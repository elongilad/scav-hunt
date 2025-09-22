'use server'

import { createClient } from '@/lib/supabase/server'
import { createClient as createServiceRoleClient } from '@supabase/supabase-js'
import { headers } from 'next/headers'

export async function signUpWithEmail(email: string, password: string) {
  try {
    const supabase = await createClient()
    const origin = (await headers()).get('origin') || 'http://localhost:3000'

    // Use normal signup flow (trigger should be disabled now)
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`
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

          // Create default organization
          const { data: orgData, error: orgError } = await serviceSupabase
            .from('orgs')
            .insert({
              name: data.user.user_metadata?.full_name || data.user.email || 'My Organization',
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

    return { success: true, message: 'Check your email for a verification link' }
  } catch (error: any) {
    console.error('Sign up error:', error)
    return {
      success: false,
      message: error.message || 'Failed to create account'
    }
  }
}