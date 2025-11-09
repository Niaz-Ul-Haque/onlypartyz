# OnlyPartyz 🎉

A fun, invite-code–only party planning app for coordinating private family and friends events. Built with Next.js, TypeScript, Tailwind CSS, and Supabase.

## Features

- **Invite-Code Access**: Each party has a unique 10-character code for secure access
- **Guest Join Flow**: Join with just a display name (optional phone number)
- **RSVP Management**: Guests can RSVP as Going / Maybe / Not Going
- **Potluck Coordination**: Create categories and items, guests can claim what they'll bring
- **Real-time Updates**: See who's joined and what's been claimed in real-time
- **Admin Dashboard**: Full control over parties, invites, and guest management
- **Party Gallery**: Admin-only photo uploads for each party
- **Toronto Timezone**: Optimized for EST/EDT
- **Fun & Playful**: Confetti animations and party-themed UI

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui components
- **Backend**: Next.js API Routes, Supabase (PostgreSQL, Auth, Storage, Realtime)
- **Deployment**: Vercel

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase Database

1. Go to your Supabase project dashboard:
   - Project URL: `https://yguecklprymwxuvrkhor.supabase.co`

2. **Run the database schema**:
   - Go to Supabase Dashboard → SQL Editor
   - Copy the entire contents of `supabase/schema.sql`
   - Paste and execute the SQL

   This will create:
   - All database tables (parties, guests, rsvps, potluck_*, media, etc.)
   - Row Level Security (RLS) policies
   - Indexes for performance
   - Storage bucket for party images
   - Required functions and triggers

### 3. Environment Variables

Your `.env.local` file is already configured with Supabase credentials.

### 4. Enable Supabase Auth (Email/Password)

1. Go to Supabase Dashboard → Authentication → Providers
2. Enable "Email" provider
3. (Optional) Disable email confirmation for easier testing:
   - Go to Authentication → Settings
   - Turn off "Enable email confirmations"

### 5. Create Your Admin Account

Go to Supabase Dashboard → Authentication → Users → "Add user" → Create your admin account.

### 6. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
onlypartyz/
├── app/
│   ├── api/                    # API route handlers
│   │   ├── party/             # Guest-facing party APIs
│   │   └── admin/             # Admin-only APIs
│   ├── join/                  # Guest join flow (TODO)
│   ├── party/                 # Party page (TODO)
│   ├── admin/                 # Admin dashboard (TODO)
│   ├── page.tsx               # Landing page ✅
│   └── globals.css            # Global styles
├── components/ui/             # UI components
├── lib/                       # Utilities and types
├── supabase/schema.sql        # Database schema
└── public/                    # Static assets
```

## Current Progress

### ✅ Completed

1. Project setup with Next.js, TypeScript, Tailwind CSS
2. Supabase client configuration
3. Complete database schema with RLS policies
4. TypeScript types for all database entities
5. API routes for party operations
6. UI component library (Button, Input, Card)
7. Landing page with party code input

### 🚧 TODO (Next Steps)

1. Guest join flow and party page
2. Admin login and dashboard
3. Potluck UI with categories and claims
4. Realtime updates
5. Party gallery
6. Terms & Privacy pages

## Database Schema

- **parties**: Core party information
- **invite_codes**: One active code per party
- **guests**: Anyone who joins with a code
- **rsvps**: Guest RSVP status
- **potluck_categories**: Organizes potluck items
- **potluck_items**: Food/drink items to bring
- **potluck_claims**: Guest claims (one per guest per party)
- **media**: Party gallery images

## Security

- Row Level Security (RLS) enforced on all tables
- Admin routes check Supabase auth
- Guest routes validate party_id and guest_id
- Server-side validation for all operations

## Deployment

Deploy to Vercel:
1. Push code to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy!

---

Built with ❤️ for OnlyPartyz
