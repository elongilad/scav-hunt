import QRCode from 'qrcode'

export interface QRCodeData {
  eventId: string
  stationId: string
  stationName: string
}

// Generate QR code as base64 data URL for frontend display
export async function generateQRCode(text: string, size: number = 300): Promise<string> {
  try {
    const qrDataURL = await QRCode.toDataURL(text, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })

    return qrDataURL
  } catch (error) {
    console.error('QR Code generation failed:', error)
    throw new Error('Failed to generate QR code')
  }
}

// Generate QR code as PNG buffer (for downloads)
export async function generateQRCodeBuffer(text: string, size: number = 300): Promise<Buffer> {
  try {
    const buffer = await QRCode.toBuffer(text, {
      width: size,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      },
      errorCorrectionLevel: 'M'
    })

    return buffer
  } catch (error) {
    console.error('QR Code generation failed:', error)
    throw new Error('Failed to generate QR code')
  }
}

// Helper to get the scan URL for a station
export function getStationScanUrl(eventId: string, stationId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/s/${eventId}/${stationId}`;
  }
  return `/s/${eventId}/${stationId}`;
}

// Generate QR codes for all stations in an event
export async function generateEventQRCodes(eventId: string, stations: any[]): Promise<Array<{
  stationId: string
  stationName: string
  qrCodeDataURL: string
  scanURL: string
}>> {
  const qrCodes = []

  for (const station of stations) {
    const scanURL = getStationScanUrl(eventId, station.id)
    const qrCodeDataURL = await generateQRCode(scanURL)

    qrCodes.push({
      stationId: station.id,
      stationName: station.display_name,
      qrCodeDataURL,
      scanURL
    })
  }

  return qrCodes
}

// Helper to generate team-specific route data
export function generateRouteForTeam(teamId: string, stations: any[]): any[] {
  // Simple route generation - in production this would be more sophisticated
  // For MVP, we just return stations in order with team-specific routing
  return stations.map((station, index) => ({
    ...station,
    sequence: index + 1,
    teamSpecificData: {
      teamId,
      routeHint: `Team route step ${index + 1}`
    }
  }));
}