import { neon } from "@neondatabase/serverless"
import { NextResponse } from "next/server"
import { Groq } from "groq-sdk"

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function POST() {
  try {
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    })

    // Get books without descriptions
    const booksWithoutDesc = await sql.query(
      `SELECT id, title, author FROM books WHERE (description IS NULL OR description = '') AND title IS NOT NULL LIMIT 50`
    )

    if (!booksWithoutDesc || booksWithoutDesc.length === 0) {
      return NextResponse.json({ message: "All books have descriptions", updated: 0 })
    }

    let updated = 0

    for (const book of booksWithoutDesc) {
      try {
        // Generate description using Groq
        const message = await groq.messages.create({
          model: "mixtral-8x7b-32768",
          max_tokens: 150,
          messages: [
            {
              role: "user",
              content: `Write a short, engaging book blurb (2-3 sentences) for the book "${book.title}" by ${book.author}. Only provide the blurb, nothing else.`,
            },
          ],
        })

        const description = message.content[0]?.type === "text" ? message.content[0].text : null

        if (description) {
          // Update the book with the generated description
          await sql.query(`UPDATE books SET description = $1 WHERE id = $2`, [description, book.id])
          updated++
          console.log(`[v0] Generated description for: ${book.title}`)
        }
      } catch (error) {
        console.error(`[v0] Error generating description for ${book.title}:`, error)
        continue
      }
    }

    return NextResponse.json({ message: "Descriptions generated", updated })
  } catch (error) {
    console.error("[v0] Error in generate-descriptions:", error)
    return NextResponse.json({ error: "Failed to generate descriptions" }, { status: 500 })
  }
}
