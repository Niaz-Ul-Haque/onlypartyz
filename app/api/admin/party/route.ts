import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateInviteCode } from '@/lib/invite-code'
import { CreatePartyRequest } from '@/lib/types/database'

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get all parties for this admin
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select(`
        *,
        invite_codes(*)
      `)
      .eq('created_by', user.id)
      .order('starts_at', { ascending: false })

    if (partiesError) {
      console.error('Error fetching parties:', partiesError)
      return NextResponse.json(
        { error: 'Failed to fetch parties' },
        { status: 500 }
      )
    }

    // Fetch guest counts for each party
    const partiesWithGuestCounts = await Promise.all(
      (parties || []).map(async (party) => {
        const { data: guests, error: guestsError } = await supabase
          .from('guests')
          .select('party_size')
          .eq('party_id', party.id)

        if (guestsError) {
          console.error(`Error fetching guests for party ${party.id}:`, guestsError)
          return {
            ...party,
            guest_count: 0,
            total_headcount: 0,
          }
        }

        const guestCount = guests?.length || 0
        const totalHeadcount = guests?.reduce((sum, guest) => sum + (guest.party_size || 1), 0) || 0

        return {
          ...party,
          guest_count: guestCount,
          total_headcount: totalHeadcount,
        }
      })
    )

    return NextResponse.json({ parties: partiesWithGuestCounts })
  } catch (error) {
    console.error('Error in GET /api/admin/party:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body: CreatePartyRequest = await request.json()
    const {
      title,
      description,
      starts_at,
      ends_at,
      location_address,
      location_map_iframe,
      cover_image_url,
      is_potluck,
      rsvp_deadline,
      max_capacity,
      dress_code,
      party_type,
      special_instructions,
    } = body

    if (!title || !starts_at) {
      return NextResponse.json(
        { error: 'Title and start date are required' },
        { status: 400 }
      )
    }

    // Create party
    const { data: party, error: partyError } = await supabase
      .from('parties')
      .insert({
        title,
        description: description || null,
        starts_at,
        ends_at: ends_at || null,
        location_address: location_address || null,
        location_map_iframe: location_map_iframe || null,
        cover_image_url: cover_image_url || null,
        is_potluck: is_potluck || false,
        rsvp_deadline: rsvp_deadline || null,
        max_capacity: max_capacity || null,
        dress_code: dress_code || null,
        party_type: party_type || null,
        special_instructions: special_instructions || null,
        created_by: user.id,
        timezone: 'America/Toronto',
      })
      .select()
      .single()

    if (partyError) {
      console.error('Error creating party:', partyError)
      return NextResponse.json(
        { error: 'Failed to create party' },
        { status: 500 }
      )
    }

    // Generate invite code
    const code = generateInviteCode()
    const { data: inviteCode, error: codeError } = await supabase
      .from('invite_codes')
      .insert({
        party_id: party.id,
        code,
        is_active: true,
      })
      .select()
      .single()

    if (codeError) {
      console.error('Error creating invite code:', codeError)
      // Rollback party creation
      await supabase.from('parties').delete().eq('id', party.id)
      return NextResponse.json(
        { error: 'Failed to generate invite code' },
        { status: 500 }
      )
    }

    return NextResponse.json({ party, inviteCode })
  } catch (error) {
    console.error('Error in POST /api/admin/party:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
