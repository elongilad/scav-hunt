import { requireAuth } from '@/lib/auth'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  XCircle,
  ArrowLeft,
  RefreshCw,
  MessageCircle,
  CreditCard
} from 'lucide-react'

export default async function BillingCancelPage() {
  const user = await requireAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Cancel Header */}
        <Card className="bg-red-500/20 border-red-500/30 text-white">
          <CardContent className="p-8 text-center">
            <XCircle className="w-20 h-20 text-red-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-red-400 mb-4">
              התשלום בוטל
            </h1>
            <p className="text-gray-300 text-lg">
              התשלום לא הושלם. אין בעיה - תוכלו לנסות שוב בכל עת.
            </p>
          </CardContent>
        </Card>

        {/* What Happened */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>מה קרה?</CardTitle>
            <CardDescription className="text-gray-400">
              הסיבות האפשריות לביטול התשלום
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-spy-gold rounded-full mt-2" />
                <div>
                  <p className="text-white text-sm">לחצתם על כפתור "חזור" או סגרתם את הדף</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-spy-gold rounded-full mt-2" />
                <div>
                  <p className="text-white text-sm">בעיה טכנית עם כרטיס האשראי</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-spy-gold rounded-full mt-2" />
                <div>
                  <p className="text-white text-sm">החלטתם לדחות את הרכישה</p>
                </div>
              </div>
            </div>
            
            <div className="border-t border-white/10 pt-4">
              <p className="text-sm text-gray-400">
                בכל מקרה, המידע שלכם לא נשמר ולא חויבתם בכסף.
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>מה תוכלו לעשות עכשיו?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link href="/dashboard/billing/plans">
                <Button className="w-full bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold h-16 flex-col">
                  <RefreshCw className="w-6 h-6 mb-2" />
                  נסו שוב
                </Button>
              </Link>
              
              <Link href="/dashboard">
                <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-16 flex-col">
                  <ArrowLeft className="w-6 h-6 mb-2" />
                  חזור לדשבורד
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Alternative Options */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>אפשרויות נוספות</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium text-white">המשיכו עם התכנית החינמית</p>
                  <p className="text-sm text-gray-400">עד 2 אירועים בחודש, 20 משתתפים</p>
                </div>
                <Link href="/dashboard/events">
                  <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    התחל
                  </Button>
                </Link>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div>
                  <p className="font-medium text-white">תשלום לאירוע בודד</p>
                  <p className="text-sm text-gray-400">שלמו רק עבור האירועים שאתם צריכים</p>
                </div>
                <Link href="/dashboard/events/new">
                  <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <CreditCard className="w-4 h-4 mr-2" />
                    צור אירוע
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Support */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6 text-center">
            <MessageCircle className="w-12 h-12 text-spy-gold mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">נתקלתם בבעיה?</h3>
            <p className="text-gray-400 text-sm mb-4">
              אם היתה בעיה טכנית או שאתם צריכים עזרה, אנו כאן בשבילכם
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                צור קשר עם התמיכה
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                שאלות נפוצות
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}