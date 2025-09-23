import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import Link from 'next/link'
import { PRICING_PLANS, formatPrice } from '@/lib/stripe'
import PricingClient from './PricingClient'
import { 
  Crown,
  Check,
  ArrowLeft,
  Star,
  Zap,
  Shield,
  Users
} from 'lucide-react'

const planIcons = {
  free: Users,
  basic: Star,
  pro: Zap,
  enterprise: Shield
}

const planColors = {
  free: 'text-gray-400',
  basic: 'text-blue-400',
  pro: 'text-spy-gold',
  enterprise: 'text-purple-400'
}

export default async function PricingPlansPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = await createClient()

  const currentOrg = (orgs as any[])[0]
  if (!currentOrg) {
    return <div>ארגון לא נמצא</div>
  }

  // Get current subscription
  const { data: subscription } = await supabase
    .from('org_subscriptions')
    .select('*')
    .eq('org_id', currentOrg.id)
    .eq('status', 'active')
    .single()

  const currentPlanId = subscription?.plan_id || 'free'

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-4 mb-2">
            <Link href="/dashboard/billing">
              <button className="flex items-center gap-2 text-gray-400 hover:text-white">
                <ArrowLeft className="w-4 h-4" />
                חזור לתשלומים
              </button>
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-white mb-2">
            <Crown className="w-8 h-8 text-spy-gold inline mr-3" />
            תכניות תמחור
          </h1>
          <p className="text-gray-300">
            בחרו את התכנית המתאימה לכם
          </p>
        </div>
      </div>

      {/* Current Plan Notice */}
      {subscription && (
        <Card className="bg-spy-gold/20 border-spy-gold/30 text-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <Crown className="w-6 h-6 text-spy-gold" />
              <div>
                <h3 className="font-semibold text-spy-gold">התכנית הנוכחית שלכם</h3>
                <p className="text-gray-300">
                  אתם כרגע ב{PRICING_PLANS[currentPlanId as keyof typeof PRICING_PLANS].name} • 
                  מתחדש ב-{new Date((subscription as any).current_period_end).toLocaleDateString('he-IL')}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pricing Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Object.entries(PRICING_PLANS).map(([planId, plan]) => {
          const IconComponent = planIcons[planId as keyof typeof planIcons]
          const isCurrentPlan = planId === currentPlanId
          const isUpgrade = Object.keys(PRICING_PLANS).indexOf(planId) > Object.keys(PRICING_PLANS).indexOf(currentPlanId)
          
          return (
            <Card 
              key={planId}
              className={`
                relative text-white transition-all duration-300 hover:scale-105
                ${isCurrentPlan 
                  ? 'bg-spy-gold/20 border-spy-gold/50 ring-2 ring-spy-gold/30' 
                  : 'bg-white/10 border-white/20 hover:border-white/30'
                }
                ${planId === 'pro' ? 'lg:scale-110 lg:z-10' : ''}
              `}
            >
              {planId === 'pro' && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-spy-gold text-black font-bold">
                  הכי פופולרי
                </Badge>
              )}
              
              {isCurrentPlan && (
                <Badge className="absolute -top-3 right-4 bg-green-500 text-white">
                  התכנית שלכם
                </Badge>
              )}

              <CardHeader className="text-center">
                <div className={`w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4`}>
                  <IconComponent className={`w-8 h-8 ${planColors[planId as keyof typeof planColors]}`} />
                </div>
                
                <CardTitle className="text-xl">{plan.name}</CardTitle>
                
                <div className="py-4">
                  <div className="text-4xl font-bold text-white">
                    {formatPrice(plan.price)}
                  </div>
                  <div className="text-gray-400 text-sm">לחודש</div>
                </div>
              </CardHeader>

              <CardContent className="space-y-6">
                {/* Features */}
                <div className="space-y-3">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>

                {/* Limits */}
                <div className="border-t border-white/10 pt-4 space-y-2">
                  <div className="text-xs text-gray-400 space-y-1">
                    <div>אירועים: {plan.limits.events_per_month === -1 ? 'ללא הגבלה' : plan.limits.events_per_month}</div>
                    <div>משתתפים: {plan.limits.participants_per_event === -1 ? 'ללא הגבלה' : plan.limits.participants_per_event}</div>
                    <div>אחסון: {plan.limits.video_storage_gb}GB</div>
                  </div>
                </div>

                {/* Action Button */}
                <PricingClient 
                  planId={planId}
                  plan={plan}
                  currentPlanId={currentPlanId}
                  isCurrentPlan={isCurrentPlan}
                  isUpgrade={isUpgrade}
                  orgId={currentOrg.id}
                />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* FAQ / Additional Info */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>שאלות נפוצות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-white mb-2">האם אוכל לשנות תכנית בכל עת?</h4>
              <p className="text-gray-400 text-sm">
                כן, תוכלו לשדרג או להוריד דרגה בכל עת. שינויים יכנסו לתוקף באופן מיידי.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2">מה קורה אם אחרוג מהמגבלות?</h4>
              <p className="text-gray-400 text-sm">
                נודיע לכם כשאתם מתקרבים למגבלה ונציע לכם לשדרג את התכנית.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2">האם יש הנחות לארגונים?</h4>
              <p className="text-gray-400 text-sm">
                כן, אנו מציעים הנחות מיוחדות לארגונים גדולים ולמוסדות חינוך.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold text-white mb-2">איך עובד התשלום לאירוע?</h4>
              <p className="text-gray-400 text-sm">
                בנוסף למנוי, תוכלו לשלם עבור אירועים בודדים בהתאם למספר המשתתפים.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}