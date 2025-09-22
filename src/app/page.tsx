import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft, Play, Users, Video, MapPin, Star } from 'lucide-react'
import { HeroImage } from '@/components/OptimizedImage'

export default async function HomePage() {
  const supabase = await createClient()

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
                Login
              </Button>
            </Link>
            <Link href="/auth/login">
              <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-7xl font-bold text-white mb-6 leading-tight">
            Create <span className="text-spy-gold">Spy Games</span><br />
            Easily and Quickly
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Platform for building custom scavenger hunts with QR codes,
            mission videos and real-time tracking
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/auth/login">
              <Button size="lg" className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold text-lg px-8 py-4">
                <Play className="w-5 h-5 mr-2" />
                Start Creating Now
              </Button>
            </Link>

            <Link href="/demo">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4">
                <Video className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">5+</div>
              <div className="text-gray-300 text-sm">Teams per Event</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">∞</div>
              <div className="text-gray-300 text-sm">Possible Stations</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">100%</div>
              <div className="text-gray-300 text-sm">Customized</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">Real-Time</div>
              <div className="text-gray-300 text-sm">Advanced Tracking</div>
            </div>
          </div>
        </div>
      </section>

      {/* Hero Image Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            See It In <span className="text-spy-gold">Action</span>
          </h2>
          <p className="text-lg text-gray-300 mb-12">
            Real families enjoying spy-themed scavenger hunts with our platform
          </p>
          <HeroImage className="w-full" />
        </div>
      </section>

      {/* Features Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            How It Works?
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Build, manage and run professional scavenger hunts with amazing ease
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <MapPin className="w-8 h-8 text-spy-gold" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">Choose Stations</h3>
            <p className="text-gray-300 leading-relaxed">
              Mark locations on the map, upload custom videos and get ready-to-print QR codes
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Video className="w-8 h-8 text-spy-gold" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">Create Videos</h3>
            <p className="text-gray-300 leading-relaxed">
              The system automatically integrates your videos with professional templates and creates custom missions
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 text-center">
            <div className="w-16 h-16 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-spy-gold" />
            </div>
            <h3 className="text-2xl font-semibold text-white mb-4">Track in Real-Time</h3>
            <p className="text-gray-300 leading-relaxed">
              Watch team progress in the game, manage manually and control the experience at every moment
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Create the Experience?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Join the leading platform for creating professional scavenger hunts
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold text-lg px-8 py-4">
                Start for Free
              </Button>
            </Link>
            
            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4">
                Contact Us
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/20">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="text-gray-400 mb-4 md:mb-0">
            © 2024 Khapesethamatmon. All Rights Reserved.
          </div>
          
          <div className="flex gap-6">
            <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">
              Terms of Service
            </Link>
            <Link href="/contact" className="text-gray-400 hover:text-white transition-colors">
              Contact Us
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
