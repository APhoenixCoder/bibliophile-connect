import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, author, genre } = body

    if (!title || !author) {
      return NextResponse.json({ error: "Title and author are required" }, { status: 400 })
    }

    // Normalize to lowercase for checking
    const normalizedTitle = title.toLowerCase()
    const normalizedAuthor = author.toLowerCase()

    // Check if book already exists in the database (case-insensitive)
    const existing = await sql.query(
      "SELECT id FROM books WHERE LOWER(title) = $1 AND LOWER(author) = $2 LIMIT 1",
      [normalizedTitle, normalizedAuthor]
    )

    if (existing && existing.length > 0) {
      return NextResponse.json({ success: true, isNew: false, message: "Book already exists in database" })
    }

    // Insert new book into the database
    await sql.query(
      "INSERT INTO books (title, author, genre) VALUES ($1, $2, $3)",
      [normalizedTitle, normalizedAuthor, genre || null]
    )

    return NextResponse.json({ success: true, isNew: true, message: "Book added to database" })
  } catch (error) {
    console.error("[v0] Error adding book:", error)
    return NextResponse.json({ error: "Failed to add book" }, { status: 500 })
  }
}
