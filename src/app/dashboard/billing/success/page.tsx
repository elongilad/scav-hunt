import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { stripe } from '@/lib/stripe'
import { 
  CheckCircle,
  Crown,
  Calendar,
  CreditCard,
  ArrowRight
} from 'lucide-react'

interface PageProps {
  searchParams: {
    session_id?: string
  }
}

export default async function BillingSuccessPage({ searchParams }: PageProps) {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = createClient()

  const currentOrg = orgs[0]
  if (!currentOrg) {
    return <div>ארגון לא נמצא</div>
  }

  let session = null
  let subscription = null

  // Get Stripe session details if provided
  if (searchParams.session_id) {
    try {
      session = await stripe.checkout.sessions.retrieve(searchParams.session_id)
      
      if (session.subscription) {
        subscription = await stripe.subscriptions.retrieve(session.subscription as string)
      }
    } catch (error) {
      console.error('Error retrieving session:', error)
    }
  }

  // Get current subscription from database
  const { data: dbSubscription } = await supabase
    .from('org_subscriptions')
    .select('*')
    .eq('org_id', currentOrg.id)
    .eq('status', 'active')
    .single()

  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black p-6">
      <div className="max-w-2xl mx-auto space-y-8">
        {/* Success Header */}
        <Card className="bg-green-500/20 border-green-500/30 text-white">
          <CardContent className="p-8 text-center">
            <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-6" />
            <h1 className="text-3xl font-bold text-green-400 mb-4">
              תשלום הושלם בהצלחה!
            </h1>
            <p className="text-gray-300 text-lg">
              תודה על הרכישה. המנוי שלכם פעיל ומוכן לשימוש.
            </p>
          </CardContent>
        </Card>

        {/* Payment Details */}
        {session && (
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-6 h-6 text-spy-gold" />
                פרטי התשלום
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm">סכום</p>
                  <p className="font-bold text-lg">
                    {new Intl.NumberFormat('he-IL', {
                      style: 'currency',
                      currency: session.currency?.toUpperCase() || 'ILS',
                    }).format((session.amount_total || 0) / 100)}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">תאריך</p>
                  <p className="font-medium">
                    {new Date().toLocaleDateString('he-IL')}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">מזהה תשלום</p>
                  <p className="font-mono text-sm text-gray-300">
                    {session.id.substring(0, 20)}...
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-400 text-sm">סטטוס</p>
                  <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                    הושלם
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Subscription Details */}
        {(subscription || dbSubscription) && (
          <Card className="bg-white/10 border-white/20 text-white">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-spy-gold" />
                פרטי המנוי
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {subscription && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">תכנית:</span>
                    <span className="font-medium">
                      {subscription.items.data[0]?.price.nickname || 'מנוי פרימיום'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">מחזור חיוב:</span>
                    <span className="font-medium">חודשי</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">חידוש הבא:</span>
                    <span className="font-medium flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {new Date((subscription as any).current_period_end * 1000).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </>
              )}
              
              <div className="border-t border-white/10 pt-4">
                <p className="text-sm text-gray-400">
                  המנוי שלכם פעיל ותוכלו להתחיל להשתמש בכל התכונות מיד.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>מה הלאה?</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-spy-gold text-sm font-bold">1</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">התחילו ליצור אירועים</p>
                  <p className="text-gray-400 text-xs">אתם יכולים עכשיו ליצור אירועים בהתאם לתכנית שלכם</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-spy-gold text-sm font-bold">2</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">הזמינו משתתפים</p>
                  <p className="text-gray-400 text-xs">שתפו קודי צוות עם המשתתפים שלכם</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 bg-spy-gold/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-spy-gold text-sm font-bold">3</span>
                </div>
                <div>
                  <p className="text-white text-sm font-medium">נהלו את המנוי</p>
                  <p className="text-gray-400 text-xs">עקבו אחר השימוש ונהלו תשלומים בעמוד החיובים</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/dashboard/events" className="flex-1">
            <Button className="w-full bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold h-12">
              <ArrowRight className="w-5 h-5 mr-2" />
              התחל ליצור אירועים
            </Button>
          </Link>
          
          <Link href="/dashboard/billing" className="flex-1">
            <Button variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20 h-12">
              <CreditCard className="w-5 h-5 mr-2" />
              עמוד התשלומים
            </Button>
          </Link>
        </div>

        {/* Support */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6 text-center">
            <h3 className="font-semibold text-white mb-2">צריכים עזרה?</h3>
            <p className="text-gray-400 text-sm mb-4">
              אם יש לכם שאלות או בעיות, אנו כאן לעזור
            </p>
            <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              צור קשר עם התמיכה
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}