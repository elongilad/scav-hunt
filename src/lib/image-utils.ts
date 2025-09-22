// Image optimization utilities

export function generateBlurDataURL(width: number = 8, height: number = 8): string {
  // Generate a simple base64 encoded 1x1 pixel placeholder
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // Create a subtle gradient matching the spy theme
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#1a1a1a')
  gradient.addColorStop(1, '#2d2d2d')

  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  return canvas.toDataURL('image/jpeg', 0.1)
}

// Common responsive image sizes for the spy hunt app
export const imageSizes = {
  // Hero images
  hero: '(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px',

  // Card thumbnails
  card: '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px',

  // Profile/avatar images
  avatar: '(max-width: 768px) 80px, 120px',

  // Full width images
  fullWidth: '100vw',

  // Gallery images
  gallery: '(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 300px',
}

// Image quality settings
export const imageQuality = {
  thumbnail: 75,
  standard: 85,
  high: 95,
  hero: 90,
} as const

// Generate optimized image props
export function getOptimizedImageProps(
  src: string,
  alt: string,
  type: keyof typeof imageSizes = 'standard',
  quality: keyof typeof imageQuality = 'standard'
) {
  return {
    src,
    alt,
    sizes: imageSizes[type],
    quality: imageQuality[quality],
    placeholder: 'blur' as const,
    blurDataURL: createSimpleBlurDataURL(),
  }
}

// Simple blur data URL for SSR compatibility
export function createSimpleBlurDataURL(): string {
  return 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAYEBQYFBAYGBQYHBwYIChAKCgkJChQODwwQFxQYGBcUFhYaHSUfGhsjHBYWICwgIyYnKSopGR8tMC0oMCUoKSj/2wBDAQcHBwoIChMKChMoGhYaKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCgoKCj/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABAUGIWGRkrHR4f/EABUBAQEAAAAAAAAAAAAAAAAAAAMF/8QAGhEAAgIDAAAAAAAAAAAAAAAAAAECEgMRkf/aAAwDAQACEQMRAD8AltJagyeH0AthI5xdrLcNM91BF5pX2HaH9bcfaSXWGaRmknyJckliyjqTzSlT54b6bk+h0R//2Q=='
}