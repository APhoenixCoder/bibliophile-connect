'use client'

import Link from "next/link"
import { BookOpen, LogOut, Compass } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const userId = localStorage.getItem("userId")
    setIsLoggedIn(!!userId)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("userId")
    localStorage.removeItem("userName")
    window.location.href = "/"
  }

  if (!mounted) return null

  return (
    <nav className="border-b border-border bg-card">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="flex items-center gap-2 text-2xl font-serif font-bold text-foreground hover:text-accent transition-colors"
          >
            <BookOpen className="h-7 w-7" />
            <span>Bibliophile.Connect</span>
          </Link>
          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <>
                <Link
                  href="/recommendations"
                  className="flex items-center gap-2 text-sm font-medium text-foreground hover:text-accent transition-colors"
                >
                  <Compass className="h-4 w-4" />
                  Recommendations
                </Link>
                <Link href="/profile" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
                  Profile
                </Link>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleLogout}
                  className="flex items-center gap-2"
                >
                  <LogOut className="h-4 w-4" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-foreground hover:text-accent transition-colors">
                  Login
                </Link>
                <Link
                  href="/signup"
                  className="text-sm font-medium bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
