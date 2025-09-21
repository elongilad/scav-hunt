# Scavenger Hunt Application Archive

This archive contains everything needed to redeploy the QR-based multi-route scavenger hunt application.

## 📁 Archive Contents

```
scavhunt-archive/
├── README.md                    # This file
├── source-code/                 # Complete application source code
│   ├── app/                     # Next.js app directory
│   ├── components/              # React components
│   ├── lib/                     # Utility libraries
│   ├── types/                   # TypeScript definitions
│   ├── package.json             # Dependencies
│   └── ...                      # All other source files
├── deployment-docs/             # Deployment guides and configurations
│   ├── DEPLOYMENT_GUIDE.md      # Complete step-by-step guide
│   ├── complete-schema.sql      # Database schema
│   ├── sample-data.sql          # Sample station data
│   └── environment-template.env # Environment variables template
└── backup-scripts/              # Data backup and restoration
    └── export-data.js           # Database export script
```

## 🚀 Quick Start

1. **Extract the source code**:
   ```bash
   cp -r scavhunt-archive/source-code ./my-scavenger-hunt
   cd my-scavenger-hunt
   ```

2. **Follow the deployment guide**:
   - Read `deployment-docs/DEPLOYMENT_GUIDE.md`
   - Set up Supabase database
   - Configure environment variables
   - Deploy to Vercel

## 🎯 Application Features

- **QR Code Scanning**: Teams scan codes at physical locations
- **Multi-Route System**: 5 teams follow different paths through 16 stations  
- **Real-time Tracking**: Admin dashboard shows live team progress
- **Manual Controls**: Click stations to toggle completion status
- **Google Drive Videos**: Mission briefings embedded automatically
- **Multi-language**: English and Hebrew with RTL support
- **Mobile Optimized**: Designed for smartphone usage

## 🛠 Technology Stack

- **Frontend**: Next.js 15, TypeScript, Tailwind CSS
- **Backend**: Supabase PostgreSQL
- **QR Scanning**: html5-qrcode library
- **Deployment**: Vercel with GitHub integration
- **Videos**: Google Drive embedded player

## 📊 Team Configuration

- **Team 1**: Password 1111 (Route: GameOpen → SuperKeizer → Puzzle → ...)
- **Team 2**: Password 2222 (Route: GameOpen → Pizza → Park2 → ...)
- **Team 3**: Password 3333 (Route: GameOpen → Park4 → Park3 → ...)
- **Team 4**: Password 4444 (Route: GameOpen → Puzzle → synagogue → ...)
- **Team 5**: Password 5555 (Route: GameOpen → SchoolGate → Amos → ...)

Each team follows a unique sequence through 16 stations, ending at the final "End" station.

## 🔧 Key URLs

- **Main Game**: `/` (QR scanning and password entry)
- **Admin Panel**: `/admin` (station management)
- **Progress Tracker**: `/tracker` (team monitoring)

## 📋 Pre-deployment Checklist

- [ ] Node.js 18+ installed
- [ ] GitHub and Vercel accounts ready
- [ ] Supabase account created
- [ ] Google Drive videos prepared
- [ ] Physical QR code locations planned

## 🆘 Support

If you encounter issues during redeployment:

1. Check the detailed troubleshooting section in `DEPLOYMENT_GUIDE.md`
2. Verify all environment variables are set correctly
3. Test database connectivity in Supabase dashboard
4. Review Vercel build logs for deployment errors

## 📦 Archive Created

- **Date**: ${new Date().toISOString()}
- **Version**: Production-ready deployment
- **Last Tested**: Verified working with manual toggle functionality

This archive represents a complete, tested implementation ready for immediate redeployment.