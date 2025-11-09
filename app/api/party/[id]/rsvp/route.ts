import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { RsvpRequest } from '@/lib/types/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: RsvpRequest = await request.json()
    const { status } = body

    // Get guest_id from headers or query (set by client after join)
    const guestId = request.headers.get('x-guest-id')

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest authentication required' },
        { status: 401 }
      )
    }

    if (!status || !['going', 'maybe', 'not_going'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid RSVP status' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify guest belongs to this party
    const { data: guest } = await supabase
      .from('guests')
      .select('party_id')
      .eq('id', guestId)
      .eq('party_id', id)
      .single()

    if (!guest) {
      return NextResponse.json(
        { error: 'Guest not found for this party' },
        { status: 404 }
      )
    }

    // Upsert RSVP
    const { data: rsvp, error: rsvpError } = await supabase
      .from('rsvps')
      .upsert({
        party_id: id,
        guest_id: guestId,
        status,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'party_id,guest_id'
      })
      .select()
      .single()

    if (rsvpError) {
      console.error('Error updating RSVP:', rsvpError)
      return NextResponse.json(
        { error: 'Failed to update RSVP' },
        { status: 500 }
      )
    }

    return NextResponse.json({ rsvp })
  } catch (error) {
    console.error('Error processing RSVP:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
