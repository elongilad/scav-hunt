import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, FileText, Scale, AlertTriangle, CheckCircle } from 'lucide-react'
import { PageBreadcrumb, breadcrumbConfigs } from '@/components/Breadcrumb'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      {/* Breadcrumb */}
      <PageBreadcrumb items={breadcrumbConfigs.terms} />

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <span className="text-2xl font-bold text-white">Terms of Service</span>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Scale className="w-10 h-10 text-spy-gold" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Terms of <span className="text-spy-gold">Service</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Please read these terms carefully before using our platform. By using Khapesethamatmon, you agree to these terms.
          </p>
          <div className="text-sm text-gray-400">
            Last updated: December 2024
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Agreement */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <FileText className="w-6 h-6 text-spy-gold mr-3" />
                <h2 className="text-2xl font-bold">Agreement to Terms</h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <p>
                  By accessing and using the Khapesethamatmon platform ("Service"), you accept and agree to be bound by these Terms of Service ("Terms").
                  If you do not agree to abide by these Terms, you are not authorized to use or access the Service.
                </p>
                <p>
                  These Terms constitute a legally binding agreement between you and Khapesethamatmon regarding your use of the Service.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Service Description */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Service Description</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  Khapesethamatmon is a platform that allows users to create, manage, and run spy-themed scavenger hunts. Our services include:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Hunt model templates and customization tools</li>
                  <li>QR code generation and management</li>
                  <li>Video creation and compilation services</li>
                  <li>Real-time team tracking and progress monitoring</li>
                  <li>Event management and analytics</li>
                  <li>Printable materials and resources</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* User Accounts */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">User Accounts and Responsibilities</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Account Creation</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You must be at least 13 years old to create an account</li>
                    <li>You must provide accurate and complete information</li>
                    <li>You are responsible for maintaining account security</li>
                    <li>One account per person; no sharing of accounts</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Account Security</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Keep your password confidential and secure</li>
                    <li>Notify us immediately of any unauthorized access</li>
                    <li>You are liable for all activities under your account</li>
                    <li>Log out from shared devices and public computers</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Acceptable Use */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <CheckCircle className="w-6 h-6 text-spy-gold mr-3" />
                <h2 className="text-2xl font-bold">Acceptable Use Policy</h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree NOT to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Violate any applicable laws or regulations</li>
                  <li>Infringe on intellectual property rights</li>
                  <li>Upload malicious code, viruses, or harmful content</li>
                  <li>Attempt to gain unauthorized access to our systems</li>
                  <li>Use the Service for commercial purposes without authorization</li>
                  <li>Create events that promote illegal activities or harm</li>
                  <li>Harass, abuse, or harm other users</li>
                  <li>Spam or send unsolicited communications</li>
                  <li>Reverse engineer or attempt to extract source code</li>
                  <li>Resell or redistribute the Service without permission</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Content and Intellectual Property */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Content and Intellectual Property</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Your Content</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You retain ownership of content you upload or create</li>
                    <li>You grant us license to use your content to provide the Service</li>
                    <li>You are responsible for ensuring you have rights to uploaded content</li>
                    <li>You must not upload copyrighted material without permission</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Our Content</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>The platform, features, and templates are our intellectual property</li>
                    <li>You may not copy, modify, or distribute our content</li>
                    <li>Trademarks and logos are protected intellectual property</li>
                    <li>Templates and assets are licensed for use within the platform only</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment and Subscriptions */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Payment and Subscriptions</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Billing</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Subscription fees are billed in advance on a recurring basis</li>
                    <li>All payments are processed securely through third-party providers</li>
                    <li>Prices may change with 30 days notice</li>
                    <li>Failed payments may result in service suspension</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Cancellation and Refunds</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>You can cancel your subscription at any time</li>
                    <li>Cancellation takes effect at the end of the current billing period</li>
                    <li>Refunds are provided at our discretion for unused portions</li>
                    <li>Free trial cancellations do not incur charges</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy and Data */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Privacy and Data Protection</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  Your privacy is important to us. Our collection and use of personal information is governed by our
                  <Link href="/privacy" className="text-spy-gold hover:text-spy-gold/80 ml-1">Privacy Policy</Link>,
                  which is incorporated into these Terms by reference.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>We collect and process data as described in our Privacy Policy</li>
                  <li>You consent to data processing necessary to provide the Service</li>
                  <li>We implement security measures to protect your information</li>
                  <li>You can request data deletion subject to legal requirements</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Disclaimers */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <AlertTriangle className="w-6 h-6 text-spy-gold mr-3" />
                <h2 className="text-2xl font-bold">Disclaimers and Limitations</h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Service Availability</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>The Service is provided "as is" without warranties</li>
                    <li>We do not guarantee uninterrupted or error-free service</li>
                    <li>Maintenance and updates may cause temporary unavailability</li>
                    <li>Third-party services may affect platform functionality</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Limitation of Liability</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Our liability is limited to the amount paid for the Service</li>
                    <li>We are not liable for indirect or consequential damages</li>
                    <li>Users are responsible for event safety and compliance</li>
                    <li>We do not guarantee specific outcomes or results</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Termination */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Termination</h2>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Termination by You</h3>
                  <p>You may terminate your account at any time by contacting us or using account settings.</p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Termination by Us</h3>
                  <p>We may suspend or terminate your account if you:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Violate these Terms of Service</li>
                    <li>Engage in fraudulent or illegal activities</li>
                    <li>Fail to pay subscription fees</li>
                    <li>Misuse the platform or harm other users</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Effect of Termination</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Access to the Service will be revoked immediately</li>
                    <li>Your data may be deleted after a reasonable period</li>
                    <li>Outstanding fees remain due and payable</li>
                    <li>These Terms survive termination where applicable</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Governing Law */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Governing Law and Disputes</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  These Terms are governed by the laws of Israel. Any disputes arising from these Terms or your use of the Service
                  will be resolved through binding arbitration in Tel Aviv, Israel, except where prohibited by law.
                </p>
                <p>
                  If any provision of these Terms is found to be unenforceable, the remaining provisions will continue in full force and effect.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Terms */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Changes to Terms</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  We reserve the right to modify these Terms at any time. We will notify users of significant changes through
                  email or platform notifications. Your continued use of the Service after changes become effective constitutes
                  acceptance of the updated Terms.
                </p>
                <p>
                  We recommend reviewing these Terms periodically to stay informed of any updates.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Contact Information</h2>
              <div className="text-gray-300">
                <p className="mb-4">
                  If you have questions about these Terms of Service, please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> <a href="mailto:legal@khapesethamatmon.com" className="text-spy-gold hover:text-spy-gold/80">legal@khapesethamatmon.com</a></p>
                  <p><strong>Phone:</strong> <a href="tel:+972-50-123-4567" className="text-spy-gold hover:text-spy-gold/80">+972-50-123-4567</a></p>
                  <p><strong>Address:</strong> Tel Aviv, Israel</p>
                </div>
              </div>
            </CardContent>
          </Card>

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