'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PartyPopper, Calendar, MapPin, Loader2, Sparkles } from 'lucide-react'
import { Party } from '@/lib/types/database'
import { formatDate, generateDeviceFingerprint } from '@/lib/utils'
import { celebrateJoin } from '@/lib/confetti'

export default function JoinPartyPage({ params }: { params: Promise<{ id: string }> }) {
  const [partyId, setPartyId] = useState<string>('')
  const [party, setParty] = useState<Party | null>(null)
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, maybe: 0, not_going: 0 })
  const [guestCount, setGuestCount] = useState(0)
  const [displayName, setDisplayName] = useState('')
  const [phone, setPhone] = useState('')
  const [partySize, setPartySize] = useState('1')
  const [loading, setLoading] = useState(true)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    async function loadParty() {
      const resolvedParams = await params
      const id = resolvedParams.id
      setPartyId(id)

      // Always clear session when coming to join page (fresh start every time)
      localStorage.removeItem(`party_${id}_guest`)
      localStorage.removeItem('guestId')
      localStorage.removeItem('guestName')

      try {
        const response = await fetch(`/api/party/${id}`)
        if (!response.ok) {
          setError('Party not found')
          setLoading(false)
          return
        }

        const data = await response.json()
        setParty(data.party)
        setRsvpCounts(data.rsvpCounts || { going: 0, maybe: 0, not_going: 0 })
        setGuestCount(data.guests?.length || 0)
        setLoading(false)
      } catch (err) {
        console.error('Error loading party:', err)
        setError('Failed to load party details')
        setLoading(false)
      }
    }

    loadParty()
  }, [params, router, searchParams])

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!displayName.trim()) {
      setError('Please enter your name')
      return
    }

    const partySizeNum = parseInt(partySize)
    if (isNaN(partySizeNum) || partySizeNum < 1) {
      setError('Party size must be at least 1')
      return
    }

    setJoining(true)

    try {
      const deviceFingerprint = generateDeviceFingerprint()

      const response = await fetch(`/api/party/${partyId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          phone: phone.trim() || undefined,
          partySize: partySizeNum,
          deviceFingerprint,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Failed to join party')
        setJoining(false)
        return
      }

      const data = await response.json()

      // Store guest info in localStorage
      localStorage.setItem('guestId', data.guest.id)
      localStorage.setItem('guestName', data.guest.display_name)
      localStorage.setItem(`party_${partyId}_guest`, data.guest.id)

      // Celebrate!
      celebrateJoin()

      // Redirect to party page
      setTimeout(() => {
        router.push(`/party/${partyId}`)
      }, 1000)
    } catch (err) {
      console.error('Error joining party:', err)
      setError('Something went wrong. Please try again.')
      setJoining(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading party details...</p>
        </div>
      </div>
    )
  }

  if (error && !party) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/')} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex flex-col items-center justify-center p-4">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 text-6xl animate-bounce opacity-20">🎉</div>
        <div className="absolute top-40 right-32 text-5xl animate-pulse opacity-20">🎈</div>
        <div className="absolute bottom-32 left-40 text-7xl animate-bounce opacity-20" style={{ animationDelay: '0.5s' }}>🎊</div>
        <div className="absolute bottom-20 right-20 text-6xl animate-pulse opacity-20" style={{ animationDelay: '1s' }}>🎁</div>
      </div>

      <div className="w-full max-w-2xl z-10">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <div className="relative w-24 h-24">
            <Image
              src="/onlypartyz-logo.png"
              alt="OnlyPartyz Logo"
              fill
              className="object-contain"
            />
          </div>
        </div>

        {/* Party Preview Card */}
        <Card className="mb-6 shadow-xl border-2 border-pink-200/50 bg-white/95 overflow-hidden">
          {/* Cover Image */}
          {party?.cover_image_url && (
            <div className="relative w-full h-48 bg-gradient-to-r from-pink-100 to-purple-100">
              <Image
                src={party.cover_image_url}
                alt={party.title}
                fill
                className="object-cover"
              />
            </div>
          )}

          <CardHeader className="text-center">
            <div className="flex justify-center mb-3">
              <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
                <PartyPopper className="w-8 h-8 text-white" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {party?.title}
            </CardTitle>
            {party?.description && (
              <CardDescription className="text-base mt-2">
                {party.description}
              </CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            {/* RSVP Preview */}
            {guestCount > 0 && (
              <div className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-gray-700">People Responding:</p>
                  <span className="text-sm font-bold text-pink-600">{guestCount} {guestCount === 1 ? 'person' : 'people'}</span>
                </div>
                <div className="flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <span className="text-green-600">✓</span>
                    <span className="text-gray-600">{rsvpCounts.going} Going</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-600">?</span>
                    <span className="text-gray-600">{rsvpCounts.maybe} Maybe</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-red-600">✗</span>
                    <span className="text-gray-600">{rsvpCounts.not_going} Can't Make It</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-pink-50 rounded-lg">
                <Calendar className="w-5 h-5 text-pink-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-gray-900">When</p>
                  <p className="text-sm text-gray-600">
                    {party && formatDate(party.starts_at)}
                  </p>
                </div>
              </div>

              {party?.location_address && (
                <div className="flex items-start gap-3 p-3 bg-purple-50 rounded-lg">
                  <MapPin className="w-5 h-5 text-purple-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Where</p>
                    <p className="text-sm text-gray-600">{party.location_address}</p>
                  </div>
                </div>
              )}

              {party?.party_type && (
                <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                  <PartyPopper className="w-5 h-5 text-blue-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Type</p>
                    <p className="text-sm text-gray-600">{party.party_type}</p>
                  </div>
                </div>
              )}

              {party?.dress_code && (
                <div className="flex items-start gap-3 p-3 bg-teal-50 rounded-lg">
                  <Sparkles className="w-5 h-5 text-teal-600 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Dress Code</p>
                    <p className="text-sm text-gray-600">{party.dress_code}</p>
                  </div>
                </div>
              )}
            </div>

            {party?.special_instructions && (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-semibold text-gray-800 mb-1">📋 Important Info</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{party.special_instructions}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Join Form Card */}
        <Card className="shadow-2xl border-2 border-pink-200/50 bg-white/95">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join the Party!</CardTitle>
            <CardDescription>
              Enter your details to join the celebration
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium text-gray-900">
                  Your Name <span className="text-red-500">*</span>
                </label>
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={displayName}
                  onChange={(e) => {
                    setDisplayName(e.target.value)
                    setError('')
                  }}
                  maxLength={50}
                  disabled={joining}
                  required
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="partySize" className="text-sm font-medium text-gray-900">
                  Number of People <span className="text-red-500">*</span>
                </label>
                <Input
                  id="partySize"
                  type="number"
                  min="1"
                  max="20"
                  placeholder="1"
                  value={partySize}
                  onChange={(e) => {
                    setPartySize(e.target.value)
                    setError('')
                  }}
                  disabled={joining}
                  required
                />
                <p className="text-xs text-gray-500">
                  How many people in your party? (e.g., 2 for a couple)
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-medium text-gray-900">
                  Phone Number <span className="text-gray-400">(optional)</span>
                </label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={joining}
                />
              </div>

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600 flex items-center gap-2">
                    <span className="text-lg">⚠️</span>
                    {error}
                  </p>
                </div>
              )}

              <Button
                type="submit"
                className="w-full text-base font-semibold"
                disabled={joining || !displayName.trim()}
              >
                {joining ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Joining...
                  </>
                ) : (
                  <>
                    <PartyPopper className="w-5 h-5 mr-2" />
                    Join Party
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Back link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => router.push('/')}
            className="text-sm text-gray-600 hover:text-pink-600 transition-colors"
          >
            ← Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
