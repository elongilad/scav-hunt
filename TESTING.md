# 🧪 BuildaQuest Testing Guide

Complete testing checklist for the quest adventure platform.

## 🚀 Quick Start Testing

### Option 1: Deploy to Vercel (Recommended)
```bash
# 1. Clone the repository
git clone <your-repo>
cd buildaquest

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 3. Deploy
./scripts/deploy.sh
```

### Option 2: Local Development
```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env.local
# Edit .env.local

# 3. Run development server
npm run dev
```

## 📋 Complete Testing Checklist

### ✅ **Core System Tests**

#### Authentication (`/auth/login`)
- [ ] Email/password signup works
- [ ] Email verification sent
- [ ] Login with valid credentials
- [ ] Error handling for invalid credentials
- [ ] Google OAuth (if configured)
- [ ] Language switcher works on auth page

#### Hebrew/RTL Support
- [ ] Language switcher changes interface language
- [ ] Hebrew text displays correctly
- [ ] RTL layout works (text alignment, icons, navigation)
- [ ] Date/time formatting in Hebrew
- [ ] Form inputs work with Hebrew text
- [ ] Mobile Hebrew support

### ✅ **Admin Studio Tests** (`/admin`)

#### Hunt Models (`/admin/models`)
- [ ] Create new hunt model
- [ ] Edit existing model
- [ ] Set difficulty, age ranges, duration
- [ ] Add custom tags and categories

#### Stations (`/admin/stations`)
- [ ] Create station with description
- [ ] Set required props and duration
- [ ] Different station types work
- [ ] Location hints save correctly

#### Missions (`/admin/missions`)
- [ ] Create mission with clues
- [ ] Link mission to stations
- [ ] Video template integration
- [ ] Hebrew text in missions

#### Video Templates (`/admin/templates`)
- [ ] Upload video template
- [ ] Timeline editor works
- [ ] Preview functionality
- [ ] Layer management

### ✅ **Organizer Dashboard Tests** (`/dashboard`)

#### Event Management (`/dashboard/events`)
- [ ] Create new event
- [ ] Set event details (date, location, participants)
- [ ] Assign hunt model to event
- [ ] Edit existing events
- [ ] Event status management

#### Station Setup (`/dashboard/events/[id]/setup`)
- [ ] Map stations to physical locations
- [ ] Upload location-specific media
- [ ] Set station-specific instructions

#### Team Management
- [ ] Create teams
- [ ] Add participants to teams
- [ ] Generate team codes
- [ ] Team progress tracking

#### Export System (`/dashboard/events/[id]/export`)
- [ ] Generate QR codes for stations
- [ ] Export event summary PDF
- [ ] Team list export
- [ ] Setup guide generation
- [ ] QR codes print clearly
- [ ] QR codes scan correctly

### ✅ **Player Experience Tests** (`/play`)

#### Team Login (`/play`)
- [ ] Enter team code successfully
- [ ] QR code team login
- [ ] Team information displays
- [ ] Language switching on mobile

#### Team Dashboard (`/play/[teamId]`)
- [ ] Team stats display correctly
- [ ] Current progress shows
- [ ] Quick actions work
- [ ] Hebrew interface on mobile

#### QR Scanner (`/play/[teamId]/scan`)
- [ ] Camera access granted
- [ ] QR code detection works
- [ ] Manual code entry fallback
- [ ] Flashlight toggle (if supported)
- [ ] Camera switching (front/back)
- [ ] Error handling for invalid codes

#### Station Interface (`/play/[teamId]/station/[stationId]`)
- [ ] Mission displays correctly
- [ ] Video recording starts/stops
- [ ] Recording preview works
- [ ] Pause/resume recording
- [ ] Video upload with progress
- [ ] Mission completion
- [ ] Hebrew mission text displays
- [ ] Mobile video controls work

#### Completion Flow (`/play/[teamId]/completed`)
- [ ] Celebration animation plays
- [ ] Final stats display
- [ ] Leaderboard ranking
- [ ] Share functionality
- [ ] Video status tracking

### ✅ **Billing System Tests** (`/dashboard/billing`)

#### Subscription Plans (`/dashboard/billing/plans`)
- [ ] Plan comparison displays
- [ ] Stripe checkout flow
- [ ] Payment success handling
- [ ] Payment cancellation handling
- [ ] Subscription activation
- [ ] Hebrew currency formatting

#### Billing Management (`/dashboard/billing`)
- [ ] Current plan status
- [ ] Usage statistics
- [ ] Payment history
- [ ] Invoice downloads
- [ ] Customer portal access

### ✅ **Mobile-Specific Tests**

#### Responsive Design
- [ ] All pages work on mobile (320px+)
- [ ] Touch interactions work
- [ ] Hebrew text readable on small screens
- [ ] Navigation accessible
- [ ] Forms usable on mobile

#### PWA Features
- [ ] Add to home screen works
- [ ] App icon displays correctly
- [ ] Offline capability (basic)
- [ ] Fast loading times

#### Camera Integration
- [ ] Camera permission request
- [ ] Video recording quality
- [ ] File upload on mobile data
- [ ] Recording in different orientations

### ✅ **Performance Tests**

#### Loading Times
- [ ] Initial page load < 3 seconds
- [ ] Subsequent navigation < 1 second
- [ ] Image optimization working
- [ ] Font loading optimized

#### Database Performance
- [ ] Real-time updates work
- [ ] Large team/event handling
- [ ] Concurrent user support

## 🐛 Common Issues & Solutions

### Authentication Issues
```bash
# Check Supabase configuration
- Verify URL and keys in .env.local
- Check auth settings in Supabase dashboard
- Ensure redirect URLs are correct
```

### Hebrew/RTL Issues
```bash
# Check font loading
- Verify Hebrew fonts load in production
- Test on different browsers
- Check mobile font rendering
```

### Mobile Camera Issues
```bash
# Camera access problems
- Ensure HTTPS is enabled
- Test permission handling
- Verify camera API support
```

### Payment Integration Issues
```bash
# Stripe configuration
- Verify webhook endpoints
- Check environment variables
- Test with Stripe test cards
```

## 📱 Device Testing Matrix

Test on these devices/browsers:

### Mobile Devices
- [ ] iPhone (Safari)
- [ ] Android (Chrome)
- [ ] iPad (Safari)
- [ ] Android Tablet (Chrome)

### Desktop Browsers
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

### Hebrew-Specific Testing
- [ ] iOS Hebrew keyboard
- [ ] Android Hebrew keyboard
- [ ] Hebrew text selection
- [ ] Hebrew text input fields

## 🎯 Test Scenarios

### Scenario 1: Birthday Party Hunt
1. Admin creates "Birthday Adventure" hunt model
2. Organizer sets up event for 10 kids
3. Creates 5 stations around backyard
4. Generates QR codes and prints them
5. Teams use mobile app to complete hunt
6. Watch completion celebration

### Scenario 2: Corporate Team Building
1. Admin creates "Office Quest" model
2. Organizer sets up enterprise event
3. 50 participants across 10 teams
4. Mix of puzzle and physical challenges
5. Real-time leaderboard tracking
6. Video compilation at the end

### Scenario 3: Hebrew Language Event
1. Switch interface to Hebrew
2. Create hunt with Hebrew clues
3. Test RTL layout throughout
4. Hebrew text in videos
5. Hebrew QR code generation
6. Hebrew completion messages

## 🚨 Production Readiness Checklist

Before going live:

- [ ] All core features tested
- [ ] Mobile experience optimized
- [ ] Hebrew/RTL fully functional
- [ ] Payment flow working (if enabled)
- [ ] QR codes print and scan properly
- [ ] Video recording works on target devices
- [ ] Performance benchmarks met
- [ ] Error monitoring in place
- [ ] Backup procedures tested

## 📊 Success Metrics

Track these metrics post-launch:
- User registration rate
- Event creation rate
- Hunt completion rate
- Mobile vs desktop usage
- Hebrew vs English usage
- Payment conversion (if applicable)

Happy testing! 🎉