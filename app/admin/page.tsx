'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Plus,
  Calendar,
  Users,
  PartyPopper,
  Loader2,
  Edit,
  Trash2,
  Copy,
  LogOut,
  UtensilsCrossed,
  MapPin,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { Party, InviteCode } from '@/lib/types/database'
import { formatDateShort, isDatePast } from '@/lib/utils'

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const [parties, setParties] = useState<(Party & { invite_codes?: InviteCode[] })[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      router.push('/admin/login')
      return
    }

    setUser(user)
    await loadParties()
  }

  async function loadParties() {
    try {
      const response = await fetch('/api/admin/party')
      if (!response.ok) {
        throw new Error('Failed to load parties')
      }

      const data = await response.json()
      setParties(data.parties || [])
      setLoading(false)
    } catch (err) {
      console.error('Error loading parties:', err)
      setLoading(false)
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/')
  }

  async function handleDeleteParty(id: string) {
    if (!confirm('Are you sure you want to delete this party? This cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/party/${id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        await loadParties()
      }
    } catch (err) {
      console.error('Error deleting party:', err)
    }
  }

  function copyToClipboard(code: string) {
    navigator.clipboard.writeText(code)
    setCopiedCode(code)
    setTimeout(() => setCopiedCode(null), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-pink-500 mx-auto mb-4" />
          <p className="text-gray-900">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  const upcomingParties = parties.filter((p) => !isDatePast(p.starts_at))
  const pastParties = parties.filter((p) => isDatePast(p.starts_at))

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-pink-200">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/onlypartyz-logo.png" alt="Logo" width={40} height={40} />
            <div>
              <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-sm text-gray-900">{user?.email}</p>
            </div>
          </div>
          <Button onClick={handleLogout} variant="outline" size="sm">
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="shadow-lg border-2 border-pink-200/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Total Parties</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{parties.length}</p>
                </div>
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
                  <PartyPopper className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 border-purple-200/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Upcoming</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{upcomingParties.length}</p>
                </div>
                <div className="bg-gradient-to-r from-purple-500 to-blue-600 p-3 rounded-full">
                  <Calendar className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-lg border-2 border-blue-200/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-900">Past Events</p>
                  <p className="text-3xl font-bold text-gray-900 mt-1">{pastParties.length}</p>
                </div>
                <div className="bg-gradient-to-r from-blue-500 to-teal-600 p-3 rounded-full">
                  <Users className="w-8 h-8 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Party Button */}
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-900">Your Parties</h2>
          <Button onClick={() => router.push('/admin/party/new')} size="lg">
            <Plus className="w-5 h-5 mr-2" />
            Create New Party
          </Button>
        </div>

        {/* Upcoming Parties */}
        {upcomingParties.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Upcoming Parties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {upcomingParties.map((party) => {
                const inviteCode = party.invite_codes?.[0]
                const guestCount = (party as any).guest_count || 0
                const totalHeadcount = (party as any).total_headcount || 0
                return (
                  <Card key={party.id} className="shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                    {/* Cover Image */}
                    {party.cover_image_url && (
                      <div className="relative w-full h-32 bg-gradient-to-r from-pink-100 to-purple-100">
                        <Image
                          src={party.cover_image_url}
                          alt={party.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    )}

                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-xl line-clamp-2">{party.title}</CardTitle>
                          <CardDescription className="mt-2 flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            {formatDateShort(party.starts_at)}
                          </CardDescription>
                        </div>
                        {party.is_potluck && (
                          <div className="bg-orange-100 p-2 rounded-full" title="Potluck enabled">
                            <UtensilsCrossed className="w-4 h-4 text-orange-600" />
                          </div>
                        )}
                      </div>
                    </CardHeader>

                    <CardContent className="space-y-3">
                      {inviteCode && (
                        <div className="p-3 bg-gray-50 rounded-lg">
                          <p className="text-xs text-gray-900 mb-1">Invite Code</p>
                          <div className="flex items-center justify-between gap-2">
                            <code className="text-sm font-mono font-bold text-pink-600">
                              {inviteCode.code}
                            </code>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => copyToClipboard(inviteCode.code)}
                            >
                              {copiedCode === inviteCode.code ? (
                                <span className="text-xs text-green-600">Copied!</span>
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Guest Count - More Prominent */}
                      <div className="p-4 bg-gradient-to-r from-purple-500 to-blue-500 rounded-lg text-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Users className="w-5 h-5" />
                            <div>
                              <p className="text-sm font-semibold">
                                {guestCount} {guestCount === 1 ? 'Guest' : 'Guests'} Attending
                              </p>
                              {totalHeadcount !== guestCount && (
                                <p className="text-xs opacity-90">
                                  {totalHeadcount} {totalHeadcount === 1 ? 'person' : 'people'} total
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="text-2xl font-bold">
                            {guestCount}
                          </div>
                        </div>
                      </div>

                      {/* Location Preview */}
                      {party.location_address && (
                        <div className="flex items-start gap-2 text-xs text-gray-900">
                          <MapPin className="w-4 h-4 text-gray-900 flex-shrink-0 mt-0.5" />
                          <p className="line-clamp-1">{party.location_address}</p>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => router.push(`/admin/party/${party.id}`)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteParty(party.id)}
                          variant="outline"
                          size="sm"
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </div>
        )}

        {/* Past Parties */}
        {pastParties.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">Past Parties</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pastParties.map((party) => (
                <Card key={party.id} className="shadow-lg opacity-75">
                  <CardHeader>
                    <CardTitle className="text-xl line-clamp-2">{party.title}</CardTitle>
                    <CardDescription className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDateShort(party.starts_at)}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <Button
                        onClick={() => router.push(`/admin/party/${party.id}`)}
                        variant="outline"
                        size="sm"
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      <Button
                        onClick={() => handleDeleteParty(party.id)}
                        variant="outline"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {parties.length === 0 && (
          <Card className="shadow-lg">
            <CardContent className="py-16 text-center">
              <PartyPopper className="w-16 h-16 text-pink-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No parties yet!</h3>
              <p className="text-gray-900 mb-6">Create your first party to get started.</p>
              <Button onClick={() => router.push('/admin/party/new')} size="lg">
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Party
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
