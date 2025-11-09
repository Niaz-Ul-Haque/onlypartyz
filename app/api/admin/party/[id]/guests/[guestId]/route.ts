import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; guestId: string }> }
) {
  try {
    const { id, guestId } = await params
    const supabase = await createClient()

    // Verify admin is authenticated
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify party belongs to this admin
    const { data: party } = await supabase
      .from('parties')
      .select('id')
      .eq('id', id)
      .eq('created_by', user.id)
      .single()

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found or unauthorized' },
        { status: 404 }
      )
    }

    // Delete the guest (cascades to RSVPs and potluck selections)
    const { error: deleteError } = await supabase
      .from('guests')
      .delete()
      .eq('id', guestId)
      .eq('party_id', id)

    if (deleteError) {
      console.error('Error deleting guest:', deleteError)
      return NextResponse.json(
        { error: 'Failed to remove guest' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing guest:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
