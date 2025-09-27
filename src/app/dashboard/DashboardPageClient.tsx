'use client'

import { Button } from '@/components/ui/button'
import { LogoutButton } from '@/components/LogoutButton'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { useLanguage } from '@/contexts/LanguageContext'
import { isOwner } from '@/lib/owner'
import Link from 'next/link'
import { Plus, Settings, Users, Video, MapPin, Package } from 'lucide-react'

interface DashboardPageClientProps {
  user: {
    id: string
    email?: string | undefined
  }
  orgs: any[]
  events: any[]
}

export function DashboardPageClient({ user, orgs, events }: DashboardPageClientProps) {
  const { language } = useLanguage()
  const showAuthoring = process.env.NEXT_PUBLIC_FEATURE_AUTHORING === 'true' && isOwner(user.id)

  return (
    <>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-4xl font-bold text-brand-navy font-display mb-2">
            🗺️ {language === 'he' ? 'מרכז בקרה' : 'Quest Control'}
          </h1>
          <p className="text-gray-600">
            {language === 'he'
              ? `ברוך הבא, ${user.email?.split('@')[0]}`
              : `Welcome back, ${user.email?.split('@')[0]}`
            }
          </p>
        </div>

        <div className="flex gap-4">
          <LanguageToggle />

          <LogoutButton
            variant="outline"
            className="border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5"
          />

          <Link href="/catalog">
            <Button variant="outline" className="border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5">
              <Package className="w-4 h-4 mr-2" />
              {language === 'he' ? 'קטלוג' : 'Catalog'}
            </Button>
          </Link>

          {showAuthoring && (
            <Link href="/admin">
              <Button variant="outline" className="border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5">
                <Settings className="w-4 h-4 mr-2" />
                {language === 'he' ? 'סטודיו אדמין' : 'Admin Studio'}
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white/70 backdrop-blur-lg rounded-lg p-6 border border-brand-teal/20 shadow-lg">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-brand-teal mr-3" />
            <div>
              <p className="text-2xl font-bold text-brand-navy">{orgs.length}</p>
              <p className="text-gray-600 text-sm">
                {language === 'he' ? 'ארגונים' : 'Organizations'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg rounded-lg p-6 border border-brand-teal/20 shadow-lg">
          <div className="flex items-center">
            <MapPin className="w-8 h-8 text-brand-teal mr-3" />
            <div>
              <p className="text-2xl font-bold text-brand-navy">{events?.length || 0}</p>
              <p className="text-gray-600 text-sm">
                {language === 'he' ? 'אירועים אחרונים' : 'Recent Events'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg rounded-lg p-6 border border-brand-teal/20 shadow-lg">
          <div className="flex items-center">
            <Video className="w-8 h-8 text-brand-teal mr-3" />
            <div>
              <p className="text-2xl font-bold text-brand-navy">-</p>
              <p className="text-gray-600 text-sm">
                {language === 'he' ? 'סרטונים קומפילד' : 'Videos Compiled'}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/70 backdrop-blur-lg rounded-lg p-6 border border-brand-teal/20 shadow-lg">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-brand-teal mr-3" />
            <div>
              <p className="text-2xl font-bold text-brand-navy">
                {language === 'he' ? 'פעיל' : 'Active'}
              </p>
              <p className="text-gray-600 text-sm">
                {language === 'he' ? 'סטטוס מערכת' : 'System Status'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white/70 backdrop-blur-lg rounded-lg p-6 border border-brand-teal/20 shadow-lg mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-semibold text-brand-navy">
            {language === 'he' ? 'אירועים אחרונים' : 'Recent Events'}
          </h2>
          <Link href="/dashboard/events">
            <Button variant="ghost" className="text-brand-teal hover:text-brand-teal/80">
              {language === 'he' ? '← צפה בכל' : 'View All →'}
            </Button>
          </Link>
        </div>

        {events && events.length > 0 ? (
          <div className="space-y-4">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex justify-between items-center p-4 bg-white/50 rounded-lg border border-brand-teal/20"
              >
                <div>
                  <h3 className="font-medium text-brand-navy">
                    {event.child_name ?
                      (language === 'he' ? `ציד של ${event.child_name}` : `${event.child_name}'s Hunt`) :
                      (language === 'he' ? 'אירוע ללא שם' : 'Unnamed Event')
                    }
                  </h3>
                  <p className="text-gray-600 text-sm">
                    {event.date_start
                      ? new Date(event.date_start).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')
                      : (language === 'he' ? 'תאריך לא נקבע' : 'No date set')
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
                    {language === 'he' ? (
                      event.status === 'active' ? 'פעיל' :
                      event.status === 'ready' ? 'מוכן' :
                      event.status === 'completed' ? 'הושלם' : 'טיוטה'
                    ) : event.status}
                  </span>

                  <Link href={`/dashboard/events/${event.id}`}>
                    <Button size="sm" variant="outline" className="border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5">
                      {language === 'he' ? 'צפה' : 'View'}
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <MapPin className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">
              {language === 'he' ? 'אין אירועים עדיין' : 'No events yet'}
            </h3>
            <p className="text-gray-500 mb-6">
              {language === 'he'
                ? 'צור את הרפתקת הבחירה הראשונה שלך כדי להתחיל'
                : 'Create your first quest adventure to get started'
              }
            </p>
            <Link href="/dashboard/events/new">
              <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white font-semibold">
                <Plus className="w-4 h-4 mr-2" />
                {language === 'he' ? 'צור קווסט ראשון' : 'Create First Quest'}
              </Button>
            </Link>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className={`grid grid-cols-1 gap-6 ${showAuthoring ? 'md:grid-cols-3' : 'md:grid-cols-2'}`}>
        <Link href="/catalog">
          <div className="bg-white/70 backdrop-blur-lg rounded-lg p-6 border border-brand-teal/20 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <Package className="w-12 h-12 text-brand-teal mb-4" />
            <h3 className="text-xl font-semibold text-brand-navy mb-2">
              {language === 'he' ? 'קטלוג קווסטים' : 'Quest Catalog'}
            </h3>
            <p className="text-gray-600 text-sm">
              {language === 'he'
                ? 'גלה וקנה הרפתקאות קווסט מוכנות לשימוש'
                : 'Discover and purchase ready-to-use quest adventures'
              }
            </p>
          </div>
        </Link>

        <Link href="/dashboard/events">
          <div className="bg-white/70 backdrop-blur-lg rounded-lg p-6 border border-brand-teal/20 shadow-lg hover:shadow-xl transition-all cursor-pointer">
            <MapPin className="w-12 h-12 text-brand-teal mb-4" />
            <h3 className="text-xl font-semibold text-brand-navy mb-2">
              {language === 'he' ? 'האירועים שלי' : 'My Events'}
            </h3>
            <p className="text-gray-600 text-sm">
              {language === 'he'
                ? 'נהל והפעל את הקווסטים שרכשת'
                : 'Manage and run your purchased quests'
              }
            </p>
          </div>
        </Link>

        {showAuthoring && (
          <Link href="/admin/models">
            <div className="bg-white/70 backdrop-blur-lg rounded-lg p-6 border border-brand-teal/20 shadow-lg hover:shadow-xl transition-all cursor-pointer">
              <Video className="w-12 h-12 text-brand-teal mb-4" />
              <h3 className="text-xl font-semibold text-brand-navy mb-2">
                {language === 'he' ? 'מודלי ציד' : 'Quest Models'}
              </h3>
              <p className="text-gray-600 text-sm">
                {language === 'he'
                  ? 'צור ונהל תבניות צידים עם תחנות ומשימות'
                  : 'Create and manage quest templates with stations and missions'
                }
              </p>
            </div>
          </Link>
        )}
      </div>
    </>
  )
}