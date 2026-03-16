import { type NextRequest, NextResponse } from "next/server"
import { sql, ensureUsersTable } from "@/lib/db"
import { hashPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Signup API called")

    // Ensure table exists
    await ensureUsersTable()
    console.log("[v0] Users table ensured")

    const body = await request.json()
    const { name, email, password } = body

    console.log("[v0] Signup data received:", { name, email })

    // Validate input
    if (!name || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await sql`
      SELECT * FROM users WHERE email = ${email}
    `

    if (existingUser.length > 0) {
      return NextResponse.json({ error: "User with this email already exists" }, { status: 400 })
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password)
    console.log("[v0] Password hashed, creating user")

    const result = await sql`
      INSERT INTO users (name, email, password)
      VALUES (${name}, ${email}, ${hashedPassword})
      RETURNING id, name, email, created_at
    `

    const user = result[0]
    console.log("[v0] User created successfully:", user.id)

    const response = NextResponse.json(
      {
        message: "User created successfully",
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 201 },
    )

    response.cookies.set("userId", user.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/", // Ensure cookie is available on all paths
    })

    console.log("[v0] Set userId cookie:", user.id)

    return response
  } catch (error) {
    console.error("[v0] Signup error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
