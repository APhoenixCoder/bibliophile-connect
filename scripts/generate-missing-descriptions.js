import Groq from 'groq-sdk'
import { neon } from '@neondatabase/serverless'

const client = new Groq({
  apiKey: process.env.GROQ_API_KEY,
})
const sql = neon(process.env.NEON_DATABASE_URL)

async function generateDescription(title, author) {
  const message = await client.chat.completions.create({
    messages: [
      {
        role: 'user',
        content: `Write a compelling 2-3 sentence book blurb for "${title}" by ${author}. Make it engaging and intriguing but concise. Just provide the blurb, no additional text.`,
      },
    ],
    model: 'llama-3.3-70b-versatile',
    max_tokens: 150,
  })

  const content = message.choices[0]?.message?.content
  if (content) {
    return content.trim()
  }
  return ''
}

async function main() {
  try {
    console.log('[v0] Fetching books without descriptions...')

    const result = await sql`
      SELECT id, title, author FROM books 
      WHERE description IS NULL OR description = '' 
      ORDER BY title LIMIT 100
    `

    const books = result
    console.log(`[v0] Found ${books.length} books without descriptions`)

    let updated = 0

    for (const book of books) {
      console.log(`[v0] Generating description for: ${book.title} by ${book.author}`)
      const description = await generateDescription(book.title, book.author)

      if (description) {
        await sql`UPDATE books SET description = ${description} WHERE id = ${book.id}`
        updated++
        console.log(`[v0] Updated: ${book.title}`)
      }

      // Rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500))
    }

    console.log(`[v0] Successfully updated ${updated} books with descriptions!`)
  } catch (error) {
    console.error('[v0] Error:', error)
  }
}

main()
