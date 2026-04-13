import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, author, genre, userId } = body

    if (!title || !author || !genre) {
      return NextResponse.json(
        { error: "Title, author, and genre are required" },
        { status: 400 }
      )
    }

    // Store book request in database
    await sql`
      INSERT INTO book_requests (user_id, title, author, genre, requested_at) 
      VALUES (${userId || null}, ${title.toLowerCase()}, ${author.toLowerCase()}, ${genre}, NOW())
    `

    return NextResponse.json({
      success: true,
      message: "Book request submitted successfully",
    })
  } catch (error) {
    console.error("[v0] Error submitting book request:", error)
    return NextResponse.json(
      { error: "Failed to submit book request" },
      { status: 500 }
    )
  }
}
