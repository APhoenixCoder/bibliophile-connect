'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/navbar'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useToast } from '@/components/ui/use-toast'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

interface Genre {
  id: string
  name: string
  slug: string
}

export default function RequestBookPage() {
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [mounted, setMounted] = useState(false)
  const [title, setTitle] = useState(searchParams.get('title') || '')
  const [author, setAuthor] = useState(searchParams.get('author') || '')
  const [genre, setGenre] = useState('')
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setMounted(true)
    fetchGenres()
  }, [])

  const fetchGenres = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/genres')
      if (res.ok) {
        const data = await res.json()
        setGenres(data.genres || [])
      }
    } catch (error) {
      console.error('Error fetching genres:', error)
      toast({
        title: 'Error',
        description: 'Failed to load genres',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title || !author || !genre) {
      toast({
        title: 'Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      })
      return
    }

    setSubmitting(true)
    try {
      const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null

      const res = await fetch('/api/book-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          author,
          genre,
          userId,
        }),
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: 'Book request submitted! We will review it and add it to our database soon.',
        })
        setTitle('')
        setAuthor('')
        setGenre('')
      } else {
        const error = await res.json()
        toast({
          title: 'Error',
          description: error.error || 'Failed to submit request',
          variant: 'destructive',
        })
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      toast({
        title: 'Error',
        description: 'Failed to submit book request',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (!mounted) return null

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-accent hover:text-accent/80 transition-colors">
              <ChevronLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </div>

          <div className="max-w-2xl">
            <Card className="border-border">
              <CardHeader>
                <CardTitle className="font-serif">Request a Book</CardTitle>
                <CardDescription>
                  This book isn't in our database yet. Help us add it by providing the details below!
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium text-foreground mb-2">
                      Book Title
                    </label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="Enter book title"
                      className="bg-muted border-border"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="author" className="block text-sm font-medium text-foreground mb-2">
                      Author
                    </label>
                    <Input
                      id="author"
                      value={author}
                      onChange={(e) => setAuthor(e.target.value)}
                      placeholder="Enter author name"
                      className="bg-muted border-border"
                      disabled={submitting}
                    />
                  </div>

                  <div>
                    <label htmlFor="genre" className="block text-sm font-medium text-foreground mb-2">
                      Genre
                    </label>
                    <Select value={genre} onValueChange={setGenre} disabled={submitting || loading}>
                      <SelectTrigger className="bg-muted border-border">
                        <SelectValue placeholder="Select a genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres.map((g) => (
                          <SelectItem key={g.id} value={g.name}>
                            {g.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex gap-3">
                    <Button
                      type="submit"
                      disabled={submitting || loading}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground"
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </Button>
                    <Link href="/dashboard">
                      <Button
                        type="button"
                        variant="outline"
                        disabled={submitting}
                      >
                        Cancel
                      </Button>
                    </Link>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </>
  )
}