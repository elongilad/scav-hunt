import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function middleware(request: NextRequest) {
  const url = request.nextUrl.clone()

  // Check if trying to access admin routes
  if (url.pathname.startsWith('/admin')) {
    const supabase = await createClient()

    // Get the current user
    const { data: { user } } = await supabase.auth.getUser()

    // Check if feature is enabled and user is owner
    const featureEnabled = process.env.NEXT_PUBLIC_FEATURE_AUTHORING === 'true'
    const isOwner = user?.id === process.env.OWNER_USER_ID

    if (!featureEnabled || !isOwner) {
      url.pathname = '/catalog'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*']
}