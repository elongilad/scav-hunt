# 🚀 BuildaQuest Deployment Guide

This guide will help you deploy the BuildaQuest quest adventure platform to production.

## Prerequisites

- Node.js 18+ and npm
- Git repository (GitHub recommended)
- Supabase account
- Stripe account
- Vercel account (recommended) or similar hosting platform

## 🎯 Quick Deployment (5 minutes)

### 1. Set Up Supabase Database

1. **Create a Supabase project:**
   - Go to [supabase.com](https://supabase.com)
   - Create new project
   - Note your project URL and anon key

2. **Set up the database schema:**
   ```bash
   # Run these SQL files in Supabase SQL Editor in order:
   # 1. src/lib/supabase/schema.sql
   # 2. database-schema-updates.sql  
   # 3. team-progress-schema.sql
   # 4. render-jobs-schema.sql
   # 5. stripe-schema.sql
   ```

3. **Enable Authentication:**
   - In Supabase Dashboard → Authentication → Settings
   - Enable Email provider
   - Optionally enable Google OAuth

### 2. Set Up Stripe (Optional but Recommended)

1. **Create Stripe account:**
   - Go to [stripe.com](https://stripe.com)
   - Get your test/live API keys

2. **Create Products and Prices:**
   ```bash
   # In Stripe Dashboard, create these products:
   - Basic Plan (₹99/month)
   - Pro Plan (₹199/month) 
   - Enterprise Plan (₹499/month)
   - Small Event (₹49 one-time)
   - Medium Event (₹89 one-time)
   - Large Event (₹149 one-time)
   ```

3. **Note the Price IDs** for your environment variables

### 3. Deploy to Vercel

1. **Fork/Clone the repository:**
   ```bash
   git clone <your-repo-url>
   cd buildaquest
   ```

2. **Deploy to Vercel:**
   - Connect your GitHub repo to Vercel
   - Or use Vercel CLI:
   ```bash
   npm i -g vercel
   vercel
   ```

3. **Set Environment Variables:**
   In Vercel Dashboard → Settings → Environment Variables, add:
   ```
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-supabase-anon-key>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   NEXT_PUBLIC_APP_URL=<your-vercel-url>
   STRIPE_SECRET_KEY=<your-stripe-secret>
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=<your-stripe-public>
   # ... other Stripe price IDs
   ```

4. **Redeploy** after adding environment variables

## 🧪 Testing Your Deployment

### 1. Basic Functionality Test

1. **Visit your deployed site**
2. **Test authentication:**
   - Go to `/auth/login`
   - Create an account
   - Verify email functionality

3. **Test language switching:**
   - Use the language switcher
   - Verify Hebrew/RTL works properly

### 2. Admin Features Test

1. **Access admin dashboard:**
   - Go to `/admin`
   - Create a hunt model
   - Add stations and missions

2. **Test video templates:**
   - Go to `/admin/templates`
   - Upload a template
   - Test timeline editor

### 3. Organizer Features Test

1. **Create an event:**
   - Go to `/dashboard/events/new`
   - Fill in event details
   - Test station setup

2. **Test exports:**
   - Go to event export page
   - Generate QR codes PDF
   - Verify QR codes work

### 4. Player Experience Test

1. **Test mobile player:**
   - Go to `/play` on mobile
   - Enter team code
   - Test QR scanner
   - Test video recording

2. **Test game flow:**
   - Complete a station
   - Verify progress tracking
   - Test completion flow

### 5. Payment System Test (if Stripe enabled)

1. **Test subscription:**
   - Go to `/dashboard/billing/plans`
   - Test checkout flow
   - Verify webhooks work

2. **Use Stripe test cards:**
   ```
   Success: 4242 4242 4242 4242
   Declined: 4000 0000 0000 0002
   ```

## 🔧 Configuration Options

### Custom Domain

1. **Add domain in Vercel:**
   - Vercel Dashboard → Domains
   - Add your custom domain
   - Update DNS records

2. **Update environment variables:**
   ```
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

### Email Setup

1. **Configure Supabase SMTP:**
   - Dashboard → Authentication → Settings
   - Add your SMTP provider
   - Test email delivery

### File Storage

The platform uses Supabase Storage for:
- User-uploaded videos
- Template assets
- Exported files

Ensure your Supabase project has sufficient storage.

## 📱 Mobile App (PWA)

The platform works as a Progressive Web App:

1. **Mobile-first design** - Optimized for phones
2. **Offline capability** - Basic caching included
3. **Add to homescreen** - Works like a native app

### Enable PWA features:
- Ensure HTTPS is enabled
- Test add-to-homescreen functionality
- Verify offline capabilities

## 🚨 Production Checklist

Before going live:

- [ ] Database schema applied correctly
- [ ] Environment variables set
- [ ] HTTPS enabled
- [ ] Custom domain configured (if needed)
- [ ] Email delivery working
- [ ] Stripe webhooks configured
- [ ] Mobile testing completed
- [ ] Hebrew/RTL testing on various devices
- [ ] Payment flow tested thoroughly
- [ ] QR codes printing and scanning properly
- [ ] Video recording working on mobile
- [ ] Error monitoring set up

## 🔍 Troubleshooting

### Common Issues:

1. **Database connection issues:**
   - Verify Supabase URL and keys
   - Check if database schema is applied

2. **Authentication not working:**
   - Check Supabase auth settings
   - Verify redirect URLs

3. **Payment issues:**
   - Verify Stripe webhook endpoint
   - Check webhook secret matches

4. **Mobile camera issues:**
   - Ensure HTTPS is enabled
   - Test camera permissions

5. **Hebrew font issues:**
   - Verify font loading in production
   - Check browser compatibility

### Getting Help:

- Check browser console for errors
- Review Vercel deployment logs
- Check Supabase logs
- Test in multiple browsers/devices

## 🎉 You're Live!

Once deployed, your quest adventure platform will be available at your domain with:

- ✅ Multi-language support (Hebrew/English)
- ✅ Mobile-first responsive design
- ✅ Complete admin and organizer tools
- ✅ Real-time player experience
- ✅ Payment processing
- ✅ QR code generation
- ✅ Video recording and rendering

Share your domain and start creating amazing quest adventure experiences!