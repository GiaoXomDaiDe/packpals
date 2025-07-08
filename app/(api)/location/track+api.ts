import { neon } from '@neondatabase/serverless'

const sql = neon(`${process.env.DATABASE_URL}`)

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const ride_id = searchParams.get('ride_id')

        if (!ride_id) {
            return Response.json(
                { error: 'ride_id is required' },
                { status: 400 }
            )
        }

        const result = await sql`
            SELECT 
                r.ride_id,
                r.driver_current_lat,
                r.driver_current_lng,
                r.destination_latitude,
                r.destination_longitude,
                r.origin_latitude,
                r.origin_longitude,
                r.payment_status,
                r.tracking_enabled,
                dl.heading,
                dl.speed,
                dl.accuracy,
                dl.updated_at as last_update,
                d.first_name as driver_first_name,
                d.last_name as driver_last_name,
                d.profile_image_url as driver_image
            FROM rides r
            LEFT JOIN drivers d ON r.driver_id = d.id
            LEFT JOIN driver_locations dl ON d.clerk_user_id = dl.clerk_user_id
            WHERE r.ride_id = ${ride_id}
        `

        if (result.length === 0) {
            return Response.json({ error: 'Ride not found' }, { status: 404 })
        }

        return Response.json({ success: true, data: result[0] })
    } catch (error) {
        console.error('Error tracking location:', error)
        return Response.json(
            { error: 'Failed to track location' },
            { status: 500 }
        )
    }
}
