import { requireAuth } from '@/lib/auth'
import AdminLayoutClient from '@/components/admin/AdminLayoutClient'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()

  // TEMPORARY: Skip getUserOrgs to avoid RLS recursion issues
  // const orgs = await getUserOrgs(user.id)
  const orgs: Array<{ id: string; name: string; org_members?: { role: string } }> = []

  console.log(`[DEV] Bypassing getUserOrgs for user ${user.id} in admin layout`)

  return (
    <AdminLayoutClient user={{ id: user.id, email: user.email || '' }} orgs={orgs}>
      {children}
    </AdminLayoutClient>
  )
}