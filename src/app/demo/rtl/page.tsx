'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage, useRTL } from '@/components/LanguageProvider'
import LanguageSwitcher from '@/components/LanguageSwitcher'
import RTLCard, { EventCard, TeamCard, StationCard } from '@/components/RTLCard'
import { 
  Calendar,
  Clock,
  Users,
  MapPin,
  Star,
  Trophy,
  Target,
  Camera,
  QrCode,
  CheckCircle
} from 'lucide-react'

export default function RTLDemoPage() {
  const { t, formatDate, formatDateTime } = useLanguage()
  const { isRTL, direction, rtlClass } = useRTL()

  // Sample data for demonstration
  const sampleEvent = {
    id: '1',
    name: 'ציד יום הולדת מיוחד',
    child_name: 'שרה',
    location: 'פארק הירקון, תל אביב',
    date_start: new Date('2024-12-25T10:00:00'),
    participant_count: 15,
    status: 'active',
    hunt_models: { name: 'ציד גיבורי על' }
  }

  const sampleTeam = {
    id: '1',
    name: 'הנינג׳ות הסגולות',
    participants: ['דני', 'מיכל', 'עמית', 'נועה'],
    status: 'active',
    score: 450,
    current_station_id: 'ST003'
  }

  const sampleStation = {
    station_id: 'ST001',
    display_name: 'עמדת החידות',
    activity_description: 'פתרו את החידה הסודית כדי לקבל את הרמז הבא',
    station_type: 'חידה',
    estimated_duration: 10,
    props_needed: ['עיפרון', 'נייר', 'זכוכית מגדלת']
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <div className={`flex items-center justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <div>
                <CardTitle className={`hebrew-title text-2xl ${isRTL ? 'text-right' : 'text-left'}`}>
                  דוגמא לתמיכה בעברית ו-RTL
                </CardTitle>
                <CardDescription className={`text-gray-400 hebrew-body ${isRTL ? 'text-right' : 'text-left'}`}>
                  הדף הזה מדגים את התמיכה המלאה בעברית וכיוון כתיבה מימין לשמאל
                </CardDescription>
              </div>
              
              <LanguageSwitcher variant="dropdown" showFlag={true} showText={true} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`grid grid-cols-1 md:grid-cols-4 gap-4 text-center ${isRTL ? 'text-right' : 'text-left'}`}>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-spy-gold mb-1">RTL</div>
                <div className="text-sm text-gray-400">כיוון: {direction}</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-spy-gold mb-1">🇮🇱</div>
                <div className="text-sm text-gray-400">עברית</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-spy-gold mb-1">{formatDate(new Date())}</div>
                <div className="text-sm text-gray-400">תאריך</div>
              </div>
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-2xl font-bold text-spy-gold mb-1">✨</div>
                <div className="text-sm text-gray-400">דוגמא</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Typography Examples */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="hebrew-title">דוגמאות טיפוגרפיה</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h1 className="text-3xl font-bold hebrew-title mb-2">כותרת ראשית - ציד האוצרות</h1>
              <h2 className="text-2xl font-semibold hebrew-title mb-2">כותרת משנה - מערכת ניהול</h2>
              <h3 className="text-xl font-medium hebrew-title mb-2">כותרת קטנה - אירועים</h3>
            </div>
            
            <div className="hebrew-body">
              <p className="text-lg mb-4">
                זהו טקסט גוף רגיל בעברית. הטקסט נכתב בצורה טבעית ונקרא בקלות. 
                הפונט נבחר במיוחד לתמיכה מיטבית בעברית ובקריאות גבוהה.
              </p>
              
              <p className="text-base text-gray-300">
                טקסט משני עם צבע שונה. ניתן לראות כיצד הטקסט מתיישר באופן טבעי לימין
                ותומך בכל הסימנים הדיאקריטיים של העברית כמו ניקוד ותעתיק.
              </p>
            </div>

            <div className={`flex flex-wrap gap-2 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <Badge className="bg-spy-gold text-black">תג בעברית</Badge>
              <Badge variant="outline" className="border-spy-gold/30 text-spy-gold">עמדה פעילה</Badge>
              <Badge variant="outline" className="border-green-500/30 text-green-400">הושלם בהצלחה</Badge>
              <Badge variant="outline" className="border-blue-500/30 text-blue-400">בתהליך</Badge>
            </div>
          </CardContent>
        </Card>

        {/* RTL Components Demo */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-white hebrew-title">רכיבי ממשק מותאמי RTL</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Event Card */}
            <EventCard 
              event={sampleEvent}
              onView={() => alert('צפייה באירוע')}
              onEdit={() => alert('עריכת אירוע')}
            />

            {/* Team Card */}
            <TeamCard 
              team={sampleTeam}
              onViewProgress={() => alert('צפייה בהתקדמות')}
            />

            {/* Station Card */}
            <StationCard 
              station={sampleStation}
              onEdit={() => alert('עריכת עמדה')}
            />
          </div>
        </div>

        {/* Form Elements Demo */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="hebrew-title">אלמנטי טופס</CardTitle>
            <CardDescription className="text-gray-400 hebrew-body">
              דוגמא לטפסים המותאמים לעברית
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">שם האירוע</label>
                <input 
                  type="text" 
                  placeholder="הזינו שם אירוע..."
                  className={`
                    w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white 
                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spy-gold
                    ${isRTL ? 'text-right' : 'text-left'}
                  `}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-white mb-2">תאריך האירוע</label>
                <input 
                  type="date" 
                  className={`
                    w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white 
                    focus:outline-none focus:ring-2 focus:ring-spy-gold
                  `}
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-white mb-2">תיאור האירוע</label>
                <textarea 
                  rows={3}
                  placeholder="תארו את האירוע שלכם..."
                  className={`
                    w-full p-3 rounded-lg bg-white/10 border border-white/20 text-white 
                    placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spy-gold resize-none
                    ${isRTL ? 'text-right' : 'text-left'}
                  `}
                />
              </div>
            </div>
            
            <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
              <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black">
                שמור אירוע
              </Button>
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                בטל
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Interactive Elements */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="hebrew-title">אלמנטים אינטרקטיביים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button className="h-16 bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold flex-col">
                <QrCode className="w-6 h-6 mb-2" />
                סרוק QR
              </Button>
              
              <Button variant="outline" className="h-16 bg-white/10 border-white/20 text-white hover:bg-white/20 flex-col">
                <Camera className="w-6 h-6 mb-2" />
                צלם וידאו
              </Button>
              
              <Button variant="outline" className="h-16 bg-white/10 border-white/20 text-white hover:bg-white/20 flex-col">
                <Trophy className="w-6 h-6 mb-2" />
                דירוג
              </Button>
              
              <Button variant="outline" className="h-16 bg-white/10 border-white/20 text-white hover:bg-white/20 flex-col">
                <CheckCircle className="w-6 h-6 mb-2" />
                הושלם
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Numbers and Statistics */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="hebrew-title">סטטיסטיקות ומספרים</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-spy-gold mb-2">1,234</div>
                <div className="text-sm text-gray-400">משתתפים כללי</div>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-spy-gold mb-2">89</div>
                <div className="text-sm text-gray-400">אירועים פעילים</div>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-spy-gold mb-2">456</div>
                <div className="text-sm text-gray-400">ציידים הושלמו</div>
              </div>
              
              <div className="p-4 bg-white/5 rounded-lg">
                <div className="text-3xl font-bold text-spy-gold mb-2">98%</div>
                <div className="text-sm text-gray-400">שביעות רצון</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6 text-center">
            <div className="space-y-2">
              <p className="text-lg font-semibold text-spy-gold hebrew-title">
                מערכת ציד האוצרות חפשתמטמון
              </p>
              <p className="text-gray-400 hebrew-body">
                פלטפורמה מתקדמת ליצירת וניהול ציידי אוצרות אינטרקטיביים
              </p>
              <p className="text-sm text-gray-500">
                תמיכה מלאה בעברית וכיוון כתיבה RTL • {formatDateTime(new Date())}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}