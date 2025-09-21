import { NextRequest, NextResponse } from 'next/server'
import PDFDocument from 'pdfkit'
import QRCode from 'qrcode'

export async function POST(request: NextRequest) {
  try {
    const { eventId, exports, format } = await request.json()

    if (format !== 'pdf') {
      return NextResponse.json({ error: 'רק פורמט PDF נתמך כרגע' }, { status: 400 })
    }

    // Create PDF document
    const doc = new PDFDocument({ 
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    })

    // Create buffer to collect PDF data
    const chunks: Buffer[] = []
    doc.on('data', (chunk) => chunks.push(chunk))
    
    let pdfPromise = new Promise<Buffer>((resolve) => {
      doc.on('end', () => {
        resolve(Buffer.concat(chunks))
      })
    })

    // Add Hebrew font support (if needed)
    // doc.registerFont('Hebrew', 'path/to/hebrew-font.ttf')

    let isFirstPage = true

    for (const exportItem of exports) {
      if (!isFirstPage) {
        doc.addPage()
      }
      isFirstPage = false

      switch (exportItem.type) {
        case 'station-qrs':
          await generateStationQRPages(doc, exportItem.data)
          break
        
        case 'event-summary':
          generateEventSummaryPage(doc, exportItem.data)
          break
        
        case 'team-list':
          generateTeamListPage(doc, exportItem.data)
          break
        
        case 'setup-guide':
          generateSetupGuidePage(doc, exportItem.data)
          break
      }
    }

    doc.end()
    const pdfBuffer = await pdfPromise

    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="event_${eventId}_export.pdf"`
      }
    })

  } catch (error: any) {
    console.error('Export error:', error)
    return NextResponse.json(
      { error: 'שגיאה ביצירת הייצוא' },
      { status: 500 }
    )
  }
}

async function generateStationQRPages(doc: PDFKit.PDFDocument, stations: any[]) {
  let stationIndex = 0
  
  for (const station of stations) {
    if (stationIndex > 0) {
      doc.addPage()
    }

    // Page title
    doc.fontSize(24)
       .font('Helvetica-Bold')
       .text(`Station ${station.stationId}`, 50, 60, { align: 'center' })

    // Station name
    doc.fontSize(18)
       .font('Helvetica')
       .text(station.displayName, 50, 100, { align: 'center' })

    // Generate QR code
    try {
      const qrCodeDataURL = await QRCode.toDataURL(station.qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      })

      // Convert data URL to buffer
      const qrBuffer = Buffer.from(qrCodeDataURL.split(',')[1], 'base64')
      
      // Add QR code to PDF (centered)
      const qrSize = 250
      const centerX = (doc.page.width - qrSize) / 2
      doc.image(qrBuffer, centerX, 150, { width: qrSize, height: qrSize })

    } catch (qrError) {
      console.error('QR generation error:', qrError)
      // Fallback text if QR generation fails
      doc.fontSize(12)
         .text('שגיאה ביצירת קוד QR', 50, 200, { align: 'center' })
         .text(station.qrData, 50, 220, { align: 'center' })
    }

    // Station info
    doc.fontSize(12)
       .font('Helvetica')
       .text(`Type: ${station.type}`, 50, 450)

    if (station.hint) {
      doc.text(`Location Hint: ${station.hint}`, 50, 470)
    }

    // Instructions
    doc.fontSize(10)
       .font('Helvetica')
       .text('Instructions:', 50, 520)
       .text('1. Print this page clearly', 50, 540)
       .text('2. Cut along the borders if needed', 50, 555)
       .text('3. Place at the station location', 50, 570)
       .text('4. Ensure QR code is visible and not damaged', 50, 585)
       .text('5. Test scanning before the event', 50, 600)

    // QR data as backup
    doc.fontSize(8)
       .font('Helvetica')
       .text(`QR Data: ${station.qrData}`, 50, 730, { 
         width: doc.page.width - 100,
         align: 'left'
       })

    stationIndex++
  }
}

function generateEventSummaryPage(doc: PDFKit.PDFDocument, summary: any) {
  // Page title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text('Event Summary', 50, 60, { align: 'center' })

  // Event details
  let y = 120
  const lineHeight = 25

  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Event Details', 50, y)

  y += lineHeight * 1.5

  doc.fontSize(12)
     .font('Helvetica')
     .text(`Event Name: ${summary.eventName}`, 50, y)
  y += lineHeight

  if (summary.childName) {
    doc.text(`Child Name: ${summary.childName}`, 50, y)
    y += lineHeight
  }

  doc.text(`Date: ${new Date(summary.date).toLocaleDateString()}`, 50, y)
  y += lineHeight

  doc.text(`Status: ${summary.status}`, 50, y)
  y += lineHeight

  doc.text(`Hunt Model: ${summary.huntModel}`, 50, y)
  y += lineHeight * 2

  // Statistics
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Statistics', 50, y)

  y += lineHeight * 1.5

  doc.fontSize(12)
     .font('Helvetica')
     .text(`Total Stations: ${summary.totalStations}`, 50, y)
  y += lineHeight

  doc.text(`Total Teams: ${summary.totalTeams}`, 50, y)
  y += lineHeight * 2

  // Generation info
  doc.fontSize(10)
     .font('Helvetica')
     .text(`Generated on: ${new Date().toLocaleString()}`, 50, doc.page.height - 100)
     .text('Created with ScavHunt Management System', 50, doc.page.height - 80)
}

function generateTeamListPage(doc: PDFKit.PDFDocument, teams: any[]) {
  // Page title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text('Team List', 50, 60, { align: 'center' })

  // Table headers
  let y = 120
  const rowHeight = 20
  const colWidths = [40, 120, 80, 60, 200] // ID, Name, Status, Count, Participants
  const startX = 50

  doc.fontSize(10)
     .font('Helvetica-Bold')
     .text('ID', startX, y)
     .text('Team Name', startX + colWidths[0], y)
     .text('Status', startX + colWidths[0] + colWidths[1], y)
     .text('Count', startX + colWidths[0] + colWidths[1] + colWidths[2], y)
     .text('Participants', startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y)

  y += rowHeight
  
  // Draw header line
  doc.moveTo(startX, y)
     .lineTo(startX + colWidths.reduce((sum, width) => sum + width, 0), y)
     .stroke()

  y += 10

  // Team rows
  doc.font('Helvetica')
  teams.forEach((team, index) => {
    if (y > doc.page.height - 100) {
      doc.addPage()
      y = 60
    }

    const teamId = team.id.substring(0, 8) // Truncate ID for display
    doc.text(teamId, startX, y, { width: colWidths[0] })
    doc.text(team.name, startX + colWidths[0], y, { width: colWidths[1] })
    doc.text(team.status, startX + colWidths[0] + colWidths[1], y, { width: colWidths[2] })
    doc.text(team.participantCount.toString(), startX + colWidths[0] + colWidths[1] + colWidths[2], y, { width: colWidths[3] })
    doc.text(team.participants.join(', '), startX + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y, { width: colWidths[4] })

    y += rowHeight
  })
}

function generateSetupGuidePage(doc: PDFKit.PDFDocument, guide: any) {
  // Page title
  doc.fontSize(24)
     .font('Helvetica-Bold')
     .text('Event Setup Guide', 50, 60, { align: 'center' })

  // Event name
  doc.fontSize(16)
     .font('Helvetica')
     .text(guide.eventName, 50, 100, { align: 'center' })

  let y = 150
  const lineHeight = 20

  // Instructions
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Setup Instructions', 50, y)

  y += lineHeight * 1.5

  doc.fontSize(12)
     .font('Helvetica')

  guide.instructions.forEach((instruction: string, index: number) => {
    doc.text(`${index + 1}. ${instruction}`, 50, y)
    y += lineHeight
  })

  y += lineHeight

  // Station checklist
  doc.fontSize(16)
     .font('Helvetica-Bold')
     .text('Station Checklist', 50, y)

  y += lineHeight * 1.5

  doc.fontSize(10)
     .font('Helvetica')

  guide.stations.forEach((station: any) => {
    if (y > doc.page.height - 100) {
      doc.addPage()
      y = 60
    }

    doc.text(`☐ ${station.station_id} - ${station.display_name}`, 50, y)
    if (station.location_hint) {
      doc.text(`   Location: ${station.location_hint}`, 70, y + 12)
      y += 12
    }
    y += lineHeight
  })

  // Team codes section
  if (y < doc.page.height - 200) {
    y += lineHeight * 2
    doc.fontSize(16)
       .font('Helvetica-Bold')
       .text('Team Access Codes', 50, y)

    y += lineHeight * 1.5

    doc.fontSize(10)
       .font('Helvetica')

    guide.teams.forEach((team: any) => {
      if (y > doc.page.height - 60) {
        doc.addPage()
        y = 60
      }
      doc.text(`Team: ${team.name} | Participants: ${(team.participants || []).length}`, 50, y)
      y += lineHeight
    })
  }
}