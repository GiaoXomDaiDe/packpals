import { neon } from '@neondatabase/serverless'

export async function GET(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`)
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId')
        const status = searchParams.get('status')
        const limit = searchParams.get('limit') || '50'

        let query
        if (userId && status) {
            query = sql`
                SELECT 
                    r.*,
                    d.first_name as driver_first_name,
                    d.last_name as driver_last_name,
                    d.profile_image_url as driver_image,
                    d.rating as driver_rating
                FROM rides r
                LEFT JOIN drivers d ON r.driver_id = d.id
                WHERE r.user_id = ${userId} AND r.ride_status = ${status}
                ORDER BY r.created_at DESC
                LIMIT ${parseInt(limit)}
            `
        } else if (userId) {
            query = sql`
                SELECT 
                    r.*,
                    d.first_name as driver_first_name,
                    d.last_name as driver_last_name,
                    d.profile_image_url as driver_image,
                    d.rating as driver_rating
                FROM rides r
                LEFT JOIN drivers d ON r.driver_id = d.id
                WHERE r.user_id = ${userId}
                ORDER BY r.created_at DESC
                LIMIT ${parseInt(limit)}
            `
        } else {
            query = sql`
                SELECT 
                    r.*,
                    d.first_name as driver_first_name,
                    d.last_name as driver_last_name,
                    d.profile_image_url as driver_image,
                    d.rating as driver_rating
                FROM rides r
                LEFT JOIN drivers d ON r.driver_id = d.id
                ORDER BY r.created_at DESC
                LIMIT ${parseInt(limit)}
            `
        }

        const rides = await query

        return Response.json({
            success: true,
            data: { rides },
        })
    } catch (error) {
        console.error('Error fetching rides:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`)
        const {
            userId,
            driverId,
            pickupLatitude,
            pickupLongitude,
            destinationLatitude,
            destinationLongitude,
            pickupAddress,
            destinationAddress,
            farePrice,
            rideTime,
        } = await request.json()

        console.log('Received data:', {
            userId,
            driverId,
            pickupLatitude,
            pickupLongitude,
            farePrice,
            rideTime,
        })

        if (
            !userId ||
            !driverId ||
            !pickupLatitude ||
            !pickupLongitude ||
            !farePrice
        ) {
            return Response.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        // Ensure proper data types
        const parsedDriverId = parseInt(String(driverId))
        const parsedRideTime = Math.round(Number(rideTime) || 0)
        const parsedFarePrice = parseFloat(String(farePrice))

        console.log('Parsed data:', {
            parsedDriverId,
            parsedRideTime,
            parsedFarePrice,
        })

        const result = await sql`
            INSERT INTO rides (
                origin_address, destination_address, origin_latitude, origin_longitude,
                destination_latitude, destination_longitude, ride_time, fare_price, 
                payment_status, driver_id, user_id, ride_status, trip_completed_at
            )
            VALUES (
                ${pickupAddress || 'Unknown'}, ${destinationAddress || 'Unknown'}, 
                ${pickupLatitude}, ${pickupLongitude},
                ${destinationLatitude || pickupLatitude}, ${destinationLongitude || pickupLongitude}, 
                ${parsedRideTime}, ${parsedFarePrice}, 'completed', ${parsedDriverId}, 
                ${userId}, 'completed', CURRENT_TIMESTAMP
            )
            RETURNING *
        `

        return Response.json({
            success: true,
            data: result[0],
        })
    } catch (error) {
        console.error('Error creating ride:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`)
        const { rideId, status } = await request.json()

        if (!rideId || !status) {
            return Response.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const result = await sql`
            UPDATE rides 
            SET ride_status = ${status}, 
                trip_completed_at = ${status === 'completed' ? 'CURRENT_TIMESTAMP' : 'trip_completed_at'}
            WHERE ride_id = ${parseInt(rideId)}
            RETURNING *
        `

        return Response.json({
            success: true,
            data: result[0],
        })
    } catch (error) {
        console.error('Error updating ride:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
