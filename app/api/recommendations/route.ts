import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    const books = await sql`
      SELECT id, title, author, genre, description FROM books 
      WHERE genre IS NOT NULL AND genre != '' 
      ORDER BY genre, title
      LIMIT 500
    `

    // Get user's reading list if userId is provided
    let userReadingList: any[] = []
    if (userId) {
      try {
        const userList = await sql`
          SELECT book_title, book_author FROM reading_list WHERE user_id = ${userId}
        `
        if (userList && userList.length > 0) {
          userReadingList = userList
        }
      } catch (err) {
        console.error("[v0] Error fetching user reading list:", err)
      }
    }

    // Group books by genre and filter out books in reading list
    const booksByGenre: Record<string, any[]> = {}

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
