/**
 * Video Rendering Worker
 * Handles server-side video processing with FFmpeg
 * This would typically run on a separate worker server or serverless function
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { createClient } from '@supabase/supabase-js'

// const execAsync = promisify(exec) // Currently unused

interface WorkerConfig {
  supabaseUrl: string
  supabaseServiceKey: string
  ffmpegPath?: string
  tempDir?: string
  outputDir?: string
}

export class VideoRenderingWorker {
  private supabase
  private config: WorkerConfig
  private ffmpegPath: string
  private tempDir: string
  private outputDir: string

  constructor(config: WorkerConfig) {
    this.config = config
    this.supabase = createClient(config.supabaseUrl, config.supabaseServiceKey)
    this.ffmpegPath = config.ffmpegPath || 'ffmpeg'
    this.tempDir = config.tempDir || '/tmp/video-renders'
    this.outputDir = config.outputDir || '/tmp/output'
  }

  /**
   * Start the worker to listen for pending render jobs
   */
  async start(): Promise<void> {
    console.log('Video rendering worker starting...')
    
    // Ensure directories exist
    await this.ensureDirectories()
    
    // Start polling for jobs (in production, use a proper queue system)
    this.pollForJobs()
  }

  /**
   * Poll database for pending render jobs
   */
  private async pollForJobs(): Promise<void> {
    while (true) {
      try {
        // Get pending jobs
        const { data: jobs, error } = await this.supabase
          .from('render_jobs')
          .select('*')
          .eq('status', 'pending')
          .order('created_at', { ascending: true })
          .limit(5)

        if (error) {
          console.error('Error fetching jobs:', error)
        } else if (jobs && jobs.length > 0) {
          // Process jobs concurrently (limit concurrency in production)
          await Promise.all(jobs.map(job => this.processJob(job)))
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, 5000))
        
      } catch (error) {
        console.error('Error in job polling:', error)
        await new Promise(resolve => setTimeout(resolve, 10000))
      }
    }
  }

  /**
   * Process a single render job
   */
  private async processJob(job: Record<string, unknown>): Promise<void> {
    const jobId = job.id
    console.log(`Processing job ${jobId}`)

    try {
      // Update status to processing
      await this.updateJobStatus(jobId, 'processing', 0)

      // Create job workspace
      const workspaceDir = path.join(this.tempDir, jobId)
      await fs.mkdir(workspaceDir, { recursive: true })

      // Download required files
      await this.downloadJobFiles(job, workspaceDir)

      // Generate FFmpeg command
      const command = await this.generateFFmpegCommand(job, workspaceDir)

      // Execute FFmpeg
      const outputPath = await this.executeFFmpeg(jobId, command, workspaceDir)

      // Upload result
      const finalPath = await this.uploadResult(jobId, outputPath)

      // Update job as completed
      await this.updateJobStatus(jobId, 'completed', 100, finalPath)

      // Cleanup workspace
      await this.cleanup(workspaceDir)

      console.log(`Job ${jobId} completed successfully`)

    } catch (error) {
      console.error(`Job ${jobId} failed:`, error)
      await this.updateJobStatus(jobId, 'failed', 0, undefined, error.message)
    }
  }

  /**
   * Download all files needed for the job
   */
  private async downloadJobFiles(job: Record<string, unknown>, workspaceDir: string): Promise<void> {
    const downloads: Promise<void>[] = []

    // Download video template
    if (job.video_template_id) {
      const { data: template } = await this.supabase
        .from('media_assets')
        .select('storage_path')
        .eq('id', job.video_template_id)
        .single()

      if (template?.storage_path) {
        downloads.push(this.downloadFile(template.storage_path, path.join(workspaceDir, 'template.mp4')))
      }
    }

    // Download user clips
    if (job.user_clips && Array.isArray(job.user_clips)) {
      job.user_clips.forEach((clip: Record<string, unknown>, index: number) => {
        downloads.push(this.downloadFile(clip.file_path, path.join(workspaceDir, `clip_${index}.mp4`)))
      })
    }

    await Promise.all(downloads)
  }

  /**
   * Download a file from Supabase Storage
   */
  private async downloadFile(storagePath: string, localPath: string): Promise<void> {
    try {
      const { data, error } = await this.supabase.storage
        .from('user-uploads')
        .download(storagePath)

      if (error) throw error

      const buffer = await data.arrayBuffer()
      await fs.writeFile(localPath, Buffer.from(buffer))
    } catch (error) {
      console.error(`Error downloading ${storagePath}:`, error)
      throw error
    }
  }

  /**
   * Generate FFmpeg command for the job
   */
  private async generateFFmpegCommand(job: Record<string, unknown>, workspaceDir: string): Promise<string> {
    // Load video scenes
    const { data: scenes } = await this.supabase
      .from('video_template_scenes')
      .select('*')
      .eq('template_asset_id', job.video_template_id)
      .order('order_index')

    if (!scenes || scenes.length === 0) {
      throw new Error('No scenes found for video template')
    }

    const templatePath = path.join(workspaceDir, 'template.mp4')
    const outputPath = path.join(workspaceDir, 'output.mp4')
    
    // Build complex filter for video composition
    const filterComplex = this.buildFilterComplex(scenes, job.user_clips, workspaceDir)
    
    // Generate FFmpeg command
    const command = [
      this.ffmpegPath,
      '-y', // Overwrite output files
      `-i "${templatePath}"`, // Input template video
    ]

    // Add user clip inputs
    if (job.user_clips && Array.isArray(job.user_clips)) {
      job.user_clips.forEach((_: Record<string, unknown>, index: number) => {
        command.push(`-i "${path.join(workspaceDir, `clip_${index}.mp4`)}"`)
      })
    }

    // Add filter complex
    if (filterComplex) {
      command.push(`-filter_complex "${filterComplex}"`)
    }

    // Output settings
    command.push(
      '-map "[outv]"',  // Map final video
      '-map "[outa]"',  // Map final audio
      '-c:v libx264',   // Video codec
      '-c:a aac',       // Audio codec
      '-b:v 2M',        // Video bitrate
      '-b:a 128k',      // Audio bitrate
      '-r 30',          // Frame rate
      '-s 1920x1080',   // Resolution
      `"${outputPath}"`
    )

    return command.join(' ')
  }

  /**
   * Build FFmpeg filter complex for video composition
   */
  private buildFilterComplex(scenes: unknown[], userClips: unknown[], _workspaceDir: string): string {
    const filters: string[] = []
    const videoInputs: string[] = []
    const audioInputs: string[] = []

    scenes.forEach((scene, index) => {
      const startMs = scene.start_ms || 0
      const endMs = scene.end_ms || 5000
      const duration = (endMs - startMs) / 1000

      switch (scene.scene_type) {
        case 'intro':
        case 'outro':
          // Extract segment from template
          filters.push(
            `[0:v]trim=start=${startMs/1000}:duration=${duration},setpts=PTS-STARTPTS[v${index}]`,
            `[0:a]atrim=start=${startMs/1000}:duration=${duration},asetpts=PTS-STARTPTS[a${index}]`
          )
          videoInputs.push(`[v${index}]`)
          audioInputs.push(`[a${index}]`)
          break

        case 'user_clip':
          if (userClips && userClips.length > 0) {
            // Use first available user clip (improve matching logic as needed)
            const clipIndex = 1 // Assuming first user clip is input 1
            filters.push(
              `[${clipIndex}:v]scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setpts=PTS-STARTPTS[v${index}]`,
              `[${clipIndex}:a]asetpts=PTS-STARTPTS[a${index}]`
            )
          } else {
            // Placeholder for missing user clip
            filters.push(
              `color=c=black:s=1920x1080:d=${duration}[v${index}]`,
              `anullsrc=channel_layout=stereo:sample_rate=44100:d=${duration}[a${index}]`
            )
          }
          videoInputs.push(`[v${index}]`)
          audioInputs.push(`[a${index}]`)
          break

        case 'overlay':
          let videoFilter = `[0:v]trim=start=${startMs/1000}:duration=${duration},setpts=PTS-STARTPTS`
          
          // Add text overlay
          if (scene.overlay_text?.text) {
            const text = scene.overlay_text.text.replace(/'/g, "\\'").replace(/"/g, '\\"')
            const x = Math.round((scene.overlay_text.x / 100) * 1920)
            const y = Math.round((scene.overlay_text.y / 100) * 1080)
            const fontSize = scene.overlay_text.style.size || 24
            const fontColor = scene.overlay_text.style.color || '#ffffff'
            
            videoFilter += `,drawtext=text='${text}':x=${x}:y=${y}:fontsize=${fontSize}:fontcolor=${fontColor}:fontfile=/System/Library/Fonts/Arial.ttf`
          }
          
          videoFilter += `[v${index}]`
          filters.push(videoFilter)
          
          filters.push(
            `[0:a]atrim=start=${startMs/1000}:duration=${duration},asetpts=PTS-STARTPTS[a${index}]`
          )
          videoInputs.push(`[v${index}]`)
          audioInputs.push(`[a${index}]`)
          break
      }
    })

    // Final concatenation
    if (videoInputs.length > 1) {
      const concatFilter = videoInputs.concat(audioInputs).join('') + 
                          `concat=n=${videoInputs.length}:v=1:a=1[outv][outa]`
      filters.push(concatFilter)
    } else if (videoInputs.length === 1) {
      filters.push(
        `${videoInputs[0]}copy[outv]`,
        `${audioInputs[0]}copy[outa]`
      )
    }

    return filters.join(';')
  }

  /**
   * Execute FFmpeg command with progress tracking
   */
  private async executeFFmpeg(jobId: string, command: string, workspaceDir: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const outputPath = path.join(workspaceDir, 'output.mp4')
      
      console.log(`Executing FFmpeg for job ${jobId}:`, command)
      
      const child = exec(command, { 
        cwd: workspaceDir,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer
      })

      let lastProgress = 0

      // Parse FFmpeg output for progress
      child.stderr?.on('data', (data) => {
        const output = data.toString()
        
        // Parse time progress from FFmpeg output
        const timeMatch = output.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/)
        if (timeMatch) {
          const hours = parseInt(timeMatch[1])
          const minutes = parseInt(timeMatch[2])
          const seconds = parseInt(timeMatch[3])
          const totalSeconds = hours * 3600 + minutes * 60 + seconds
          
          // Estimate progress based on expected duration (this is rough)
          const estimatedDuration = 60 // seconds - should be calculated from scenes
          const progress = Math.min(95, Math.round((totalSeconds / estimatedDuration) * 100))
          
          if (progress > lastProgress) {
            lastProgress = progress
            this.updateJobStatus(jobId, 'processing', progress)
          }
        }
      })

      child.on('close', (code) => {
        if (code === 0) {
          resolve(outputPath)
        } else {
          reject(new Error(`FFmpeg process exited with code ${code}`))
        }
      })

      child.on('error', (error) => {
        reject(error)
      })
    })
  }

  /**
   * Upload rendered video to Supabase Storage
   */
  private async uploadResult(jobId: string, localPath: string): Promise<string> {
    try {
      const fileName = `${jobId}_final.mp4`
      const storagePath = `renders/${jobId}/${fileName}`
      
      const fileBuffer = await fs.readFile(localPath)

      const { error } = await this.supabase.storage
        .from('user-uploads')
        .upload(storagePath, fileBuffer, {
          contentType: 'video/mp4',
          upsert: true
        })

      if (error) throw error

      return storagePath
    } catch (error) {
      console.error('Error uploading result:', error)
      throw error
    }
  }

  /**
   * Update job status in database
   */
  private async updateJobStatus(
    jobId: string,
    status: string,
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
   * Ensure required directories exist
   */
  private async ensureDirectories(): Promise<void> {
    await fs.mkdir(this.tempDir, { recursive: true })
    await fs.mkdir(this.outputDir, { recursive: true })
  }

  /**
   * Clean up temporary files
   */
  private async cleanup(workspaceDir: string): Promise<void> {
    try {
      await fs.rm(workspaceDir, { recursive: true, force: true })
    } catch (error) {
      console.error('Error cleaning up workspace:', error)
    }
  }
}

// Export worker initialization function
export function createVideoWorker(config: WorkerConfig): VideoRenderingWorker {
  return new VideoRenderingWorker(config)
}

// CLI entry point for running as standalone worker
if (require.main === module) {
  const config: WorkerConfig = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseServiceKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
    ffmpegPath: process.env.FFMPEG_PATH || 'ffmpeg',
    tempDir: process.env.TEMP_DIR || '/tmp/video-renders',
    outputDir: process.env.OUTPUT_DIR || '/tmp/output'
  }

  const worker = createVideoWorker(config)
  worker.start().catch(console.error)
}