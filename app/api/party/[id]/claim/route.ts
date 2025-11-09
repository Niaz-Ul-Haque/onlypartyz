import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { ClaimItemRequest } from '@/lib/types/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: ClaimItemRequest = await request.json()
    const { itemId, qty = 1, note } = body

    const guestId = request.headers.get('x-guest-id')

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest authentication required' },
        { status: 401 }
      )
    }

    if (!itemId) {
      return NextResponse.json(
        { error: 'Item ID is required' },
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

    // Verify item belongs to this party
    const { data: item } = await supabase
      .from('potluck_items')
      .select('*')
      .eq('id', itemId)
      .eq('party_id', id)
      .single()

    if (!item) {
      return NextResponse.json(
        { error: 'Item not found' },
        { status: 404 }
      )
    }

    // Check if guest already has a claim for this party
    const { data: existingClaim } = await supabase
      .from('potluck_claims')
      .select('*')
      .eq('party_id', id)
      .eq('guest_id', guestId)
      .maybeSingle()

    if (existingClaim) {
      // If claiming the same item, just update the quantity/note
      if (existingClaim.item_id === itemId) {
        const { data: updated, error: updateError } = await supabase
          .from('potluck_claims')
          .update({
            qty: qty || 1,
            note: note || null,
          })
          .eq('id', existingClaim.id)
          .select()
          .single()

        if (updateError) {
          console.error('Error updating claim:', updateError)
          return NextResponse.json(
            { error: 'Failed to update claim' },
            { status: 500 }
          )
        }

        return NextResponse.json({ claim: updated })
      } else {
        // Delete old claim and create new one
        await supabase
          .from('potluck_claims')
          .delete()
          .eq('id', existingClaim.id)
      }
    }

    // Create new claim
    const { data: claim, error: claimError } = await supabase
      .from('potluck_claims')
      .insert({
        party_id: id,
        item_id: itemId,
        guest_id: guestId,
        qty: qty || 1,
        note: note || null,
      })
      .select()
      .single()

    if (claimError) {
      console.error('Error creating claim:', claimError)
      return NextResponse.json(
        { error: 'Failed to claim item' },
        { status: 500 }
      )
    }

    return NextResponse.json({ claim })
  } catch (error) {
    console.error('Error processing claim:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
