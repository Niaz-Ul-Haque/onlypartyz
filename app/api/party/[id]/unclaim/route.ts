import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { UnclaimItemRequest } from '@/lib/types/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: UnclaimItemRequest = await request.json()
    const { claimId } = body

    const guestId = request.headers.get('x-guest-id')

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest authentication required' },
        { status: 401 }
      )
    }

    if (!claimId) {
      return NextResponse.json(
        { error: 'Claim ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify claim belongs to this guest and party
    const { data: claim } = await supabase
      .from('potluck_claims')
      .select('*')
      .eq('id', claimId)
      .eq('party_id', id)
      .eq('guest_id', guestId)
      .single()

    if (!claim) {
      return NextResponse.json(
        { error: 'Claim not found' },
        { status: 404 }
      )
    }

    // Delete the claim
    const { error: deleteError } = await supabase
      .from('potluck_claims')
      .delete()
      .eq('id', claimId)

    if (deleteError) {
      console.error('Error deleting claim:', deleteError)
      return NextResponse.json(
        { error: 'Failed to unclaim item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error processing unclaim:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
