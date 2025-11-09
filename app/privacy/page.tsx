import Image from 'next/image'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

export default function PrivacyPage() {
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
            <CardTitle className="text-3xl">Privacy Policy</CardTitle>
            <p className="text-gray-900 mt-2">Last updated: November 2025</p>
          </CardHeader>

          <CardContent className="prose prose-pink max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Privacy Matters 🔒</h2>
              <p className="text-gray-900">
                Okay, real talk: We're not Facebook. We're not selling your data to sketchy advertisers. 
                This is literally just an app so we can stop having 15 group chats about the same party. 
                Here's everything we know about you (spoiler: it's not much):
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">What We Actually Collect</h2>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">For Party Guests (That's You!):</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-900">
                    <li>Your name (so we know who's bringing the chips)</li>
                    <li>Phone number if you want (for when Karen says "text me the address!")</li>
                    <li>Whether you're coming (Going / Maybe / Nah)</li>
                    <li>What food you claimed (so three people don't all bring hummus... again)</li>
                    <li>A device fingerprint (so we remember you - it's not as creepy as it sounds)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">For Party Hosts (The Heroes):</h3>
                  <ul className="list-disc list-inside space-y-1 text-gray-900">
                    <li>Email address (thanks, Supabase!)</li>
                    <li>Password (hashed and locked up tighter than your embarrassing high school photos)</li>
                    <li>Party details you create (date, theme, "please no plus-ones")</li>
                    <li>Photos you upload (yes, including that one where everyone blinked)</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">What We Do With It</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-900">
                <li>Let you join parties (revolutionary, we know)</li>
                <li>Show everyone who's coming (so you can make your attendance decision accordingly 👀)</li>
                <li>Track the potluck situation (goodbye, 4 identical pasta salads!)</li>
                <li>Remember you when you come back (because we care... and also caching)</li>
                <li>Let hosts do their organizational thing</li>
              </ul>
              <p className="text-gray-900 mt-4 font-medium">
                <strong className="text-pink-600">That's literally it!</strong> No ads. No selling data. 
                No "recommended parties based on your browsing history." We're not that kind of app.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Where We Keep Your Stuff</h2>
              <p className="text-gray-900">
                Everything lives in{' '}
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-pink-600 hover:underline font-semibold"
                >
                  Supabase
                </a>
                , which is like a super secure vault but for databases. Your photos? Also Supabase Storage. 
                It's all encrypted and protected better than your secret snack stash. 🍪🔐
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Cookies & Technical Stuff 🍪</h2>
              <p className="text-gray-900">We use:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-900 mt-2">
                <li>
                  <strong>Cookies:</strong> Only for admin logins. They're not tracking cookies. 
                  They're "please remember I'm logged in" cookies.
                </li>
                <li>
                  <strong>Local Storage:</strong> To remember your guest ID. So you don't have to type 
                  your name every. single. time. You're welcome.
                </li>
              </ul>
              <p className="text-gray-900 mt-2">
                That's it. No creepy tracking. No selling to advertisers. Just basic "make the app work" stuff.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Who Can See Your Info</h2>
              <ul className="list-disc list-inside space-y-2 text-gray-900">
                <li>
                  <strong>Your party crew:</strong> They can see your name, if you're coming, and what 
                  you're bringing. Kind of the whole point.
                </li>
                <li>
                  <strong>The host:</strong> Can see everything for their party. They can also boot you 
                  if you RSVP'd yes then ghosted three times. (We're looking at you, Brad.)
                </li>
                <li>
                  <strong>Random internet strangers:</strong> NOPE. Everything's locked behind party codes. 
                  Unless you leak the code... then that's on you, buddy.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Security (The Serious Part)</h2>
              <p className="text-gray-900">We protect your data with:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-900 mt-2">
                <li>Row Level Security (fancy database speak for "people can only see their own stuff")</li>
                <li>HTTPS everywhere (the little lock icon in your browser)</li>
                <li>Supabase's enterprise-grade auth (we're standing on the shoulders of giants here)</li>
                <li>Server-side validation (because we don't trust anything from the internet)</li>
              </ul>
              <p className="text-gray-900 mt-3">
                Is it Fort Knox? No. Is it secure enough for party planning? Absolutely.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Your Rights (Power to the People!)</h2>
              <p className="text-gray-900">You can:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-900 mt-2">
                <li>See all the party data you're part of (transparency, baby!)</li>
                <li>Change your RSVP whenever (we get it, plans change)</li>
                <li>Update what you're bringing ("actually, I'll bring brownies instead")</li>
                <li>Ask the host to remove you (though they might be sad about it 😢)</li>
                <li>Delete your admin account if you want (RIP party hosting career)</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">How Long We Keep Your Data</h2>
              <p className="text-gray-900">
                As long as the party exists in the system. When a host deletes their party, POOF! 💨 
                All the data goes with it. Guest lists, RSVPs, potluck claims, photos - all gone. 
                It's like the party never happened (except in your memories and that food coma).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Third-Party Services (Our Friends)</h2>
              <p className="text-gray-900">We team up with:</p>
              <ul className="list-disc list-inside space-y-2 text-gray-900 mt-2">
                <li>
                  <strong>Supabase:</strong> For database magic, auth wizardry, and photo storage
                </li>
                <li>
                  <strong>Vercel:</strong> For hosting this bad boy
                </li>
                <li>
                  <strong>Google Maps:</strong> For "where is this party again?" moments
                </li>
              </ul>
              <p className="text-gray-900 mt-2">
                They have their own privacy policies. We picked them because they're legit, but feel 
                free to check them out if you're into that kind of bedtime reading.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Kids & Privacy</h2>
              <p className="text-gray-900">
                This app is for family parties, so yeah, kids might use it. We don't specifically collect 
                data from children - we just collect whoever's at the party. If you're a parent and you're 
                concerned, that's between you and your party host. We're just here to coordinate who's 
                bringing the juice boxes.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Changes to This Policy</h2>
              <p className="text-gray-900">
                Sometimes we might update this (like if we add a cool new feature). When we do, we'll 
                change that "Last updated" date up top. If you keep using OnlyPartyz after that, it 
                means you're cool with it. If not... well, there's always the group text (just kidding, 
                please stay).
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Questions? Concerns? Compliments?</h2>
              <p className="text-gray-900">
                Dude, this is a friends and family app. If you're worried about privacy, just talk to 
                your party host. They're probably your friend/cousin/weird neighbor anyway. And if you're 
                REALLY worried, you can always just... not use it? (But then you'll miss all the party fun. 
                Your call. 🤷)
              </p>
            </section>

            <div className="mt-8 p-4 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg border-2 border-pink-200">
              <p className="text-base text-gray-900 text-center font-medium">
                <strong className="text-pink-600">TL;DR:</strong> We collect the bare minimum, guard it like 
                a dragon hoards treasure, and only share it with your party crew. No ads, no selling data, 
                no nonsense. Just good vibes and party planning! 🎉🔒
              </p>
            </div>

            <div className="mt-6 text-center">
              <Link href="/terms">
                <Button variant="outline">View Terms of Service</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
