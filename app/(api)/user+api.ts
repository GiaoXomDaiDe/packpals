import { neon } from '@neondatabase/serverless'

export async function GET(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`)
        const { searchParams } = new URL(request.url)
        const clerkId = searchParams.get('clerkId')

        if (!clerkId) {
            return Response.json(
                { error: 'Missing clerkId parameter' },
                { status: 400 }
            )
        }

        const response = await sql`
            SELECT name, email, clerk_id, date_of_birth, profile_image_url, phone_number, gender 
            FROM users 
            WHERE clerk_id = ${clerkId}
        `

        if (response.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 })
        }

        return Response.json({ data: response[0] }, { status: 200 })
    } catch (error) {
        console.error('Error fetching user:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function POST(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`)
        const { name, email, clerkId, dateOfBirth, phoneNumber, gender } =
            await request.json()

        if (!name || !email || !clerkId) {
            return Response.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        console.log('da vao duoc api POST user')
        const response = await sql`
        INSERT INTO users (
        name, 
        email, 
        clerk_id,
        date_of_birth,
        profile_image_url,
        phone_number,
        gender
      ) 
      VALUES (
        ${name}, 
        ${email},
        ${clerkId},
        ${dateOfBirth || null},
        ${null},
        ${phoneNumber || null},
        ${gender || null}
        );`

        return new Response(JSON.stringify({ data: response }), {
            status: 201,
        })
    } catch (error) {
        console.error('Error creating user:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}

export async function PUT(request: Request) {
    try {
        const sql = neon(`${process.env.DATABASE_URL}`)
        const {
            clerkId,
            name,
            dateOfBirth,
            profileImageUrl,
            phoneNumber,
            gender,
        } = await request.json()

        console.log('PUT user request data:', {
            clerkId,
            name,
            dateOfBirth,
            profileImageUrl,
            phoneNumber,
        })

        if (!clerkId) {
            return Response.json({ error: 'Missing clerkId' }, { status: 400 })
        }

        // Check if user exists
        const existingUser = await sql`
            SELECT * FROM users WHERE clerk_id = ${clerkId}
        `

        if (existingUser.length === 0) {
            return Response.json({ error: 'User not found' }, { status: 404 })
        }

        const currentUser = existingUser[0]

        // Execute update with all fields (use existing values if not provided)
        const response = await sql`
            UPDATE users 
            SET name = ${name !== undefined ? name : currentUser.name},
                date_of_birth = ${dateOfBirth !== undefined ? dateOfBirth : currentUser.date_of_birth},
                profile_image_url = ${profileImageUrl !== undefined ? profileImageUrl : currentUser.profile_image_url},
                phone_number = ${phoneNumber !== undefined ? phoneNumber : currentUser.phone_number},
                gender = ${gender !== undefined ? gender : currentUser.gender}
            WHERE clerk_id = ${clerkId}
            RETURNING name, email, clerk_id, date_of_birth, profile_image_url, phone_number, gender
        `

        return Response.json(
            {
                success: true,
                data: response[0],
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Error updating user:', error)
        return Response.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        )
    }
}
