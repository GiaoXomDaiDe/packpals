import { neon } from '@neondatabase/serverless'

const sql = neon(`${process.env.DATABASE_URL}`)

export async function POST(request: Request) {
    try {
        const { clerk_user_id, latitude, longitude, heading, speed, accuracy } =
            await request.json()

        if (!clerk_user_id || !latitude || !longitude) {
            return Response.json(
                {
                    error: 'Missing required fields: clerk_user_id, latitude, longitude',
                },
                { status: 400 }
            )
        }

        // Upsert driver location (insert or update if exists)
        const locationResult = await sql`
            INSERT INTO driver_locations (clerk_user_id, latitude, longitude, heading, speed, accuracy, updated_at)
            VALUES (${clerk_user_id}, ${latitude}, ${longitude}, ${heading || 0}, ${speed || 0}, ${accuracy || 0}, CURRENT_TIMESTAMP)
            ON CONFLICT (clerk_user_id) 
            DO UPDATE SET 
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                heading = EXCLUDED.heading,
                speed = EXCLUDED.speed,
                accuracy = EXCLUDED.accuracy,
                updated_at = CURRENT_TIMESTAMP,
                is_active = true
            RETURNING *
        `

        // Update active rides with driver location (using proper joins)
        const rideUpdateResult = await sql`
            UPDATE rides 
            SET driver_current_lat = ${latitude}, 
                driver_current_lng = ${longitude},
                tracking_enabled = true
            FROM drivers 
            WHERE rides.driver_id = drivers.id 
            AND drivers.clerk_user_id = ${clerk_user_id}
            AND rides.payment_status = 'paid'
            RETURNING rides.ride_id
        `

        return Response.json({
            success: true,
            location: locationResult[0],
            updated_rides: rideUpdateResult.length,
        })
    } catch (error) {
        console.error('Error updating location:', error)
        return Response.json(
            { error: 'Failed to update location' },
            { status: 500 }
        )
    }
}
