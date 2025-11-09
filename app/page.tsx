'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { PartyPopper, Sparkles, Calendar, Users, Utensils, MessageCircle, Shield, Clock } from 'lucide-react'

export default function HomePage() {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!code || code.trim().length === 0) {
      setError('Please enter a party code')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/party/resolve-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.toUpperCase().trim() }),
      })

      if (!response.ok) {
        const data = await response.json()
        setError(data.error || 'Invalid party code')
        setLoading(false)
        return
      }

      const data = await response.json()
      // Redirect to join page with party ID
      router.push(`/join/${data.party.id}?code=${code.toUpperCase().trim()}`)
    } catch (err) {
      console.error('Error resolving code:', err)
      setError('Something went wrong. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 text-6xl animate-bounce opacity-20">🎉</div>
        <div className="absolute top-40 right-32 text-5xl animate-pulse opacity-20">🎈</div>
        <div className="absolute bottom-32 left-40 text-7xl animate-bounce opacity-20" style={{ animationDelay: '0.5s' }}>🎊</div>
        <div className="absolute bottom-20 right-20 text-6xl animate-pulse opacity-20" style={{ animationDelay: '1s' }}>🎁</div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="flex justify-center mb-6 animate-fadeIn">
            <div className="relative w-64 h-64 drop-shadow-2xl">
              <Image
                src="/onlypartyz-logo.png"
                alt="OnlyPartyz Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>

          {/* Hero Text */}
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent mb-4">
            OnlyPartyz
          </h1>
          <p className="text-xl md:text-2xl text-gray-900 mb-6 max-w-2xl mx-auto">
            Because group texts are chaos and we're tired of it 🎉
          </p>
          <p className="text-base text-gray-900 mb-8 max-w-xl mx-auto">
            Finally, a way to coordinate parties without creating 47 different group chats. 
            You're welcome.
          </p>
        </div>
{/* Join Party Section */}
        <div className="max-w-md mx-auto mb-12">
          <Card className="shadow-2xl border-2 border-pink-200/50 backdrop-blur-sm bg-white/95">
            <CardHeader className="text-center space-y-2">
              <div className="flex justify-center mb-2">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
                  <PartyPopper className="w-8 h-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                Join a Party
              </CardTitle>
              <CardDescription className="text-base">
                Enter your unique party code to get started
              </CardDescription>
            </CardHeader>

          <CardContent className="space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="code" className="text-sm font-medium text-gray-900">
                  Party Code
                </label>
                <Input
                  id="code"
                  type="text"
                  placeholder="Enter 10-character code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase())
                    setError('')
                  }}
                  maxLength={10}
                  className="text-center text-lg font-mono tracking-wider"
                  disabled={loading}
                />
                {error && (
                  <p className="text-sm text-red-500 flex items-center gap-1">
                    <span className="text-lg">⚠️</span>
                    {error}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full text-base font-semibold"
                disabled={loading || code.length !== 10}
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    Checking code...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Join Party
                  </>
                )}
              </Button>
            </form>

            <div className="pt-4 border-t border-gray-200">
              <div className="text-center space-y-2">
                <p className="text-sm text-gray-900">Are you a party host?</p>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => router.push('/admin/login')}
                >
                  Admin Login
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        </div>
        
        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card className="border-2 border-pink-100 bg-white/90 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-3 rounded-full">
                  <Calendar className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-lg">Easy RSVP Management</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-900 text-center">
                Know exactly who's coming, who's "maybe" (we see you), and who's brave enough to say no. 
                No more guessing games!
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-purple-100 bg-white/90 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 p-3 rounded-full">
                  <Utensils className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-lg">Smart Potluck Coordination</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-900 text-center">
                Say goodbye to the days of five people bringing potato salad. Claim your dish and avoid the 
                awkward "oh... you brought that too?" moment.
              </p>
            </CardContent>
          </Card>

          <Card className="border-2 border-blue-100 bg-white/90 hover:shadow-lg transition-shadow">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-3">
                <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-3 rounded-full">
                  <MessageCircle className="w-6 h-6 text-white" />
                </div>
              </div>
              <CardTitle className="text-lg">Party Wall & Comments</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-900 text-center">
                Share the hype before, during, and after. Post comments, share moments, and immortalize 
                the embarrassing photos. What happens at the party... gets posted here. 📸
              </p>
            </CardContent>
          </Card>
        </div>

        

        {/* Why Choose OnlyPartyz */}
        <div className="max-w-4xl mx-auto mb-12">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-8">
            Why Hosts Love OnlyPartyz
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 p-4 bg-white/80 rounded-lg border border-pink-100">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Real-Time Updates</h3>
                <p className="text-sm text-gray-900">
                  Watch RSVPs roll in faster than your aunt can type "see you there sweetie!! 😘😘😘" 
                  in the family group chat.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-white/80 rounded-lg border border-purple-100">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Private & Secure</h3>
                <p className="text-sm text-gray-900">
                  Invite-code only. No randos. Just your people. Keep the party crashers out and the 
                  good vibes in.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-white/80 rounded-lg border border-blue-100">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Save Your Sanity</h3>
                <p className="text-sm text-gray-900">
                  No more "did you get my text?" or "wait, who's bringing chips?" Lost in translation? 
                  Not here. Everything's in one spot.
                </p>
              </div>
            </div>

            <div className="flex gap-4 p-4 bg-white/80 rounded-lg border border-pink-100">
              <div className="flex-shrink-0">
                <div className="w-12 h-12 bg-gradient-to-r from-pink-500 to-blue-600 rounded-full flex items-center justify-center">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">Actually Fun to Use</h3>
                <p className="text-sm text-gray-900">
                  Party planning should be exciting, not exhausting. We made it pretty, we made it easy, 
                  and we made it actually enjoyable. You're welcome.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Want to Host Section */}
        <Card className="shadow-xl border-2 border-purple-200/50 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="py-8 text-center">
            <div className="mb-4">
              <span className="text-5xl">🎯</span>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-3">
              Want to Host Your Own Parties?
            </h2>
            <p className="text-base text-gray-900 mb-6 max-w-2xl mx-auto">
              Ready to level up and become a party host? Get your own admin account and start creating 
              epic events for your crew. It's exclusive, it's powerful, and it's surprisingly easy.
            </p>
            <div className="p-4 bg-white/80 rounded-lg border-2 border-purple-200 max-w-md mx-auto">
              <p className="text-sm text-gray-900 font-medium mb-2">
                🎊 Hit up <strong className="text-purple-600">Niaz</strong> to get started
              </p>
              <p className="text-xs text-gray-900">
                (Yes, you have to know someone. That's how exclusivity works. 😎)
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-900">
          <br />
          <p>
            <a href="/terms" className="hover:text-pink-600 transition-colors">
              Terms
            </a>
            {' • '}
            <a href="/privacy" className="hover:text-pink-600 transition-colors">
              Privacy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
