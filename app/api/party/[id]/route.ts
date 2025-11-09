import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Get party details
    const { data: party, error: partyError } = await supabase
      .from('parties')
      .select('*')
      .eq('id', id)
      .eq('is_archived', false)
      .single()

    if (partyError || !party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      )
    }

    // Get guests with RSVPs
    const { data: guests } = await supabase
      .from('guests')
      .select(`
        *,
        rsvp:rsvps(*)
      `)
      .eq('party_id', id)
      .order('created_at', { ascending: true })

    // Get RSVP counts
    const { data: rsvps } = await supabase
      .from('rsvps')
      .select('status')
      .eq('party_id', id)

    const rsvpCounts = {
      going: rsvps?.filter(r => r.status === 'going').length || 0,
      maybe: rsvps?.filter(r => r.status === 'maybe').length || 0,
      not_going: rsvps?.filter(r => r.status === 'not_going').length || 0,
    }

    // Get potluck data if enabled (new simplified structure)
    let potluckData = null
    if (party.is_potluck) {
      const { data: itemTypes } = await supabase
        .from('potluck_capacity_stats')
        .select('*')
        .eq('party_id', id)
        .order('sort_order', { ascending: true })

      // Get selections with guest info
      const { data: selections } = await supabase
        .from('potluck_selections')
        .select(`
          *,
          guest:guests(*),
          item_type:potluck_item_types(*)
        `)
        .eq('party_id', id)

      // Map selections to item types
      if (itemTypes && selections) {
        potluckData = itemTypes.map((type: any) => ({
          ...type,
          selections: selections.filter((s: any) => s.item_type_id === type.item_type_id),
        }))
      } else {
        potluckData = itemTypes
      }
    }

    // Get media
    const { data: media } = await supabase
      .from('media')
      .select('*')
      .eq('party_id', id)
      .order('created_at', { ascending: false })

    // Get invite code
    const { data: inviteCode } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('party_id', id)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    return NextResponse.json({
      party,
      guests: guests || [],
      rsvpCounts,
      potluck: potluckData,
      media: media || [],
      inviteCode: inviteCode || null,
    })
  } catch (error) {
    console.error('Error fetching party:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
