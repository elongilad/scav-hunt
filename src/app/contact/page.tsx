import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, MapPin, Clock, MessageSquare, Send } from 'lucide-react'
import { ContactForm } from '@/components/ContactForm'
import { PageBreadcrumb, breadcrumbConfigs } from '@/components/Breadcrumb'

export default function ContactPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      {/* Breadcrumb */}
      <PageBreadcrumb items={breadcrumbConfigs.contact} />

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Contact Us</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Get in <span className="text-spy-gold">Touch</span>
          </h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Ready to create amazing spy scavenger hunts? We're here to help you get started.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Email */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-spy-gold/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-spy-gold" />
              </div>
              <CardTitle className="text-lg">Email Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4">Get in touch via email</p>
              <a
                href="mailto:hello@khapesethamatmon.com"
                className="text-spy-gold hover:text-spy-gold/80 transition-colors"
              >
                hello@khapesethamatmon.com
              </a>
            </CardContent>
          </Card>

          {/* Phone */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-spy-gold/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-spy-gold" />
              </div>
              <CardTitle className="text-lg">Call Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4">Speak with our team</p>
              <a
                href="tel:+972-50-123-4567"
                className="text-spy-gold hover:text-spy-gold/80 transition-colors"
              >
                +972-50-123-4567
              </a>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-spy-gold/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-spy-gold" />
              </div>
              <CardTitle className="text-lg">Visit Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4">Our office location</p>
              <p className="text-spy-gold">
                Tel Aviv, Israel
              </p>
            </CardContent>
          </Card>

          {/* Hours */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-spy-gold/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-spy-gold" />
              </div>
              <CardTitle className="text-lg">Office Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-300 text-sm mb-4">When we're available</p>
              <div className="text-spy-gold text-sm">
                <p>Sun-Thu: 9AM-6PM</p>
                <p>Fri: 9AM-2PM</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-2">Send us a Message</CardTitle>
              <CardDescription className="text-gray-300">
                Fill out the form below and we'll get back to you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ContactForm />
            </CardContent>
          </Card>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-300">
              Quick answers to common questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">How do I get started?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Sign up for a free account, choose a hunt model, customize your event, and you're ready to go!
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">Do you offer custom events?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Yes! We can create fully customized scavenger hunts tailored to your specific needs and location.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">What's included in the platform?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  QR code generation, video creation tools, real-time tracking, team management, and printable materials.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
              <CardHeader>
                <CardTitle className="text-lg">How long does setup take?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm">
                  Most events can be set up in 15-30 minutes using our pre-built templates and automated tools.
                </p>
              </CardContent>
            </Card>
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