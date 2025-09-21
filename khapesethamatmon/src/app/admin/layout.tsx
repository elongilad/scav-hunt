import { requireAuth, getUserOrgs } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { 
  Settings, 
  Video, 
  Map, 
  Users, 
  Image, 
  ArrowRight,
  Home,
  FileText 
} from 'lucide-react'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      {/* Navigation */}
      <nav className="border-b border-white/20 bg-white/5 backdrop-blur-lg">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-6">
              <Link href="/dashboard" className="flex items-center space-x-2 text-white hover:text-spy-gold">
                <Home className="w-5 h-5" />
                <span>חזור ללוח הבקרה</span>
              </Link>
              
              <div className="w-px h-6 bg-white/20" />
              
              <h1 className="text-xl font-bold text-white">
                🕵️ Admin Studio
              </h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-gray-300 text-sm">
                {user.email}
              </span>
              <div className="w-8 h-8 bg-spy-gold rounded-full flex items-center justify-center">
                <span className="text-black font-semibold text-sm">
                  {user.email?.charAt(0).toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 min-h-screen border-r border-white/20 bg-white/5 backdrop-blur-lg">
          <div className="p-6">
            <nav className="space-y-2">
              <Link
                href="/admin"
                className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
                <span>סקירה כללית</span>
              </Link>
              
              <Link
                href="/admin/models"
                className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Map className="w-5 h-5" />
                <span>מודלי ציד</span>
              </Link>
              
              <Link
                href="/admin/stations"
                className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Users className="w-5 h-5" />
                <span>עמדות</span>
              </Link>
              
              <Link
                href="/admin/missions"
                className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <FileText className="w-5 h-5" />
                <span>משימות</span>
              </Link>
              
              <Link
                href="/admin/media"
                className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Image className="w-5 h-5" />
                <span>ספריית מדיה</span>
              </Link>
              
              <Link
                href="/admin/templates"
                className="flex items-center space-x-3 px-3 py-2 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
              >
                <Video className="w-5 h-5" />
                <span>תבניות וידאו</span>
              </Link>
            </nav>
            
            <div className="mt-8 pt-6 border-t border-white/20">
              <div className="text-xs text-gray-400 mb-3">ארגונים</div>
              <div className="space-y-1">
                {orgs.map((org) => (
                  <div
                    key={org.id}
                    className="flex items-center justify-between px-3 py-2 text-sm text-gray-300"
                  >
                    <span className="truncate">{org.name}</span>
                    <span className="text-xs text-gray-500">
                      {(org as any).org_members.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  )
}