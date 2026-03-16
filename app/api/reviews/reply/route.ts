import { sql } from "@/lib/db"
import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, reviewId, reply_text } = body

    if (!userId || !reviewId || !reply_text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    await sql.query(
      `INSERT INTO review_replies (review_id, user_id, reply_text)
       VALUES ($1, $2, $3)`,
      [reviewId, userId, reply_text]
    )

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Reply POST error:", error)
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 })
  }
}
