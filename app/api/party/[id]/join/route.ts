import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sanitizeInput } from '@/lib/utils'
import { JoinPartyRequest, JoinPartyResponse } from '@/lib/types/database'
import { nanoid } from 'nanoid'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: JoinPartyRequest = await request.json()
    const { displayName, phone, partySize, deviceFingerprint } = body

    if (!displayName || displayName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Display name is required' },
        { status: 400 }
      )
    }

    if (displayName.length > 50) {
      return NextResponse.json(
        { error: 'Display name is too long (max 50 characters)' },
        { status: 400 }
      )
    }

    const partySizeValue = partySize || 1
    if (partySizeValue < 1 || partySizeValue > 20) {
      return NextResponse.json(
        { error: 'Party size must be between 1 and 20' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify party exists and is not archived
    const { data: party } = await supabase
      .from('parties')
      .select('id, is_archived')
      .eq('id', id)
      .single()

    if (!party || party.is_archived) {
      return NextResponse.json(
        { error: 'Party not found or has been archived' },
        { status: 404 }
      )
    }

    // Always create a new guest (allow multiple joins with same name)
    const { data: newGuest, error: guestError } = await supabase
      .from('guests')
      .insert({
        party_id: id,
        display_name: sanitizeInput(displayName),
        phone: phone || null,
        party_size: partySizeValue,
        device_fingerprint: deviceFingerprint || null,
      })
      .select()
      .single()

    if (guestError) {
      console.error('Error creating guest:', guestError)
      return NextResponse.json(
        { error: 'Failed to join party' },
        { status: 500 }
      )
    }

    const guest = newGuest

    // Increment invite code uses
    await supabase.rpc('increment_invite_code_uses', { party_id_param: id })

    // Generate a simple guest token (in production, use JWT)
    const token = nanoid(32)

    const response: JoinPartyResponse = {
      guest,
      token,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error joining party:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
