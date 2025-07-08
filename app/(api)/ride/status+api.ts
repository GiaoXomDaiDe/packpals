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
                r.origin_address,
                r.destination_address,
                r.origin_latitude,
                r.origin_longitude,
                r.destination_latitude,
                r.destination_longitude,
                r.ride_status,
                r.payment_status,
                r.driver_assigned_at,
                r.trip_started_at,
                r.trip_completed_at,
                r.estimated_arrival_minutes,
                r.fare_price,
                r.created_at,
                d.first_name as driver_first_name,
                d.last_name as driver_last_name,
                d.profile_image_url as driver_image,
                d.car_seats,
                d.rating as driver_rating
            FROM rides r
            LEFT JOIN drivers d ON r.driver_id = d.id
            WHERE r.ride_id = ${ride_id}
        `

        if (result.length === 0) {
            return Response.json({ error: 'Ride not found' }, { status: 404 })
        }

        const ride = result[0]

        // Calculate estimated arrival if trip is in progress
        let eta_minutes = null
        if (
            ride.ride_status === 'in_progress' &&
            ride.estimated_arrival_minutes
        ) {
            const tripStarted = new Date(ride.trip_started_at)
            const now = new Date()
            const elapsedMinutes = Math.floor(
                (now.getTime() - tripStarted.getTime()) / (1000 * 60)
            )
            eta_minutes = Math.max(
                0,
                ride.estimated_arrival_minutes - elapsedMinutes
            )
        }

        return Response.json({
            success: true,
            data: {
                ...ride,
                eta_minutes,
            },
        })
    } catch (error) {
        console.error('Error fetching ride status:', error)
        return Response.json(
            { error: 'Failed to fetch ride status' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const { ride_id, status, estimated_minutes } = await request.json()

        if (!ride_id || !status) {
            return Response.json(
                { error: 'ride_id and status are required' },
                { status: 400 }
            )
        }

        const allowedStatuses = [
            'pending',
            'driver_assigned',
            'driver_en_route',
            'driver_arrived',
            'in_progress',
            'completed',
            'cancelled',
        ]

        if (!allowedStatuses.includes(status)) {
            return Response.json({ error: 'Invalid status' }, { status: 400 })
        }

        const result = await sql`
            UPDATE rides 
            SET ride_status = ${status}
                ${status === 'driver_assigned' ? sql`, driver_assigned_at = CURRENT_TIMESTAMP` : sql``}
                ${status === 'in_progress' ? sql`, trip_started_at = CURRENT_TIMESTAMP` : sql``}
                ${status === 'completed' ? sql`, trip_completed_at = CURRENT_TIMESTAMP` : sql``}
                ${estimated_minutes && status === 'driver_assigned' ? sql`, estimated_arrival_minutes = ${estimated_minutes}` : sql``}
            WHERE ride_id = ${ride_id}
            RETURNING *
        `

        return Response.json({
            success: true,
            data: result[0],
        })
    } catch (error) {
        console.error('Error updating ride status:', error)
        return Response.json(
            { error: 'Failed to update ride status' },
            { status: 500 }
        )
    }
}
