import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import Link from 'next/link'
import { ArrowLeft, Shield, Eye, Lock, Users } from 'lucide-react'
import { PageBreadcrumb, breadcrumbConfigs } from '@/components/Breadcrumb'

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      {/* Breadcrumb */}
      <PageBreadcrumb items={breadcrumbConfigs.privacy} />

      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <div className="flex items-center space-x-4">
          <Link href="/">
            <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
          <h1 className="text-2xl font-bold text-white">Privacy Policy</h1>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto text-center">
          <div className="w-20 h-20 bg-spy-gold/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Shield className="w-10 h-10 text-spy-gold" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Privacy <span className="text-spy-gold">Policy</span>
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Your privacy and data security are our top priorities. Learn how we protect and handle your information.
          </p>
          <div className="text-sm text-gray-400">
            Last updated: December 2024
          </div>
        </div>
      </section>

      {/* Privacy Content */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto space-y-8">

          {/* Overview */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <Eye className="w-6 h-6 text-spy-gold mr-3" />
                <h2 className="text-2xl font-bold">Overview</h2>
              </div>
              <div className="prose prose-invert max-w-none">
                <p className="text-gray-300 leading-relaxed">
                  At Khapesethamatmon, we are committed to protecting your privacy and ensuring the security of your personal information.
                  This Privacy Policy explains how we collect, use, and safeguard your data when you use our spy scavenger hunt platform.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Information We Collect */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <Users className="w-6 h-6 text-spy-gold mr-3" />
                <h2 className="text-2xl font-bold">Information We Collect</h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Personal Information</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Name and email address when you create an account</li>
                    <li>Phone number (optional) for account verification</li>
                    <li>Profile information you choose to provide</li>
                    <li>Payment information for subscription services</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Event Data</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Scavenger hunt event details and configurations</li>
                    <li>Media files you upload for events</li>
                    <li>Team and participant information</li>
                    <li>Event analytics and progress data</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Technical Information</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Device information and browser type</li>
                    <li>IP address and location data</li>
                    <li>Usage patterns and interaction data</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* How We Use Information */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <div className="flex items-center mb-6">
                <Lock className="w-6 h-6 text-spy-gold mr-3" />
                <h2 className="text-2xl font-bold">How We Use Your Information</h2>
              </div>
              <div className="space-y-4 text-gray-300">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Service Provision</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Create and manage your account</li>
                    <li>Process and deliver scavenger hunt services</li>
                    <li>Generate QR codes and event materials</li>
                    <li>Provide customer support and assistance</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Platform Improvement</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Analyze usage patterns to improve our platform</li>
                    <li>Develop new features and functionality</li>
                    <li>Monitor and maintain platform security</li>
                    <li>Conduct research and analytics</li>
                  </ul>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white mb-2">Communication</h3>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Send important service notifications</li>
                    <li>Provide customer support responses</li>
                    <li>Share platform updates and new features</li>
                    <li>Send marketing communications (with consent)</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Data Sharing */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Data Sharing and Disclosure</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  We do not sell, trade, or rent your personal information to third parties. We may share your information only in the following circumstances:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Service Providers:</strong> Trusted third-party services that help us operate our platform (hosting, payment processing, analytics)</li>
                  <li><strong>Legal Requirements:</strong> When required by law, legal process, or to protect our rights and safety</li>
                  <li><strong>Business Transfers:</strong> In the event of a merger, acquisition, or sale of assets</li>
                  <li><strong>Consent:</strong> When you explicitly consent to sharing your information</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Data Security */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Data Security</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  We implement industry-standard security measures to protect your information:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Encryption of data in transit and at rest</li>
                  <li>Secure cloud infrastructure with regular backups</li>
                  <li>Access controls and authentication requirements</li>
                  <li>Regular security audits and monitoring</li>
                  <li>Employee training on data protection practices</li>
                </ul>
                <p>
                  While we strive to protect your information, no system is 100% secure. We encourage you to use strong passwords and keep your account information confidential.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Your Rights */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Your Rights and Choices</h2>
              <div className="space-y-4 text-gray-300">
                <p>You have the following rights regarding your personal information:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Access:</strong> Request a copy of the personal information we hold about you</li>
                  <li><strong>Correction:</strong> Update or correct inaccurate personal information</li>
                  <li><strong>Deletion:</strong> Request deletion of your personal information (subject to legal requirements)</li>
                  <li><strong>Portability:</strong> Request your data in a portable format</li>
                  <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                  <li><strong>Account Deletion:</strong> Delete your account and associated data</li>
                </ul>
                <p>
                  To exercise these rights, please contact us at <a href="mailto:privacy@khapesethamatmon.com" className="text-spy-gold hover:text-spy-gold/80">privacy@khapesethamatmon.com</a>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Cookies */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Cookies and Tracking</h2>
              <div className="space-y-4 text-gray-300">
                <p>
                  We use cookies and similar technologies to enhance your experience:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li><strong>Essential Cookies:</strong> Required for platform functionality and security</li>
                  <li><strong>Performance Cookies:</strong> Help us understand how you use our platform</li>
                  <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                  <li><strong>Marketing Cookies:</strong> Used for targeted advertising (with consent)</li>
                </ul>
                <p>
                  You can control cookie settings through your browser preferences. Note that disabling certain cookies may affect platform functionality.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Children's Privacy */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Children's Privacy</h2>
              <div className="text-gray-300">
                <p>
                  Our platform is designed for users 13 years and older. We do not knowingly collect personal information from children under 13.
                  If you believe we have collected information from a child under 13, please contact us immediately at
                  <a href="mailto:privacy@khapesethamatmon.com" className="text-spy-gold hover:text-spy-gold/80 ml-1">privacy@khapesethamatmon.com</a>.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Changes to Policy */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Changes to This Policy</h2>
              <div className="text-gray-300">
                <p>
                  We may update this Privacy Policy periodically to reflect changes in our practices or legal requirements.
                  We will notify you of significant changes through email or platform notifications. Your continued use of our platform
                  after changes become effective constitutes acceptance of the updated policy.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold mb-6">Contact Us</h2>
              <div className="text-gray-300">
                <p className="mb-4">
                  If you have questions about this Privacy Policy or our data practices, please contact us:
                </p>
                <div className="space-y-2">
                  <p><strong>Email:</strong> <a href="mailto:privacy@khapesethamatmon.com" className="text-spy-gold hover:text-spy-gold/80">privacy@khapesethamatmon.com</a></p>
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