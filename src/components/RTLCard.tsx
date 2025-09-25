'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useLanguage, useRTL } from '@/components/LanguageProvider'
import { 
  ArrowLeft,
  ArrowRight,
  Calendar,
  Clock,
  Users,
  MapPin,
  Star,
  CheckCircle
} from 'lucide-react'

interface RTLCardProps {
  title: string
  description?: string
  children?: React.ReactNode
  className?: string
  status?: 'active' | 'completed' | 'pending' | 'draft'
  date?: Date | string
  participants?: number
  location?: string
  rating?: number
  badges?: string[]
  actions?: {
    primary?: {
      label: string
      onClick: () => void
      variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    }
    secondary?: {
      label: string
      onClick: () => void
      variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
    }
  }
}

export default function RTLCard({
  title,
  description,
  children,
  className = '',
  status,
  date,
  participants,
  location,
  rating,
  badges = [],
  actions
}: RTLCardProps) {
  const { t } = useLanguage()
  const isRTL = useRTL()
  const rtlClass = isRTL ? 'rtl' : ''
  const mr = isRTL ? 'ml' : 'mr'
  const ml = isRTL ? 'mr' : 'ml'

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat(isRTL ? 'he-IL' : 'en-US').format(new Date(date))
  }

  const formatTime = (date: Date | string) => {
    return new Intl.DateTimeFormat(isRTL ? 'he-IL' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date))
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'border-green-500/30 text-green-400'
      case 'completed': return 'border-blue-500/30 text-blue-400'
      case 'pending': return 'border-yellow-500/30 text-yellow-400'
      case 'draft': return 'border-gray-500/30 text-gray-400'
      default: return 'border-white/20 text-white'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active': return t('common.active')
      case 'completed': return t('common.completed')
      case 'pending': return t('common.pending')
      case 'draft': return t('common.draft')
      default: return status
    }
  }

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight

  return (
    <Card className={`bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all duration-200 ${className}`}>
      <CardHeader>
        <div className={`flex items-start justify-between ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
          <div className={`flex-1 ${isRTL ? 'text-right' : 'text-left'}`}>
            <CardTitle className={`hebrew-title ${isRTL ? 'text-right' : 'text-left'}`}>
              {title}
            </CardTitle>
            {description && (
              <CardDescription className={`text-gray-400 mt-1 hebrew-body ${isRTL ? 'text-right' : 'text-left'}`}>
                {description}
              </CardDescription>
            )}
          </div>
          
          {status && (
            <Badge variant="outline" className={getStatusColor(status)}>
              {getStatusText(status)}
            </Badge>
          )}
        </div>

        {/* Metadata Row */}
        {(date || participants || location || rating) && (
          <div className={`flex flex-wrap items-center gap-4 text-sm text-gray-400 mt-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            {date && (
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <Calendar className="w-4 h-4" />
                <span>{formatDate(date)}</span>
              </div>
            )}
            
            {participants && (
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <Users className="w-4 h-4" />
                <span>{participants} {t('common.participants')}</span>
              </div>
            )}
            
            {location && (
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <MapPin className="w-4 h-4" />
                <span>{location}</span>
              </div>
            )}
            
            {rating && (
              <div className={`flex items-center gap-1 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
                <Star className="w-4 h-4 text-spy-gold" />
                <span>{rating}/5</span>
              </div>
            )}
          </div>
        )}

        {/* Badges */}
        {badges.length > 0 && (
          <div className={`flex flex-wrap gap-2 mt-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            {badges.map((badge, index) => (
              <Badge key={index} variant="outline" className="border-spy-gold/30 text-spy-gold text-xs">
                {badge}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      {children && (
        <CardContent className="hebrew-body">
          {children}
        </CardContent>
      )}

      {/* Actions */}
      {actions && (
        <CardContent className="pt-0">
          <div className={`flex gap-3 ${isRTL ? 'flex-row-reverse' : 'flex-row'}`}>
            {actions.primary && (
              <Button
                onClick={actions.primary.onClick}
                variant={actions.primary.variant || 'default'}
                className={`
                  flex items-center gap-2
                  ${actions.primary.variant === 'default' || !actions.primary.variant 
                    ? 'bg-spy-gold hover:bg-spy-gold/90 text-black' 
                    : ''
                  }
                  ${isRTL ? 'flex-row-reverse' : 'flex-row'}
                `}
              >
                <ArrowIcon className="w-4 h-4" />
                {actions.primary.label}
              </Button>
            )}
            
            {actions.secondary && (
              <Button
                onClick={actions.secondary.onClick}
                variant={actions.secondary.variant || 'outline'}
                className={`
                  flex items-center gap-2 bg-white/10 border-white/20 text-white hover:bg-white/20
                  ${isRTL ? 'flex-row-reverse' : 'flex-row'}
                `}
              >
                {actions.secondary.label}
              </Button>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}

// Specialized card variants
export function EventCard({ event, onEdit, onView }: {
  event: any
  onEdit?: () => void
  onView?: () => void
}) {
  const { t } = useLanguage()

  return (
    <RTLCard
      title={event.child_name ? `${t('events.huntFor')} ${event.child_name}` : event.name}
      description={event.location}
      status={event.status}
      date={event.date_start}
      participants={event.participant_count}
      badges={[event.hunt_models?.name].filter(Boolean)}
      actions={{
        primary: onView ? {
          label: t('common.view'),
          onClick: onView
        } : undefined,
        secondary: onEdit ? {
          label: t('common.edit'),
          onClick: onEdit,
          variant: 'outline'
        } : undefined
      }}
    />
  )
}

export function TeamCard({ team, onViewProgress }: {
  team: any
  onViewProgress?: () => void
}) {
  const { t } = useLanguage()

  return (
    <RTLCard
      title={team.name}
      description={`${team.participants?.length || 0} ${t('common.participants')}`}
      status={team.status}
      rating={team.score ? Math.round(team.score / 100) : undefined}
      actions={{
        primary: onViewProgress ? {
          label: t('teams.viewProgress'),
          onClick: onViewProgress
        } : undefined
      }}
    >
      {team.current_station_id && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <MapPin className="w-4 h-4" />
          <span>{t('teams.currentStation')}: {team.current_station_id}</span>
        </div>
      )}
    </RTLCard>
  )
}

export function StationCard({ station, onEdit }: {
  station: any
  onEdit?: () => void
}) {
  const { t } = useLanguage()

  return (
    <RTLCard
      title={`${station.station_id}: ${station.display_name}`}
      description={station.activity_description}
      badges={[station.station_type, `${station.estimated_duration} ${t('common.minutes')}`]}
      actions={{
        primary: onEdit ? {
          label: t('common.edit'),
          onClick: onEdit
        } : undefined
      }}
    >
      {station.props_needed && station.props_needed.length > 0 && (
        <div className="mt-3">
          <p className="text-sm font-medium text-gray-300 mb-2">{t('stations.propsNeeded')}:</p>
          <div className="flex flex-wrap gap-1">
            {station.props_needed.map((prop: string, index: number) => (
              <Badge key={index} variant="outline" className="text-xs">
                {prop}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </RTLCard>
  )
}