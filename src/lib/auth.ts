import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function requireAuth() {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  return user
}

export async function getUserOrgs(userId: string) {
  const supabase = createClient()
  
  const { data: orgs, error } = await supabase
    .from('orgs')
    .select(`
      id,
      name,
      owner_user_id,
      created_at,
      org_members!inner (
        role
      )
    `)
    .eq('org_members.user_id', userId)

  if (error) {
    throw error
  }

  return orgs
}

export async function getUserRole(userId: string, orgId: string) {
  const supabase = createClient()
  
  const { data, error } = await supabase
    .from('org_members')
    .select('role')
    .eq('user_id', userId)
    .eq('org_id', orgId)
    .single()

  if (error) {
    return null
  }

  return data.role
}

export async function requireOrgAccess(orgId: string, minRole: 'viewer' | 'editor' | 'admin' | 'owner' = 'viewer') {
  const user = await requireAuth()
  const role = await getUserRole(user.id, orgId)
  
  const roleHierarchy = {
    viewer: 0,
    editor: 1,
    admin: 2,
    owner: 3
  }
  
  if (!role || roleHierarchy[role as keyof typeof roleHierarchy] < roleHierarchy[minRole]) {
    redirect('/unauthorized')
  }
  
  return { user, role }
}