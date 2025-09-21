import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { VideoRenderer } from '@/lib/video/renderer'

export async function POST(request: NextRequest) {
  try {
    const { eventId, teamId, videoTemplateId, userClips } = await request.json()

    // Validate required fields
    if (!eventId || !teamId || !videoTemplateId || !userClips) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Initialize renderer
    const renderer = new VideoRenderer()

    // Create render job
    const jobId = await renderer.createRenderJob(
      eventId,
      teamId,
      videoTemplateId,
      userClips
    )

    return NextResponse.json({
      success: true,
      jobId,
      message: 'Render job created successfully'
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')
    const eventId = searchParams.get('eventId')

    const renderer = new VideoRenderer()

    if (jobId) {
      // Get specific job status
      const job = await renderer.getRenderJobStatus(jobId)
      
      if (!job) {
        return NextResponse.json(
          { error: 'Job not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ job })
    }

    if (eventId) {
      // Get all jobs for an event
      const jobs = await renderer.getEventRenderJobs(eventId)
      return NextResponse.json({ jobs })
    }

    return NextResponse.json(
      { error: 'Missing jobId or eventId parameter' },
      { status: 400 }
    )

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const jobId = searchParams.get('jobId')

    if (!jobId) {
      return NextResponse.json(
        { error: 'Missing jobId parameter' },
        { status: 400 }
      )
    }

    const renderer = new VideoRenderer()
    await renderer.cancelRenderJob(jobId)

    return NextResponse.json({
      success: true,
      message: 'Render job cancelled'
    })

  } catch (error: any) {
    console.error('API Error:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}