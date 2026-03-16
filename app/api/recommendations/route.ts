import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const books = await sql.query(
      `SELECT id, title, author, genre, description FROM books 
       WHERE genre IS NOT NULL AND genre != '' 
       ORDER BY genre, title
       LIMIT 500`
    )

    // Get user's reading list if userId is provided
    let userReadingList: Array<{ book_title: string; book_author: string }> = []
    if (userId) {
      try {
        const userList = await sql.query(
          `SELECT book_title, book_author FROM reading_list WHERE user_id = $1`,
          [userId]
        )
        if (userList && userList.length > 0) {
          userReadingList = userList
        }
      } catch (err) {
        console.error("[v0] Error fetching user reading list:", err)
      }
    }

    // Group books by genre and filter out books in reading list
    const booksByGenre: Record<string, Array<{ id: string; title: string; author: string; genre: string; description: string | null }>> = {}

    if (books) {
      for (const book of books) {
        // Check if book is in user's reading list
        const isInReadingList = userReadingList.some(
          (item) =>
            item.book_title.toLowerCase() === book.title.toLowerCase() &&
            item.book_author.toLowerCase() === book.author.toLowerCase()
        )

        if (isInReadingList) continue

        const genre = book.genre || "Other"
        if (!booksByGenre[genre]) {
          booksByGenre[genre] = []
        }
        booksByGenre[genre].push(book)
      }
    }

    return NextResponse.json({ booksByGenre })
  } catch (error) {
    console.error("[v0] Error fetching recommendations:", error)
    return NextResponse.json({ booksByGenre: {} }, { status: 500 })
  }
}
