import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Search, Home, HelpCircle } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black flex items-center justify-center">
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto text-center">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-12">
              <div className="w-20 h-20 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="w-10 h-10 text-spy-gold" />
              </div>

              <h1 className="text-6xl md:text-8xl font-bold text-spy-gold mb-4">
                404
              </h1>

              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
                Mission <span className="text-spy-gold">Not Found</span>
              </h2>

              <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                The page you're looking for seems to have vanished like a secret agent.
                It might have been moved, deleted, or never existed.
              </p>

              <div className="bg-spy-gold/10 border border-spy-gold/20 rounded-lg p-4 mb-8">
                <p className="text-spy-gold text-sm">
                  <strong>🕵️ Agent Tips:</strong><br />
                  • Check the URL for typos<br />
                  • Use the navigation menu<br />
                  • Return to headquarters (home page)<br />
                  • Contact mission control if needed
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/">
                  <Button size="lg" className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                    <Home className="w-5 h-5 mr-2" />
                    Return to Base
                  </Button>
                </Link>

                <Link href="/contact">
                  <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <HelpCircle className="w-5 h-5 mr-2" />
                    Get Help
                  </Button>
                </Link>
              </div>

              <div className="mt-8 pt-6 border-t border-white/20">
                <p className="text-gray-400 text-sm">
                  Ready to start your own mission?
                </p>
                <Link href="/auth/login" className="text-spy-gold hover:text-spy-gold/80 text-sm">
                  Create Scavenger Hunt →
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}