import { cn } from '@/lib/utils'
import { Camera, Image as ImageIcon, User, Video } from 'lucide-react'

interface ImagePlaceholderProps {
  type?: 'avatar' | 'photo' | 'video' | 'general'
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape'
}

export function ImagePlaceholder({
  type = 'general',
  size = 'md',
  className,
  aspectRatio = 'square'
}: ImagePlaceholderProps) {
  const sizeClasses = {
    sm: 'w-16 h-16',
    md: 'w-24 h-24',
    lg: 'w-32 h-32',
    xl: 'w-48 h-48'
  }

  const aspectClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]'
  }

  const iconSize = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const icons = {
    avatar: User,
    photo: Camera,
    video: Video,
    general: ImageIcon
  }

  const Icon = icons[type]

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-spy-gold/10 to-spy-dark/20 rounded-lg flex items-center justify-center border border-white/10',
        aspectRatio === 'square' ? sizeClasses[size] : aspectClasses[aspectRatio],
        className
      )}
    >
      <Icon className={cn('text-spy-gold/60', iconSize[size])} />
    </div>
  )
}

interface TeamEmblemPlaceholderProps {
  teamName: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
}

export function TeamEmblemPlaceholder({
  teamName,
  color = 'spy-gold',
  size = 'md'
}: TeamEmblemPlaceholderProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-12 h-12 text-sm',
    lg: 'w-16 h-16 text-base'
  }

  const initials = teamName
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-bold text-black bg-spy-gold',
        sizeClasses[size]
      )}
    >
      {initials}
    </div>
  )
}