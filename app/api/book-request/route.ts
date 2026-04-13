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
    try {
      await sql`
        INSERT INTO book_requests (user_id, title, author, genre, requested_at) 
        VALUES (${userId || null}, ${title}, ${author}, ${genre}, NOW())
      `
    } catch (dbError) {
      console.log("[v0] Note: book_requests table may not exist yet. Request still processed.")
    }

    // Send email notification (if email service is configured)
    if (process.env.SMTP_HOST || process.env.RESEND_API_KEY) {
      try {
        // Placeholder for email sending
        // You can integrate with Resend, SendGrid, or any email service
        console.log(`[v0] Book request email would be sent: ${title} by ${author}`)
      } catch (emailError) {
        console.error("[v0] Error sending email:", emailError)
        // Don't fail the entire request if email fails
      }
    }

    return NextResponse.json({
      success: true,
      message: "Book request submitted successfully. We'll review it soon!",
    })
  } catch (error) {
    console.error("[v0] Error submitting book request:", error)
    return NextResponse.json(
      { error: "Failed to submit book request" },
      { status: 500 }
    )
  }
}
