import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { CreateItemTypeRequest } from '@/lib/types/database'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify party belongs to this admin
    const { data: party } = await supabase
      .from('parties')
      .select('created_by')
      .eq('id', id)
      .single()

    if (!party || party.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Party not found or unauthorized' },
        { status: 404 }
      )
    }

    // Get item types with stats
    const { data: itemTypes, error } = await supabase
      .from('potluck_capacity_stats')
      .select('*')
      .eq('party_id', id)
      .order('sort_order', { ascending: true })

    if (error) {
      console.error('Error fetching item types:', error)
      return NextResponse.json(
        { error: 'Failed to fetch item types' },
        { status: 500 }
      )
    }

    // Fetch selections with guest data for each item type
    const itemTypesWithSelections = await Promise.all(
      (itemTypes || []).map(async (itemType) => {
        const { data: selections, error: selectionsError } = await supabase
          .from('potluck_selections')
          .select(`
            id,
            note,
            created_at,
            guest:guests (
              id,
              display_name
            )
          `)
          .eq('party_id', id)
          .eq('item_type_id', itemType.item_type_id)

        if (selectionsError) {
          console.error(`Error fetching selections for item type ${itemType.item_type_id}:`, selectionsError)
          return {
            ...itemType,
            selections: []
          }
        }

        return {
          ...itemType,
          selections: selections || []
        }
      })
    )

    return NextResponse.json({ itemTypes: itemTypesWithSelections })
  } catch (error) {
    console.error('Error in GET /api/admin/party/[id]/item-types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Verify party belongs to this admin
    const { data: party } = await supabase
      .from('parties')
      .select('created_by')
      .eq('id', id)
      .single()

    if (!party || party.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Party not found or unauthorized' },
        { status: 404 }
      )
    }

    const body: CreateItemTypeRequest = await request.json()
    const { name, capacity, sort_order = 0 } = body

    if (!name || !capacity || capacity < 1) {
      return NextResponse.json(
        { error: 'Name and capacity (min 1) are required' },
        { status: 400 }
      )
    }

    const { data: itemType, error } = await supabase
      .from('potluck_item_types')
      .insert({
        party_id: id,
        name,
        capacity,
        sort_order,
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating item type:', error)
      return NextResponse.json(
        { error: 'Failed to create item type' },
        { status: 500 }
      )
    }

    return NextResponse.json({ itemType })
  } catch (error) {
    console.error('Error in POST /api/admin/party/[id]/item-types:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
