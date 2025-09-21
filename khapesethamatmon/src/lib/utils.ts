import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(cents: number, currency: string = 'ILS') {
  return new Intl.NumberFormat('he-IL', {
    style: 'currency',
    currency,
  }).format(cents / 100)
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('he-IL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date))
}

export function generateTeamPasswords(count: number): string[] {
  const passwords = []
  for (let i = 1; i <= count; i++) {
    passwords.push(i.toString().padStart(4, '0'))
  }
  return passwords
}

export function generateTeamNames(count: number, locale: string = 'he'): string[] {
  const hebrewAnimals = [
    'צוות אריה', 'צוות נמר', 'צוות דוב', 'צוות זאב', 'צוות עקרב',
    'צוות נשר', 'צוות פנתר', 'צוות כריש', 'צוות קוברה', 'צוות פלקון'
  ]
  
  const englishAnimals = [
    'Team Lion', 'Team Tiger', 'Team Bear', 'Team Wolf', 'Team Scorpion',
    'Team Eagle', 'Team Panther', 'Team Shark', 'Team Cobra', 'Team Falcon'
  ]
  
  const names = locale === 'he' ? hebrewAnimals : englishAnimals
  return names.slice(0, count)
}

export function generateTeamColors(count: number): string[] {
  const colors = [
    '#ef4444', // red
    '#3b82f6', // blue  
    '#10b981', // green
    '#f59e0b', // yellow
    '#8b5cf6', // purple
    '#f97316', // orange
    '#06b6d4', // cyan
    '#ec4899', // pink
    '#84cc16', // lime
    '#6366f1'  // indigo
  ]
  return colors.slice(0, count)
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function generateQRUrl(baseUrl: string, eventId: string, stationId: string): string {
  const url = new URL('/play', baseUrl)
  url.searchParams.set('event', eventId)
  url.searchParams.set('station', stationId)
  return url.toString()
}

export function parseQRUrl(url: string): { eventId?: string; stationId?: string } {
  try {
    const parsed = new URL(url)
    return {
      eventId: parsed.searchParams.get('event') || undefined,
      stationId: parsed.searchParams.get('station') || undefined
    }
  } catch {
    return {}
  }
}

export function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c * 1000 // Return distance in meters
}

export function estimateWalkingTime(distanceMeters: number): number {
  // Assume 5 km/h walking speed = 1.39 m/s
  // Add 2 minutes buffer for each location
  const walkingTimeMinutes = distanceMeters / (1.39 * 60)
  return Math.ceil(walkingTimeMinutes + 2)
}

export function detectRouteConflicts(routes: Array<{
  teamId: string
  stations: Array<{ lat: number; lng: number; estimatedArrival: Date }>
}>): Array<{
  time: Date
  teams: string[]
  station: { lat: number; lng: number }
}> {
  const conflicts = []
  const CONFLICT_RADIUS = 50 // meters
  const CONFLICT_TIME_WINDOW = 10 * 60 * 1000 // 10 minutes in milliseconds
  
  // Compare all team routes
  for (let i = 0; i < routes.length; i++) {
    for (let j = i + 1; j < routes.length; j++) {
      const route1 = routes[i]
      const route2 = routes[j]
      
      // Check each station in route1 against each station in route2
      for (const station1 of route1.stations) {
        for (const station2 of route2.stations) {
          const distance = calculateDistance(
            station1.lat, station1.lng,
            station2.lat, station2.lng
          )
          
          const timeDiff = Math.abs(
            station1.estimatedArrival.getTime() - station2.estimatedArrival.getTime()
          )
          
          if (distance <= CONFLICT_RADIUS && timeDiff <= CONFLICT_TIME_WINDOW) {
            conflicts.push({
              time: station1.estimatedArrival,
              teams: [route1.teamId, route2.teamId],
              station: { lat: station1.lat, lng: station1.lng }
            })
          }
        }
      }
    }
  }
  
  return conflicts
}

export function isRTL(locale: string): boolean {
  return ['he', 'ar', 'fa', 'ur'].includes(locale)
}