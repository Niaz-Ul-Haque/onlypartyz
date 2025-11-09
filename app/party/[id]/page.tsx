'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
  LogOut,
  Edit3,
  Share2,
  Download,
  MessageCircle,
  Send,
  Clock,
  Info,
  Cloud,
  Droplets,
  QrCode,
  Copy,
} from 'lucide-react'
import QRCodeLib from 'qrcode'
import {
  Party,
  RsvpStatus,
  PotluckItemTypeWithStats,
  GuestWithRsvp,
  Comment,
} from '@/lib/types/database'
import { formatDate, cn } from '@/lib/utils'
import { celebrateRSVP, celebrateClaim } from '@/lib/confetti'
import { createClient } from '@/lib/supabase/client'
import { CountdownTimer } from '@/components/CountdownTimer'

export default function PartyPage({ params }: { params: Promise<{ id: string }> }) {
  const [partyId, setPartyId] = useState<string>('')
  const [party, setParty] = useState<Party | null>(null)
  const [guests, setGuests] = useState<GuestWithRsvp[]>([])
  const [rsvpCounts, setRsvpCounts] = useState({ going: 0, maybe: 0, not_going: 0 })
  const [itemTypes, setItemTypes] = useState<PotluckItemTypeWithStats[]>([])
  const [media, setMedia] = useState<any[]>([])
  const [currentGuestId, setCurrentGuestId] = useState<string | null>(null)
  const [currentGuestName, setCurrentGuestName] = useState<string>('')
  const [myRsvp, setMyRsvp] = useState<RsvpStatus | null>(null)
  const [mySelection, setMySelection] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [showSelectionModal, setShowSelectionModal] = useState(false)
  const [selectionNote, setSelectionNote] = useState('')
  const [selectedTypeId, setSelectedTypeId] = useState<string | null>(null)
  const [selectionError, setSelectionError] = useState('')
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [weather, setWeather] = useState<any | null>(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState<string | null>(null)
  const [inviteCode, setInviteCode] = useState<any | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const router = useRouter()

  useEffect(() => {
    async function init() {
      const resolvedParams = await params
      const id = resolvedParams.id
      setPartyId(id)

      // Check if guest has joined
      const guestId = localStorage.getItem(`party_${id}_guest`)
      const guestName = localStorage.getItem('guestName') || 'Guest'

      if (!guestId) {
        // Redirect to join page
        router.push(`/join/${id}`)
        return
      }

      setCurrentGuestId(guestId)
      setCurrentGuestName(guestName)
      await loadPartyData(id, guestId)
    }

    init()
  }, [params, router])

  useEffect(() => {
    if (!partyId || !currentGuestId) return

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
        { event: '*', schema: 'public', table: 'potluck_selections', filter: `party_id=eq.${partyId}` },
        () => loadPartyData(partyId, currentGuestId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'potluck_item_types', filter: `party_id=eq.${partyId}` },
        () => loadPartyData(partyId, currentGuestId)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'comments', filter: `party_id=eq.${partyId}` },
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
      setItemTypes(data.potluck || [])
      setMedia(data.media || [])
      setInviteCode(data.inviteCode)

      // Generate QR code for join page
      if (data.inviteCode) {
        try {
          const joinUrl = `${window.location.origin}/join/${id}`
          const qrDataUrl = await QRCodeLib.toDataURL(joinUrl, {
            width: 300,
            margin: 2,
            color: {
              dark: '#DB2777', // pink-600
              light: '#FFFFFF'
            }
          })
          setQrCodeUrl(qrDataUrl)
        } catch (err) {
          console.error('Error generating QR code:', err)
        }
      }

      // Fetch comments
      const commentsResponse = await fetch(`/api/party/${id}/comments`)
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData.comments || [])
      }

      // Find my RSVP
      if (guestId) {
        const myGuest = data.guests?.find((g: any) => g.id === guestId)
        if (myGuest?.rsvp) {
          setMyRsvp(Array.isArray(myGuest.rsvp) ? myGuest.rsvp[0]?.status : myGuest.rsvp.status)
        }

        // Find my selection
        if (data.potluck) {
          let foundSelection = null
          for (const itemType of data.potluck) {
            const selection = itemType.selections?.find((s: any) => s.guest_id === guestId)
            if (selection) {
              foundSelection = {
                ...selection,
                item_type: itemType,
              }
              break
            }
          }
          setMySelection(foundSelection)
        }
      }

      // Fetch weather if location and date are available
      if (data.party?.location_address && data.party?.starts_at) {
        fetchWeather(data.party.location_address, data.party.starts_at)
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading party:', err)
      setLoading(false)
    }
  }

  async function fetchWeather(address: string, date: string) {
    if (!address || !date) return

    setWeatherLoading(true)
    setWeatherError(null)
    try {
      const response = await fetch(`/api/weather?address=${encodeURIComponent(address)}&date=${encodeURIComponent(date)}`)

      if (response.ok) {
        const data = await response.json()
        setWeather(data.forecast)
        setWeatherError(null)
      } else {
        const errorData = await response.json()
        const errorMessage = errorData.error || 'Weather data not available'
        console.log('Weather fetch failed:', errorMessage)
        setWeatherError(errorMessage)
      }
    } catch (err) {
      console.error('Error fetching weather:', err)
      setWeatherError('Failed to load weather data')
    } finally {
      setWeatherLoading(false)
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

  async function handleSelectItem() {
    if (!currentGuestId || !selectedTypeId || actionLoading) return

    setActionLoading(true)
    setSelectionError('')

    try {
      const response = await fetch(`/api/party/${partyId}/select-item`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': currentGuestId,
        },
        body: JSON.stringify({
          itemTypeId: selectedTypeId,
          note: selectionNote.trim() || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (response.status === 409) {
          // Capacity filled
          setSelectionError(data.error)
          await loadPartyData(partyId, currentGuestId)
        } else {
          setSelectionError(data.error || 'Failed to save selection')
        }
        setActionLoading(false)
        return
      }

      celebrateClaim()
      setShowSelectionModal(false)
      setSelectionNote('')
      setSelectedTypeId(null)
      setSelectionError('')
      await loadPartyData(partyId, currentGuestId)
    } catch (err) {
      console.error('Error selecting item:', err)
      setSelectionError('Something went wrong. Please try again.')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleRemoveSelection() {
    if (!currentGuestId || actionLoading) return

    setActionLoading(true)

    try {
      const response = await fetch(`/api/party/${partyId}/remove-selection`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-guest-id': currentGuestId,
        },
      })

      if (response.ok) {
        setMySelection(null)
        await loadPartyData(partyId, currentGuestId)
      }
    } catch (err) {
      console.error('Error removing selection:', err)
    } finally {
      setActionLoading(false)
    }
  }

  function handleSwitchGuest() {
    // Clear session and redirect to join page
    localStorage.removeItem(`party_${partyId}_guest`)
    localStorage.removeItem('guestId')
    localStorage.removeItem('guestName')
    router.push(`/join/${partyId}?switch=true`)
  }

  function copyPartyCode() {
    if (!inviteCode?.code) return
    navigator.clipboard.writeText(inviteCode.code)
    setCopiedCode(true)
    setTimeout(() => setCopiedCode(false), 2000)
  }

  function downloadQRCode() {
    if (!qrCodeUrl) return
    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `party-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function openSelectionModal(typeId?: string) {
    if (mySelection) {
      setSelectionNote(mySelection.note || '')
      setSelectedTypeId(typeId || mySelection.item_type_id)
    } else {
      setSelectionNote('')
      setSelectedTypeId(typeId || null)
    }
    setSelectionError('')
    setShowSelectionModal(true)
  }

  function handleShareParty() {
    const url = window.location.href
    if (navigator.share) {
      navigator.share({
        title: party?.title || 'Party Invitation',
        text: `Join me at ${party?.title}!`,
        url: url,
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(url)
        alert('Party link copied to clipboard!')
      })
    } else {
      navigator.clipboard.writeText(url)
      alert('Party link copied to clipboard!')
    }
  }

  function downloadCalendar() {
    if (!party) return

    const event = {
      title: party.title,
      description: party.description || '',
      location: party.location_address || '',
      startTime: new Date(party.starts_at),
      endTime: party.ends_at ? new Date(party.ends_at) : new Date(new Date(party.starts_at).getTime() + 3 * 60 * 60 * 1000),
    }

    const formatDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
    }

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//OnlyPartyz//Party Calendar//EN',
      'BEGIN:VEVENT',
      `UID:${partyId}@onlypartyz.com`,
      `DTSTAMP:${formatDate(new Date())}`,
      `DTSTART:${formatDate(event.startTime)}`,
      `DTEND:${formatDate(event.endTime)}`,
      `SUMMARY:${event.title}`,
      `DESCRIPTION:${event.description}`,
      `LOCATION:${event.location}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n')

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' })
    const link = document.createElement('a')
    link.href = URL.createObjectURL(blob)
    link.download = `${party.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.ics`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  async function handlePostComment() {
    if (!newComment.trim() || commentLoading) return

    setCommentLoading(true)

    try {
      const response = await fetch(`/api/party/${partyId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: newComment.trim(),
          guestId: currentGuestId,
          authorName: currentGuestName,
          isAdmin: false,
        }),
      })

      if (response.ok) {
        setNewComment('')
        await loadPartyData(partyId, currentGuestId)
      }
    } catch (err) {
      console.error('Error posting comment:', err)
    } finally {
      setCommentLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-900">Loading party...</p>
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
          <div className="flex items-center gap-3">
            <Button onClick={handleShareParty} variant="outline" size="sm" className="hidden sm:flex">
              <Share2 className="w-4 h-4 mr-2" />
              Share
            </Button>
            <Button onClick={downloadCalendar} variant="outline" size="sm" className="hidden sm:flex">
              <Download className="w-4 h-4 mr-2" />
              Add to Calendar
            </Button>
            <span className="text-sm text-gray-900">{currentGuestName}</span>
            <Button onClick={handleSwitchGuest} variant="outline" size="sm">
              <LogOut className="w-4 h-4 mr-2" />
              Switch Guest
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Countdown Timer */}
        {party && <CountdownTimer targetDate={party.starts_at} className="mb-8" />}
        {/* Hero Section */}
        <Card className="shadow-xl border-2 border-pink-200/50 overflow-hidden">
          {party?.cover_image_url && (
            <div className="relative w-full h-64 bg-gradient-to-r from-pink-100 to-purple-100">
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
                  <p className="font-medium text-gray-900">Date & Time</p>
                  <p className="text-gray-900">{party && formatDate(party.starts_at)}</p>
                </div>
              </div>

              {party?.location_address && (
                <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
                  <MapPin className="w-6 h-6 text-purple-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Location</p>
                    <p className="text-gray-900">{party.location_address}</p>
                  </div>
                </div>
              )}

              {party?.party_type && (
                <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
                  <PartyPopper className="w-6 h-6 text-blue-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Party Type</p>
                    <p className="text-gray-900">{party.party_type}</p>
                  </div>
                </div>
              )}

              {party?.dress_code && (
                <div className="flex items-start gap-3 p-4 bg-teal-50 rounded-lg">
                  <Sparkles className="w-6 h-6 text-teal-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">Dress Code</p>
                    <p className="text-gray-900">{party.dress_code}</p>
                  </div>
                </div>
              )}

              {party?.rsvp_deadline && (
                <div className="flex items-start gap-3 p-4 bg-orange-50 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-gray-900">RSVP By</p>
                    <p className="text-gray-900">{formatDate(party.rsvp_deadline)}</p>
                  </div>
                </div>
              )}
            </div>

            {party?.special_instructions && (
              <div className="mt-4 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
                <p className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Info className="w-5 h-5 text-yellow-600" />
                  Important Information
                </p>
                <p className="text-gray-900 whitespace-pre-wrap">{party.special_instructions}</p>
              </div>
            )}

            {party?.location_map_iframe && (
              <div className="mt-4">
                {(party.location_map_iframe.includes('google.com/maps/embed') || party.location_map_iframe.includes('maps.google.com/maps')) ? (
                  <iframe
                    src={party.location_map_iframe}
                    width="100%"
                    height="300"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    className="rounded-lg"
                  />
                ) : (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
                    <p className="text-sm text-yellow-800">
                      Map unavailable. Please contact the host to update the map link.
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Party Code & QR Code */}
        {inviteCode && (
          <Card className="shadow-lg border-2 border-purple-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-purple-500" />
                Share This Party
              </CardTitle>
              <CardDescription>
                Share the party code or QR code with your friends to let them join
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-6">
                {/* Party Code Section */}
                <div className="space-y-3">
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg border-2 border-purple-200">
                    <p className="text-sm font-medium text-gray-700 mb-2">Party Code</p>
                    <p className="text-3xl font-bold tracking-wider text-purple-600 mb-3">
                      {inviteCode.code}
                    </p>
                    <Button
                      onClick={copyPartyCode}
                      size="sm"
                      variant={copiedCode ? "default" : "outline"}
                      className="w-full"
                    >
                      {copiedCode ? (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4 mr-2" />
                          Copy Code
                        </>
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-gray-900 text-center">
                    Friends can use this code to join at {window.location.origin}/join
                  </p>
                </div>

                {/* QR Code Section */}
                <div className="space-y-3">
                  <div className="text-center p-6 bg-white rounded-lg border-2 border-purple-200">
                    <p className="text-sm font-medium text-gray-900 mb-3">Scan to Join</p>
                    {qrCodeUrl ? (
                      <div className="flex justify-center">
                        <img
                          src={qrCodeUrl}
                          alt="Party QR Code"
                          className="w-48 h-48 rounded-lg"
                        />
                      </div>
                    ) : (
                      <div className="w-48 h-48 mx-auto flex items-center justify-center bg-gray-100 rounded-lg">
                        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                      </div>
                    )}
                    <Button
                      onClick={downloadQRCode}
                      size="sm"
                      variant="outline"
                      className="w-full mt-3"
                      disabled={!qrCodeUrl}
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download QR Code
                    </Button>
                  </div>
                  <p className="text-xs text-gray-900 text-center">
                    Scan with any QR code reader to join instantly
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Weather Forecast */}
        {party?.location_address && (
          <Card className="shadow-lg border-2 border-blue-200/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cloud className="w-6 h-6 text-blue-500" />
                Weather Forecast
              </CardTitle>
              <CardDescription>Expected conditions for party day</CardDescription>
            </CardHeader>
            <CardContent>
              {weatherLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <span className="ml-3 text-gray-900">Loading weather...</span>
                </div>
              ) : weather ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-6 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="text-6xl">{weather.emoji}</div>
                      <div>
                        <p className="text-2xl font-bold text-gray-900">{weather.description}</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {new Date(weather.date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-gray-900">
                          {Math.round(weather.temperature_max)}°
                        </span>
                        <span className="text-xl text-gray-900">
                          / {Math.round(weather.temperature_min)}°
                        </span>
                      </div>
                      <p className="text-sm text-gray-900 mt-1">High / Low</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Droplets className="w-5 h-5 text-blue-600" />
                        <span className="text-sm font-medium text-gray-900">Rain Chance</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{weather.precipitation_probability}%</p>
                    </div>

                    <div className="p-4 bg-cyan-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-5 h-5 text-cyan-600" />
                        <span className="text-sm font-medium text-gray-900">Location</span>
                      </div>
                      <p className="text-sm text-gray-900 line-clamp-2">{weather.location}</p>
                    </div>
                  </div>

                  {weather.precipitation_probability > 50 && (
                    <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <p className="text-sm text-yellow-800 flex items-center gap-2">
                        <span className="text-lg">☔</span>
                        <span>High chance of rain - bring an umbrella or plan for indoor activities!</span>
                      </p>
                    </div>
                  )}
                </div>
              ) : weatherError ? (
                <div className="text-center py-8 text-gray-500">
                  <Cloud className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm font-medium mb-1">Weather forecast not available</p>
                  <p className="text-xs text-gray-400">{weatherError}</p>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Cloud className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">Weather forecast not available</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

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

        {/* Potluck Section */}
        {party?.is_potluck && itemTypes.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UtensilsCrossed className="w-6 h-6 text-orange-500" />
                Potluck - What to Bring
              </CardTitle>
              <CardDescription>
                {mySelection
                  ? `You're bringing: ${mySelection.item_type?.name || 'an item'}`
                  : 'Choose what you will bring to the party!'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {mySelection && (
                <div className="p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="font-semibold text-green-800">
                        {mySelection.item_type?.name}
                      </p>
                      {mySelection.note && (
                        <p className="text-sm text-green-700 mt-1">Note: {mySelection.note}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={() => openSelectionModal(mySelection.item_type_id)}
                        size="sm"
                        variant="outline"
                        disabled={actionLoading}
                      >
                        <Edit3 className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        onClick={handleRemoveSelection}
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700"
                        disabled={actionLoading}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid gap-3">
                {itemTypes.map((type) => {
                  const isFull = type.remaining <= 0
                  const isMyType = mySelection?.item_type_id === type.item_type_id

                  return (
                    <div
                      key={type.item_type_id}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all',
                        isMyType
                          ? 'bg-green-50 border-green-300'
                          : isFull
                          ? 'bg-gray-100 border-gray-300 opacity-60'
                          : 'bg-white border-pink-200 hover:border-pink-400'
                      )}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <p className="font-semibold text-gray-800">{type.name}</p>
                            {isFull ? (
                              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-semibold rounded-full">
                                FULL
                              </span>
                            ) : (
                              <span className="px-3 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full">
                                {type.remaining} left
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {type.selections_count} of {type.capacity} selected
                          </p>
                        </div>

                        {!isMyType && (
                          <Button
                            onClick={() => openSelectionModal(type.item_type_id)}
                            disabled={isFull || actionLoading}
                            size="sm"
                          >
                            {mySelection ? 'Switch' : 'Select'}
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Attendees Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-6 h-6 text-purple-500" />
              Who's Coming
            </CardTitle>
            <CardDescription>
              {(() => {
                const totalHeadcount = guests.reduce((sum, guest) => sum + (guest.party_size || 1), 0)
                return `${guests.length} ${guests.length === 1 ? 'response' : 'responses'} • ${totalHeadcount} ${totalHeadcount === 1 ? 'person' : 'people'} total`
              })()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {guests.map((guest) => {
                const rsvp = Array.isArray(guest.rsvp) ? guest.rsvp[0] : guest.rsvp
                const partySize = guest.party_size || 1
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
                        {partySize > 1 && (
                          <span className="ml-1 text-xs text-purple-600 font-semibold">
                            ({partySize})
                          </span>
                        )}
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

        {/* Party Wall / Comments Section */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="w-6 h-6 text-blue-500" />
              Party Wall
            </CardTitle>
            <CardDescription>
              Share your excitement and leave messages for the host and guests
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Comments List */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No messages yet. Be the first to say something!</p>
                </div>
              ) : (
                comments.map((comment) => (
                  <div
                    key={comment.id}
                    className={cn(
                      'p-3 rounded-lg border',
                      comment.is_admin
                        ? 'bg-gradient-to-r from-pink-50 to-purple-50 border-pink-200'
                        : 'bg-gray-50 border-gray-200'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm',
                            comment.is_admin
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                              : 'bg-gradient-to-r from-blue-500 to-teal-600'
                          )}
                        >
                          {comment.author_name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {comment.author_name}
                            {comment.is_admin && (
                              <span className="ml-1 text-xs bg-pink-200 text-pink-800 px-1.5 py-0.5 rounded">
                                Host
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(comment.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-800 mt-2 ml-10">{comment.message}</p>
                  </div>
                ))
              )}
            </div>

            {/* Post Comment Form */}
            <div className="border-t pt-4">
              <div className="flex gap-2">
                <Input
                  placeholder="Leave a message..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      handlePostComment()
                    }
                  }}
                  maxLength={1000}
                  disabled={commentLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handlePostComment}
                  disabled={!newComment.trim() || commentLoading}
                  className="px-4"
                >
                  {commentLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Press Enter to send • {newComment.length}/1000 characters
              </p>
            </div>
          </CardContent>
        </Card>

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

      {/* Selection Modal */}
      {showSelectionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>
                {mySelection ? 'Edit Your Selection' : 'What Will You Bring?'}
              </CardTitle>
              <CardDescription>
                Add a note about what specifically you'll bring
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium">Item Type</label>
                <p className="text-lg font-semibold text-pink-600 mt-1">
                  {itemTypes.find(t => t.item_type_id === selectedTypeId)?.name}
                </p>
              </div>

              <div className="space-y-2">
                <label htmlFor="note" className="text-sm font-medium">
                  What specifically? <span className="text-gray-400">(optional)</span>
                </label>
                <Input
                  id="note"
                  placeholder="e.g., Grilled chicken, Chocolate cake..."
                  value={selectionNote}
                  onChange={(e) => setSelectionNote(e.target.value)}
                  maxLength={100}
                  disabled={actionLoading}
                />
              </div>

              {selectionError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{selectionError}</p>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  onClick={() => {
                    setShowSelectionModal(false)
                    setSelectionError('')
                  }}
                  variant="outline"
                  className="flex-1"
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSelectItem}
                  className="flex-1"
                  disabled={actionLoading}
                >
                  {actionLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
