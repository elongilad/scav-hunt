import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, AlertCircle, RefreshCw } from 'lucide-react'

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-navy via-slate-800 to-slate-900 flex items-center justify-center">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-12">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle className="w-10 h-10 text-red-400" />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Authentication <span className="text-red-400">Error</span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                There was a problem with your authentication code. This could be due to an expired link, invalid code, or network issue.
              </p>

              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 mb-8">
                <p className="text-red-300 text-sm">
                  <strong>Common causes:</strong><br />
                  • Authentication link has expired<br />
                  • Code was already used<br />
                  • Network connectivity issues<br />
                  • Invalid or corrupted authentication state
                </p>
              </div>

              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Error Code: AUTH_CODE_ERROR
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/login">
                    <Button size="lg" className="bg-brand-teal hover:bg-brand-teal/90 text-white font-semibold">
                      <RefreshCw className="w-5 h-5 mr-2" />
                      Try Again
                    </Button>
                  </Link>

                  <Link href="/">
                    <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Return Home
                    </Button>
                  </Link>
                </div>

                <div className="mt-8 pt-6 border-t border-white/20">
                  <p className="text-gray-400 text-sm mb-4">
                    Still having trouble?
                  </p>
                  <Link href="/contact">
                    <Button variant="ghost" className="text-brand-teal hover:text-brand-teal/80">
                      Contact Support
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}