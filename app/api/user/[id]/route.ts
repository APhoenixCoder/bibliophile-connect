import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      )
    }

    const result = await sql`
      SELECT u.id, u.name, u.email, 
             up.profile_picture_url, up.bio, up.pronouns, up.favorite_characters, 
             up.reading_goal, up.location, up.website, up.display_name
      FROM users u
      LEFT JOIN user_profiles up ON u.id = up.user_id
      WHERE u.id = ${userId}
    `

    const user = result[0]

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // Fetch books read and reading list
    const booksRead = await sql`
      SELECT book_title as title, book_author as author
      FROM books_read
      WHERE user_id = ${userId}
    `

    const readingList = await sql`
      SELECT book_title as title, book_author as author
      FROM reading_list
      WHERE user_id = ${userId}
    `

    // Fetch favorite genres
    const genres = await sql`
      SELECT g.id, g.name, g.slug
      FROM genres g
      INNER JOIN user_genres ug ON g.id = ug.genre_id
      WHERE ug.user_id = ${userId}
    `

    return NextResponse.json({
      user: {
        ...user,
        booksRead,
        readingList,
        favoriteGenres: genres || [],
      },
    })
  } catch (error) {
    console.error('[v0] Error fetching user profile:', error)
    return NextResponse.json(
      { error: 'Failed to fetch user profile' },
      { status: 500 }
    )
  }
}
