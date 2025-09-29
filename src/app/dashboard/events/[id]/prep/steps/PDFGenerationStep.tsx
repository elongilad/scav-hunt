import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Download, CheckCircle, QrCode, Puzzle, ExternalLink } from 'lucide-react'

interface PDFGenerationStepProps {
  event: any
  onComplete: () => void
  isCompleted: boolean
}

export default function PDFGenerationStep({ event, onComplete, isCompleted }: PDFGenerationStepProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [pdfGenerated, setPdfGenerated] = useState(false)
  const [qrCodes, setQrCodes] = useState<any[]>([])
  const [loadingQR, setLoadingQR] = useState(false)

  const handleGenerateQRCodes = async () => {
    if (!event?.id) return

    setLoadingQR(true)
    try {
      const response = await fetch(`/api/events/${event.id}/qr-codes`)
      if (!response.ok) {
        throw new Error('Failed to generate QR codes')
      }

      const data = await response.json()
      setQrCodes(data.qrCodes || [])
    } catch (error) {
      console.error('Failed to generate QR codes:', error)
    } finally {
      setLoadingQR(false)
    }
  }

  const handleGeneratePDF = async () => {
    setIsGenerating(true)

    // First generate QR codes if not already done
    if (qrCodes.length === 0) {
      await handleGenerateQRCodes()
    }

    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000))

    setIsGenerating(false)
    setPdfGenerated(true)
  }

  // Auto-generate QR codes when component loads
  useEffect(() => {
    if (event?.id && qrCodes.length === 0) {
      handleGenerateQRCodes()
    }
  }, [event?.id])

  const handleDownload = () => {
    // In real implementation, this would download the actual PDF
    const link = document.createElement('a')
    link.href = '#'
    link.download = `${event?.child_name || 'Quest'}-Materials.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <FileText className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Generate Quest Materials</h3>
        <p className="text-gray-600">
          Generate and download your custom PDF containing QR codes, puzzles, ciphers, and parent instructions.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Your Quest Materials Will Include:</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <QrCode className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-medium">QR Codes</h4>
                <p className="text-sm text-gray-600">One for each station location</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <Puzzle className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-medium">Custom Puzzles</h4>
                <p className="text-sm text-gray-600">Using your uploaded photos</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-medium">Cipher Wheels</h4>
                <p className="text-sm text-gray-600">Secret decoder tools</p>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 border rounded-lg">
              <FileText className="w-8 h-8 text-blue-600" />
              <div>
                <h4 className="font-medium">Parent Guide</h4>
                <p className="text-sm text-gray-600">Setup and troubleshooting instructions</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Preview */}
      {qrCodes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <QrCode className="w-5 h-5" />
              <span>QR Code Preview</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {qrCodes.map((qr, index) => (
                <div key={qr.stationId} className="border rounded-lg p-4 text-center">
                  <div className="mb-3">
                    <img
                      src={qr.qrCodeDataURL}
                      alt={`QR Code for ${qr.stationName}`}
                      className="w-32 h-32 mx-auto border rounded"
                    />
                  </div>
                  <h4 className="font-medium text-sm mb-2">{qr.stationName}</h4>
                  <div className="space-y-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(`/api/events/${event.id}/qr-codes/${qr.stationId}`, '_blank')}
                      className="w-full"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download PNG
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(qr.scanURL, '_blank')}
                      className="w-full text-xs"
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Test URL
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {loadingQR && (
        <Card>
          <CardContent className="p-6 text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-600">Generating QR codes...</p>
          </CardContent>
        </Card>
      )}

      {!pdfGenerated && (
        <div className="text-center">
          <Button
            onClick={handleGeneratePDF}
            disabled={isGenerating}
            className="bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                Generating PDF...
              </>
            ) : (
              <>
                <FileText className="w-4 h-4 mr-2" />
                Generate Quest Materials
              </>
            )}
          </Button>
        </div>
      )}

      {pdfGenerated && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-6 text-center">
            <CheckCircle className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-800 mb-2">
              Quest Materials Ready!
            </h3>
            <p className="text-green-700 mb-4">
              Your custom PDF has been generated with all quest materials.
            </p>
            <Button
              onClick={handleDownload}
              className="bg-green-600 hover:bg-green-700 mr-3"
            >
              <Download className="w-4 h-4 mr-2" />
              Download PDF
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            PDF Status: {pdfGenerated ? 'Generated' : 'Not generated'}
          </div>
          {pdfGenerated && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Ready to proceed
            </div>
          )}
        </div>

        <Button
          onClick={onComplete}
          disabled={!pdfGenerated || isCompleted}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isCompleted ? 'Completed' : 'Complete Step'}
        </Button>
      </div>
    </div>
  )
}