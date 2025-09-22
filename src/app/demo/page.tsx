import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Play, Users, MapPin, Video, Clock, Star, CheckCircle } from 'lucide-react'
import { OptimizedImage } from '@/components/OptimizedImage'
import { PageBreadcrumb, breadcrumbConfigs } from '@/components/Breadcrumb'

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      {/* Breadcrumb */}
      <PageBreadcrumb items={breadcrumbConfigs.demo} />

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">🕵️ Platform Demo</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            See Khapesethamatmon <span className="text-spy-gold">In Action</span>
          </h1>

          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Watch how easy it is to create professional spy-themed scavenger hunts
          </p>

          {/* Demo Video */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 mb-12">
            <div className="aspect-video rounded-lg relative overflow-hidden group cursor-pointer">
              <OptimizedImage
                src="/demo-thumbnail.jpg"
                alt="Platform demo video thumbnail"
                fill
                priority
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 1200px"
                quality={90}
                className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-300" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 bg-spy-gold/90 hover:bg-spy-gold rounded-full flex items-center justify-center transition-colors duration-300">
                  <Play className="w-8 h-8 text-black ml-1" />
                </div>
              </div>
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h3 className="text-xl font-semibold mb-2">Platform Demo Video</h3>
                <p className="text-gray-200 text-sm">See how easy it is to create spy scavenger hunts</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold text-lg px-8 py-4">
                <Play className="w-5 h-5 mr-2" />
                Try It Now
              </Button>
            </Link>

            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Demo Features */}
      <section className="container mx-auto px-4 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            What You'll See in the Demo
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            A complete walkthrough of creating, managing, and running a spy scavenger hunt
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Demo Feature 1 - QR Code Station */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <div className="aspect-video relative overflow-hidden">
              <OptimizedImage
                src="/feature-qr.jpg"
                alt="QR code station setup"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                quality={85}
                className="object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle>Station Setup</CardTitle>
              <CardDescription className="text-gray-300">
                See how to mark locations and create QR codes for each station
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-spy-gold mr-2" />
                  Interactive map selection
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-spy-gold mr-2" />
                  Automatic QR code generation
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-spy-gold mr-2" />
                  Print-ready materials
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Demo Feature 2 - Video Creation */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <div className="aspect-video relative overflow-hidden">
              <OptimizedImage
                src="/feature-video.jpg"
                alt="Video creation interface"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                quality={85}
                className="object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle>Video Creation</CardTitle>
              <CardDescription className="text-gray-300">
                Watch the automated video compilation process in action
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-spy-gold mr-2" />
                  Upload custom clips
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-spy-gold mr-2" />
                  Professional templates
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-spy-gold mr-2" />
                  Automated compilation
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* Demo Feature 3 - Real-Time Tracking */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <div className="aspect-video relative overflow-hidden">
              <OptimizedImage
                src="/feature-tracking.jpg"
                alt="Real-time tracking dashboard"
                fill
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                quality={85}
                className="object-cover"
              />
            </div>
            <CardHeader>
              <CardTitle>Real-Time Tracking</CardTitle>
              <CardDescription className="text-gray-300">
                Experience live team progress monitoring and control
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-spy-gold mr-2" />
                  Live team positions
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-spy-gold mr-2" />
                  Progress visualization
                </li>
                <li className="flex items-center">
                  <CheckCircle className="w-4 h-4 text-spy-gold mr-2" />
                  Manual controls
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Demo Stats */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Demo Event Showcase
            </h2>
            <p className="text-lg text-gray-300">
              Sample event created for demonstration purposes
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">8</div>
              <div className="text-gray-300 text-sm">Stations Created</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">5</div>
              <div className="text-gray-300 text-sm">Teams Participating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">45</div>
              <div className="text-gray-300 text-sm">Minutes Duration</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-spy-gold mb-2">100%</div>
              <div className="text-gray-300 text-sm">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-12 border border-white/20 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Ready to Create Your Own?
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Start building professional spy scavenger hunts in minutes
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/login">
              <Button size="lg" className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold text-lg px-8 py-4">
                Get Started Free
              </Button>
            </Link>

            <Link href="/contact">
              <Button size="lg" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-lg px-8 py-4">
                Schedule Demo Call
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