import { createClient } from '@/lib/supabase/client'

export interface VideoScene {
  id: string
  order_index: number
  scene_type: 'intro' | 'user_clip' | 'overlay' | 'outro'
  start_ms?: number
  end_ms?: number
  overlay_text?: {
    text?: string
    x: number
    y: number
    style: {
      family: string
      size: number
      color: string
      bold: boolean
      italic: boolean
    }
  }
}

export interface UserClip {
  id: string
  file_path: string
  duration_ms: number
  station_id: string
  timestamp: string
}

export interface RenderJob {
  id: string
  event_id: string
  team_id: string
  video_template_id: string
  user_clips: UserClip[]
  status: 'pending' | 'processing' | 'completed' | 'failed'
  progress: number
  output_path?: string
  error_message?: string
  created_at: string
  updated_at: string
}

export interface FFmpegCommand {
  inputs: string[]
  filters: string[]
  output: string
}

export class VideoRenderer {
  private supabase = createClient()
  
  constructor() {}

  /**
   * Create a new render job for a team's hunt completion video
   */
  async createRenderJob(
    eventId: string,
    teamId: string,
    videoTemplateId: string,
    userClips: UserClip[]
  ): Promise<string> {
    try {
      const { data: job, error } = await this.supabase
        .from('render_jobs')
        .insert({
          event_id: eventId,
          team_id: teamId,
          video_template_id: videoTemplateId,
          user_clips: userClips,
          status: 'pending',
          progress: 0
        })
        .select()
        .single()

      if (error) throw error

      // Trigger render process (in production, this would be a queue/worker)
      this.processRenderJob(job.id)

      return job.id
    } catch (error) {
      console.error('Error creating render job:', error)
      throw error
    }
  }

  /**
   * Process a render job by generating the final video
   */
  async processRenderJob(jobId: string): Promise<void> {
    try {
      // Update status to processing
      await this.updateJobStatus(jobId, 'processing', 0)

      // Load job details
      const job = await this.loadRenderJob(jobId)
      if (!job) throw new Error('Render job not found')

      // Load video template and scenes
      const template = await this.loadVideoTemplate(job.video_template_id)
      const scenes = await this.loadVideoScenes(job.video_template_id)

      // Generate FFmpeg command
      const command = await this.generateFFmpegCommand(job, template, scenes)

      // Execute rendering (this would run on a worker server in production)
      const outputPath = await this.executeFFmpegCommand(jobId, command)

      // Update job as completed
      await this.updateJobStatus(jobId, 'completed', 100, outputPath)

    } catch (error) {
      console.error('Error processing render job:', error)
      await this.updateJobStatus(jobId, 'failed', 0, undefined, error instanceof Error ? error.message : 'Unknown error')
    }
  }

  /**
   * Generate FFmpeg command for video composition
   */
  async generateFFmpegCommand(
    job: RenderJob,
    template: any,
    scenes: VideoScene[]
  ): Promise<FFmpegCommand> {
    const inputs: string[] = []
    const filters: string[] = []
    let videoIndex = 0

    // Add template video as first input
    if (template.storage_path) {
      inputs.push(await this.getSignedUrl(template.storage_path))
    }

    // Sort scenes by order
    const sortedScenes = scenes.sort((a, b) => a.order_index - b.order_index)
    
    // Process each scene
    for (const scene of sortedScenes) {
      switch (scene.scene_type) {
        case 'intro':
          await this.processIntroScene(scene, template, inputs, filters, videoIndex)
          break
          
        case 'user_clip':
          await this.processUserClipScene(scene, job.user_clips, inputs, filters, videoIndex)
          videoIndex++
          break
          
        case 'overlay':
          await this.processOverlayScene(scene, inputs, filters, videoIndex)
          break
          
        case 'outro':
          await this.processOutroScene(scene, template, inputs, filters, videoIndex)
          break
      }
    }

    // Final concatenation filter
    const sceneCount = sortedScenes.length
    if (sceneCount > 1) {
      const concatInputs = Array.from({ length: sceneCount }, (_, i) => `[v${i}][a${i}]`).join('')
      filters.push(`${concatInputs}concat=n=${sceneCount}:v=1:a=1[outv][outa]`)
    }

    const outputPath = `renders/${job.id}/final_video.mp4`
    
    return {
      inputs,
      filters,
      output: outputPath
    }
  }

  /**
   * Process intro scene
   */
  private async processIntroScene(
    scene: VideoScene,
    template: any,
    inputs: string[],
    filters: string[],
    index: number
  ): Promise<void> {
    const startMs = scene.start_ms || 0
    const endMs = scene.end_ms || 5000
    const duration = (endMs - startMs) / 1000

    // Extract intro segment from template
    filters.push(
      `[0:v]trim=start=${startMs/1000}:duration=${duration},setpts=PTS-STARTPTS[v${index}]`,
      `[0:a]atrim=start=${startMs/1000}:duration=${duration},asetpts=PTS-STARTPTS[a${index}]`
    )
  }

  /**
   * Process user clip scene
   */
  private async processUserClipScene(
    scene: VideoScene,
    userClips: UserClip[],
    inputs: string[],
    filters: string[],
    index: number
  ): Promise<void> {
    // Find matching user clip (this is simplified - in reality you'd match by station/order)
    const userClip = userClips[0] // Take first clip for now
    if (userClip) {
      // Add user clip as input
      const clipUrl = await this.getSignedUrl(userClip.file_path)
      inputs.push(clipUrl)
      
      const inputIndex = inputs.length - 1
      
      // Scale and prepare user clip
      filters.push(
        `[${inputIndex}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS[v${index}]`,
        `[${inputIndex}:a]asetpts=PTS-STARTPTS[a${index}]`
      )
    } else {
      // No user clip available, use placeholder
      filters.push(
        `color=c=black:s=1920x1080:d=3[v${index}]`,
        `anullsrc=channel_layout=stereo:sample_rate=44100[a${index}]`
      )
    }
  }

  /**
   * Process overlay scene with text
   */
  private async processOverlayScene(
    scene: VideoScene,
    inputs: string[],
    filters: string[],
    index: number
  ): Promise<void> {
    const startMs = scene.start_ms || 0
    const endMs = scene.end_ms || 3000
    const duration = (endMs - startMs) / 1000

    let videoFilter = `[0:v]trim=start=${startMs/1000}:duration=${duration},setpts=PTS-STARTPTS`
    
    // Add text overlay if specified
    if (scene.overlay_text?.text) {
      const text = scene.overlay_text.text.replace(/'/g, "\\'")
      const x = (scene.overlay_text.x / 100) * 1920
      const y = (scene.overlay_text.y / 100) * 1080
      const fontSize = scene.overlay_text.style.size
      const fontColor = scene.overlay_text.style.color
      const fontWeight = scene.overlay_text.style.bold ? 'bold' : 'normal'
      
      videoFilter += `,drawtext=text='${text}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${fontColor}:font='Arial'`
    }
    
    videoFilter += `[v${index}]`
    filters.push(videoFilter)
    
    filters.push(
      `[0:a]atrim=start=${startMs/1000}:duration=${duration},asetpts=PTS-STARTPTS[a${index}]`
    )
  }

  /**
   * Process outro scene
   */
  private async processOutroScene(
    scene: VideoScene,
    template: any,
    inputs: string[],
    filters: string[],
    index: number
  ): Promise<void> {
    const startMs = scene.start_ms || 0
    const endMs = scene.end_ms || 5000
    const duration = (endMs - startMs) / 1000

    // Extract outro segment from template
    filters.push(
      `[0:v]trim=start=${startMs/1000}:duration=${duration},setpts=PTS-STARTPTS[v${index}]`,
      `[0:a]atrim=start=${startMs/1000}:duration=${duration},asetpts=PTS-STARTPTS[a${index}]`
    )
  }

  /**
   * Execute FFmpeg command (mock implementation)
   * In production, this would run on a worker server with actual FFmpeg
   */
  private async executeFFmpegCommand(jobId: string, command: FFmpegCommand): Promise<string> {
    // Simulate FFmpeg processing with progress updates
    for (let progress = 10; progress <= 90; progress += 10) {
      await new Promise(resolve => setTimeout(resolve, 500)) // Simulate processing time
      await this.updateJobStatus(jobId, 'processing', progress)
    }

    // Generate output path
    const outputPath = `renders/${jobId}/final_video.mp4`
    
    // In production, this would:
    // 1. Run actual FFmpeg with the generated command
    // 2. Upload result to Supabase Storage
    // 3. Return the storage path
    
    console.log('FFmpeg Command:', {
      inputs: command.inputs,
      filters: command.filters,
      output: command.output
    })

    return outputPath
  }

  /**
   * Load render job from database
   */
  private async loadRenderJob(jobId: string): Promise<RenderJob | null> {
    try {
      const { data: job, error } = await this.supabase
        .from('render_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (error) throw error
      return job
    } catch (error) {
      console.error('Error loading render job:', error)
      return null
    }
  }

  /**
   * Load video template data
   */
  private async loadVideoTemplate(templateId: string): Promise<unknown> {
    try {
      const { data: template, error } = await this.supabase
        .from('media_assets')
        .select('*')
        .eq('id', templateId)
        .eq('kind', 'video')
        .single()

      if (error) throw error
      return template
    } catch (error) {
      console.error('Error loading video template:', error)
      throw error
    }
  }

  /**
   * Load video scenes for template
   */
  private async loadVideoScenes(templateId: string): Promise<VideoScene[]> {
    try {
      const { data: scenes, error } = await this.supabase
        .from('video_template_scenes')
        .select('*')
        .eq('template_asset_id', templateId)
        .order('order_index')

      if (error) throw error
      return scenes || []
    } catch (error) {
      console.error('Error loading video scenes:', error)
      return []
    }
  }

  /**
   * Update render job status
   */
  private async updateJobStatus(
    jobId: string,
    status: RenderJob['status'],
    progress: number,
    outputPath?: string,
    errorMessage?: string
  ): Promise<void> {
    try {
      const updates: Record<string, unknown> = {
        status,
        progress,
        updated_at: new Date().toISOString()
      }

      if (outputPath) updates.output_path = outputPath
      if (errorMessage) updates.error_message = errorMessage

      const { error } = await this.supabase
        .from('render_jobs')
        .update(updates)
        .eq('id', jobId)

      if (error) throw error
    } catch (error) {
      console.error('Error updating job status:', error)
    }
  }

  /**
   * Get signed URL for accessing stored files
   */
  private async getSignedUrl(storagePath: string): Promise<string> {
    try {
      const { data, error } = await this.supabase.storage
        .from('user-uploads')
        .createSignedUrl(storagePath, 3600) // 1 hour expiry

      if (error) throw error
      return data.signedUrl
    } catch (error) {
      console.error('Error creating signed URL:', error)
      throw error
    }
  }

  /**
   * Get render job status
   */
  async getRenderJobStatus(jobId: string): Promise<RenderJob | null> {
    return this.loadRenderJob(jobId)
  }

  /**
   * Cancel a pending render job
   */
  async cancelRenderJob(jobId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('render_jobs')
        .update({
          status: 'failed',
          error_message: 'Cancelled by user',
          updated_at: new Date().toISOString()
        })
        .eq('id', jobId)
        .eq('status', 'pending')

      if (error) throw error
    } catch (error) {
      console.error('Error cancelling render job:', error)
      throw error
    }
  }

  /**
   * Get render jobs for an event
   */
  async getEventRenderJobs(eventId: string): Promise<RenderJob[]> {
    try {
      const { data: jobs, error } = await this.supabase
        .from('render_jobs')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return jobs || []
    } catch (error) {
      console.error('Error loading event render jobs:', error)
      return []
    }
  }
}