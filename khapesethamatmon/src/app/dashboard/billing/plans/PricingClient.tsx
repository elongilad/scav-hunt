'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { 
  Loader2,
  Crown,
  AlertTriangle
} from 'lucide-react'
import { getStripe } from '@/lib/stripe'

interface PricingClientProps {
  planId: string
  plan: any
  currentPlanId: string
  isCurrentPlan: boolean
  isUpgrade: boolean
  orgId: string
}

export default function PricingClient({ 
  planId, 
  plan, 
  currentPlanId, 
  isCurrentPlan, 
  isUpgrade, 
  orgId 
}: PricingClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubscribe = async () => {
    if (planId === 'free') {
      // Handle downgrade to free plan
      handleDowngradeToFree()
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          planId: planId,
          successUrl: `${window.location.origin}/dashboard/billing/success`,
          cancelUrl: `${window.location.origin}/dashboard/billing/plans`
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      // Redirect to Stripe Checkout
      const stripe = await getStripe()
      if (stripe) {
        await stripe.redirectToCheckout({ sessionId: data.sessionId })
      }

    } catch (err: any) {
      setError(err.message || 'שגיאה ביצירת תשלום')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDowngradeToFree = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      // Reload page to reflect changes
      window.location.reload()

    } catch (err: any) {
      setError(err.message || 'שגיאה בביטול המנוי')
    } finally {
      setIsLoading(false)
    }
  }

  const getButtonText = () => {
    if (isCurrentPlan) return 'התכנית הנוכחית'
    if (planId === 'free') return 'עבור לתכנית החינמית'
    if (isUpgrade) return 'שדרג עכשיו'
    return 'החלף תכנית'
  }

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'outline'
    if (planId === 'pro') return 'default'
    return 'outline'
  }

  const getButtonStyle = () => {
    if (isCurrentPlan) {
      return 'bg-white/10 border-white/20 text-white cursor-not-allowed'
    }
    if (planId === 'pro') {
      return 'bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold'
    }
    return 'bg-white/10 border-white/20 text-white hover:bg-white/20'
  }

  return (
    <div className="space-y-3">
      {error && (
        <div className="p-2 bg-red-500/20 border border-red-500/30 rounded text-red-400 text-xs flex items-center gap-2">
          <AlertTriangle className="w-3 h-3" />
          {error}
        </div>
      )}
      
      <Button 
        onClick={handleSubscribe}
        disabled={isLoading || isCurrentPlan}
        variant={getButtonVariant()}
        className={`w-full h-12 ${getButtonStyle()}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            מעבד...
          </>
        ) : (
          <>
            {!isCurrentPlan && planId !== 'free' && (
              <Crown className="w-4 h-4 mr-2" />
            )}
            {getButtonText()}
          </>
        )}
      </Button>

      {isCurrentPlan && (
        <p className="text-xs text-center text-gray-400">
          זו התכנית הפעילה שלכם
        </p>
      )}
    </div>
  )
}