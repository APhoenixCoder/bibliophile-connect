import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET(request: NextRequest) {
  try {
    // Get userId from query params or cookie
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId") || request.cookies.get("userId")?.value

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get user profile
    const profiles = await sql`
      SELECT * FROM user_profiles WHERE user_id = ${userId}
    `

    // Get favorite genres
    const userGenres = await sql`
      SELECT g.id, g.name, g.slug
      FROM user_genres ug
      JOIN genres g ON ug.genre_id = g.id
      WHERE ug.user_id = ${userId}
    `

    // Get books read
    const booksRead = await sql`
      SELECT book_title as title, book_author as author
      FROM books_read
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    // Get reading list
    const readingList = await sql`
      SELECT book_title as title, book_author as author
      FROM reading_list
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `

    return NextResponse.json({
      profile: profiles[0] || null,
      favoriteGenres: userGenres.map((g) => g.id),
      booksRead,
      readingList,
    })
  } catch (error) {
    console.error("[v0] Profile fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Profile POST endpoint called")
    const body = await request.json()
    console.log("[v0] Request body received:", { userId: body.userId, displayName: body.displayName })
    
    // Get userId from body or cookie
    const userId = body.userId || request.cookies.get("userId")?.value
    console.log("[v0] Using userId:", userId)

    if (!userId) {
      console.log("[v0] No userId provided, returning 401")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const {
      displayName,
      pronouns,
      bio,
      readingGoal,
      favoriteCharacters,
      profilePictureUrl,
      favoriteGenres,
      booksRead,
      readingList,
    } = body

    
    const existingProfile = await sql`
      SELECT id FROM user_profiles WHERE user_id = ${userId}
    `

    if (existingProfile.length > 0) {
      
      await sql`
        UPDATE user_profiles SET
          display_name = ${displayName},
          pronouns = ${pronouns},
          bio = ${bio},
          reading_goal = ${readingGoal},
          favorite_characters = ${favoriteCharacters},
          profile_picture_url = ${profilePictureUrl},
          updated_at = NOW()
        WHERE user_id = ${userId}
      `
    } else {
      console.log("[v0] Creating new profile")
      await sql`
        INSERT INTO user_profiles (
          user_id, display_name, pronouns, bio,
          reading_goal, favorite_characters, profile_picture_url
        )
        VALUES (
          ${userId}, ${displayName}, ${pronouns}, ${bio},
          ${readingGoal}, ${favoriteCharacters}, ${profilePictureUrl}
        )
      `
    }

    console.log("[v0] Profile saved, updating genres")
    // Update favorite genres
    await sql`DELETE FROM user_genres WHERE user_id = ${userId}`

    if (favoriteGenres && favoriteGenres.length > 0) {
      for (const genreId of favoriteGenres) {
        await sql`
          INSERT INTO user_genres (user_id, genre_id)
          VALUES (${userId}, ${genreId})
        `
      }
      console.log("[v0] Saved", favoriteGenres.length, "favorite genres")
    }

    console.log("[v0] Updating books read")
    // Update books read
    await sql`DELETE FROM books_read WHERE user_id = ${userId}`

    if (booksRead && booksRead.length > 0) {
      for (const book of booksRead) {
        await sql`
          INSERT INTO books_read (user_id, book_title, book_author)
          VALUES (${userId}, ${book.title}, ${book.author})
        `
      }
      console.log("[v0] Saved", booksRead.length, "books read")
    }

    console.log("[v0] Updating reading list")
    // Update reading list
    await sql`DELETE FROM reading_list WHERE user_id = ${userId}`

    if (readingList && readingList.length > 0) {
      for (const book of readingList) {
        await sql`
          INSERT INTO reading_list (user_id, book_title, book_author)
          VALUES (${userId}, ${book.title}, ${book.author})
        `
      }
      console.log("[v0] Saved", readingList.length, "reading list books")
    }

    console.log("[v0] Profile update complete")
    return NextResponse.json({ message: "Profile updated successfully" })
  } catch (error) {
    console.error("[v0] Profile update error:", error)
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 })
  }
}
