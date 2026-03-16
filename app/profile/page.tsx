"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Navbar } from "@/components/navbar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Save, Plus, X, ArrowLeft, CheckCircle } from "lucide-react"
import { useRouter } from "next/navigation"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface Genre {
  id: string
  name: string
  slug: string
}

interface BookEntry {
  title: string
  author: string
}

export default function ProfilePage() {
  const router = useRouter()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const [genres, setGenres] = useState<Genre[]>([])
  const [formData, setFormData] = useState({
    displayName: "",
    pronouns: "",
    bio: "",
    readingGoal: "",
    favoriteCharacters: "",
    profilePictureUrl: "",
  })
  const [selectedGenres, setSelectedGenres] = useState<string[]>([])
  const [booksRead, setBooksRead] = useState<BookEntry[]>([])
  const [readingList, setReadingList] = useState<BookEntry[]>([])
  const [newBookRead, setNewBookRead] = useState<BookEntry>({ title: "", author: "" })
  const [newReadingListBook, setNewReadingListBook] = useState<BookEntry>({ title: "", author: "" })
  const [uploadingImage, setUploadingImage] = useState(false)
  const [showSuccessDialog, setShowSuccessDialog] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (isClient) {
      fetchProfile()
      fetchGenres()
    }
  }, [isClient])

  const fetchGenres = async () => {
    try {
      const res = await fetch("/api/genres")
      if (res.ok) {
        const data = await res.json()
        setGenres(data.genres)
      }
    } catch (error) {
      console.error("Failed to fetch genres:", error)
    }
  }

  const fetchProfile = async () => {
    try {
      const userId = localStorage.getItem("userId")
      console.log("[v0] fetchProfile called, userId:", userId)
      
      if (!userId) {
        console.log("[v0] No userId in localStorage, redirecting to login")
        router.push("/login")
        return
      }
      
      const res = await fetch(`/api/profile?userId=${userId}`)
      if (res.ok) {
        const data = await res.json()
        if (data.profile) {
          setFormData({
            displayName: data.profile.display_name || "",
            pronouns: data.profile.pronouns || "",
            bio: data.profile.bio || "",
            readingGoal: data.profile.reading_goal?.toString() || "",
            favoriteCharacters: data.profile.favorite_characters || "",
            profilePictureUrl: data.profile.profile_picture_url || "",
          })
          setSelectedGenres(data.favoriteGenres || [])
          setBooksRead(data.booksRead || [])
          setReadingList(data.readingList || [])
        }
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    console.log("[v0] Save profile button clicked")
    const userId = localStorage.getItem("userId")
    console.log("[v0] Retrieved userId:", userId)
    
    if (!userId) {
      console.log("[v0] No userId found, redirecting to login")
      toast({
        title: "Error",
        description: "You must be logged in to save your profile",
        variant: "destructive",
      })
      router.push("/login")
      return
    }

    setLoading(true)
    console.log("[v0] Set loading to true")

    try {
      const payload = {
        userId,
        ...formData,
        readingGoal: formData.readingGoal ? Number.parseInt(formData.readingGoal) : null,
        favoriteGenres: selectedGenres,
        booksRead,
        readingList,
      }

      console.log("[v0] Sending profile update with payload:", {
        userId,
        displayName: formData.displayName,
        genreCount: selectedGenres.length,
        booksReadCount: booksRead.length,
        readingListCount: readingList.length,
      })

      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      console.log("[v0] Profile API response status:", res.status)
      const data = await res.json()
      console.log("[v0] Profile API response data:", data)

      if (res.ok) {
        console.log("[v0] Profile update successful, showing success dialog")
        setShowSuccessDialog(true)
      } else {
        console.log("[v0] Profile update failed:", data.error)
        toast({
          title: "Error",
          description: data.error || "Failed to update profile",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Profile update error:", error)
      toast({
        title: "Error",
        description: "An error occurred while updating your profile",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      console.log("[v0] Set loading to false")
    }
  }

  const addBookRead = () => {
    if (newBookRead.title && newBookRead.author) {
      setBooksRead([...booksRead, newBookRead])
      setNewBookRead({ title: "", author: "" })
    }
  }

  const removeBookRead = (index: number) => {
    setBooksRead(booksRead.filter((_, i) => i !== index))
  }

  const addToReadingList = () => {
    if (newReadingListBook.title && newReadingListBook.author) {
      setReadingList([...readingList, newReadingListBook])
      setNewReadingListBook({ title: "", author: "" })
    }
  }

  const removeFromReadingList = (index: number) => {
    setReadingList(readingList.filter((_, i) => i !== index))
  }

  const toggleGenre = (genreId: string) => {
    if (selectedGenres.includes(genreId)) {
      setSelectedGenres(selectedGenres.filter((id) => id !== genreId))
    } else {
      setSelectedGenres([...selectedGenres, genreId])
    }
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file",
        description: "Please upload an image file",
        variant: "destructive",
      })
      return
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      })
      return
    }

    setUploadingImage(true)

    try {
      // Convert image to base64
      const reader = new FileReader()
      reader.onloadend = () => {
        const base64String = reader.result as string
        setFormData({ ...formData, profilePictureUrl: base64String })
        toast({
          title: "Image uploaded",
          description: "Your profile picture has been uploaded successfully",
        })
        setUploadingImage(false)
      }
      reader.onerror = () => {
        toast({
          title: "Upload failed",
          description: "Failed to read the image file",
          variant: "destructive",
        })
        setUploadingImage(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "An error occurred while uploading the image",
        variant: "destructive",
      })
      setUploadingImage(false)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>

          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Your Profile</h1>
          <p className="text-muted-foreground mb-8">Share your literary journey with fellow book lovers</p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Basic Information</CardTitle>
                <CardDescription>Tell us about yourself</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="displayName">Display Name</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                      placeholder="What should we call you?"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pronouns">Pronouns</Label>
                    <Input
                      id="pronouns"
                      value={formData.pronouns}
                      onChange={(e) => setFormData({ ...formData, pronouns: e.target.value })}
                      placeholder="e.g., she/her, he/him, they/them"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Share your story, reading philosophy, or favorite quote..."
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="profilePicture">Profile Picture</Label>
                  <div className="flex items-center gap-4">
                    {formData.profilePictureUrl && (
                      <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-accent">
                        <img
                          src={formData.profilePictureUrl || "/placeholder.svg"}
                          alt="Profile preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <Input
                        id="profilePicture"
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-muted-foreground mt-1">
                        Upload an image (max 2MB). Supported formats: JPG, PNG, GIF, WebP
                      </p>
                    </div>
                    {uploadingImage && <Loader2 className="h-5 w-5 animate-spin text-accent" />}
                  </div>
                  {formData.profilePictureUrl && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setFormData({ ...formData, profilePictureUrl: "" })}
                    >
                      Remove Picture
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Reading Preferences */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Reading Preferences</CardTitle>
                <CardDescription>What do you love to read?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="readingGoal">Annual Reading Goal (books per year)</Label>
                  <Input
                    id="readingGoal"
                    type="number"
                    min="0"
                    value={formData.readingGoal}
                    onChange={(e) => setFormData({ ...formData, readingGoal: e.target.value })}
                    placeholder="e.g., 52"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Favorite Genres</Label>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {genres.map((genre) => (
                      <button
                        key={genre.id}
                        type="button"
                        onClick={() => toggleGenre(genre.id)}
                        className={`px-3 py-2 rounded-md text-sm border transition-colors ${
                          selectedGenres.includes(genre.id)
                            ? "bg-accent text-accent-foreground border-accent"
                            : "bg-background border-border hover:border-accent"
                        }`}
                      >
                        {genre.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="favoriteCharacters">Favorite Characters</Label>
                  <Textarea
                    id="favoriteCharacters"
                    value={formData.favoriteCharacters}
                    onChange={(e) => setFormData({ ...formData, favoriteCharacters: e.target.value })}
                    placeholder="List your favorite literary characters..."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Books Read */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">Books I've Read</CardTitle>
                <CardDescription>Share your reading history</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {booksRead.map((book, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <div className="flex-1">
                        <p className="font-medium">{book.title}</p>
                        <p className="text-sm text-muted-foreground">by {book.author}</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeBookRead(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Book title"
                    value={newBookRead.title}
                    onChange={(e) => setNewBookRead({ ...newBookRead, title: e.target.value })}
                  />
                  <Input
                    placeholder="Author"
                    value={newBookRead.author}
                    onChange={(e) => setNewBookRead({ ...newBookRead, author: e.target.value })}
                  />
                  <Button type="button" onClick={addBookRead} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Reading List */}
            <Card>
              <CardHeader>
                <CardTitle className="font-serif">My Reading List</CardTitle>
                <CardDescription>Books you plan to read</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  {readingList.map((book, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-muted rounded-md">
                      <div className="flex-1">
                        <p className="font-medium">{book.title}</p>
                        <p className="text-sm text-muted-foreground">by {book.author}</p>
                      </div>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeFromReadingList(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <Input
                    placeholder="Book title"
                    value={newReadingListBook.title}
                    onChange={(e) => setNewReadingListBook({ ...newReadingListBook, title: e.target.value })}
                  />
                  <Input
                    placeholder="Author"
                    value={newReadingListBook.author}
                    onChange={(e) => setNewReadingListBook({ ...newReadingListBook, author: e.target.value })}
                  />
                  <Button type="button" onClick={addToReadingList} size="icon">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Profile
                  </>
                )}
              </Button>
<Button type="button" variant="outline" onClick={() => router.push("/dashboard")}>
              Cancel
            </Button>
            </div>
          </form>
        </div>
      </div>

      <AlertDialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-6 w-6 text-green-600" />
              <AlertDialogTitle className="font-serif">Profile Updated!</AlertDialogTitle>
            </div>
            <AlertDialogDescription>
              Your profile has been saved successfully. Your changes will now appear on your dashboard.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction
              onClick={() => router.push("/dashboard")}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
            >
              OK
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
