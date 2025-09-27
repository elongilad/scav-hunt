'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceRoleClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export async function signUpWithEmail(email: string, password: string, fullName?: string) {
  try {
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || 'http://localhost:3000'

    // Use normal signup flow (trigger should be disabled now)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        data: {
          full_name: fullName || ''
        }
      }
    })

    if (error) {
      throw error
    }

    // If user was created, ensure they have an organization
    if (data.user) {
      try {
        // Use service role client to bypass RLS for organization creation
        const serviceSupabase = createServiceRoleClient(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        // Check if user already has an organization
        const { data: existingOrgs } = await serviceSupabase
          .from('orgs')
          .select('id')
          .eq('owner_user_id', data.user.id)
          .limit(1)

        if (!existingOrgs || existingOrgs.length === 0) {
          console.log('Creating organization for user:', data.user.id)

          // Create default organization for parents
          const orgName = fullName ? `${fullName}'s Quests` : (data.user.email ? `${data.user.email.split('@')[0]}'s Quests` : 'My Quests')
          const { data: orgData, error: orgError } = await serviceSupabase
            .from('orgs')
            .insert({
              name: orgName,
              owner_user_id: data.user.id
            })
            .select()
            .single()

          if (orgError) {
            console.error('Failed to create organization:', orgError)
          } else if (orgData) {
            console.log('Created organization:', orgData.id)

            // Create organization membership
            const { error: memberError } = await serviceSupabase
              .from('org_members')
              .insert({
                org_id: orgData.id,
                user_id: data.user.id,
                role: 'owner'
              })

            if (memberError) {
              console.error('Failed to create organization membership:', memberError)
            } else {
              console.log('Created organization membership for user:', data.user.id)
            }
          }
        } else {
          console.log('User already has organization:', existingOrgs[0].id)
        }
      } catch (fallbackError) {
        console.error('Failed to create organization manually:', fallbackError)
        // Don't throw - user account still created successfully
      }
    }

    // Check environment and user verification status
    const isDevelopment = process.env.NODE_ENV === 'development'

    if (data.user && !data.user.email_confirmed_at && !isDevelopment) {
      return {
        success: true,
        message: 'Account created! Please check your email for a verification link to complete your registration.'
      }
    } else if (data.user && !data.user.email_confirmed_at && isDevelopment) {
      return {
        success: true,
        message: 'Account created! In development mode, you can sign in directly without email verification.'
      }
    } else if (data.user && data.user.email_confirmed_at) {
      return {
        success: true,
        message: 'Account created and verified! You can now sign in.'
      }
    } else {
      return {
        success: true,
        message: 'Account created! You can now sign in.'
      }
    }
  } catch (error: any) {
    console.error('Sign up error:', error)
    return {
      success: false,
      message: error.message || 'Failed to create account'
    }
  }
}