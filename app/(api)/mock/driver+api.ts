import { neon } from '@neondatabase/serverless'

const sql = neon(`${process.env.DATABASE_URL}`)

// Mock driver simulation for demo purposes
export async function POST(request: Request) {
    try {
        const { ride_id, action } = await request.json()

        if (!ride_id || !action) {
            return Response.json(
                { error: 'ride_id and action are required' },
                { status: 400 }
            )
        }

        // Get ride details
        const ride = await sql`
            SELECT * FROM rides WHERE ride_id = ${ride_id}
        `

        if (ride.length === 0) {
            return Response.json({ error: 'Ride not found' }, { status: 404 })
        }

        const rideData = ride[0]

        switch (action) {
            case 'assign_driver':
                // Simulate driver assignment with random driver
                const drivers =
                    await sql`SELECT * FROM drivers ORDER BY RANDOM() LIMIT 1`

                if (drivers.length === 0) {
                    return Response.json(
                        { error: 'No drivers available' },
                        { status: 404 }
                    )
                }

                const driver = drivers[0]

                // Calculate estimated arrival time (mock: 5-15 minutes)
                const estimatedMinutes = Math.floor(Math.random() * 10) + 5

                await sql`
                    UPDATE rides 
                    SET ride_status = 'driver_assigned',
                        driver_id = ${driver.id},
                        driver_assigned_at = CURRENT_TIMESTAMP,
                        estimated_arrival_minutes = ${estimatedMinutes}
                    WHERE ride_id = ${ride_id}
                `

                return Response.json({
                    success: true,
                    message: 'Driver assigned',
                    driver: {
                        name: `${driver.first_name} ${driver.last_name}`,
                        rating: driver.rating,
                        car_seats: driver.car_seats,
                        profile_image_url: driver.profile_image_url,
                    },
                    estimated_arrival_minutes: estimatedMinutes,
                })

            case 'driver_en_route':
                await sql`
                    UPDATE rides 
                    SET ride_status = 'driver_en_route'
                    WHERE ride_id = ${ride_id}
                `
                return Response.json({
                    success: true,
                    message: 'Driver is en route',
                })

            case 'driver_arrived':
                await sql`
                    UPDATE rides 
                    SET ride_status = 'driver_arrived'
                    WHERE ride_id = ${ride_id}
                `
                return Response.json({
                    success: true,
                    message: 'Driver has arrived',
                })

            case 'start_trip':
                await sql`
                    UPDATE rides 
                    SET ride_status = 'in_progress',
                        trip_started_at = CURRENT_TIMESTAMP
                    WHERE ride_id = ${ride_id}
                `
                return Response.json({ success: true, message: 'Trip started' })

            case 'complete_trip':
                await sql`
                    UPDATE rides 
                    SET ride_status = 'completed',
                        trip_completed_at = CURRENT_TIMESTAMP
                    WHERE ride_id = ${ride_id}
                `
                return Response.json({
                    success: true,
                    message: 'Trip completed',
                })

            case 'auto_progression':
                // Simulate automatic progression through all stages
                setTimeout(async () => {
                    // After 2 seconds: driver en route
                    await sql`UPDATE rides SET ride_status = 'driver_en_route' WHERE ride_id = ${ride_id}`

                    setTimeout(async () => {
                        // After 30 seconds total: driver arrived
                        await sql`UPDATE rides SET ride_status = 'driver_arrived' WHERE ride_id = ${ride_id}`

                        setTimeout(async () => {
                            // After 45 seconds total: trip started
                            await sql`UPDATE rides SET ride_status = 'in_progress', trip_started_at = CURRENT_TIMESTAMP WHERE ride_id = ${ride_id}`

                            setTimeout(async () => {
                                // After 2 minutes total: trip completed
                                await sql`UPDATE rides SET ride_status = 'completed', trip_completed_at = CURRENT_TIMESTAMP WHERE ride_id = ${ride_id}`
                            }, 75000) // +75s = 2min total
                        }, 15000) // +15s = 45s total
                    }, 28000) // +28s = 30s total
                }, 2000) // 2s

                return Response.json({
                    success: true,
                    message:
                        'Auto progression started - ride will complete in ~2 minutes',
                })

            default:
                return Response.json(
                    { error: 'Invalid action' },
                    { status: 400 }
                )
        }
    } catch (error) {
        console.error('Error in mock driver simulation:', error)
        return Response.json(
            { error: 'Failed to simulate driver action' },
            { status: 500 }
        )
    }
}
