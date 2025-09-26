'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LogoutButton } from '@/components/LogoutButton'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import Link from 'next/link'
import {
  Calendar,
  Plus,
  Search,
  Eye,
  Edit,
  Play,
  Clock,
  Users,
  MapPin,
  Video,
  FileText
} from 'lucide-react'

interface EventsPageClientProps {
  events: any[]
  stats: {
    totalEvents: number
    activeEvents: number
    upcomingEvents: number
    completedEvents: number
  }
}

export function EventsPageClient({ events, stats }: EventsPageClientProps) {
  const { language } = useLanguage()

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white font-display mb-2">
            {language === 'he' ? 'אירועי ציד' : 'Quest Events'}
          </h1>
          <p className="text-gray-300">
            {language === 'he' ? 'נהל את כל אירועי הציד שלך' : 'Manage all your quest adventures'}
          </p>
        </div>

        <div className="flex gap-4">
          <LanguageToggle />
          <LogoutButton
            variant="outline"
            className="bg-white/10 border-white/20 text-white hover:bg-white/20"
          />

          <Link href="/dashboard/events/new">
            <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white font-semibold">
              <Plus className="w-4 h-4 mr-2" />
              {language === 'he' ? 'אירוע חדש' : 'New Quest'}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-brand-teal">{stats.totalEvents}</p>
                <p className="text-sm text-gray-400">
                  {language === 'he' ? 'סה"כ אירועים' : 'Total Events'}
                </p>
              </div>
              <Calendar className="w-8 h-8 text-brand-teal/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-brand-teal">{stats.activeEvents}</p>
                <p className="text-sm text-gray-400">
                  {language === 'he' ? 'פעילים כעת' : 'Active Now'}
                </p>
              </div>
              <Play className="w-8 h-8 text-brand-teal/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-brand-teal">{stats.upcomingEvents}</p>
                <p className="text-sm text-gray-400">
                  {language === 'he' ? 'צפויים' : 'Upcoming'}
                </p>
              </div>
              <Clock className="w-8 h-8 text-brand-teal/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-brand-teal">{stats.completedEvents}</p>
                <p className="text-sm text-gray-400">
                  {language === 'he' ? 'הושלמו' : 'Completed'}
                </p>
              </div>
              <FileText className="w-8 h-8 text-brand-teal/60" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-center">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder={language === 'he' ? 'חפש אירועים...' : 'Search events...'}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                {language === 'he' ? 'כל האירועים' : 'All Events'}
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                {language === 'he' ? 'פעילים' : 'Active'}
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                {language === 'he' ? 'צפויים' : 'Upcoming'}
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                {language === 'he' ? 'הושלמו' : 'Completed'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events List */}
      {events && events.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {events.map((event) => {
            const eventDate = event.date_start ? new Date(event.date_start) : null
            const isUpcoming = eventDate && eventDate > new Date()
            const isPast = eventDate && eventDate < new Date()

            return (
              <Card key={event.id} className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors">
                <CardHeader className="pb-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-lg">
                          {event.child_name ?
                            (language === 'he' ? `ציד של ${event.child_name}` : `${event.child_name}'s Quest`) :
                            (language === 'he' ? 'אירוע ללא שם' : 'Unnamed Event')
                          }
                        </CardTitle>
                        <Badge
                          variant={event.status === 'active' ? "default" : "secondary"}
                          className={
                            event.status === 'active' ? "bg-green-500/20 text-green-400 border-green-500/30" :
                            event.status === 'ready' ? "bg-blue-500/20 text-blue-400 border-blue-500/30" :
                            event.status === 'completed' ? "bg-gray-500/20 text-gray-400 border-gray-500/30" :
                            "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }
                        >
                          {language === 'he' ? (
                            event.status === 'active' ? 'פעיל' :
                            event.status === 'ready' ? 'מוכן' :
                            event.status === 'completed' ? 'הושלם' : 'טיוטה'
                          ) : (
                            event.status === 'active' ? 'Active' :
                            event.status === 'ready' ? 'Ready' :
                            event.status === 'completed' ? 'Completed' : 'Draft'
                          )}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        {event.child_age && (
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            {language === 'he' ? `גיל ${event.child_age}` : `Age ${event.child_age}`}
                          </Badge>
                        )}
                        {event.duration_minutes && (
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            <Clock className="w-3 h-3 mr-1" />
                            {event.duration_minutes} {language === 'he' ? 'דק׳' : 'mins'}
                          </Badge>
                        )}
                        {event.participant_count && (
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            <Users className="w-3 h-3 mr-1" />
                            {event.participant_count} {language === 'he' ? 'משתתפים' : 'participants'}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-1 text-sm text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 text-brand-teal" />
                        <span>
                          {eventDate ? eventDate.toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US') :
                            (language === 'he' ? 'תאריך לא נקבע' : 'No date set')}
                          {eventDate && (
                            <span className="text-xs ml-2">
                              ({language === 'he' ?
                                (isUpcoming ? 'עתיד' : isPast ? 'עבר' : 'היום') :
                                (isUpcoming ? 'upcoming' : isPast ? 'past' : 'today')
                              })
                            </span>
                          )}
                        </span>
                      </div>

                      <p className="text-sm text-gray-300">
                        {language === 'he' ? 'מודל:' : 'Model:'} {(event as any).hunt_models?.name ||
                          (language === 'he' ? 'לא נבחר' : 'None selected')}
                      </p>
                    </div>

                    <div className="w-10 h-10 bg-brand-teal/20 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-brand-teal" />
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Quest Model Info */}
                  {(event as any).hunt_models && (
                    <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                      <div className="flex items-center gap-2 mb-1">
                        <Video className="w-4 h-4 text-brand-teal" />
                        <span className="text-sm font-medium text-white">
                          {(event as any).hunt_models.name}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400">
                        {(event as any).hunt_models.description?.substring(0, 80)}...
                      </p>
                    </div>
                  )}

                  {/* Organization */}
                  <div className="text-xs text-gray-400">
                    {language === 'he' ? 'ארגון:' : 'Organization:'} {(event as any).orgs?.name}
                  </div>

                  {/* Created Date */}
                  <div className="text-xs text-gray-500">
                    {language === 'he' ? 'נוצר ב-' : 'Created on '}
                    {new Date(event.created_at).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-white/10">
                    <Link href={`/dashboard/events/${event.id}`} className="flex-1">
                      <Button size="sm" variant="outline" className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <Eye className="w-4 h-4 mr-2" />
                        {language === 'he' ? 'צפה' : 'View'}
                      </Button>
                    </Link>

                    {event.status !== 'completed' && (
                      <Link href={`/dashboard/events/${event.id}/edit`}>
                        <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Link>
                    )}

                    {event.status === 'ready' && (
                      <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white">
                        <Play className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">
              {language === 'he' ? 'אין אירועים עדיין' : 'No events yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {language === 'he' ? 'צור את האירוע הראשון שלך כדי להתחיל' : 'Create your first quest to get started'}
            </p>
            <Link href="/dashboard/events/new">
              <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                {language === 'he' ? 'צור אירוע ראשון' : 'Create First Quest'}
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle>{language === 'he' ? 'פעולות מהירות' : 'Quick Actions'}</CardTitle>
          <CardDescription className="text-gray-400">
            {language === 'he' ? 'דרכים מהירות ליצור ולנהל אירועים' : 'Fast ways to create and manage events'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/events/new">
              <Button variant="outline" className="w-full h-20 bg-white/10 border-white/20 text-white hover:bg-white/20 flex-col">
                <Plus className="w-6 h-6 mb-2" />
                {language === 'he' ? 'אירוע חדש' : 'New Quest'}
              </Button>
            </Link>

            <Link href="/admin/models">
              <Button variant="outline" className="w-full h-20 bg-white/10 border-white/20 text-white hover:bg-white/20 flex-col">
                <Video className="w-6 h-6 mb-2" />
                {language === 'he' ? 'מודלי ציד' : 'Quest Models'}
              </Button>
            </Link>

            <Link href="/dashboard/events?filter=active">
              <Button variant="outline" className="w-full h-20 bg-white/10 border-white/20 text-white hover:bg-white/20 flex-col">
                <Play className="w-6 h-6 mb-2" />
                {language === 'he' ? 'אירועים פעילים' : 'Active Events'}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}