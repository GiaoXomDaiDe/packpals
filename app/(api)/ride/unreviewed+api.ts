import { neon } from '@neondatabase/serverless'

export async function GET(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`)
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')

        if (!userId) {
            return Response.json(
                { error: 'User ID is required' },
                { status: 400 }
            )
        }

        // Get completed rides that haven't been reviewed yet
        const unreviewedRides = await sql`
            SELECT 
                r.ride_id,
                r.driver_id,
                r.origin_address,
                r.destination_address,
                r.fare_price,
                r.trip_completed_at,
                d.first_name,
                d.last_name,
                d.profile_image_url as driver_image,
                d.rating as driver_rating
            FROM rides r
            LEFT JOIN drivers d ON r.driver_id = d.id
            LEFT JOIN reviews rv ON r.ride_id::text = rv.ride_id
            WHERE r.user_id = ${userId} 
              AND r.ride_status = 'completed'
              AND rv.id IS NULL
            ORDER BY r.trip_completed_at DESC
        `

        return Response.json({
            success: true,
            data: { unreviewed_rides: unreviewedRides },
        })
    } catch (error) {
        console.error('Error fetching unreviewed rides:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
