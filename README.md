# QR-Based Multi-Route Scavenger Hunt Application

A spy-themed Next.js application that enables teams to follow different paths through a scavenger hunt using QR codes and team-specific passwords.

<!-- Force redeploy to refresh environment variables -->

## Features

- **QR Code Scanning**: Teams scan QR codes at physical locations to receive mission briefings
- **Multi-Route System**: Different teams follow unique paths with different passwords
- **Google Drive Video Integration**: Mission videos hosted on Google Drive are automatically embedded
- **Multi-Language Support**: English and Hebrew with RTL layout support
- **Admin Interface**: Complete CRUD operations for station management
- **QR Code Generation**: Automatic QR code generation for physical station placement
- **Responsive Design**: Mobile-first design optimized for phone usage
- **Real-time Database**: Powered by Supabase with PostgreSQL

## Technology Stack

- **Frontend**: Next.js 15 with TypeScript
- **UI**: Tailwind CSS with custom spy theme
- **Database**: Supabase (PostgreSQL)
- **QR Scanning**: html5-qrcode library
- **Deployment**: Vercel with automatic CI/CD
- **Icons**: Lucide React

## Setup Instructions

### 1. Environment Setup

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### 2. Database Setup

1. Create a new project in [Supabase](https://supabase.com)
2. Run the SQL commands from `supabase-schema.sql` in your Supabase SQL editor
3. Copy your project URL and anon key to the `.env.local` file

### 3. Development

Start the development server:
```bash
npm run dev
```

Visit `http://localhost:3000` to view the application.

### 4. Deployment

#### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Set the environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Deploy automatically with git push

## Usage

### For Game Administrators

1. Visit `/admin` to access the station management interface
2. Create stations with unique IDs and descriptive names
3. Add routes for each station with:
   - Team passwords
   - Next station destinations
   - Clue text for next location
   - Google Drive video URLs
4. Generate and download QR codes for physical placement

### For Teams/Players

1. Scan QR code at physical station location
2. Enter your team password
3. Watch mission briefing video
4. Follow clue to next station
5. Repeat until mission complete

### QR Code URL Format

QR codes should contain URLs in this format:
```
https://your-domain.com/?station=STATION_ID
```

### Google Drive Video Setup

1. Upload videos to Google Drive
2. Set sharing permissions to "Anyone with the link can view"
3. Copy the shareable link
4. Use the full Google Drive URL in the admin interface

The application automatically converts Google Drive URLs to embeddable format.

## Database Schema

### Stations Table

```sql
CREATE TABLE stations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  routes JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Route Structure

```json
{
  "TEAM_NAME": {
    "nextStation": "STATION_ID",
    "password": "TEAM_PASSWORD",
    "nextClue": "Text clue for next location",
    "videoUrl": "https://drive.google.com/file/d/FILE_ID/view"
  }
}
```

## Multi-Language Support

The application supports English and Hebrew with automatic RTL layout switching. Users can toggle between languages using the globe icon in the top-right corner.

## Security Considerations

- Environment variables for sensitive data
- Row Level Security (RLS) can be enabled in Supabase for production
- No sensitive data stored in browser localStorage
- QR code validation prevents invalid station access

## Mobile Optimization

- Touch-friendly UI with minimum 44px touch targets
- Mobile-first responsive design
- Optimized for 3G network conditions
- Progressive Web App capabilities ready for implementation

## Development Scripts

```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run start      # Start production server
npm run lint       # Run ESLint
```

## File Structure

```
├── app/
│   ├── admin/          # Admin interface
│   ├── globals.css     # Global styles
│   ├── layout.tsx      # Root layout
│   └── page.tsx        # Main game interface
├── components/
│   ├── ui/             # Reusable UI components
│   ├── QRScanner.tsx   # QR code scanning component
│   ├── VideoPlayer.tsx # Google Drive video player
│   └── LanguageToggle.tsx # Language switching
├── lib/
│   ├── supabase.ts     # Supabase client
│   ├── i18n.ts         # Internationalization
│   └── utils.ts        # Utility functions
├── types/
│   └── index.ts        # TypeScript type definitions
└── supabase-schema.sql # Database schema and sample data
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.