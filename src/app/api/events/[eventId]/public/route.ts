import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const resolvedParams = await params
    const eventId = resolvedParams.eventId
    const adminSupabase = createAdminClient()

    // Get public quest information (no auth required for active quests)
    const { data: quest, error: questError } = await adminSupabase
      .from('events')
      .select('id, child_name, status, model_id, created_at')
      .eq('id', eventId)
      .eq('status', 'active') // Only return active quests
      .single()

    if (questError || !quest) {
      return NextResponse.json(
        { error: 'Quest not found or not active' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      quest: {
        id: quest.id,
        name: quest.child_name,
        status: quest.status,
        modelId: quest.model_id,
        createdAt: quest.created_at
      }
    })

  } catch (error) {
    console.error('Public quest access error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}