import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Image src="/onlypartyz-logo.png" alt="OnlyPartyz Logo" width={60} height={60} />
            <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              OnlyPartyz
            </h1>
          </div>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>

        {/* Content */}
        <Card className="shadow-2xl border-2 border-pink-200/50">
          <CardHeader>
            <CardTitle className="text-3xl">Terms of Service</CardTitle>
            <p className="text-gray-900 mt-2">Last updated: November 2025</p>
          </CardHeader>

          <CardContent className="prose prose-pink max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Welcome to OnlyPartyz! 🎉</h2>
              <p className="text-gray-900">
                Hey! So, uh, we need to have "Terms of Service" because apparently that's what you do 
                when you make an app. But let's be real - this is just for us to coordinate parties 
                without creating 47 different group chats. Here's the deal:
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">The Basics (But Make It Fun)</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-900">
                <li>
                  <strong>Secret Club Vibes:</strong> You need a party code. No code? No party. 
                  (We're exclusive like that. 😎)
                </li>
                <li>
                  <strong>Name Drop:</strong> We'll ask for your name. Maybe your phone number if 
                  you're feeling fancy. That's it. We promise we won't sell your info to Big Pharma 
                  or whatever.
                </li>
                <li>
                  <strong>Host with the Most:</strong> Party hosts get admin access. With great 
                  power comes great responsibility (to not delete everyone accidentally).
                </li>
                <li>
                  <strong>Don't Be That Person:</strong> You know that person. The one who RSVPs 
                  "Yes" then ghosts. Or brings store-bought cookies to a potluck. Don't be them.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">What You Can Do ✅</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-900">
                <li>Join parties (duh)</li>
                <li>RSVP and actually mean it</li>
                <li>Claim to bring guac, then bring the world's best guac</li>
                <li>Stalk who else is coming before you commit</li>
                <li>If you're hosting: flex your organizational skills</li>
                <li>View embarrassing party photos (that's what friends are for)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">What You Can't Do ❌</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-900">
                <li>Share party codes with your weird uncle. Keep it in the circle.</li>
                <li>Put your name as "Party Crasher" or "Free Food Hunter" (we're watching you)</li>
                <li>Try to hack the mainframe or whatever hackers do. We run on vibes and duct tape here.</li>
                <li>Upload photos of your feet. Please. We're begging you.</li>
                <li>Use this to plan your pyramid scheme launch party</li>
                <li>Claim to bring 5 different dishes then show up with nothing (looking at you, Dave)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">About Those Party Pics 📸</h2>
              <p className="text-gray-900">
                Hosts can upload photos. If you upload a pic, make sure you actually took it (or have 
                permission). Also, maybe check if everyone's eyes are open before immortalizing that 
                moment forever. We're not responsible for unflattering angles - that's between you and 
                your photographer friend.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Data (The Serious Bit)</h2>
              <p className="text-gray-900">
                We collect your name, maybe your number, and what you're bringing to the potluck. 
                That's literally it. We're not tracking your location, reading your texts, or reporting 
                your questionable music taste to anyone. Everything's locked up tight in Supabase. 
                Check our{' '}
                <Link href="/privacy" className="text-pink-600 hover:underline font-semibold">
                  Privacy Policy
                </Link>{' '}
                for the boring details (but it's actually pretty chill).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">The Lawyer-y Stuff 📜</h2>
              <p className="text-gray-900">
                OnlyPartyz is provided "as is" - meaning if the app crashes during your party, you can't 
                sue us. We're also not responsible for:
              </p>
              <ul className="list-disc list-inside space-y-2 text-gray-900 mt-2">
                <li>Three people bringing potato salad (coordination is on you)</li>
                <li>Your friend showing up 2 hours late "fashionably"</li>
                <li>Someone eating all the good snacks before everyone arrives</li>
                <li>Drama that starts in the comments section</li>
                <li>Your inability to say "no" to hosting yet another party</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">We Might Change Stuff</h2>
              <p className="text-gray-900">
                Sometimes we'll update these terms. We'll change the date at the top. If you keep 
                using the app, it means you're cool with the changes. If you're not cool with it, 
                you can... uh... go back to group texts? (Please don't.)
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Questions? Comments? Concerns?</h2>
              <p className="text-gray-900">
                This is literally just for our friend group. If you have questions, text your party 
                host. If you have complaints, bring them up at the next party. If you have compliments, 
                we'll take those too. 😊
              </p>
            </section>

            <div className="mt-8 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-pink-200">
              <p className="text-base text-gray-900 text-center font-medium">
                <strong className="text-pink-600">TL;DR:</strong> Don't be weird, bring what you said you'd bring, 
                and have fun. That's it. That's the terms. Now go party! 🎉🎊🎈
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
