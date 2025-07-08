import { neon } from '@neondatabase/serverless'

export async function GET(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`)
        const { searchParams } = new URL(request.url)
        const driverId = searchParams.get('driverId')
        const userId = searchParams.get('userId')
        const limit = searchParams.get('limit') || '10'

        // If driverId is provided, get reviews for a specific driver
        if (driverId) {
            const reviews = await sql`
                SELECT 
                    r.*,
                    d.first_name,
                    d.last_name,
                    d.profile_image_url as driver_image
                FROM reviews r
                LEFT JOIN drivers d ON r.driver_id = d.id
                WHERE r.driver_id = ${parseInt(driverId)}
                ORDER BY r.created_at DESC
                LIMIT ${parseInt(limit)}
            `

            // Get average rating for the driver
            const avgRating = await sql`
                SELECT 
                    AVG(rating)::DECIMAL(3,2) as average_rating,
                    COUNT(*) as total_reviews
                FROM reviews 
                WHERE driver_id = ${parseInt(driverId)}
            `

            return Response.json({
                success: true,
                data: {
                    reviews,
                    averageRating: avgRating[0]?.average_rating || 0,
                    totalReviews: avgRating[0]?.total_reviews || 0,
                },
            })
        }

        // If userId is provided, get reviews by a specific user (only for completed rides)
        if (userId) {
            const reviews = await sql`
                SELECT 
                    r.*,
                    d.first_name,
                    d.last_name,
                    d.profile_image_url as driver_image,
                    rd.origin_address,
                    rd.destination_address,
                    rd.trip_completed_at as ride_completed_at
                FROM reviews r
                LEFT JOIN drivers d ON r.driver_id = d.id
                LEFT JOIN rides rd ON r.ride_id = rd.ride_id::text
                WHERE r.user_id = ${userId} 
                  AND rd.ride_status = 'completed'
                ORDER BY r.created_at DESC
                LIMIT ${parseInt(limit)}
            `

            return Response.json({
                success: true,
                data: { reviews },
            })
        }

        // Get all recent reviews
        const reviews = await sql`
            SELECT 
                r.*,
                d.first_name,
                d.last_name,
                d.profile_image_url as driver_image
            FROM reviews r
            LEFT JOIN drivers d ON r.driver_id = d.id
            ORDER BY r.created_at DESC
            LIMIT ${parseInt(limit)}
        `

        return Response.json({
            success: true,
            data: { reviews },
        })
    } catch (error) {
        console.error('Error fetching reviews:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`)
        const { rideId, userId, driverId, rating, reviewText } =
            await request.json()

        if (!rideId || !userId || !driverId || !rating) {
            return Response.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        if (rating < 1 || rating > 5) {
            return Response.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        // Check if ride exists and is completed
        const rideCheck = await sql`
            SELECT ride_id, ride_status, user_id 
            FROM rides 
            WHERE ride_id = ${parseInt(rideId)} AND ride_status = 'completed'
        `

        if (rideCheck.length === 0) {
            return Response.json(
                { error: 'Ride not found or not completed yet' },
                { status: 404 }
            )
        }

        if (rideCheck[0].user_id !== userId) {
            return Response.json(
                { error: 'Unauthorized to review this ride' },
                { status: 403 }
            )
        }

        // Check if review already exists for this ride
        const existingReview = await sql`
            SELECT id FROM reviews 
            WHERE ride_id = ${rideId} AND user_id = ${userId}
        `

        if (existingReview.length > 0) {
            return Response.json(
                { error: 'Review already exists for this ride' },
                { status: 409 }
            )
        }

        const result = await sql`
            INSERT INTO reviews (ride_id, user_id, driver_id, rating, review_text)
            VALUES (${rideId}, ${userId}, ${parseInt(driverId)}, ${rating}, ${reviewText || null})
            RETURNING *
        `

        // Update driver's average rating
        const avgRating = await sql`
            SELECT AVG(rating)::DECIMAL(3,2) as average_rating
            FROM reviews 
            WHERE driver_id = ${parseInt(driverId)}
        `

        if (avgRating[0]?.average_rating) {
            await sql`
                UPDATE drivers 
                SET rating = ${avgRating[0].average_rating}
                WHERE id = ${parseInt(driverId)}
            `
        }

        return Response.json({
            success: true,
            data: result[0],
        })
    } catch (error) {
        console.error('Error creating review:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`)
        const { reviewId, rating, reviewText } = await request.json()

        if (!reviewId) {
            return Response.json(
                { error: 'Review ID is required' },
                { status: 400 }
            )
        }

        if (rating && (rating < 1 || rating > 5)) {
            return Response.json(
                { error: 'Rating must be between 1 and 5' },
                { status: 400 }
            )
        }

        const result = await sql`
            UPDATE reviews 
            SET 
                rating = COALESCE(${rating}, rating),
                review_text = COALESCE(${reviewText}, review_text),
                updated_at = CURRENT_TIMESTAMP
            WHERE id = ${parseInt(reviewId)}
            RETURNING *
        `

        if (result.length === 0) {
            return Response.json({ error: 'Review not found' }, { status: 404 })
        }

        // Update driver's average rating if rating was changed
        if (rating) {
            const driverId = result[0].driver_id
            const avgRating = await sql`
                SELECT AVG(rating)::DECIMAL(3,2) as average_rating
                FROM reviews 
                WHERE driver_id = ${driverId}
            `

            if (avgRating[0]?.average_rating) {
                await sql`
                    UPDATE drivers 
                    SET rating = ${avgRating[0].average_rating}
                    WHERE id = ${driverId}
                `
            }
        }

        return Response.json({
            success: true,
            data: result[0],
        })
    } catch (error) {
        console.error('Error updating review:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`)
        const { searchParams } = new URL(request.url)
        const reviewId = searchParams.get('reviewId')

        if (!reviewId) {
            return Response.json(
                { error: 'Review ID is required' },
                { status: 400 }
            )
        }

        const result = await sql`
            DELETE FROM reviews 
            WHERE id = ${parseInt(reviewId)}
            RETURNING *
        `

        if (result.length === 0) {
            return Response.json({ error: 'Review not found' }, { status: 404 })
        }

        // Update driver's average rating after deletion
        const driverId = result[0].driver_id
        const avgRating = await sql`
            SELECT AVG(rating)::DECIMAL(3,2) as average_rating
            FROM reviews 
            WHERE driver_id = ${driverId}
        `

        // If no reviews left, set rating to null or default
        const newRating = avgRating[0]?.average_rating || null
        await sql`
            UPDATE drivers 
            SET rating = ${newRating}
            WHERE id = ${driverId}
        `

        return Response.json({
            success: true,
            message: 'Review deleted successfully',
        })
    } catch (error) {
        console.error('Error deleting review:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
