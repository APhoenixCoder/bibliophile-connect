'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { BookOpen, Star, Plus, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import Link from 'next/link'

interface Book {
  id: string
  title: string
  author: string
  genre: string
  description: string | null
}

interface Review {
  id: string
  user_name: string
  rating: number
  review_text: string
  created_at: string
}

interface Genre {
  name: string
  bookCount: number
}

export default function RecommendationsPage() {
  const [booksByGenre, setBooksByGenre] = useState<Record<string, Book[]>>({})
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(null)
  const [selectedBook, setSelectedBook] = useState<Book | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [loadingReviews, setLoadingReviews] = useState(false)
  const [addingToList, setAddingToList] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchRecommendations()
  }, [])

  const fetchRecommendations = async () => {
    try {
      const userId = localStorage.getItem('userId')
      const url = userId 
        ? `/api/recommendations?userId=${userId}`
        : '/api/recommendations'
      
      const res = await fetch(url)
      const data = await res.json()
      setBooksByGenre(data.booksByGenre)

      // Extract genres from booksByGenre
      const genreList = Object.entries(data.booksByGenre).map(([name, books]) => ({
        name,
        bookCount: (books as Book[]).length,
      }))
      setGenres(genreList.sort((a, b) => a.name.localeCompare(b.name)))
    } catch (error) {
      console.error('[v0] Error fetching recommendations:', error)
      toast({
        title: 'Error',
        description: 'Failed to load recommendations',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchReviews = async (book: Book) => {
    setSelectedBook(book)
    setLoadingReviews(true)
    try {
      const res = await fetch(`/api/reviews?title=${encodeURIComponent(book.title.toLowerCase())}&author=${encodeURIComponent(book.author.toLowerCase())}`)
      const data = await res.json()
      setReviews(data.reviews || [])
    } catch (error) {
      console.error('[v0] Error fetching reviews:', error)
      setReviews([])
    } finally {
      setLoadingReviews(false)
    }
  }

  const addToReadingList = async () => {
    try {
      const userId = localStorage.getItem('userId')
      if (!userId) {
        setShowLoginPrompt(true)
        return
      }

      setAddingToList(true)

      // Get current reading list
      const profileRes = await fetch(`/api/profile?userId=${userId}`)
      const profileData = await profileRes.json()
      const currentReadingList = profileData.readingList || []

      // Add new book
      const newBook = {
        title: selectedBook!.title,
        author: selectedBook!.author,
      }

      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          readingList: [...currentReadingList, newBook],
        }),
      })

      if (res.ok) {
        toast({
          title: 'Success',
          description: `"${selectedBook!.title}" added to your reading list!`,
        })
        setSelectedBook(null)
        setSelectedGenre(null)
        // Refresh to show updated list
        fetchRecommendations()
      }
    } catch (error) {
      console.error('[v0] Error adding to reading list:', error)
      toast({
        title: 'Error',
        description: 'Failed to add book to reading list',
        variant: 'destructive',
      })
    } finally {
      setAddingToList(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Loading recommendations...</p>
        </div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 md:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header with Back Button */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-serif font-bold mb-2">Discover Books</h1>
            <p className="text-muted-foreground">Explore our curated collection by genre</p>
          </div>
          <Link href="/dashboard">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        {/* Genre Cards Grid */}
        {!selectedGenre ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {genres.map((genre) => (
              <Card
                key={genre.name}
                className="cursor-pointer border-border hover:shadow-md hover:scale-105 transition-all duration-300 bg-card"
                onClick={() => setSelectedGenre(genre.name)}
              >
                <CardHeader>
                  <CardTitle className="font-serif text-xl">{genre.name}</CardTitle>
                  <CardDescription>{genre.bookCount} books</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">Click to explore</p>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div>
            {/* Back to Genres Button */}
            <Button
              variant="outline"
              onClick={() => setSelectedGenre(null)}
              className="mb-6 flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Genres
            </Button>

            <h2 className="text-2xl font-serif font-bold mb-6">{selectedGenre}</h2>

            {/* Books Grid for Selected Genre */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {booksByGenre[selectedGenre]?.map((book) => (
                <Card key={book.id} className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow border-border">
                  <CardHeader>
                    <CardTitle className="font-serif line-clamp-2 text-lg">{book.title}</CardTitle>
                    <CardDescription className="line-clamp-1">{book.author}</CardDescription>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm text-foreground line-clamp-3 mb-4 flex-1">
                      {book.description || 'No description available'}
                    </p>
                    <Button
                      onClick={() => fetchReviews(book)}
                      variant="outline"
                      className="w-full"
                    >
                      View Reviews & Details
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Book Details Modal */}
      <Dialog open={!!selectedBook} onOpenChange={(open) => !open && setSelectedBook(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          {selectedBook && (
            <>
              <DialogHeader>
                <DialogTitle className="font-serif text-2xl">{selectedBook.title}</DialogTitle>
                <DialogDescription>by {selectedBook.author}</DialogDescription>
              </DialogHeader>

              <div className="space-y-6">
                {selectedBook.description && (
                  <div>
                    <h3 className="font-semibold mb-2">About</h3>
                    <p className="text-sm text-foreground">{selectedBook.description}</p>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-4">Community Reviews</h3>
                  {loadingReviews ? (
                    <p className="text-sm text-muted-foreground">Loading reviews...</p>
                  ) : reviews.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No reviews yet. Be the first to review!</p>
                  ) : (
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {reviews.map((review) => (
                        <div key={review.id} className="p-3 bg-muted rounded-md">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm">{review.user_name || 'Anonymous'}</p>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-muted'}`}
                                />
                              ))}
                            </div>
                          </div>
                          {review.review_text && (
                            <p className="text-sm text-foreground">{review.review_text}</p>
                          )}
                          <p className="text-xs text-muted-foreground mt-2">
                            {new Date(review.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={addToReadingList}
                    disabled={addingToList}
                    className="flex-1"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {addingToList ? 'Adding...' : 'Add to Reading List'}
                  </Button>
                  <Link href={`/review?title=${encodeURIComponent(selectedBook.title.toLowerCase())}&author=${encodeURIComponent(selectedBook.author.toLowerCase())}`}>
                    <Button variant="outline" className="w-full">
                      Write a Review
                    </Button>
                  </Link>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Login Prompt Modal */}
      <Dialog open={showLoginPrompt} onOpenChange={setShowLoginPrompt}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Sign In Required</DialogTitle>
            <DialogDescription>
              Please sign in or create an account to add books to your reading list.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <Link href="/login" className="w-full">
              <Button className="w-full">
                Sign In
              </Button>
            </Link>
            <Link href="/signup" className="w-full">
              <Button variant="outline" className="w-full">
                Create Account
              </Button>
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  )
}
