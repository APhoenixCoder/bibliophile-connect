import { type NextRequest, NextResponse } from "next/server"
import { sql, ensureUsersTable } from "@/lib/db"
import { verifyPassword } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    console.log("[v0] Login API called")

    await ensureUsersTable()
    console.log("[v0] Users table ensured")

    const body = await request.json()
    const { email, password } = body

    console.log("[v0] Login attempt for email:", email)

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const users = await sql`
      SELECT * FROM users WHERE email = ${email}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    const user = users[0]
    console.log("[v0] User found, verifying password")

    // Verify password
    const isValidPassword = await verifyPassword(password, user.password)

    if (!isValidPassword) {
      console.log("[v0] Invalid password")
      return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
    }

    console.log("[v0] Login successful for user:", user.id)

    const response = NextResponse.json(
      {
        message: "Login successful",
        user: { id: user.id, name: user.name, email: user.email },
      },
      { status: 200 },
    )

    // Set cookie with user ID for authentication
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
    console.error("[v0] Login error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
