import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Shield, AlertTriangle } from 'lucide-react'
import { PageBreadcrumb } from '@/components/Breadcrumb'

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      {/* Breadcrumb */}
      <PageBreadcrumb items={[{ label: 'Error', current: true }]} />

      <div className="flex items-center justify-center min-h-[calc(100vh-120px)]">
        <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-12">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle className="w-10 h-10 text-red-400" />
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Access <span className="text-red-400">Denied</span>
              </h1>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                You don't have permission to access this resource. Please check your credentials or contact an administrator.
              </p>

              <div className="space-y-4">
                <p className="text-gray-400 text-sm">
                  Error Code: 401 - Unauthorized
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/">
                    <Button size="lg" className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                      <ArrowLeft className="w-5 h-5 mr-2" />
                      Return Home
                    </Button>
                  </Link>

                  <Link href="/auth/login">
                    <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                      <Shield className="w-5 h-5 mr-2" />
                      Sign In
                    </Button>
                  </Link>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </div>
      </div>
    </div>
  )
}