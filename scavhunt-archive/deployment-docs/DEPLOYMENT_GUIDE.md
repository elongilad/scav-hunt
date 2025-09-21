# Scavenger Hunt Application - Complete Deployment Guide

## Overview
This archive contains a complete QR-based multi-route scavenger hunt application with real-time team tracking and administrative controls.

## Quick Start Checklist
- [ ] Set up Supabase project
- [ ] Configure environment variables
- [ ] Deploy to Vercel
- [ ] Import database schema
- [ ] Test application functionality

## Prerequisites
- Node.js 18+ installed
- GitHub account
- Vercel account (free tier sufficient)
- Supabase account (free tier sufficient)

## Step 1: Extract and Prepare Code

1. **Extract the archive**:
   ```bash
   cd /path/to/your/projects
   cp -r scavhunt-archive/source-code ./scavenger-hunt-app
   cd scavenger-hunt-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Initialize Git repository**:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - Scavenger Hunt Application"
   ```

## Step 2: Set Up Supabase Database

1. **Create Supabase Project**:
   - Go to [supabase.com](https://supabase.com)
   - Click "New Project"
   - Choose organization and enter project details
   - Wait for project to be ready (2-3 minutes)

2. **Get Database Credentials**:
   - Go to Settings → API
   - Copy these values:
     - `Project URL` (starts with https://)
     - `anon/public` API key

3. **Import Database Schema**:
   - Go to SQL Editor in Supabase dashboard
   - Copy and run the contents of `deployment-docs/complete-schema.sql`
   - Verify tables are created: `stations` and `team_visits`

## Step 3: Configure Environment Variables

1. **Create environment file**:
   ```bash
   cp .env.example .env.local
   ```

2. **Edit `.env.local`**:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_project_url_here
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   ```

3. **Test local development**:
   ```bash
   npm run dev
   ```
   - Visit http://localhost:3000
   - Should see the spy-themed landing page

## Step 4: Deploy to Vercel

1. **Create GitHub Repository**:
   ```bash
   # Create new repository on GitHub, then:
   git remote add origin https://github.com/yourusername/scavenger-hunt.git
   git branch -M main
   git push -u origin main
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Click "New Project"
   - Import your GitHub repository
   - Configure environment variables in Vercel:
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - Click "Deploy"

3. **Verify Deployment**:
   - Visit your Vercel URL
   - Test QR scanning functionality
   - Check admin panel at `/admin`
   - Verify tracker at `/tracker`

## Step 5: Configure Game Data

1. **Access Admin Panel**:
   - Go to `https://yourapp.vercel.app/admin`
   - Create stations using the provided sample data or your own

2. **Set Up Teams**:
   - Use the predefined team structure:
     - Team 1: Password 1111
     - Team 2: Password 2222
     - Team 3: Password 3333
     - Team 4: Password 4444
     - Team 5: Password 5555

3. **Generate QR Codes**:
   - In admin panel, generate QR codes for each station
   - Print and place at physical locations

## Step 6: Test Complete Flow

1. **Test QR Scanning**:
   - Use phone camera to scan generated QR code
   - Should open app with station loaded

2. **Test Password Flow**:
   - Enter team password (1111-5555)
   - Should show video and next clue

3. **Test Progress Tracking**:
   - Go to `/tracker`
   - Should show team progress updating
   - Test manual toggle functionality

## Troubleshooting

### Common Issues

**"Invalid API key" errors**:
- Verify environment variables are set correctly
- Check Supabase project is active
- Ensure API key matches project

**QR codes not working**:
- Verify URL format: `https://yourapp.com/?station=STATION_ID`
- Check station ID exists in database
- Test with browser first before printing

**Videos not loading**:
- Ensure Google Drive links are publicly accessible
- Use full Google Drive URLs (not shortened)
- Check network connectivity

**Deployment failures**:
- Verify all dependencies in package.json
- Check build logs in Vercel dashboard
- Ensure environment variables are set

### Database Issues

**Reset database**:
```sql
-- Run in Supabase SQL Editor to clear all data
DELETE FROM team_visits;
DELETE FROM stations;
```

**Check permissions**:
```sql
-- Verify table permissions
SELECT * FROM information_schema.table_privileges 
WHERE table_name IN ('stations', 'team_visits');
```

## Maintenance

### Regular Backups

1. **Export Database**:
   - Use Supabase dashboard → Database → Backups
   - Download periodic backups

2. **Export Station Configuration**:
   - Use admin panel export functionality
   - Save JSON configuration files

### Updates and Modifications

1. **Code Changes**:
   - Modify code locally
   - Test with `npm run dev`
   - Commit and push to trigger auto-deployment

2. **Database Schema Changes**:
   - Test changes in development first
   - Apply to production via Supabase SQL Editor
   - Update this documentation

## Security Checklist

- [ ] Environment variables not committed to Git
- [ ] Supabase RLS enabled if needed for production
- [ ] Regular database backups configured
- [ ] Monitor application logs for errors
- [ ] Update dependencies periodically

## Support

### Key Files for Debugging
- `lib/supabase-direct.ts` - Database operations
- `app/page.tsx` - Main game interface
- `app/admin/page.tsx` - Admin functionality
- `app/tracker/page.tsx` - Progress tracking

### Useful Commands
```bash
npm run dev          # Development server
npm run build        # Production build
npm run lint         # Code quality check
git log --oneline    # View commit history
```

## Archive Contents
```
scavhunt-archive/
├── source-code/           # Complete application source
├── deployment-docs/       # This guide and schemas
│   ├── DEPLOYMENT_GUIDE.md
│   ├── complete-schema.sql
│   ├── sample-data.sql
│   └── environment-template.env
└── backup-scripts/        # Maintenance scripts
    ├── export-data.js
    └── restore-data.js
```

This guide provides everything needed to redeploy the scavenger hunt application from scratch. Keep this archive in a safe location for future use.