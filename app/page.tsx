"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { BookOpen, Users, Library, Sparkles } from "lucide-react"

export default function HomePage() {
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    const userId = localStorage.getItem("userId")
    if (userId) {
      router.push("/dashboard")
    }
  }, [router])

  if (!isClient) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-oregano font-bold text-foreground mb-6 text-balance">
            Where Book Lovers Connect
          </h1>
          <p className="text-lg text-muted-foreground mb-2 text-pretty font-comicneue">
            Join a community of bibliophiles. <br/> Review your favorite books, discover new ones, and keep track of your TBR! 🤎
          </p>
          
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-oregano font-semibold text-foreground mb-2">Build Your Library</h3>
            <p className="text-sm text-muted-foreground font-comicneue">Organize and track your reading collection</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Library className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-oregano font-semibold text-foreground mb-2">Curate a TBR</h3>
            <p className="text-sm text-muted-foreground font-comicneue">Create reading lists</p>
          </div>

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mb-4">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
            <h3 className="text-base font-oregano font-semibold text-foreground mb-2">Get Recommendations</h3>
            <p className="text-sm text-muted-foreground font-comicneue">Discover books</p>
          </div>
        </div>
      </section>
    </div>
  )
}
