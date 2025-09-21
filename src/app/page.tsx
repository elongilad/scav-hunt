import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Play, Users, Video, MapPin, Star } from 'lucide-react'

export default async function HomePage() {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  // If user is logged in, redirect to dashboard
  if (user) {
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-white">🕵️ Khapesethamatmon</h1>
          </div>
          
          <div className="flex gap-4">
            <Link href="/auth/login">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                התחברות
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                התחל עכשיו
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            צור <span className="text-spy-gold">משחקי ריגול</span><br />
            בקלות ובמהירות
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            פלטפורמה לבניית מסעות ציד אוצרות מותאמים אישית עם קודי QR, 
            סרטוני משימות וניטור בזמן אמת
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/login">
              <Button size="lg" className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold text-lg px-8 py-4">
                <Play className="w-5 h-5 mr-2" />
                התחל ליצור עכשיו
              </Button>
            </Link>
            
            <Link href="/demo">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4">
                <Video className="w-5 h-5 mr-2" />
                צפה בדמו
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">5+</div>
              <div className="text-gray-300 text-sm">קבוצות לאירוע</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">∞</div>
              <div className="text-gray-300 text-sm">עמדות אפשריות</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">100%</div>
              <div className="text-gray-300 text-sm">מותאם אישית</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">זמן אמת</div>
              <div className="text-gray-300 text-sm">מעקב מתקדם</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            איך זה עובד?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            בנה, נהל והפעל מסעות ציד אוצרות מקצועיים בקלות מדהימה
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-spy-gold" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">בחר עמדות</h3>
            <p className="text-gray-300 leading-relaxed">
              סמן מקומות על המפה, העלה סרטונים מותאמים אישית וקבל קודי QR מוכנים להדפסה
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-8 h-8 text-spy-gold" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">יצור סרטונים</h3>
            <p className="text-gray-300 leading-relaxed">
              המערכת משלבת אוטומטית את הסרטונים שלך עם תבניות מקצועיות ויוצרת משימות מותאמות
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-spy-gold" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">עקוב בזמן אמת</h3>
            <p className="text-gray-300 leading-relaxed">
              צפה בהתקדמות הקבוצות במשחק, נהל באופן ידני ושלוט על החוויה בכל רגע
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            מוכן ליצור את החוויה?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            הצטרף לפלטפורמה המובילה ליצירת מסעות ציד אוצרות מקצועיים
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold text-lg px-8 py-4">
                התחל בחינם
              </Button>
            </Link>
            
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4">
                צור קשר
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/20">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 mb-4 md:mb-0">
            © 2024 Khapesethamatmon. כל הזכויות שמורות.
          </div>
          
          <div className="flex gap-6">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              מדיניות פרטיות
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              תנאי שימוש
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
              צור קשר
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
