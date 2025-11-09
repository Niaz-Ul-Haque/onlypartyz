import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdateItemTypeRequest } from '@/lib/types/database'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const { id, typeId } = await params
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
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const body: UpdateItemTypeRequest = await request.json()

    // If reducing capacity, check if it would cause conflicts
    if (body.capacity !== undefined) {
      const { count } = await supabase
        .from('potluck_selections')
        .select('*', { count: 'exact', head: true })
        .eq('item_type_id', typeId)

      if (count && count > body.capacity) {
        return NextResponse.json(
          { error: `Cannot reduce capacity to ${body.capacity}. ${count} guests have already selected this type. Please have them change their selection first.` },
          { status: 400 }
        )
      }
    }

    const { data: itemType, error } = await supabase
      .from('potluck_item_types')
      .update(body)
      .eq('id', typeId)
      .eq('party_id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating item type:', error)
      return NextResponse.json(
        { error: 'Failed to update item type' },
        { status: 500 }
      )
    }

    return NextResponse.json({ itemType })
  } catch (error) {
    console.error('Error in PATCH /api/admin/party/[id]/item-types/[typeId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; typeId: string }> }
) {
  try {
    const { id, typeId } = await params
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
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    const { error } = await supabase
      .from('potluck_item_types')
      .delete()
      .eq('id', typeId)
      .eq('party_id', id)

    if (error) {
      console.error('Error deleting item type:', error)
      return NextResponse.json(
        { error: 'Failed to delete item type' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/party/[id]/item-types/[typeId]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
