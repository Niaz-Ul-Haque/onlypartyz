import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { UpdatePartyRequest } from '@/lib/types/database'

export async function PATCH(
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
    const { data: existingParty } = await supabase
      .from('parties')
      .select('created_by')
      .eq('id', id)
      .single()

    if (!existingParty || existingParty.created_by !== user.id) {
      return NextResponse.json(
        { error: 'Party not found or unauthorized' },
        { status: 404 }
      )
    }

    const body: UpdatePartyRequest = await request.json()

    const { data: party, error: updateError } = await supabase
      .from('parties')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating party:', updateError)
      return NextResponse.json(
        { error: 'Failed to update party' },
        { status: 500 }
      )
    }

    return NextResponse.json({ party })
  } catch (error) {
    console.error('Error in PATCH /api/admin/party/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(
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

    // Verify and delete
    const { error: deleteError } = await supabase
      .from('parties')
      .delete()
      .eq('id', id)
      .eq('created_by', user.id)

    if (deleteError) {
      console.error('Error deleting party:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete party' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/admin/party/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
