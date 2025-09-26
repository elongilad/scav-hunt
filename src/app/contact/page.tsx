import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ContactForm } from '@/components/ContactForm';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, Phone, MapPin, Clock } from 'lucide-react';
import { LanguageProvider } from '@/contexts/LanguageContext';

export default function ContactPage() {
  return (
    <LanguageProvider>
      <Header />

      {/* Hero Section */}
      <section className="py-20 md:py-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-display text-4xl md:text-5xl text-brand-navy mb-6">
            Get in <span className="text-brand-teal">Touch</span>
          </h1>
          <p className="text-lg text-slate-700 max-w-3xl mx-auto mb-12">
            Ready to create amazing scavenger hunts? We're here to help you get started.
          </p>
        </div>
      </section>

      {/* Contact Options */}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {/* Email */}
          <Card className="bg-white/90 backdrop-blur-lg border-brand-teal/20 shadow-xl text-brand-navy text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-brand-teal/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Mail className="w-6 h-6 text-brand-teal" />
              </div>
              <CardTitle className="text-lg">Email Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-sm mb-4">Get in touch via email</p>
              <a
                href="mailto:hello@buildaquest.com"
                className="text-brand-teal hover:text-brand-teal/80 transition-colors"
              >
                hello@buildaquest.com
              </a>
            </CardContent>
          </Card>

          {/* Phone */}
          <Card className="bg-white/90 backdrop-blur-lg border-brand-teal/20 shadow-xl text-brand-navy text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-brand-teal/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Phone className="w-6 h-6 text-brand-teal" />
              </div>
              <CardTitle className="text-lg">Call Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-sm mb-4">Speak with our team</p>
              <a
                href="tel:+1-555-123-4567"
                className="text-brand-teal hover:text-brand-teal/80 transition-colors"
              >
                +1-555-123-4567
              </a>
            </CardContent>
          </Card>

          {/* Location */}
          <Card className="bg-white/90 backdrop-blur-lg border-brand-teal/20 shadow-xl text-brand-navy text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-brand-teal/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-6 h-6 text-brand-teal" />
              </div>
              <CardTitle className="text-lg">Visit Us</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-sm mb-4">Our office location</p>
              <p className="text-brand-teal">
                San Francisco, CA
              </p>
            </CardContent>
          </Card>

          {/* Hours */}
          <Card className="bg-white/90 backdrop-blur-lg border-brand-teal/20 shadow-xl text-brand-navy text-center">
            <CardHeader>
              <div className="w-12 h-12 bg-brand-teal/20 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Clock className="w-6 h-6 text-brand-teal" />
              </div>
              <CardTitle className="text-lg">Office Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-sm mb-4">When we're available</p>
              <div className="text-brand-teal text-sm">
                <p>Mon-Fri: 9AM-6PM PST</p>
                <p>Weekend: Emergency only</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/90 backdrop-blur-lg border-brand-teal/20 shadow-xl text-brand-navy">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl mb-2">Send us a Message</CardTitle>
              <CardDescription className="text-gray-700">
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
            <h2 className="text-3xl md:text-4xl font-bold text-brand-navy mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-700">
              Quick answers to common questions
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-white/90 backdrop-blur-lg border-brand-teal/20 shadow-xl text-brand-navy">
              <CardHeader>
                <CardTitle className="text-lg">How do I get started?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  Sign up for a free account, choose a hunt model, customize your event, and you're ready to go!
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-lg border-brand-teal/20 shadow-xl text-brand-navy">
              <CardHeader>
                <CardTitle className="text-lg">Do you offer custom events?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  Yes! We can create fully customized scavenger hunts tailored to your specific needs and location.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-lg border-brand-teal/20 shadow-xl text-brand-navy">
              <CardHeader>
                <CardTitle className="text-lg">What's included in the platform?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  QR code generation, video creation tools, real-time tracking, team management, and printable materials.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-white/90 backdrop-blur-lg border-brand-teal/20 shadow-xl text-brand-navy">
              <CardHeader>
                <CardTitle className="text-lg">How long does setup take?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-sm">
                  Most events can be set up in 15-30 minutes using our pre-built templates and automated tools.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <Footer />
    </LanguageProvider>
  );
}