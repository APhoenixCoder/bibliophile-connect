'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { User, ArrowLeft, BookOpen, Library } from 'lucide-react'

interface UserProfile {
  id: string
  name: string
  email: string
  display_name?: string
  profile_picture_url?: string
  bio?: string
  pronouns?: string
  favorite_characters?: string
  reading_goal?: number
  location?: string
  website?: string
  booksRead?: Array<{ title: string; author: string }>
  readingList?: Array<{ title: string; author: string }>
  favoriteGenres?: Array<{ id: string; name: string; slug: string }>
}

export default function UserProfilePage() {
  const params = useParams()
  const userId = params.id as string
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!userId) return

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const res = await fetch(`/api/user/${userId}`, { cache: 'no-store' })
        if (!res.ok) {
          throw new Error('Failed to fetch user profile')
        }
        const data = await res.json()
        setProfile(data.user)
      } catch (err) {
        console.error('[v0] Error fetching profile:', err)
        setError('User profile not found')
      } finally {
        setLoading(false)
      }
    }

    fetchProfile()
  }, [userId])

  if (loading) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </main>
    )
  }

  if (error || !profile) {
    return (
      <main className="min-h-screen bg-background py-8 px-4 md:px-6">
        <div className="max-w-2xl mx-auto">
          <Link href="/dashboard">
            <Button variant="outline" className="mb-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <Card className="border-border">
            <CardContent className="pt-6">
              <p className="text-muted-foreground text-center">
                {error || 'User profile not found'}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background py-8 px-4 md:px-6">
      <div className="max-w-2xl mx-auto">
        <Link href="/dashboard">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <Card className="mb-8 border-border">
          <CardContent className="pt-6">
            <div className="flex items-start gap-6">
              <div className="w-24 h-24 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                {profile.profile_picture_url ? (
                  <img
                    src={profile.profile_picture_url}
                    alt={profile.display_name || profile.name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <User className="h-12 w-12 text-accent" />
                )}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-serif font-bold mb-1">{profile.display_name || profile.name}</h1>
                {profile.pronouns && (
                  <p className="text-sm text-muted-foreground mb-3">{profile.pronouns}</p>
                )}
                {profile.bio && (
                  <p className="text-muted-foreground mb-4">{profile.bio}</p>
                )}
                {profile.location && (
                  <p className="text-sm text-muted-foreground mb-2">📍 {profile.location}</p>
                )}
                {profile.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer" className="text-sm text-accent hover:underline mb-2">
                    🌐 {profile.website}
                  </a>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {profile.reading_goal && (
          <Card className="mb-8 border-border">
            <CardHeader>
              <CardTitle className="font-serif">Reading Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{profile.reading_goal} books per year</p>
            </CardContent>
          </Card>
        )}

        {profile.favoriteGenres && profile.favoriteGenres.length > 0 && (
          <Card className="mb-8 border-border">
            <CardHeader>
              <CardTitle className="font-serif">Favorite Genres</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {profile.favoriteGenres.map((genre) => (
                  <span key={genre.id} className="px-3 py-1 bg-accent/20 text-accent rounded-full text-sm">
                    {genre.name}
                  </span>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {profile.favorite_characters && (
          <Card className="mb-8 border-border">
            <CardHeader>
              <CardTitle className="font-serif">Favorite Characters</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{profile.favorite_characters}</p>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-6 md:grid-cols-2 max-w-2xl mx-auto mb-8">
          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-accent" />
                <CardTitle className="font-serif">Books Read</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{profile.booksRead?.length || 0}</p>
              <p className="text-sm text-muted-foreground">books completed</p>
            </CardContent>
          </Card>

          <Card className="border-border">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Library className="h-5 w-5 text-accent" />
                <CardTitle className="font-serif">Reading List</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{profile.readingList?.length || 0}</p>
              <p className="text-sm text-muted-foreground">books queued</p>
            </CardContent>
          </Card>
        </div>

        {profile.booksRead && profile.booksRead.length > 0 && (
          <Card className="mb-8 border-border">
            <CardHeader>
              <CardTitle className="font-serif">Books Read</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.booksRead.map((book, index) => (
                  <div key={index} className="pb-3 border-b border-border last:border-b-0 last:pb-0">
                    <p className="font-medium text-foreground">{book.title}</p>
                    <p className="text-sm text-muted-foreground">by {book.author}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {profile.readingList && profile.readingList.length > 0 && (
          <Card className="mb-8 border-border">
            <CardHeader>
              <CardTitle className="font-serif">Reading List</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {profile.readingList.map((book, index) => (
                  <div key={index} className="pb-3 border-b border-border last:border-b-0 last:pb-0">
                    <p className="font-medium text-foreground">{book.title}</p>
                    <p className="text-sm text-muted-foreground">by {book.author}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </main>
  )
}
