import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'
import { validateInviteCode } from '@/lib/invite-code'
import { ResolveCodeRequest, ResolveCodeResponse } from '@/lib/types/database'

export async function POST(request: NextRequest) {
  try {
    const body: ResolveCodeRequest = await request.json()
    const { code } = body

    if (!code || !validateInviteCode(code.toUpperCase())) {
      return NextResponse.json(
        { error: 'Invalid invite code format' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Find the invite code
    const { data: inviteCode, error: codeError } = await supabase
      .from('invite_codes')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (codeError || !inviteCode) {
      return NextResponse.json(
        { error: 'Party not found' },
        { status: 404 }
      )
    }

    // Check if code is active and not expired
    if (!inviteCode.is_active) {
      return NextResponse.json(
        { error: 'This invite code has been deactivated' },
        { status: 410 }
      )
    }

    if (inviteCode.expires_at && new Date(inviteCode.expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'This invite code has expired' },
        { status: 410 }
      )
    }

    if (inviteCode.max_uses && inviteCode.uses >= inviteCode.max_uses) {
      return NextResponse.json(
        { error: 'This invite code has reached its maximum uses' },
        { status: 410 }
      )
    }

    // Get the party details
    const { data: party, error: partyError } = await supabase
      .from('parties')
      .select('*')
      .eq('id', inviteCode.party_id)
      .eq('is_archived', false)
      .single()

    if (partyError || !party) {
      return NextResponse.json(
        { error: 'Party not found or has been archived' },
        { status: 404 }
      )
    }

    const response: ResolveCodeResponse = {
      party,
      inviteCode,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('Error resolving code:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
