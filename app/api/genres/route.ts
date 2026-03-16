import { NextResponse } from "next/server"
import { sql } from "@/lib/db"

export async function GET() {
  try {
    console.log("[v0] Fetching genres from database")

    const genres = await sql`
      SELECT id, name, slug, description
      FROM genres
      ORDER BY name ASC
    `

    console.log("[v0] Genres fetched:", genres.length)

    return NextResponse.json({ genres })
  } catch (error) {
    console.error("[v0] Genres fetch error:", error)
    return NextResponse.json({ error: "Failed to fetch genres" }, { status: 500 })
  }
}
