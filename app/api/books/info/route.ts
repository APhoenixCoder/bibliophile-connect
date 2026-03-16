import { NextRequest, NextResponse } from 'next/server'
import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.NEON_DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const title = searchParams.get('title')?.toLowerCase() || ''
    const author = searchParams.get('author')?.toLowerCase() || ''

    if (!title || !author) {
      return NextResponse.json({ book: null })
    }

    const result = await sql`SELECT title, author, description FROM books WHERE LOWER(title) = ${title} AND LOWER(author) = ${author} LIMIT 1`

    const book = result[0] || null

    return NextResponse.json({ book })
  } catch (error) {
    console.error('[v0] Error fetching book info:', error)
    return NextResponse.json({ book: null })
  }
}
