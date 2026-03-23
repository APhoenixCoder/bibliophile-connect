import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get("q") || ""
    const type = searchParams.get("type") || "title" // 'title' or 'author'

    if (!query || query.length < 1) {
      return NextResponse.json({ suggestions: [] })
    }

    const searchQuery = `%${query}%`
    let suggestions: { title?: string; author?: string }[] = []

    try {
      if (type === "title") {
        // Search from the main books table and return both title and author
        const booksResults = await sql`
          SELECT DISTINCT title, author FROM books WHERE title ILIKE ${searchQuery} LIMIT 15
        `
        suggestions = [...(booksResults || [])]
      } else if (type === "author") {
        // Search from the main books table first
        const booksResults = await sql`
          SELECT DISTINCT author FROM books WHERE author ILIKE ${searchQuery} LIMIT 15
        `
        suggestions = [...(booksResults || [])]
      }
    } catch (sqlError) {
      console.error("[v0] SQL search error:", sqlError)
      // Return empty suggestions if query fails
      return NextResponse.json({ suggestions: [] })
    }

    // Remove duplicates (case-insensitive)
    const unique = Array.from(
      new Map(
        suggestions.map((s) => [
          (s.title || s.author)?.toLowerCase(),
          s,
        ])
      ).values()
    )

    return NextResponse.json({ suggestions: unique })
  } catch (error) {
    console.error("[v0] Search error:", error)
    return NextResponse.json({ suggestions: [] })
  }
}
