"use client"

import { useEffect, useState, useCallback } from "react"
import { Navbar } from "@/components/navbar"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Trash2, Edit, Star, CheckCircle } from "lucide-react"
import { User, BookOpen, Library, Plus } from "lucide-react"
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
import Link from "next/link"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface BookEntry {
  title: string
  author: string
}

interface Suggestion {
  title?: string
  author?: string
}

export default function DashboardPage() {
  const [booksRead, setBooksRead] = useState<BookEntry[]>([])
  const [readingList, setReadingList] = useState<BookEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [userName, setUserName] = useState<string | null>(null)
  const [openReadingListDialog, setOpenReadingListDialog] = useState(false)
  const [openBooksReadDialog, setOpenBooksReadDialog] = useState(false)
  const [newBook, setNewBook] = useState<BookEntry>({ title: "", author: "" })
  const [addingBook, setAddingBook] = useState(false)
  const [titleSuggestions, setTitleSuggestions] = useState<Suggestion[]>([])
  const [authorSuggestions, setAuthorSuggestions] = useState<Suggestion[]>([])
  const [showTitleSuggestions, setShowTitleSuggestions] = useState(false)
  const [showAuthorSuggestions, setShowAuthorSuggestions] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: "read" | "list"; index: number } | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [markAsReadConfirm, setMarkAsReadConfirm] = useState<{ book: BookEntry; index: number } | null>(null)
  const [markingAsRead, setMarkingAsRead] = useState(false)
  const { toast } = useToast()
  const [openDialog, setOpenDialog] = useState(false) // Declare openDialog here

  const fetchDashboardData = async () => {
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        setLoading(false)
        return
      }
      const res = await fetch(`/api/profile?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        setBooksRead(data.booksRead || [])
        setReadingList(data.readingList || [])
        // Get display name from profile, fallback to 'bookworm'
        const displayName = data.profile?.display_name || 'bookworm'
        setUserName(displayName)
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error)
    } finally {
      setLoading(false)
    }
  }

  const searchSuggestions = useCallback(
    async (query: string, type: "title" | "author") => {
      if (!query || query.length < 1) {
        if (type === "title") {
          setTitleSuggestions([])
        } else {
          setAuthorSuggestions([])
        }
        return
      }

      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(query)}&type=${type}`)
        if (res.ok) {
          const data = await res.json()
          if (type === "title") {
            setTitleSuggestions(data.suggestions || [])
            setShowTitleSuggestions(true)
          } else {
            setAuthorSuggestions(data.suggestions || [])
            setShowAuthorSuggestions(true)
          }
        }
      } catch (error) {
        console.error("Search error:", error)
      }
    },
    []
  )

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const deleteBook = async () => {
    if (!deleteConfirm) return
    
    setDeleting(true)
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) return

      const newBooks = deleteConfirm.type === "read" 
        ? booksRead.filter((_, i) => i !== deleteConfirm.index)
        : readingList.filter((_, i) => i !== deleteConfirm.index)

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          booksRead: deleteConfirm.type === "read" ? newBooks : booksRead,
          readingList: deleteConfirm.type === "list" ? newBooks : readingList,
        }),
      })

      if (res.ok) {
        if (deleteConfirm.type === "read") {
          setBooksRead(newBooks)
        } else {
          setReadingList(newBooks)
        }
        toast({
          title: "Success",
          description: "Book removed successfully",
        })
      }
    } catch (error) {
      console.error("Error deleting book:", error)
      toast({
        title: "Error",
        description: "Failed to delete book",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteConfirm(null)
    }
  }

  const markAsRead = async () => {
    if (!markAsReadConfirm) return

    setMarkingAsRead(true)
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) return

      const newReadingList = readingList.filter((_, i) => i !== markAsReadConfirm.index)
      const updatedBooksRead = [...booksRead, markAsReadConfirm.book]

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          booksRead: updatedBooksRead,
          readingList: newReadingList,
        }),
      })

      if (res.ok) {
        setBooksRead(updatedBooksRead)
        setReadingList(newReadingList)
        toast({
          title: "Success",
          description: "Book marked as read! Redirecting to review page...",
        })
        // Redirect to review page after a brief delay
        setTimeout(() => {
          window.location.href = `/review?title=${encodeURIComponent(markAsReadConfirm.book.title.toLowerCase())}&author=${encodeURIComponent(markAsReadConfirm.book.author.toLowerCase())}`
        }, 1000)
      }
    } catch (error) {
      console.error("Error marking book as read:", error)
      toast({
        title: "Error",
        description: "Failed to mark book as read",
        variant: "destructive",
      })
    } finally {
      setMarkingAsRead(false)
      setMarkAsReadConfirm(null)
    }
  }

  const addBookToReadingList = async () => {
    if (!newBook.title || !newBook.author) {
      toast({
        title: "Error",
        description: "Please enter both book title and author",
        variant: "destructive",
      })
      return
    }

    // Check if book already exists in reading list
    const isDuplicateInReadingList = readingList.some(
      (book) =>
        book.title.toLowerCase() === newBook.title.toLowerCase() &&
        book.author.toLowerCase() === newBook.author.toLowerCase()
    )

    // Check if book already exists in books read
    const isDuplicateInBooksRead = booksRead.some(
      (book) =>
        book.title.toLowerCase() === newBook.title.toLowerCase() &&
        book.author.toLowerCase() === newBook.author.toLowerCase()
    )

    if (isDuplicateInReadingList || isDuplicateInBooksRead) {
      toast({
        title: "Error",
        description: "You've already added this book to your lists",
        variant: "destructive",
      })
      return
    }

    setAddingBook(true)
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        })
        return
      }

      // Try to add the book to the books database if it's new
      await fetch("/api/books/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBook.title,
          author: newBook.author,
        }),
      }).catch(() => {
        // Silently fail if book add fails
      })

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          readingList: [...readingList, newBook],
          booksRead,
        }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Book added to your reading list!",
        })
        setReadingList([...readingList, newBook])
        setNewBook({ title: "", author: "" })
        setOpenReadingListDialog(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to add book",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding book:", error)
      toast({
        title: "Error",
        description: "An error occurred while adding the book",
        variant: "destructive",
      })
    } finally {
      setAddingBook(false)
    }
  }

  const addBookToRead = async () => {
    if (!newBook.title || !newBook.author) {
      toast({
        title: "Error",
        description: "Please enter both book title and author",
        variant: "destructive",
      })
      return
    }

    // Check if book already exists in books read
    const isDuplicateInBooksRead = booksRead.some(
      (book) =>
        book.title.toLowerCase() === newBook.title.toLowerCase() &&
        book.author.toLowerCase() === newBook.author.toLowerCase()
    )

    // Check if book already exists in reading list
    const isDuplicateInReadingList = readingList.some(
      (book) =>
        book.title.toLowerCase() === newBook.title.toLowerCase() &&
        book.author.toLowerCase() === newBook.author.toLowerCase()
    )

    if (isDuplicateInBooksRead || isDuplicateInReadingList) {
      toast({
        title: "Error",
        description: "You've already added this book to your lists",
        variant: "destructive",
      })
      return
    }

    setAddingBook(true)
    try {
      const userId = localStorage.getItem("userId")
      if (!userId) {
        toast({
          title: "Error",
          description: "You must be logged in",
          variant: "destructive",
        })
        return
      }

      // Try to add the book to the books database if it's new
      await fetch("/api/books/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newBook.title,
          author: newBook.author,
        }),
      }).catch(() => {
        // Silently fail if book add fails
      })

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          booksRead: [...booksRead, newBook],
          readingList,
        }),
      })

      if (res.ok) {
        toast({
          title: "Success",
          description: "Book added to your books read!",
        })
        setBooksRead([...booksRead, newBook])
        setNewBook({ title: "", author: "" })
        setOpenBooksReadDialog(false)
      } else {
        toast({
          title: "Error",
          description: "Failed to add book",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Error adding book:", error)
      toast({
        title: "Error",
        description: "An error occurred while adding the book",
        variant: "destructive",
      })
    } finally {
      setAddingBook(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-4xl font-serif font-bold text-foreground mb-2">
                {userName ? `Welcome, ${userName}` : "Welcome to Your Dashboard"}
              </h1>
              <p className="text-muted-foreground">Your personal library awaits</p>
            </div>
            <Link href="/profile">
              <Button className="bg-accent hover:bg-accent/90 text-accent-foreground" onClick={() => console.log("[v0] Edit Profile button clicked")}>
                <User className="mr-2 h-4 w-4" />
                Edit Profile
              </Button>
            </Link>
          </div>

          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto mb-8">
            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5 text-accent" />
                  <CardTitle className="font-serif">Books Read</CardTitle>
                </div>
                <CardDescription>Your reading history</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{booksRead.length}</p>
                <p className="text-sm text-muted-foreground">books completed</p>
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Library className="h-5 w-5 text-accent" />
                  <CardTitle className="font-serif">Reading List</CardTitle>
                </div>
                <CardDescription>Books to read</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold text-foreground">{readingList.length}</p>
                <p className="text-sm text-muted-foreground">books queued</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:max-w-4xl lg:mx-auto">
            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="font-serif">Books I've Read</CardTitle>
                  <CardDescription>Your reading journey</CardDescription>
                </div>
                <Dialog open={openBooksReadDialog} onOpenChange={setOpenBooksReadDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="bg-accent hover:bg-accent/90 text-accent-foreground border-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-serif">Add to Books Read</DialogTitle>
                      <DialogDescription>Add a new book to your books read</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Book Title</label>
                        <div className="relative">
                          <Input
                            placeholder="Enter book title"
                            value={newBook.title}
                            onChange={(e) => {
                              setNewBook({ ...newBook, title: e.target.value })
                              searchSuggestions(e.target.value, "title")
                            }}
                            onFocus={() => newBook.title && setShowTitleSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowTitleSuggestions(false), 200)}
                            className="border-border"
                          />
                          {showTitleSuggestions && titleSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-md z-50">
                              {titleSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setNewBook({ 
                                      title: suggestion.title || "", 
                                      author: suggestion.author || "" 
                                    })
                                    setShowTitleSuggestions(false)
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                                >
                                  <div className="font-medium">{suggestion.title}</div>
                                  {suggestion.author && (
                                    <div className="text-xs text-muted-foreground">by {suggestion.author}</div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Author</label>
                        <div className="relative">
                          <Input
                            placeholder="Enter author name"
                            value={newBook.author}
                            onChange={(e) => {
                              setNewBook({ ...newBook, author: e.target.value })
                              searchSuggestions(e.target.value, "author")
                            }}
                            onFocus={() => newBook.author && setShowAuthorSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowAuthorSuggestions(false), 200)}
                            className="border-border"
                          />
                          {showAuthorSuggestions && authorSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-md z-50">
                              {authorSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setNewBook({ ...newBook, author: suggestion.author || "" })
                                    setShowAuthorSuggestions(false)
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                                >
                                  {suggestion.author}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2 justify-end pt-4">
                        <Button
                          variant="outline"
                          onClick={() => setOpenBooksReadDialog(false)}
                          disabled={addingBook}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={addBookToRead}
                          disabled={addingBook}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground"
                        >
                          {addingBook ? "Adding..." : "Add Book"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : booksRead.length > 0 ? (
                  <div className="space-y-3">
                    {booksRead.slice(0, 5).map((book, index) => (
                      <div key={index} className="p-3 bg-muted rounded-md flex items-center justify-between group">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{book.title}</p>
                          <p className="text-sm text-muted-foreground">by {book.author}</p>
                        </div>
                        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link href={`/review?title=${encodeURIComponent(book.title.toLowerCase())}&author=${encodeURIComponent(book.author.toLowerCase())}`}>
                            <button
                              className="p-1 text-accent hover:bg-accent/10 rounded"
                              title="Add review"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          </Link>
                          <button
                            onClick={() => setDeleteConfirm({ type: "read", index })}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded"
                            title="Delete book"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {booksRead.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        and {booksRead.length - 5} more...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No books added yet. Update your profile to add books!</p>
                )}
              </CardContent>
            </Card>

            <Card className="border-border">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="font-serif">My Reading List</CardTitle>
                  <CardDescription>Up next</CardDescription>
                </div>
                <Dialog open={openReadingListDialog} onOpenChange={setOpenReadingListDialog}>
                  <DialogTrigger asChild>
                    <Button size="sm" variant="outline" className="bg-accent hover:bg-accent/90 text-accent-foreground border-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle className="font-serif">Add to Reading List</DialogTitle>
                      <DialogDescription>Add a new book to your reading list</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Book Title</label>
                        <div className="relative">
                          <Input
                            placeholder="Enter book title"
                            value={newBook.title}
                            onChange={(e) => {
                              setNewBook({ ...newBook, title: e.target.value })
                              searchSuggestions(e.target.value, "title")
                            }}
                            onFocus={() => newBook.title && setShowTitleSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowTitleSuggestions(false), 200)}
                            className="border-border"
                          />
                          {showTitleSuggestions && titleSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-md z-50">
                              {titleSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setNewBook({ 
                                      title: suggestion.title || "", 
                                      author: suggestion.author || "" 
                                    })
                                    setShowTitleSuggestions(false)
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                                >
                                  <div className="font-medium">{suggestion.title}</div>
                                  {suggestion.author && (
                                    <div className="text-xs text-muted-foreground">by {suggestion.author}</div>
                                  )}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Author</label>
                        <div className="relative">
                          <Input
                            placeholder="Enter author name"
                            value={newBook.author}
                            onChange={(e) => {
                              setNewBook({ ...newBook, author: e.target.value })
                              searchSuggestions(e.target.value, "author")
                            }}
                            onFocus={() => newBook.author && setShowAuthorSuggestions(true)}
                            onBlur={() => setTimeout(() => setShowAuthorSuggestions(false), 200)}
                            className="border-border"
                          />
                          {showAuthorSuggestions && authorSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-md shadow-md z-50">
                              {authorSuggestions.map((suggestion, index) => (
                                <button
                                  key={index}
                                  onClick={() => {
                                    setNewBook({ ...newBook, author: suggestion.author || "" })
                                    setShowAuthorSuggestions(false)
                                  }}
                                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm"
                                >
                                  {suggestion.author}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                        <Button
                          variant="outline"
                          onClick={() => setOpenReadingListDialog(false)}
                          disabled={addingBook}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={addBookToReadingList}
                          disabled={addingBook}
                          className="bg-accent hover:bg-accent/90 text-accent-foreground"
                        >
                          {addingBook ? "Adding..." : "Add Book"}
                        </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <p className="text-muted-foreground">Loading...</p>
                ) : readingList.length > 0 ? (
                  <div className="space-y-3">
                    {readingList.slice(0, 5).map((book, index) => (
                      <div key={index} className="p-3 bg-muted rounded-md flex items-center justify-between group">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{book.title}</p>
                          <p className="text-sm text-muted-foreground">by {book.author}</p>
                        </div>
                        <div className="flex gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => setMarkAsReadConfirm({ book, index })}
                            className="p-1 text-accent hover:bg-accent/10 rounded"
                            title="Mark as read"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: "list", index })}
                            className="p-1 text-destructive hover:bg-destructive/10 rounded"
                            title="Delete book"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {readingList.length > 5 && (
                      <p className="text-sm text-muted-foreground text-center pt-2">
                        and {readingList.length - 5} more...
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="text-muted-foreground">No books in your reading list yet!</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <AlertDialog open={!!deleteConfirm} onOpenChange={(open) => !open && setDeleteConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Delete Book</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this book? This action will delete it from your profile as well.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteBook}
              disabled={deleting}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!markAsReadConfirm} onOpenChange={(open) => !open && setMarkAsReadConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="font-serif">Mark as Read</AlertDialogTitle>
            <AlertDialogDescription>
              Mark "{markAsReadConfirm?.book.title}" as read? You'll be redirected to the review page where you can add a rating and review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={markingAsRead}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={markAsRead}
              disabled={markingAsRead}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              {markingAsRead ? "Processing..." : "Mark as Read"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
