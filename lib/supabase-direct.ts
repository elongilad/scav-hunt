// Direct API calls to bypass Supabase client issues

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export async function getStations() {
  const response = await fetch(`${supabaseUrl}/rest/v1/stations?select=*&order=created_at.asc`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=minimal'
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

export async function createStation(station: any) {
  const response = await fetch(`${supabaseUrl}/rest/v1/stations`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(station)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const text = await response.text()
  return text ? JSON.parse(text) : {}
}

export async function updateStation(id: string, station: any) {
  const response = await fetch(`${supabaseUrl}/rest/v1/stations?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(station)
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const text = await response.text()
  return text ? JSON.parse(text) : {}
}

export async function deleteStation(id: string) {
  const response = await fetch(`${supabaseUrl}/rest/v1/stations?id=eq.${id}`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  const text = await response.text()
  return text ? JSON.parse(text) : {}
}

export async function logTeamVisit(teamPassword: string, stationId: string, success: boolean = true) {
  const response = await fetch(`${supabaseUrl}/rest/v1/team_visits`, {
    method: 'POST',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify({
      team_password: teamPassword,
      station_id: stationId,
      success: success,
      timestamp: new Date().toISOString()
    })
  })
  
  if (!response.ok) {
    console.error('Failed to log team visit:', response.status, response.statusText)
  }
  
  return response.ok
}

export async function getTeamVisits() {
  const response = await fetch(`${supabaseUrl}/rest/v1/team_visits?select=*&order=timestamp.desc`, {
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.json()
}

export async function clearAllTeamVisits() {
  const response = await fetch(`${supabaseUrl}/rest/v1/team_visits`, {
    method: 'DELETE',
    headers: {
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
      'Content-Type': 'application/json'
    }
  })
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`)
  }
  
  return response.ok
}