'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  PartyPopper,
  Calendar,
  MapPin,
  Users,
  Loader2,
  Check,
  X,
  HelpCircle,
  UtensilsCrossed,
  Sparkles,
} from 'lucide-react'
import {
  Party,
  RsvpStatus,
  PotluckCategoryWithItems,
  PotluckItemWithClaims,
  GuestWithRsvp,
} from '@/lib/types/database'
import { formatDate, cn } from '@/lib/utils'
import { celebrateRSVP, celebrateClaim } from '@/lib/confetti'
import { createClient } from '@/lib/supabase/client'

export default function PartyPage({ params }: { params: Promise<{ id: string }> }) {
  const [partyId, setPartyId] = useState<string>('')
  const [party, setParty] = useState<Party | null>(null)
  const [guests, setGuests] = useState<GuestWithRsvp[]>([])
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, maybe: 0, not_going: 0 })
  const [potluckCategories, setPotluckCategories] = useState<PotluckCategoryWithItems[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [currentGuestId, setCurrentGuestId] = useState<string | null>(null)
  const [myRsvp, setMyRsvp] = useState<RsvpStatus | null>(null)
  const [myClaim, setMyClaim] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const resolvedParams = await params
      const id = resolvedParams.id
      setPartyId(id)

      // Check if guest has joined
      const guestId = localStorage.getItem(`party_${id}_guest`)
      if (!guestId) {
        // Redirect to join page
        router.push(`/join/${id}`)
        return
      }

      setCurrentGuestId(guestId)
      await loadPartyData(id, guestId)
    }

    init()
  }, [params, router])

  useEffect(() => {
    if (!partyId) return

    const supabase = createClient()

    // Subscribe to realtime updates
    const channel = supabase
      .channel(`party-${partyId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'guests', filter: `party_id=eq.${partyId}` },
        () => loadPartyData(partyId, currentGuestId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'rsvps', filter: `party_id=eq.${partyId}` },
        () => loadPartyData(partyId, currentGuestId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'potluck_claims', filter: `party_id=eq.${partyId}` },
        () => loadPartyData(partyId, currentGuestId)
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [partyId, currentGuestId])

  async function loadPartyData(id: string, guestId: string | null) {
    try {
      const response = await fetch(`/api/party/${id}`)
      if (!response.ok) {
        router.push('/')
        return
      }

      const data = await response.json()
      setParty(data.party)
      setGuests(data.guests || [])
      setRsvpCounts(data.rsvpCounts || { going: 0, maybe: 0, not_going: 0 })
      setPotluckCategories(data.potluck || [])
      setMedia(data.media || [])

      // Find my RSVP
      if (guestId) {
        const myGuest = data.guests?.find((g: any) => g.id === guestId)
        if (myGuest?.rsvp) {
          setMyRsvp(Array.isArray(myGuest.rsvp) ? myGuest.rsvp[0]?.status : myGuest.rsvp.status)
        }

        // Find my claim
        if (data.potluck) {
          for (const category of data.potluck) {
            for (const item of category.items || []) {
              const claim = item.claims?.find((c: any) => c.guest_id === guestId)
              if (claim) {
                setMyClaim({ ...claim, item })
                break
              }
            }
          }
        }
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading party:', err)
      setLoading(false)
    }
  }

  async function handleRSVP(status: RsvpStatus) {
    if (!currentGuestId || actionLoading) return

    setActionLoading(true)

    try {
      const response = await fetch(`/api/party/${partyId}/rsvp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': currentGuestId,
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setMyRsvp(status)
        celebrateRSVP()
        await loadPartyData(partyId, currentGuestId)
      }
    } catch (err) {
      console.error('Error updating RSVP:', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleClaim(itemId: string) {
    if (!currentGuestId || actionLoading) return

    setActionLoading(true)

    try {
      const response = await fetch(`/api/party/${partyId}/claim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': currentGuestId,
        },
        body: JSON.stringify({ itemId }),
      })

      if (response.ok) {
        celebrateClaim()
        await loadPartyData(partyId, currentGuestId)
      }
    } catch (err) {
      console.error('Error claiming item:', err)
    } finally {
      setActionLoading(false)
    }
  }

  async function handleUnclaim() {
    if (!currentGuestId || !myClaim || actionLoading) return

    setActionLoading(true)

    try {
      const response = await fetch(`/api/party/${partyId}/unclaim`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': currentGuestId,
        },
        body: JSON.stringify({ claimId: myClaim.id }),
      })

      if (response.ok) {
        setMyClaim(null)
        await loadPartyData(partyId, currentGuestId)
      }
    } catch (err) {
      console.error('Error unclaiming item:', err)
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading party...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/onlypartyz-logo.png" alt="Logo" width={40} height={40} />
            <h1 className="text-xl font-bold text-gray-800">OnlyPartyz</h1>
          </div>
          <div className="text-sm text-gray-600">
            {localStorage.getItem('guestName') || 'Guest'}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <Card className="shadow-xl border-2 border-pink-200/50">
          {party?.cover_image_url && (
            <div className="relative w-full h-48 rounded-t-xl overflow-hidden">
              <Image
                src={party.cover_image_url}
                alt={party.title}
                fill
                className="object-cover"
              />
            </div>
          )}
          <CardHeader>
            <CardTitle className="text-4xl bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              {party?.title}
            </CardTitle>
            {party?.description && (
              <CardDescription className="text-base mt-2">{party.description}</CardDescription>
            )}
          </CardHeader>

          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-4 bg-pink-50 rounded-lg">
                <Calendar className="w-6 h-6 text-pink-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-700">Date & Time</p>
                  <p className="text-gray-600">{party && formatDate(party.starts_at)}</p>
                </div>
              </div>

              {party?.location_address && (
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-700">Location</p>
                    <p className="text-gray-600">{party.location_address}</p>
                  </div>
                </div>
              )}
            </div>

            {party?.location_map_iframe && (
              <div className="mt-4">
                <iframe
                  src={party.location_map_iframe}
                  width="100%"
                  height="300"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  className="rounded-lg"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* RSVP Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-pink-500" />
              Your RSVP
            </CardTitle>
            <CardDescription>Let everyone know if you're coming!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              <Button
                onClick={() => handleRSVP('going')}
                disabled={actionLoading}
                variant={myRsvp === 'going' ? 'default' : 'outline'}
                className={cn(
                  'flex flex-col items-center gap-2 h-auto py-4',
                  myRsvp === 'going' && 'ring-2 ring-green-400'
                )}
              >
                <Check className="w-6 h-6" />
                <span>Going</span>
                <span className="text-xs opacity-75">({rsvpCounts.going})</span>
              </Button>

              <Button
                onClick={() => handleRSVP('maybe')}
                disabled={actionLoading}
                variant={myRsvp === 'maybe' ? 'default' : 'outline'}
                className={cn(
                  'flex flex-col items-center gap-2 h-auto py-4',
                  myRsvp === 'maybe' && 'ring-2 ring-yellow-400'
                )}
              >
                <HelpCircle className="w-6 h-6" />
                <span>Maybe</span>
                <span className="text-xs opacity-75">({rsvpCounts.maybe})</span>
              </Button>

              <Button
                onClick={() => handleRSVP('not_going')}
                disabled={actionLoading}
                variant={myRsvp === 'not_going' ? 'default' : 'outline'}
                className={cn(
                  'flex flex-col items-center gap-2 h-auto py-4',
                  myRsvp === 'not_going' && 'ring-2 ring-red-400'
                )}
              >
                <X className="w-6 h-6" />
                <span>Can't Make It</span>
                <span className="text-xs opacity-75">({rsvpCounts.not_going})</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Attendees Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-500" />
              Who's Coming ({guests.length} {guests.length === 1 ? 'person' : 'people'})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {guests.map((guest) => {
                const rsvp = Array.isArray(guest.rsvp) ? guest.rsvp[0] : guest.rsvp
                return (
                  <div
                    key={guest.id}
                    className="p-3 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg flex items-center gap-2"
                  >
                    <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {guest.display_name[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 truncate">
                        {guest.display_name}
                      </p>
                      {rsvp && (
                        <p className="text-xs text-gray-500">
                          {rsvp.status === 'going' && '✓ Going'}
                          {rsvp.status === 'maybe' && '? Maybe'}
                          {rsvp.status === 'not_going' && '✗ Not going'}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* Potluck Section */}
        {party?.is_potluck && potluckCategories.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-orange-500" />
                Potluck - What to Bring
              </CardTitle>
              <CardDescription>
                {myClaim
                  ? `You're bringing: ${myClaim.item.name}`
                  : 'Claim an item to bring to the party!'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {potluckCategories.map((category) => (
                <div key={category.id}>
                  <h3 className="text-lg font-semibold text-gray-800 mb-3">{category.name}</h3>
                  <div className="grid gap-3">
                    {category.items?.map((item) => {
                      const claimCount = item.claims?.length || 0
                      const isClaimed = claimCount > 0
                      const isMyItem = myClaim?.item_id === item.id

                      return (
                        <div
                          key={item.id}
                          className={cn(
                            'p-4 rounded-lg border-2 transition-all',
                            isMyItem
                              ? 'bg-green-50 border-green-300'
                              : isClaimed
                              ? 'bg-gray-50 border-gray-200'
                              : 'bg-white border-pink-200 hover:border-pink-400'
                          )}
                        >
                          <div className="flex items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-800">{item.name}</p>
                                {item.dietary_tags && item.dietary_tags.length > 0 && (
                                  <div className="flex gap-1">
                                    {item.dietary_tags.map((tag) => (
                                      <span
                                        key={tag}
                                        className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                )}
                              </div>
                              {claimCount > 0 && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {claimCount} {claimCount === 1 ? 'person is' : 'people are'}{' '}
                                  bringing this
                                </p>
                              )}
                            </div>

                            <div>
                              {isMyItem ? (
                                <Button
                                  onClick={handleUnclaim}
                                  disabled={actionLoading}
                                  variant="outline"
                                  size="sm"
                                >
                                  Unclaim
                                </Button>
                              ) : myClaim ? (
                                <Button
                                  onClick={() => handleClaim(item.id)}
                                  disabled={actionLoading}
                                  variant="outline"
                                  size="sm"
                                >
                                  Switch
                                </Button>
                              ) : (
                                <Button
                                  onClick={() => handleClaim(item.id)}
                                  disabled={actionLoading}
                                  size="sm"
                                >
                                  Claim
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Gallery Section */}
        {media.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PartyPopper className="w-6 h-6 text-pink-500" />
                Party Gallery
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {media.map((image) => (
                  <div key={image.id} className="relative aspect-square rounded-lg overflow-hidden">
                    <Image src={image.url} alt="Party photo" fill className="object-cover" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
