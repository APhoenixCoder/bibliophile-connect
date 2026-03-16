import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = (searchParams.get("title") || "").toLowerCase()
    const author = (searchParams.get("author") || "").toLowerCase()

    if (!title || !author) {
      return NextResponse.json({ error: "Missing title or author" }, { status: 400 })
    }

    const reviews = await sql`
      SELECT r.id, r.user_id, r.rating, r.review_text, r.created_at, u.name as user_name, COALESCE(up.profile_picture_url, '') as profile_picture_url
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN user_profiles up ON r.user_id = up.user_id
      WHERE LOWER(r.book_title) = ${title} AND LOWER(r.book_author) = ${author}
      ORDER BY r.created_at DESC
    `

    const reviewsWithReplies = await Promise.all(
      (reviews || []).map(async (rev: any) => {
        const replies = await sql`
          SELECT rr.id, rr.user_id, rr.reply_text, rr.created_at, u.name as user_name, COALESCE(up.profile_picture_url, '') as profile_picture_url
          FROM review_replies rr
          LEFT JOIN users u ON rr.user_id = u.id
          LEFT JOIN user_profiles up ON rr.user_id = up.user_id
          WHERE rr.review_id = ${rev.id}
          ORDER BY rr.created_at ASC
        `
        return { ...rev, replies: replies || [] }
      })
    )

    return NextResponse.json({ reviews: reviewsWithReplies })
  } catch (error) {
    console.error("[v0] Reviews GET error:", error)
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, book_title, book_author, rating, review_text, reviewId } = body

    if (!userId || !book_title || !book_author || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const normalizedTitle = book_title.toLowerCase()
    const normalizedAuthor = book_author.toLowerCase()

    if (reviewId) {
      // Update existing review
      await sql`
        UPDATE reviews
        SET rating = ${rating}, review_text = ${review_text}, updated_at = NOW()
        WHERE id = ${reviewId} AND user_id = ${userId}
      `
    } else {
      // Create new review
      await sql`
        INSERT INTO reviews (user_id, book_title, book_author, rating, review_text)
        VALUES (${userId}, ${normalizedTitle}, ${normalizedAuthor}, ${rating}, ${review_text})
      `
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Reviews POST error:", error)
    return NextResponse.json({ error: "Failed to save review" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { reviewId } = body

    if (!reviewId) {
      return NextResponse.json({ error: "Missing review ID" }, { status: 400 })
    }

    // Delete replies first
    await sql`DELETE FROM review_replies WHERE review_id = ${reviewId}`
    
    // Delete review
    await sql`DELETE FROM reviews WHERE id = ${reviewId}`

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Reviews DELETE error:", error)
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 })
  }
}
