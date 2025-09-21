'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  CreditCard,
  Download,
  AlertTriangle,
  Loader2,
  ExternalLink,
  RefreshCw
} from 'lucide-react'

interface BillingClientProps {
  currentPlan: any
  subscription: any
  orgId: string
}

export default function BillingClient({ currentPlan, subscription, orgId }: BillingClientProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleManageSubscription = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: subscription?.stripe_customer_id,
          returnUrl: window.location.href
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      // Redirect to Stripe Customer Portal
      window.location.href = data.url

    } catch (err: any) {
      setError(err.message || 'שגיאה בפתיחת ממשק הניהול')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDownloadInvoices = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/stripe/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: subscription?.stripe_customer_id
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error)
      }

      // Open invoices in new tabs
      data.invoices.forEach((invoice: any) => {
        window.open(invoice.invoice_pdf, '_blank')
      })

    } catch (err: any) {
      setError(err.message || 'שגיאה בהורדת החשבוניות')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {/* Billing Management */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>ניהול חיובים</CardTitle>
          <CardDescription className="text-gray-400">
            עדכון פרטי תשלום וניהול מנוי
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {subscription ? (
              <>
                <Button 
                  onClick={handleManageSubscription}
                  disabled={isLoading}
                  className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold h-12"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <CreditCard className="w-5 h-5 mr-2" />
                  )}
                  נהל מנוי ותשלום
                </Button>

                <Button 
                  onClick={handleDownloadInvoices}
                  disabled={isLoading}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-12"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <Download className="w-5 h-5 mr-2" />
                  )}
                  הורד חשבוניות
                </Button>
              </>
            ) : (
              <div className="md:col-span-2">
                <div className="text-center py-8">
                  <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">אין מנוי פעיל</h3>
                  <p className="text-gray-400 mb-6">
                    אתם כרגע בתכנית החינמית. שדרגו כדי לקבל תכונות מתקדמות יותר.
                  </p>
                  <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    שדרג לתכנית בתשלום
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>פעולות מהירות</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button 
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-16 flex-col"
            >
              <RefreshCw className="w-6 h-6 mb-2" />
              רענן סטטוס
            </Button>
            
            <Button 
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-16 flex-col"
            >
              <Download className="w-6 h-6 mb-2" />
              ייצא נתונים
            </Button>
            
            <Button 
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 h-16 flex-col"
            >
              <CreditCard className="w-6 h-6 mb-2" />
              תמיכה בתשלום
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}