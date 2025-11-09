import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { SelectItemTypeRequest } from '@/lib/types/database'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: SelectItemTypeRequest = await request.json()
    const { itemTypeId, note } = body

    const guestId = request.headers.get('x-guest-id')

    if (!guestId) {
      return NextResponse.json(
        { error: 'Guest authentication required' },
        { status: 401 }
      )
    }

    if (!itemTypeId) {
      return NextResponse.json(
        { error: 'Item type ID is required' },
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

    // Verify item type belongs to this party
    const { data: itemType } = await supabase
      .from('potluck_item_types')
      .select('*')
      .eq('id', itemTypeId)
      .eq('party_id', id)
      .single()

    if (!itemType) {
      return NextResponse.json(
        { error: 'Item type not found' },
        { status: 404 }
      )
    }

    // Check current capacity (get latest count)
    const { count: currentCount } = await supabase
      .from('potluck_selections')
      .select('*', { count: 'exact', head: true })
      .eq('item_type_id', itemTypeId)

    if (currentCount !== null && currentCount >= itemType.capacity) {
      return NextResponse.json(
        { error: 'This item type just filled up. Please choose another option.' },
        { status: 409 }
      )
    }

    // Upsert selection (replaces existing if any)
    const { data: selection, error: selectionError } = await supabase
      .from('potluck_selections')
      .upsert({
        party_id: id,
        guest_id: guestId,
        item_type_id: itemTypeId,
        note: note || null,
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'party_id,guest_id'
      })
      .select()
      .single()

    if (selectionError) {
      console.error('Error creating selection:', selectionError)

      // Check if it's a capacity error from trigger
      if (selectionError.message?.includes('full') || selectionError.message?.includes('capacity')) {
        return NextResponse.json(
          { error: 'This item type just filled up. Please choose another option.' },
          { status: 409 }
        )
      }

      return NextResponse.json(
        { error: 'Failed to save selection' },
        { status: 500 }
      )
    }

    return NextResponse.json({ selection })
  } catch (error: any) {
    console.error('Error processing selection:', error)

    // Handle capacity errors from database trigger
    if (error?.message?.includes('full') || error?.message?.includes('capacity')) {
      return NextResponse.json(
        { error: 'This item type just filled up. Please choose another option.' },
        { status: 409 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
