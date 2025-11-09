'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Save,
  ArrowLeft,
  Copy,
  RefreshCw,
  Loader2,
  Plus,
  Trash2,
  User,
  X,
  MessageCircle,
  Send,
  QrCode,
  Download,
  Check,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Party, InviteCode, PotluckItemType, CreateItemTypeRequest, Comment } from '@/lib/types/database'
import { celebratePartyCreated } from '@/lib/confetti'
import { cn } from '@/lib/utils'
import QRCodeLib from 'qrcode'

export default function AdminPartyEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const [partyId, setPartyId] = useState<string>('')
  const [isNew, setIsNew] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [copiedCode, setCopiedCode] = useState(false)
  const [party, setParty] = useState<Party | null>(null)

  // Party details
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [notes, setNotes] = useState('')
  const [startsAt, setStartsAt] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [locationAddress, setLocationAddress] = useState('')
  const [locationMapIframe, setLocationMapIframe] = useState('')
  const [coverImageUrl, setCoverImageUrl] = useState('')
  const [isPotluck, setIsPotluck] = useState(false)
  const [rsvpDeadline, setRsvpDeadline] = useState('')
  const [maxCapacity, setMaxCapacity] = useState('')
  const [dressCode, setDressCode] = useState('')
  const [partyType, setPartyType] = useState('')
  const [specialInstructions, setSpecialInstructions] = useState('')
  const [inviteCode, setInviteCode] = useState<InviteCode | null>(null)

  // Potluck data
  const [itemTypes, setItemTypes] = useState<any[]>([])
  const [guests, setGuests] = useState<any[]>([])

  // Item type form
  const [newItemName, setNewItemName] = useState('')
  const [newItemCapacity, setNewItemCapacity] = useState('1')
  const [itemTypeLoading, setItemTypeLoading] = useState(false)
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editCapacity, setEditCapacity] = useState('')

  // Comments data
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [adminEmail, setAdminEmail] = useState('')

  // Image upload
  const [uploadingImage, setUploadingImage] = useState(false)
  const [imagePreview, setImagePreview] = useState<string | null>(null)

  // QR Code
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null)
  const qrCanvasRef = useRef<HTMLCanvasElement>(null)
  const [copiedDetails, setCopiedDetails] = useState(false)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }

      setAdminEmail(user.email || 'Admin')

      const resolvedParams = await params
      const id = resolvedParams.id
      setPartyId(id)

      if (id === 'new') {
        setIsNew(true)
        setLoading(false)
      } else {
        await loadParty(id)
      }
    }

    init()
  }, [params, router, supabase])

  async function loadParty(id: string) {
    try {
      const response = await fetch(`/api/party/${id}`)
      if (!response.ok) {
        router.push('/admin')
        return
      }

      const data = await response.json()
      const partyData: Party = data.party

      setParty(partyData)
      setTitle(partyData.title)
      setDescription(partyData.description || '')
      setNotes(partyData.notes || '')
      setStartsAt(partyData.starts_at ? new Date(partyData.starts_at).toISOString().slice(0, 16) : '')
      setEndsAt(partyData.ends_at ? new Date(partyData.ends_at).toISOString().slice(0, 16) : '')
      setLocationAddress(partyData.location_address || '')
      setLocationMapIframe(partyData.location_map_iframe || '')
      setCoverImageUrl(partyData.cover_image_url || '')
      setImagePreview(partyData.cover_image_url || null)
      setIsPotluck(partyData.is_potluck)
      setRsvpDeadline(partyData.rsvp_deadline ? new Date(partyData.rsvp_deadline).toISOString().slice(0, 16) : '')
      setMaxCapacity(partyData.max_capacity?.toString() || '')
      setDressCode(partyData.dress_code || '')
      setPartyType(partyData.party_type || '')
      setSpecialInstructions(partyData.special_instructions || '')

      setGuests(data.guests || [])

      // Load item types if potluck is enabled
      if (partyData.is_potluck) {
        await loadItemTypes(id)
      }

      // Load invite code
      const codeResponse = await fetch(`/api/admin/party`)
      if (codeResponse.ok) {
        const codeData = await codeResponse.json()
        const currentParty = codeData.parties?.find((p: any) => p.id === id)
        if (currentParty?.invite_codes?.[0]) {
          setInviteCode(currentParty.invite_codes[0])
        }
      }

      // Load comments
      const commentsResponse = await fetch(`/api/party/${id}/comments`)
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json()
        setComments(commentsData.comments || [])
      }

      setLoading(false)
    } catch (err) {
      console.error('Error loading party:', err)
      setLoading(false)
    }
  }

  async function handleSave() {
    if (!title || !startsAt) {
      alert('Please fill in title and start date')
      return
    }

    setSaving(true)

    try {
      const partyData = {
        title,
        description: description || undefined,
        notes: notes || undefined,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : undefined,
        location_address: locationAddress || undefined,
        location_map_iframe: locationMapIframe || undefined,
        cover_image_url: coverImageUrl || undefined,
        is_potluck: isPotluck,
        rsvp_deadline: rsvpDeadline ? new Date(rsvpDeadline).toISOString() : undefined,
        max_capacity: maxCapacity ? parseInt(maxCapacity) : undefined,
        dress_code: dressCode || undefined,
        party_type: partyType || undefined,
        special_instructions: specialInstructions || undefined,
      }

      if (isNew) {
        const response = await fetch('/api/admin/party', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partyData),
        })

        if (response.ok) {
          const data = await response.json()
          celebratePartyCreated()
          setTimeout(() => {
            router.push(`/admin/party/${data.party.id}`)
          }, 1000)
        } else {
          alert('Failed to create party')
        }
      } else {
        const response = await fetch(`/api/admin/party/${partyId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(partyData),
        })

        if (response.ok) {
          alert('Party updated successfully!')
          await loadParty(partyId)
        } else {
          alert('Failed to update party')
        }
      }
    } catch (err) {
      console.error('Error saving party:', err)
      alert('An error occurred')
    } finally {
      setSaving(false)
    }
  }

  async function loadItemTypes(id: string) {
    try {
      const response = await fetch(`/api/admin/party/${id}/item-types`)
      if (response.ok) {
        const data = await response.json()
        setItemTypes(data.itemTypes || [])
      }
    } catch (err) {
      console.error('Error loading item types:', err)
    }
  }

  async function handleAddItemType() {
    if (!newItemName.trim()) {
      alert('Please enter an item type name')
      return
    }
    const capacity = parseInt(newItemCapacity)
    if (isNaN(capacity) || capacity < 1) {
      alert('Capacity must be at least 1')
      return
    }

    setItemTypeLoading(true)
    try {
      const response = await fetch(`/api/admin/party/${partyId}/item-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newItemName.trim(),
          capacity,
          sort_order: itemTypes.length,
        }),
      })

      if (response.ok) {
        setNewItemName('')
        setNewItemCapacity('1')
        await loadItemTypes(partyId)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to add item type')
      }
    } catch (err) {
      console.error('Error adding item type:', err)
      alert('An error occurred')
    } finally {
      setItemTypeLoading(false)
    }
  }

  async function handleUpdateItemType(typeId: string) {
    const capacity = parseInt(editCapacity)
    if (isNaN(capacity) || capacity < 1) {
      alert('Capacity must be at least 1')
      return
    }

    setItemTypeLoading(true)
    try {
      const response = await fetch(`/api/admin/party/${partyId}/item-types/${typeId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          capacity,
        }),
      })

      if (response.ok) {
        setEditingTypeId(null)
        await loadItemTypes(partyId)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to update item type')
      }
    } catch (err) {
      console.error('Error updating item type:', err)
      alert('An error occurred')
    } finally {
      setItemTypeLoading(false)
    }
  }

  async function handleDeleteItemType(typeId: string) {
    if (!confirm('Are you sure you want to delete this item type? All guest selections for this type will be removed.')) {
      return
    }

    setItemTypeLoading(true)
    try {
      const response = await fetch(`/api/admin/party/${partyId}/item-types/${typeId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadItemTypes(partyId)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to delete item type')
      }
    } catch (err) {
      console.error('Error deleting item type:', err)
      alert('An error occurred')
    } finally {
      setItemTypeLoading(false)
    }
  }

  function startEditingType(type: any) {
    setEditingTypeId(type.item_type_id)
    setEditName(type.name)
    setEditCapacity(type.capacity.toString())
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
          authorName: adminEmail,
          isAdmin: true,
        }),
      })

      if (response.ok) {
        setNewComment('')
        await loadParty(partyId)
      }
    } catch (err) {
      console.error('Error posting comment:', err)
    } finally {
      setCommentLoading(false)
    }
  }

  async function handleDeleteComment(commentId: string) {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return
    }

    try {
      const response = await fetch(`/api/party/${partyId}/comments/${commentId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadParty(partyId)
      }
    } catch (err) {
      console.error('Error deleting comment:', err)
      alert('Failed to delete comment')
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    setUploadingImage(true)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to upload image')
      }

      const data = await response.json()
      setCoverImageUrl(data.url)
      setImagePreview(data.url)
    } catch (err: any) {
      console.error('Error uploading image:', err)
      alert(err.message || 'Failed to upload image')
    } finally {
      setUploadingImage(false)
    }
  }

  async function handleRemoveGuest(guestId: string, guestName: string) {
    if (!confirm(`Are you sure you want to remove ${guestName} from this party? This will delete their RSVP and potluck selections.`)) {
      return
    }

    try {
      const response = await fetch(`/api/admin/party/${partyId}/guests/${guestId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadParty(partyId)
      } else {
        const data = await response.json()
        alert(data.error || 'Failed to remove guest')
      }
    } catch (err) {
      console.error('Error removing guest:', err)
      alert('An error occurred')
    }
  }

  function copyCodeToClipboard() {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode.code)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  async function generateQRCode() {
    if (!partyId || isNew) return

    try {
      // Generate join URL
      const joinUrl = `${window.location.origin}/join/${partyId}`

      // Generate QR code
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

  function downloadQRCode() {
    if (!qrCodeUrl) return

    const link = document.createElement('a')
    link.href = qrCodeUrl
    link.download = `party-${partyId}-qr-code.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Generate QR code when party ID is available
  useEffect(() => {
    if (partyId && !isNew) {
      generateQRCode()
    }
  }, [partyId, isNew])

  function copyFullEventDetails() {
    if (!party) return

    // Format date
    const formatFullDate = (dateStr: string) => {
      const date = new Date(dateStr)
      return date.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }

    // Build the details text
    let details = `🎉 ${title}\n`
    details += `${'='.repeat(title.length + 3)}\n\n`

    // Basic Info
    if (description) {
      details += `📝 Description:\n${description}\n\n`
    }

    details += `📅 Date & Time:\n${formatFullDate(startsAt)}\n`
    if (endsAt) {
      details += `Ends: ${formatFullDate(endsAt)}\n`
    }
    details += '\n'

    if (locationAddress) {
      details += `📍 Location:\n${locationAddress}\n\n`
    }

    // Party Details
    if (partyType) {
      details += `🎊 Party Type: ${partyType}\n`
    }
    if (dressCode) {
      details += `👔 Dress Code: ${dressCode}\n`
    }
    if (rsvpDeadline) {
      details += `⏰ RSVP By: ${formatFullDate(rsvpDeadline)}\n`
    }
    if (maxCapacity) {
      details += `👥 Max Capacity: ${maxCapacity} people\n`
    }
    if (partyType || dressCode || rsvpDeadline || maxCapacity) {
      details += '\n'
    }

    if (specialInstructions) {
      details += `ℹ️ Important Information:\n${specialInstructions}\n\n`
    }

    // Guest List
    if (guests.length > 0) {
      const goingGuests = guests.filter(g => {
        const rsvp = Array.isArray(g.rsvp) ? g.rsvp[0] : g.rsvp
        return rsvp?.status === 'going'
      })
      const maybeGuests = guests.filter(g => {
        const rsvp = Array.isArray(g.rsvp) ? g.rsvp[0] : g.rsvp
        return rsvp?.status === 'maybe'
      })
      const notGoingGuests = guests.filter(g => {
        const rsvp = Array.isArray(g.rsvp) ? g.rsvp[0] : g.rsvp
        return rsvp?.status === 'not_going'
      })

      const totalHeadcount = guests.reduce((sum, g) => sum + (g.party_size || 1), 0)

      details += `👥 Guest List (${guests.length} responses, ${totalHeadcount} people total):\n\n`

      if (goingGuests.length > 0) {
        details += `✅ Coming (${goingGuests.length}):\n`
        goingGuests.forEach(g => {
          const partySize = g.party_size || 1
          details += `  • ${g.display_name}${partySize > 1 ? ` (${partySize} people)` : ''}\n`
        })
        details += '\n'
      }

      if (maybeGuests.length > 0) {
        details += `❓ Maybe (${maybeGuests.length}):\n`
        maybeGuests.forEach(g => {
          const partySize = g.party_size || 1
          details += `  • ${g.display_name}${partySize > 1 ? ` (${partySize} people)` : ''}\n`
        })
        details += '\n'
      }

      if (notGoingGuests.length > 0) {
        details += `❌ Can't Make It (${notGoingGuests.length}):\n`
        notGoingGuests.forEach(g => {
          details += `  • ${g.display_name}\n`
        })
        details += '\n'
      }
    }

    // Potluck assignments
    if (isPotluck && itemTypes.length > 0) {
      const hasSelections = itemTypes.some(type => (type.selections || []).length > 0)

      if (hasSelections) {
        details += `🍽️ Who's Bringing What:\n\n`

        itemTypes.forEach(type => {
          const selections = type.selections || []
          if (selections.length > 0) {
            details += `${type.name}:\n`
            selections.forEach((selection: any) => {
              const guestName = selection.guest?.display_name || 'Unknown'
              const note = selection.note ? ` - ${selection.note}` : ''
              details += `  • ${guestName}${note}\n`
            })
            details += '\n'
          }
        })
      }
    }

    // Join link
    if (inviteCode) {
      details += `🔗 Join the Party:\n`
      details += `Code: ${inviteCode.code}\n`
      details += `Link: ${window.location.origin}/join/${partyId}\n`
    }

    // Copy to clipboard
    navigator.clipboard.writeText(details)
    setCopiedDetails(true)
    setTimeout(() => setCopiedDetails(false), 3000)
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
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-200">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button onClick={() => router.push('/admin')} variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
            <h1 className="text-xl font-bold text-gray-900">
              {isNew ? 'Create New Party' : 'Edit Party'}
            </h1>
          </div>
          <div className="flex items-center gap-2">
            {!isNew && party && (
              <Button onClick={copyFullEventDetails} variant="outline" size="sm">
                {copiedDetails ? (
                  <>
                    <Check className="w-4 h-4 mr-2 text-green-600" />
                    <span className="text-green-600">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Event Details
                  </>
                )}
              </Button>
            )}
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Party
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Basic Info */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Party Details</CardTitle>
            <CardDescription>Basic information about your party</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">
                Party Title <span className="text-red-500">*</span>
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Summer BBQ Bash"
                maxLength={100}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Join us for an amazing summer celebration..."
                className="w-full min-h-[100px] px-4 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:border-pink-500 focus:outline-none resize-y placeholder:text-gray-900"
                maxLength={500}
              />
              <p className="text-xs text-gray-900">Visible to guests</p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Admin Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Internal notes (only visible to you as the admin)..."
                className="w-full min-h-[80px] px-4 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:border-pink-500 focus:outline-none resize-y placeholder:text-gray-900"
                maxLength={1000}
              />
              <p className="text-xs text-gray-900">Private notes - only visible to admin</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">
                  Start Date & Time <span className="text-red-500">*</span>
                </label>
                <Input
                  type="datetime-local"
                  value={startsAt}
                  onChange={(e) => setStartsAt(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">End Date & Time</label>
                <Input
                  type="datetime-local"
                  value={endsAt}
                  onChange={(e) => setEndsAt(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Location Address</label>
              <Input
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="123 Party Street, Toronto, ON"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Google Maps Embed</label>
              <textarea
                value={locationMapIframe}
                onChange={async (e) => {
                  let value = e.target.value.trim()

                  // Extract src from iframe tag if user pastes full iframe code
                  const iframeMatch = value.match(/src=["']([^"']+)["']/)
                  if (iframeMatch) {
                    value = iframeMatch[1]
                  }

                  // Handle share.google shortened links or maps.app.goo.gl links
                  if (value.includes('share.google') || value.includes('maps.app.goo.gl') || value.includes('goo.gl/maps')) {
                    try {
                      const response = await fetch('/api/resolve-maps-url', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: value }),
                      })
                      
                      if (response.ok) {
                        const data = await response.json()
                        value = data.embedUrl || value
                      }
                    } catch (error) {
                      console.log('Could not resolve shortened link:', error)
                    }
                  } else if (value.includes('google.com/maps') && !value.includes('/embed')) {
                    // Convert regular Google Maps URL to embed URL
                    const coordMatch = value.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
                    if (coordMatch) {
                      value = `https://maps.google.com/maps?q=${coordMatch[1]},${coordMatch[2]}&z=15&output=embed`
                    } else {
                      // Try to extract place name
                      const placeMatch = value.match(/place\/([^\/]+)/)
                      if (placeMatch) {
                        const placeName = decodeURIComponent(placeMatch[1].replace(/\+/g, ' '))
                        value = `https://maps.google.com/maps?q=${encodeURIComponent(placeName)}&output=embed`
                      }
                    }
                  }

                  setLocationMapIframe(value)
                }}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                placeholder="Paste Google Maps embed code or URL here..."
              />
              <div className="text-xs text-gray-600 space-y-1 bg-blue-50 p-3 rounded-md">
                <p className="font-medium text-blue-900">How to get Google Maps embed:</p>
                <ol className="list-decimal ml-4 space-y-1">
                  <li>Go to <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Maps</a></li>
                  <li>Search for your location</li>
                  <li>Click "Share" button</li>
                  <li>Copy the share link (like share.google/... or maps.app.goo.gl/...)</li>
                  <li>Paste it here - it will be automatically converted!</li>
                </ol>
                <p className="text-xs text-gray-500 mt-2">Supports: share.google links, maps.app.goo.gl links, regular Google Maps URLs, and embed URLs</p>
              </div>
              {locationMapIframe && (locationMapIframe.includes('google.com/maps/embed') || locationMapIframe.includes('maps.google.com/maps')) && (
                <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden">
                  <p className="text-xs font-medium text-gray-700 px-3 py-2 bg-gray-50">Preview:</p>
                  <iframe
                    src={locationMapIframe}
                    width="100%"
                    height="200"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                  />
                </div>
              )}
              {locationMapIframe && !(locationMapIframe.includes('google.com/maps/embed') || locationMapIframe.includes('maps.google.com/maps')) && (
                <div className="text-xs text-yellow-700 bg-yellow-50 p-2 rounded-md">
                  ⚠️ This doesn't look like a Google Maps embed URL. Please use the embed code from Google Maps.
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Cover Image</label>
              <div className="space-y-3">
                {/* Image Preview */}
                {imagePreview && (
                  <div className="relative w-full h-48 rounded-lg overflow-hidden border-2 border-gray-200">
                    <Image
                      src={imagePreview}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                    />
                    <Button
                      type="button"
                      onClick={() => {
                        setCoverImageUrl('')
                        setImagePreview(null)
                      }}
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2 bg-white"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Remove
                    </Button>
                  </div>
                )}

                {/* File Input */}
                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploadingImage}
                    className="flex-1"
                  />
                  {uploadingImage && (
                    <Loader2 className="w-5 h-5 animate-spin text-pink-500" />
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Upload a cover image for your party (max 5MB, JPG, PNG, GIF, or WebP)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Additional Party Settings */}
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Additional Settings</CardTitle>
            <CardDescription>Optional details to enhance your party</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Party Type</label>
                <select
                  value={partyType}
                  onChange={(e) => setPartyType(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:border-pink-500 focus:outline-none"
                >
                  <option value="">Select type (optional)</option>
                  <option value="Birthday">Birthday Party</option>
                  <option value="Wedding">Wedding</option>
                  <option value="Anniversary">Anniversary</option>
                  <option value="BBQ">BBQ / Cookout</option>
                  <option value="Holiday">Holiday Party</option>
                  <option value="Corporate">Corporate Event</option>
                  <option value="Graduation">Graduation</option>
                  <option value="Baby Shower">Baby Shower</option>
                  <option value="Housewarming">Housewarming</option>
                  <option value="Game Night">Game Night</option>
                  <option value="Casual">Casual Gathering</option>
                  <option value="Other">Other</option>
                </select>
                <p className="text-xs text-gray-500">Helps guests know what to expect</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Dress Code</label>
                <select
                  value={dressCode}
                  onChange={(e) => setDressCode(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:border-pink-500 focus:outline-none"
                >
                  <option value="">Select dress code (optional)</option>
                  <option value="Casual">Casual</option>
                  <option value="Smart Casual">Smart Casual</option>
                  <option value="Business Casual">Business Casual</option>
                  <option value="Semi-Formal">Semi-Formal</option>
                  <option value="Formal">Formal / Black Tie</option>
                  <option value="Costume">Costume / Theme</option>
                  <option value="Beach">Beach / Pool</option>
                  <option value="Outdoor">Outdoor / Activewear</option>
                </select>
                <p className="text-xs text-gray-500">Let guests know what to wear</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">RSVP Deadline</label>
                <Input
                  type="datetime-local"
                  value={rsvpDeadline}
                  onChange={(e) => setRsvpDeadline(e.target.value)}
                />
                <p className="text-xs text-gray-500">When guests should respond by</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-900">Max Guest Capacity</label>
                <Input
                  type="number"
                  min="1"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(e.target.value)}
                  placeholder="No limit"
                />
                <p className="text-xs text-gray-500">Maximum number of people allowed</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-900">Special Instructions</label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="Additional info for guests: parking details, what to bring, gate codes, etc."
                className="w-full min-h-[100px] px-4 py-2 rounded-lg border-2 border-gray-200 bg-white text-gray-900 focus:border-pink-500 focus:outline-none resize-y placeholder:text-gray-400"
                maxLength={500}
              />
              <p className="text-xs text-gray-500">Visible to guests • Parking, gate codes, what to bring, etc.</p>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="potluck"
                checked={isPotluck}
                onChange={(e) => setIsPotluck(e.target.checked)}
                className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
              />
              <label htmlFor="potluck" className="text-sm font-medium text-gray-900 cursor-pointer">
                Enable Potluck (guests can claim items to bring)
              </label>
            </div>
          </CardContent>
        </Card>

        {/* RSVP Stats Summary */}
        {!isNew && guests.length > 0 && (
          <Card className="shadow-lg border-2 border-blue-200/50">
            <CardHeader>
              <CardTitle>RSVP Summary</CardTitle>
              <CardDescription>Quick overview of guest responses</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gradient-to-r from-blue-500 to-teal-600 rounded-lg text-white">
                  <p className="text-sm font-medium opacity-90">Total Responses</p>
                  <p className="text-3xl font-bold mt-1">{guests.length}</p>
                  <p className="text-xs opacity-75 mt-1">
                    {guests.reduce((sum, g) => sum + (g.party_size || 1), 0)} people total
                  </p>
                </div>

                <div className="p-4 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg text-white">
                  <p className="text-sm font-medium opacity-90">Going</p>
                  <p className="text-3xl font-bold mt-1">
                    {guests.filter((g) => {
                      const rsvp = Array.isArray(g.rsvp) ? g.rsvp[0] : g.rsvp
                      return rsvp?.status === 'going'
                    }).length}
                  </p>
                  <p className="text-xs opacity-75 mt-1">✓ Confirmed</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg text-white">
                  <p className="text-sm font-medium opacity-90">Maybe</p>
                  <p className="text-3xl font-bold mt-1">
                    {guests.filter((g) => {
                      const rsvp = Array.isArray(g.rsvp) ? g.rsvp[0] : g.rsvp
                      return rsvp?.status === 'maybe'
                    }).length}
                  </p>
                  <p className="text-xs opacity-75 mt-1">? Undecided</p>
                </div>

                <div className="p-4 bg-gradient-to-r from-red-500 to-pink-600 rounded-lg text-white">
                  <p className="text-sm font-medium opacity-90">Can't Make It</p>
                  <p className="text-3xl font-bold mt-1">
                    {guests.filter((g) => {
                      const rsvp = Array.isArray(g.rsvp) ? g.rsvp[0] : g.rsvp
                      return rsvp?.status === 'not_going'
                    }).length}
                  </p>
                  <p className="text-xs opacity-75 mt-1">✗ Declined</p>
                </div>
              </div>

              {maxCapacity && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-900">Capacity Usage:</span>
                    <span className="text-sm font-bold text-purple-600">
                      {guests.reduce((sum, g) => sum + (g.party_size || 1), 0)} / {maxCapacity} people
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min((guests.reduce((sum, g) => sum + (g.party_size || 1), 0) / parseInt(maxCapacity)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Invite Code & QR Code */}
        {!isNew && inviteCode && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <QrCode className="w-6 h-6 text-pink-500" />
                Invite Code & QR Code
              </CardTitle>
              <CardDescription>Share this code or QR code with your guests</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 p-4 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-900 mb-1">Party Code</p>
                  <code className="text-2xl font-mono font-bold text-pink-600">
                    {inviteCode.code}
                  </code>
                </div>
                <Button onClick={copyCodeToClipboard} variant="outline">
                  {copiedCode ? (
                    <>
                      <span className="text-green-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </>
                  )}
                </Button>
              </div>
              <p className="text-sm text-gray-900">
                Uses: {inviteCode.uses} {inviteCode.max_uses && `/ ${inviteCode.max_uses}`}
              </p>

              {/* QR Code Section */}
              <div className="border-t pt-6">
                <div className="flex flex-col md:flex-row items-center gap-6">
                  <div className="flex-shrink-0">
                    {qrCodeUrl ? (
                      <div className="p-4 bg-white border-2 border-pink-200 rounded-lg shadow-sm">
                        <img
                          src={qrCodeUrl}
                          alt="Party QR Code"
                          className="w-64 h-64"
                        />
                      </div>
                    ) : (
                      <div className="w-64 h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 space-y-4">
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-2">Scan to Join</h4>
                      <p className="text-sm text-gray-600">
                        Guests can scan this QR code with their phone camera to instantly join the party.
                        Perfect for sharing on invitations or displaying at the entrance!
                      </p>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button
                        onClick={downloadQRCode}
                        disabled={!qrCodeUrl}
                        variant="outline"
                        className="w-full md:w-auto"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download QR Code
                      </Button>
                      <p className="text-xs text-gray-500">
                        Download as PNG to print or share digitally
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Guests */}
        {!isNew && guests.length > 0 && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Guest List</CardTitle>
              <CardDescription>
                {(() => {
                  const totalHeadcount = guests.reduce((sum, guest) => sum + (guest.party_size || 1), 0)
                  return `${guests.length} ${guests.length === 1 ? 'response' : 'responses'} • ${totalHeadcount} ${totalHeadcount === 1 ? 'person' : 'people'} total`
                })()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {guests.map((guest) => {
                  const rsvp = Array.isArray(guest.rsvp) ? guest.rsvp[0] : guest.rsvp
                  const partySize = guest.party_size || 1
                  return (
                    <div
                      key={guest.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                          {guest.display_name[0].toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {guest.display_name}
                            {partySize > 1 && (
                              <span className="ml-2 text-xs text-purple-600 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
                                {partySize} people
                              </span>
                            )}
                          </p>
                          {rsvp && (
                            <p className="text-sm text-gray-900">
                              {rsvp.status === 'going' && '✓ Going'}
                              {rsvp.status === 'maybe' && '? Maybe'}
                              {rsvp.status === 'not_going' && '✗ Not going'}
                            </p>
                          )}
                          {guest.phone && (
                            <p className="text-xs text-gray-600">{guest.phone}</p>
                          )}
                        </div>
                      </div>
                      <Button
                        onClick={() => handleRemoveGuest(guest.id, guest.display_name)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Remove
                      </Button>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Party Wall / Comments Management */}
        {!isNew && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-6 h-6 text-blue-500" />
                Party Wall
              </CardTitle>
              <CardDescription>
                View and manage comments from guests
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Comments List */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {comments.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">No messages yet</p>
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
                        <div className="flex items-center gap-2 flex-1">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0',
                              comment.is_admin
                                ? 'bg-gradient-to-r from-pink-500 to-purple-600'
                                : 'bg-gradient-to-r from-blue-500 to-teal-600'
                            )}
                          >
                            {comment.author_name[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
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
                        <Button
                          onClick={() => handleDeleteComment(comment.id)}
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
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
                    placeholder="Post a message as the host..."
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
        )}

        {/* Potluck Item Types */}
        {!isNew && isPotluck && (
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Potluck Item Types</CardTitle>
              <CardDescription>
                Define what guests can bring and set capacity limits
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Add New Item Type Form */}
              <div className="p-4 bg-pink-50 rounded-lg border border-pink-200">
                <h3 className="font-semibold text-gray-900 mb-3">Add New Item Type</h3>
                <div className="flex flex-col md:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      placeholder="e.g., Appetizers, Mains, Desserts"
                      disabled={itemTypeLoading}
                      className="bg-white text-gray-900"
                    />
                  </div>
                  <div className="w-32">
                    <Input
                      type="number"
                      min="1"
                      value={newItemCapacity}
                      onChange={(e) => setNewItemCapacity(e.target.value)}
                      placeholder="Capacity"
                      disabled={itemTypeLoading}
                      className="bg-white text-gray-900"
                    />
                  </div>
                  <Button
                    onClick={handleAddItemType}
                    disabled={itemTypeLoading}
                    className="whitespace-nowrap"
                  >
                    {itemTypeLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Type
                      </>
                    )}
                  </Button>
                </div>
                <p className="text-xs text-gray-600 mt-2">
                  Capacity = how many guests can select this type
                </p>
              </div>

              {/* Item Types List */}
              {itemTypes.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <p>No item types yet. Add one above to get started!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {itemTypes.map((type) => (
                    <div
                      key={type.item_type_id}
                      className="p-4 bg-white border-2 border-gray-200 rounded-lg"
                    >
                      {editingTypeId === type.item_type_id ? (
                        // Edit Mode
                        <div className="space-y-3">
                          <div className="flex flex-col md:flex-row gap-3">
                            <div className="flex-1">
                              <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Item type name"
                                disabled={itemTypeLoading}
                                className="text-gray-900"
                              />
                            </div>
                            <div className="w-32">
                              <Input
                                type="number"
                                min="1"
                                value={editCapacity}
                                onChange={(e) => setEditCapacity(e.target.value)}
                                placeholder="Capacity"
                                disabled={itemTypeLoading}
                                className="text-gray-900"
                              />
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleUpdateItemType(type.item_type_id)}
                              disabled={itemTypeLoading}
                              size="sm"
                            >
                              {itemTypeLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <Save className="w-4 h-4 mr-2" />
                                  Save
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => setEditingTypeId(null)}
                              disabled={itemTypeLoading}
                              variant="outline"
                              size="sm"
                            >
                              <X className="w-4 h-4 mr-2" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <h4 className="font-semibold text-gray-900 text-lg">
                                {type.name}
                              </h4>
                              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-semibold rounded-full">
                                Capacity: {type.capacity}
                              </span>
                              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-semibold rounded-full">
                                {type.selections_count || 0} selected
                              </span>
                              <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm font-semibold rounded-full">
                                {type.remaining || type.capacity} remaining
                              </span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              onClick={() => startEditingType(type)}
                              disabled={itemTypeLoading}
                              variant="outline"
                              size="sm"
                            >
                              Edit
                            </Button>
                            <Button
                              onClick={() => handleDeleteItemType(type.item_type_id)}
                              disabled={itemTypeLoading}
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Potluck Assignments - Who's Bringing What */}
              {itemTypes.length > 0 && itemTypes.some(type => (type.selections_count || 0) > 0) && (
                <div className="mt-6 pt-6 border-t">
                  <h3 className="font-semibold text-gray-900 mb-4">Who's Bringing What</h3>
                  <div className="space-y-3">
                    {itemTypes.map((type) => {
                      const selections = type.selections || []
                      if (selections.length === 0) return null

                      return (
                        <div key={type.item_type_id} className="p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
                          <h4 className="font-semibold text-gray-900 mb-2">{type.name}</h4>
                          <div className="space-y-2">
                            {selections.map((selection: any) => (
                              <div key={selection.id} className="flex items-center gap-2 text-sm">
                                <div className="w-6 h-6 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
                                  {selection.guest?.display_name?.[0]?.toUpperCase() || '?'}
                                </div>
                                <span className="font-medium text-gray-900">
                                  {selection.guest?.display_name || 'Unknown Guest'}
                                </span>
                                {selection.note && (
                                  <span className="text-gray-600">- {selection.note}</span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
