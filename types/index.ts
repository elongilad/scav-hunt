export interface StationRoute {
  nextStation: string
  password: string
  nextClue: string
  videoUrl: string
}

export interface Station {
  id: string
  name: string
  routes: Record<string, StationRoute>
  created_at?: string
}