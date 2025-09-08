'use client'

import { useEffect, useRef } from 'react'
import { Html5QrcodeScanner } from 'html5-qrcode'

interface QRScannerProps {
  onScanSuccess: (stationId: string) => void
  onScanError?: (error: string) => void
}

export default function QRScanner({ onScanSuccess, onScanError }: QRScannerProps) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null)

  useEffect(() => {
    const config: any = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      aspectRatio: 1.0,
    }

    const scanner = new Html5QrcodeScanner('qr-reader', config, false)
    scannerRef.current = scanner

    scanner.render(
      (decodedText: string) => {
        try {
          const url = new URL(decodedText)
          const stationId = url.searchParams.get('station')
          if (stationId) {
            onScanSuccess(stationId)
            scanner.clear()
          } else {
            onScanError?.('Invalid QR code: No station ID found')
          }
        } catch {
          onScanError?.('Invalid QR code format')
        }
      },
      (errorMessage: string) => {
        console.log('QR Code scan error:', errorMessage)
      }
    )

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(console.error)
      }
    }
  }, [onScanSuccess, onScanError])

  return (
    <div className="w-full max-w-md mx-auto">
      <div id="qr-reader" className="w-full"></div>
    </div>
  )
}