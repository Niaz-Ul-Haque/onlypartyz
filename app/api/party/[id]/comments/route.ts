import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { sanitizeInput } from '@/lib/utils'
import { CreateCommentRequest } from '@/lib/types/database'

// GET /api/party/[id]/comments - Fetch all comments for a party
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = createAdminClient()

    // Verify party exists
    const { data: party } = await supabase
      .from('parties')
      .select('id')
      .eq('id', id)
      .single()

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      )
    }

    // Fetch all comments for this party, ordered by creation date
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .eq('party_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching comments:', error)
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comments: comments || [] })
  } catch (error) {
    console.error('Error in GET /api/party/[id]/comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/party/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body: CreateCommentRequest = await request.json()
    const { message, guestId, authorName, isAdmin = false } = body

    // Validate message
    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      )
    }

    if (message.length > 1000) {
      return NextResponse.json(
        { error: 'Message is too long (max 1000 characters)' },
        { status: 400 }
      )
    }

    // Validate author name
    if (!authorName || authorName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Author name is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Verify party exists
    const { data: party } = await supabase
      .from('parties')
      .select('id')
      .eq('id', id)
      .single()

    if (!party) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      )
    }

    // Create the comment
    const { data: comment, error } = await supabase
      .from('comments')
      .insert({
        party_id: id,
        guest_id: guestId || null,
        author_name: sanitizeInput(authorName),
        is_admin: isAdmin,
        message: sanitizeInput(message),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating comment:', error)
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      )
    }

    return NextResponse.json({ comment })
  } catch (error) {
    console.error('Error in POST /api/party/[id]/comments:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
