import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/LogoutButton'
import Link from 'next/link'
import { Plus, Settings, Users, Video, MapPin } from 'lucide-react'

export default async function DashboardPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = await createClient()

  // Get recent events for the user's orgs
  const { data: events } = await supabase
    .from('events')
    .select(`
      id,
      child_name,
      date_start,
      status,
      created_at,
      orgs (name)
    `)
    .in('org_id', orgs.map(org => org.id))
    .order('created_at', { ascending: false })
    .limit(5)

  return (
    <div className="min-h-screen bg-gradient-to-br from-spy-dark via-gray-900 to-black">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">
              🕵️ Mission Control
            </h1>
            <p className="text-gray-300">
              Welcome back, Agent {user.email?.split('@')[0]}
            </p>
          </div>
          
          <div className="flex gap-4">
            <LogoutButton
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            />

            <Link href="/admin">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <Settings className="w-4 h-4 mr-2" />
                Admin Studio
              </Button>
            </Link>

            <Link href="/dashboard/events/new">
              <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                New Event
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-spy-gold mr-3" />
              <div>
                <p className="text-2xl font-bold text-white">{orgs.length}</p>
                <p className="text-gray-300 text-sm">Organizations</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <MapPin className="w-8 h-8 text-spy-gold mr-3" />
              <div>
                <p className="text-2xl font-bold text-white">{events?.length || 0}</p>
                <p className="text-gray-300 text-sm">Recent Events</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <Video className="w-8 h-8 text-spy-gold mr-3" />
              <div>
                <p className="text-2xl font-bold text-white">-</p>
                <p className="text-gray-300 text-sm">Videos Compiled</p>
              </div>
            </div>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20">
            <div className="flex items-center">
              <Settings className="w-8 h-8 text-spy-gold mr-3" />
              <div>
                <p className="text-2xl font-bold text-white">Active</p>
                <p className="text-gray-300 text-sm">System Status</p>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Events */}
        <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-semibold text-white">Recent Events</h2>
            <Link href="/dashboard/events">
              <Button variant="ghost" className="text-spy-gold hover:text-spy-gold/80">
                View All →
              </Button>
            </Link>
          </div>

          {events && events.length > 0 ? (
            <div className="space-y-4">
              {events.map((event) => (
                <div 
                  key={event.id} 
                  className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10"
                >
                  <div>
                    <h3 className="font-medium text-white">
                      {event.child_name ? `${event.child_name}'s Hunt` : 'Unnamed Event'}
                    </h3>
                    <p className="text-gray-400 text-sm">
                      {event.date_start 
                        ? new Date(event.date_start).toLocaleDateString('he-IL')
                        : 'No date set'
                      }
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      event.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      event.status === 'ready' ? 'bg-blue-500/20 text-blue-400' :
                      event.status === 'completed' ? 'bg-gray-500/20 text-gray-400' :
                      'bg-yellow-500/20 text-yellow-400'
                    }`}>
                      {event.status}
                    </span>
                    
                    <Link href={`/dashboard/events/${event.id}`}>
                      <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-gray-400 mb-2">No events yet</h3>
              <p className="text-gray-500 mb-6">
                Create your first spy scavenger hunt to get started
              </p>
              <Link href="/dashboard/events/new">
                <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  Create First Event
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link href="/admin/models">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
              <Video className="w-12 h-12 text-spy-gold mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Hunt Models</h3>
              <p className="text-gray-300 text-sm">
                Create and manage scavenger hunt templates with stations and missions
              </p>
            </div>
          </Link>

          <Link href="/admin/media">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
              <Settings className="w-12 h-12 text-spy-gold mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Media Library</h3>
              <p className="text-gray-300 text-sm">
                Upload and organize video templates, audio clips, and images
              </p>
            </div>
          </Link>

          <Link href="/dashboard/events/new">
            <div className="bg-white/10 backdrop-blur-lg rounded-lg p-6 border border-white/20 hover:bg-white/20 transition-colors cursor-pointer">
              <Plus className="w-12 h-12 text-spy-gold mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">New Event</h3>
              <p className="text-gray-300 text-sm">
                Set up a new scavenger hunt event for parents to run
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}