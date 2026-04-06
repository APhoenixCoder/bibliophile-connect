'use client'

import Link from "next/link"
import { BookOpen, LogOut, Compass, Menu } from "lucide-react"
import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet"

export function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
    const userId = localStorage.getItem("userId")
    setIsLoggedIn(!!userId)

    // Check if mobile
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("userId")
    localStorage.removeItem("userName")
    window.location.href = "/"
  }

  if (!mounted) return null

  return (
    <nav className="border-b border-border bg-card sticky top-0 z-40">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href={isLoggedIn ? "/dashboard" : "/"}
            className="flex items-center gap-2 text-xl sm:text-2xl font-serif font-bold text-foreground hover:text-accent transition-colors flex-shrink-0"
          >
            <BookOpen className="h-6 w-6 sm:h-7 sm:w-7" />
            <span className="hidden sm:inline">Bibliophile.Connect</span>
            <span className="sm:hidden text-sm">Bibliophile</span>
          </Link>

          {/* Desktop Navigation */}
          {!isMobile && (
            <div className="flex items-center gap-6">
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
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="ml-auto">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-full sm:w-80">
                <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
                <SheetHeader>
                  <h2 className="text-lg font-serif font-bold">Menu</h2>
                </SheetHeader>
                <div className="flex flex-col gap-4 py-4">
                  {isLoggedIn ? (
                    <>
                      <Link
                        href="/recommendations"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-foreground hover:bg-secondary hover:text-accent transition-colors font-medium"
                      >
                        Recommendations
                      </Link>
                      <Link
                        href="/profile"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-foreground hover:bg-secondary hover:text-accent transition-colors font-medium"
                      >
                        Profile
                      </Link>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/login"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-md text-foreground hover:bg-secondary hover:text-accent transition-colors font-medium"
                      >
                        Login
                      </Link>
                      <Link
                        href="/signup"
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors font-medium"
                      >
                        Sign Up
                      </Link>
                    </>
                  )}
                </div>
                {isLoggedIn && (
                  <SheetFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleLogout()
                        setOpen(false)
                      }}
                      className="w-full flex items-center gap-2 justify-center"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </Button>
                  </SheetFooter>
                )}
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>
    </nav>
  )
}
