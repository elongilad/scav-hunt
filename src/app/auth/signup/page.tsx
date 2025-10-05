'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { signUpWithEmail } from '@/app/auth/actions'
import { Eye, EyeOff, Mail, Lock, Loader2, ArrowLeft, X, User } from 'lucide-react'
import Link from 'next/link'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    if (password !== confirmPassword) {
      setMessage('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long')
      setLoading(false)
      return
    }

    try {
      const result = await signUpWithEmail(email, password, fullName)

      if (!result.success) {
        throw new Error(result.message)
      }
      setMessage(result.message)
    } catch (error: any) {
      console.error('Signup error:', error)

      if (error.message?.includes('Database error')) {
        setMessage('Database configuration issue. Please check the database triggers.')
      } else if (error.message?.includes('Email rate limit exceeded')) {
        setMessage('Too many signup attempts. Please wait before trying again.')
      } else if (error.message?.includes('already registered')) {
        setMessage('An account with this email already exists. Try signing in instead.')
      } else {
        setMessage(error.message || 'An unexpected error occurred')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignUp = async () => {
    const redirectUrl = process.env.NEXT_PUBLIC_APP_URL
      ? `${process.env.NEXT_PUBLIC_APP_URL}/auth/callback`
      : `${window.location.origin}/auth/callback`

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl
      }
    })

    if (error) {
      setMessage(error.message)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-sky via-white to-blue-50 p-4 relative">
      {/* Back Button */}
      <button
        onClick={() => router.push('/')}
        className="absolute top-6 left-6 p-3 bg-white/70 hover:bg-white/90 backdrop-blur-lg rounded-full border border-brand-teal/20 text-brand-navy transition-colors z-10 shadow-lg"
        aria-label="Back to home"
      >
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="max-w-md w-full">
        <Card className="bg-white/90 backdrop-blur-lg border-brand-teal/20 shadow-xl relative">
          {/* Close Button */}
          <button
            onClick={() => router.push('/')}
            className="absolute top-4 right-4 p-2 hover:bg-brand-navy/5 rounded-full text-gray-600 hover:text-brand-navy transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
          <CardHeader className="text-center">
            <div className="w-24 h-16 flex items-center justify-center mx-auto mb-4">
              <img src="/logo-full.svg" alt="BuildaQuest" className="h-12" />
            </div>
            <CardTitle className="text-3xl font-bold text-brand-navy font-display mb-2">
              Create Account
            </CardTitle>
            <CardDescription className="text-gray-700">
              Start creating amazing quest adventures
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Signup Form */}
            <form onSubmit={handleSignUp} className="space-y-4">
              <div>
                <label
                  htmlFor="fullName"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Full Name
                </label>
                <div className="relative">
                  <User className="absolute top-3 left-3 w-5 h-5 text-gray-500" />
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                    className="w-full py-3 pl-10 pr-4 bg-white/70 border border-brand-teal/20 rounded-lg text-brand-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                    placeholder="Enter your full name"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 w-5 h-5 text-gray-500" />
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full py-3 pl-10 pr-4 bg-white/70 border border-brand-teal/20 rounded-lg text-brand-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                    placeholder="Enter your email"
                  />
                </div>
              </div>


              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-3 left-3 w-5 h-5 text-gray-500" />
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full py-3 pl-10 pr-10 bg-white/70 border border-brand-teal/20 rounded-lg text-brand-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                    placeholder="Create a password (min 8 characters)"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-brand-navy"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-3 left-3 w-5 h-5 text-gray-500" />
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full py-3 pl-10 pr-10 bg-white/70 border border-brand-teal/20 rounded-lg text-brand-navy placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-brand-navy"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-brand-teal hover:bg-brand-teal/90 text-white font-semibold h-12 !text-white"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </form>

            {/* Google Sign Up */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-brand-teal/20" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500">
                    or sign up with
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleGoogleSignUp}
                className="w-full bg-white/70 border-brand-teal/20 text-gray-900 hover:bg-white/90 h-12"
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Sign up with Google
              </Button>
            </div>

            {/* Toggle Login */}
            <div className="text-center">
              <Link
                href="/auth/login"
                className="text-brand-teal hover:text-brand-teal/80 text-sm"
              >
                Already have an account? Sign in
              </Link>
            </div>

            {/* Message */}
            {message && (
              <Card className={`${message.includes('success') || message.includes('Check your email') ? 'bg-green-500/20 border-green-500/30' : 'bg-red-500/20 border-red-500/30'}`}>
                <CardContent className="p-4">
                  <p className={`${message.includes('success') || message.includes('Check your email') ? 'text-green-400' : 'text-red-400'} text-sm text-center`}>
                    {message}
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}