import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const guestId = request.headers.get('x-guest-id')

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest authentication required' },
        { status: 401 }
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

    // Delete the selection
    const { error: deleteError } = await supabase
      .from('potluck_selections')
      .delete()
      .eq('party_id', id)
      .eq('guest_id', guestId)

    if (deleteError) {
      console.error('Error deleting selection:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove selection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing selection:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
