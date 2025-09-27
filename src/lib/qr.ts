// Simple QR code generation utility using a canvas-based approach
// For production, consider using a dedicated QR code library like 'qrcode'

export function generateQRCode(text: string, size: number = 200): string {
  // For MVP, we'll create a simple placeholder
  // In production, you would use a proper QR code library

  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Could not get canvas context');
  }

  // Simple placeholder pattern - in production use a real QR code library
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, size, size);

  ctx.fillStyle = '#fff';
  ctx.fillRect(10, 10, size - 20, size - 20);

  ctx.fillStyle = '#000';
  ctx.font = '10px monospace';
  ctx.textAlign = 'center';
  ctx.fillText('QR CODE', size / 2, size / 2 - 10);
  ctx.fillText('(MVP PLACEHOLDER)', size / 2, size / 2 + 5);

  // Add some pattern to make it look QR-like
  for (let i = 0; i < size; i += 20) {
    for (let j = 0; j < size; j += 20) {
      if ((i + j) % 40 === 0) {
        ctx.fillRect(i, j, 10, 10);
      }
    }
  }

  return canvas.toDataURL();
}

// Helper to get the scan URL for a station
export function getStationScanUrl(eventId: string, stationId: string): string {
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/s/${eventId}/${stationId}`;
  }
  return `/s/${eventId}/${stationId}`;
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