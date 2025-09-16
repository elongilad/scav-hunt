import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'NOT_SET',
    keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length || 0,
    keyStart: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.substring(0, 20) || 'NOT_SET'
  })
}