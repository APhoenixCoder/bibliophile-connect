"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { ArrowLeft, Star, Send, Edit, Trash2, User } from "lucide-react"
import Link from "next/link"
import { useToast } from "@/components/ui/use-toast"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Review {
  id: string
  user_id: string
  rating: number
  review_text: string
  created_at: string
  user_name?: string
  profile_picture_url?: string
  replies?: Reply[]
}

interface Reply {
  id: string
  user_id: string
  reply_text: string
  created_at: string
  user_name?: string
}

interface BookInfo {
  title: string
  author: string
  description: string | null
}

export default function ReviewPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { toast } = useToast()

  const title = (searchParams.get("title") || "").toLowerCase()
  const author = (searchParams.get("author") || "").toLowerCase()

  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [review, setReview] = useState("")
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [myReview, setMyReview] = useState<Review | null>(null)
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null)
  const [replyText, setReplyText] = useState<Record<string, string>>({})
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "review" | "reply"; id: string } | null>(null)
  const [bookInfo, setBookInfo] = useState<BookInfo | null>(null)

  useEffect(() => {
    fetchReviews()
  }, [title, author])

  const fetchReviews = async () => {
    try {
      setLoading(true)
      const res = await fetch(
        `/api/reviews?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`
      )
      if (res.ok) {
        const data = await res.json()
        const userId = localStorage.getItem("userId")
        setReviews(data.reviews || [])
        const userReview = data.reviews?.find((r: Review) => r.user_id === userId)
        setMyReview(userReview || null)
        if (userReview) {
          setRating(userReview.rating)
          setReview(userReview.review_text)
          setEditingReviewId(userReview.id)
        }
      }

      // Fetch book info including description
      const bookRes = await fetch(
        `/api/books/info?title=${encodeURIComponent(title)}&author=${encodeURIComponent(author)}`
      )
      if (bookRes.ok) {
        const bookData = await bookRes.json()
        setBookInfo(bookData.book || null)
      }
    } catch (error) {
      console.error("Error fetching reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitReview = async () => {
    if (!rating) {
      toast({
        title: "Error",
        description: "Please select a rating",
        variant: "destructive",
      })
      return
    }

    setSubmitting(true)
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        router.push("/login")
        return
      }

      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          book_title: title,
          book_author: author,
          rating,
          review_text: review,
          reviewId: editingReviewId,
        }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: editingReviewId ? "Review updated!" : "Review posted!",
        })
        await fetchReviews()
        setReview("")
        setRating(0)
      } else {
        toast({
          title: "Error",
          description: "Failed to submit review",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error submitting review:", error)
      toast({
        title: "Error",
        description: "An error occurred",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  const handleReply = async (reviewId: string) => {
    if (!replyText[reviewId]?.trim()) {
      toast({
        title: "Error",
        description: "Reply cannot be empty",
        variant: "destructive",
      })
      return
    }

    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        router.push("/login")
        return
      }

      const res = await fetch("/api/reviews/reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          reviewId,
          reply_text: replyText[reviewId],
        }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Reply posted!",
        })
        setReplyText({ ...replyText, [reviewId]: "" })
        setReplyingTo(null)
        await fetchReviews()
      }
    } catch (error) {
      console.error("Error posting reply:", error)
      toast({
        title: "Error",
        description: "Failed to post reply",
        variant: "destructive",
      })
    }
  }

  const handleDeleteReview = async () => {
    if (!deleteConfirm) return

    try {
      const res = await fetch("/api/reviews", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reviewId: deleteConfirm.id }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Review deleted",
        })
        await fetchReviews()
        setDeleteConfirm(null)
      }
    } catch (error) {
      console.error("Error deleting review:", error)
      toast({
        title: "Error",
        description: "Failed to delete review",
        variant: "destructive",
      })
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <Link href="/dashboard">
          <Button variant="outline" className="mb-6 bg-transparent">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-serif font-bold mb-2">{title}</h1>
          <p className="text-muted-foreground mb-6">by {author}</p>
          
          {bookInfo?.description && (
            <Card className="mb-8 border-border bg-muted/30">
              <CardContent className="pt-6">
                <p className="text-sm text-foreground leading-relaxed">{bookInfo.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Your Review Section */}
          <Card className="mb-8 border-border">
            <CardHeader>
              <CardTitle className="font-serif">
                {editingReviewId ? "Edit Your Review" : "Add Your Review"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Rating */}
              <div>
                <label className="text-sm font-medium mb-2 block">Rating</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="transition-colors"
                    >
                      <Star
                        className={`h-8 w-8 ${
                          star <= (hoverRating || rating)
                            ? "fill-accent text-accent"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Review Text */}
              <div>
                <label className="text-sm font-medium mb-2 block">Your Review (Optional)</label>
                <Textarea
                  placeholder="Share your thoughts about this book..."
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  className="min-h-24 border-border"
                />
              </div>

              <Button
                onClick={handleSubmitReview}
                disabled={submitting || !rating}
                className="bg-accent hover:bg-accent/90 text-accent-foreground w-full"
              >
                {submitting ? "Posting..." : editingReviewId ? "Update Review" : "Post Review"}
              </Button>
            </CardContent>
          </Card>

          {/* Other Reviews Section */}
          <div>
            <h2 className="text-2xl font-serif font-bold mb-4">Community Reviews</h2>
            {loading ? (
              <p className="text-muted-foreground">Loading reviews...</p>
            ) : reviews.length === 0 ? (
              <p className="text-muted-foreground">No reviews yet. Be the first to review!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((rev) => (
                  <Card key={rev.id} className="border-border">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <Link href={`/user/${rev.user_id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity flex-1">
                          <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                            {rev.profile_picture_url ? (
                              <img
                                src={rev.profile_picture_url}
                                alt={rev.user_name || 'User'}
                                className="w-full h-full rounded-full object-cover"
                              />
                            ) : (
                              <User className="h-5 w-5 text-accent" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium hover:text-accent">{rev.user_name || "Anonymous"}</p>
                            <div className="flex gap-1 mt-2">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`h-4 w-4 ${
                                    star <= rev.rating
                                      ? "fill-accent text-accent"
                                      : "text-muted-foreground"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </Link>
                        {rev.user_id === localStorage.getItem("userId") && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingReviewId(rev.id)
                                setRating(rev.rating)
                                setReview(rev.review_text)
                                window.scrollTo({ top: 0, behavior: "smooth" })
                              }}
                              className="p-1 text-accent hover:bg-accent/10 rounded"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setDeleteConfirm({ type: "review", id: rev.id })}
                              className="p-1 text-destructive hover:bg-destructive/10 rounded"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {rev.review_text && (
                        <p className="text-foreground">{rev.review_text}</p>
                      )}

                      {/* Replies */}
                      {rev.replies && rev.replies.length > 0 && (
                        <div className="mt-4 ml-4 border-l-2 border-border pl-4 space-y-3">
                          {rev.replies.map((reply) => (
                            <div key={reply.id} className="text-sm">
                              <p className="font-medium">{reply.user_name || "Anonymous"}</p>
                              <p className="text-muted-foreground mt-1">{reply.reply_text}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Reply Input */}
                      {replyingTo === rev.id ? (
                        <div className="mt-4 flex gap-2">
                          <Input
                            placeholder="Write a reply..."
                            value={replyText[rev.id] || ""}
                            onChange={(e) =>
                              setReplyText({ ...replyText, [rev.id]: e.target.value })
                            }
                            className="border-border"
                          />
                          <Button
                            size="sm"
                            onClick={() => handleReply(rev.id)}
                            className="bg-accent hover:bg-accent/90 text-accent-foreground"
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setReplyingTo(rev.id)}
                          className="mt-4"
                        >
                          Reply
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete Review</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this review? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteReview}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
