import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('Testing Supabase connection...')
    console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL)
    console.log('Key length:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length)
    
    const { data, error, status, statusText } = await supabase
      .from('stations')
      .select('id, name')
      .limit(1)
    
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({
        success: false,
        error: error,
        status,
        statusText,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
      })
    }
    
    return NextResponse.json({
      success: true,
      data,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
    })
    
  } catch (error) {
    console.error('Catch error:', error)
    return NextResponse.json({
      success: false,
      catchError: error,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL,
      keyLength: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.length
    })
  }
}