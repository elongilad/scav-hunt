import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PRICING_PLANS, formatPrice } from '@/lib/stripe'
import BillingClient from './BillingClient'
import {
  CreditCard,
  Crown,
  Check,
  AlertTriangle,
  Calendar,
  Receipt,
  Settings,
  ArrowUp
} from 'lucide-react'

export default async function BillingPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = createClient()

  // Get current organization (assuming first org for now)
  const currentOrg = orgs[0]
  if (!currentOrg) {
    return (
      <div className="space-y-8">
        <div className="text-center py-12">
          <AlertTriangle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">ארגון לא נמצא</h2>
          <p className="text-gray-400 mb-6">עליכם להיות חברים בארגון כדי לגשת לעמוד התשלומים</p>
          <Link href="/dashboard">
            <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black">
              חזור לדשבורד
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // Get current subscription
  const { data: subscription } = await supabase
    .from('org_subscriptions')
    .select('*')
    .eq('org_id', currentOrg.id)
    .eq('status', 'active')
    .single()

  // Get recent payments
  const { data: payments } = await supabase
    .from('payment_logs')
    .select('*')
    .eq('org_id', currentOrg.id)
    .order('created_at', { ascending: false })
    .limit(10)

  // Get event payments
  const { data: eventPayments } = await supabase
    .from('event_payments')
    .select(`
      *,
      events (
        id,
        child_name,
        date_start
      )
    `)
    .eq('org_id', currentOrg.id)
    .order('created_at', { ascending: false })
    .limit(5)

  // Get usage statistics
  const { data: eventsThisMonth } = await supabase
    .from('events')
    .select('id')
    .eq('org_id', currentOrg.id)
    .gte('created_at', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())

  const currentPlan = subscription ? PRICING_PLANS[subscription.plan_id as keyof typeof PRICING_PLANS] : PRICING_PLANS.FREE

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">
            <CreditCard className="w-8 h-8 text-spy-gold inline mr-3" />
            תשלומים ומנויים
          </h1>
          <p className="text-gray-300">
            ניהול התכנית והתשלומים של {currentOrg.name}
          </p>
        </div>
        
        <div className="flex gap-3">
          <Link href="/dashboard/billing/plans">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowUp className="w-4 h-4 mr-2" />
              שדרג תכנית
            </Button>
          </Link>
          
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <Settings className="w-4 h-4 mr-2" />
            הגדרות תשלום
          </Button>
        </div>
      </div>

      {/* Current Plan */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-6 h-6 text-spy-gold" />
                התכנית הנוכחית
              </CardTitle>
              <CardDescription className="text-gray-400">
                סטטוס המנוי והגבלות שימוש
              </CardDescription>
            </div>
            
            <Badge 
              variant="outline"
              className={
                subscription?.status === 'active' ? 'border-green-500/30 text-green-400' :
                subscription?.status === 'past_due' ? 'border-red-500/30 text-red-400' :
                'border-gray-500/30 text-gray-400'
              }
            >
              {subscription?.status === 'active' ? 'פעיל' :
               subscription?.status === 'past_due' ? 'חוב' :
               subscription?.status === 'canceled' ? 'בוטל' :
               'בחינם'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Plan Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-xl font-bold text-spy-gold mb-2">{currentPlan.name}</h3>
                <p className="text-3xl font-bold text-white">
                  {formatPrice(currentPlan.price)}
                  <span className="text-sm text-gray-400 font-normal">/חודש</span>
                </p>
              </div>
              
              {subscription && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="w-4 h-4 text-spy-gold" />
                    <span className="text-gray-300">
                      מתחדש ב: {new Date(subscription.current_period_end).toLocaleDateString('he-IL')}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Usage Statistics */}
            <div className="space-y-4">
              <h4 className="font-medium text-white">שימוש החודש</h4>
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-400">אירועים</span>
                    <span className="text-white">
                      {eventsThisMonth?.length || 0} / {currentPlan.limits.events_per_month === -1 ? '∞' : currentPlan.limits.events_per_month}
                    </span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-spy-gold h-2 rounded-full" 
                      style={{ 
                        width: currentPlan.limits.events_per_month === -1 ? '20%' : 
                               `${Math.min(100, ((eventsThisMonth?.length || 0) / currentPlan.limits.events_per_month) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="space-y-4">
              <h4 className="font-medium text-white">תכונות התכנית</h4>
              <div className="space-y-2">
                {currentPlan.features.slice(0, 4).map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm">
                    <Check className="w-4 h-4 text-green-400" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Methods & Billing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Payment History */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5 text-spy-gold" />
              היסטוריית תשלומים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {payments && payments.length > 0 ? (
              <div className="space-y-3">
                {payments.slice(0, 5).map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">
                        {formatPrice(payment.amount || 0, payment.currency || 'ILS')}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(payment.created_at).toLocaleDateString('he-IL')}
                      </p>
                    </div>
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      הושלם
                    </Badge>
                  </div>
                ))}
                
                <Link href="/dashboard/billing/history">
                  <Button variant="outline" size="sm" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                    צפה בהיסטוריה המלאה
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="text-center py-8">
                <Receipt className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">אין תשלומים עדיין</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Event Payments */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>תשלומי אירועים</CardTitle>
          </CardHeader>
          <CardContent>
            {eventPayments && eventPayments.length > 0 ? (
              <div className="space-y-3">
                {eventPayments.map((payment) => (
                  <div key={payment.id} className="flex justify-between items-center p-3 bg-white/5 rounded-lg">
                    <div>
                      <p className="font-medium text-white">
                        {(payment.events as any)?.child_name || 'אירוע'}
                      </p>
                      <p className="text-sm text-gray-400">
                        {formatPrice(payment.amount || 0, payment.currency || 'ILS')} • {payment.participant_count} משתתפים
                      </p>
                    </div>
                    <Badge variant="outline" className="border-green-500/30 text-green-400">
                      {payment.status === 'completed' ? 'הושלם' : payment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-400">אין תשלומי אירועים עדיין</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Billing Management */}
      <BillingClient 
        currentPlan={currentPlan}
        subscription={subscription}
        orgId={currentOrg.id}
      />
    </div>
  )
}