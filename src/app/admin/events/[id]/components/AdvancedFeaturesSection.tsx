'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n/translations'
import Link from 'next/link'
import {
  Zap,
  Search,
  Target,
  Timer,
  Route,
  Clock,
  CheckSquare,
} from 'lucide-react'

interface AdvancedFeaturesSectionProps {
  eventId: string
}

export function AdvancedFeaturesSection({ eventId }: AdvancedFeaturesSectionProps) {
  const { language } = useLanguage()

  return (
    <Card className="bg-white/10 border-white/20 text-white">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-spy-gold" />
          {t('advanced.title', language)}
        </CardTitle>
        <CardDescription className="text-gray-400">
          {t('advanced.description', language)}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* POI Discovery */}
          <Link href="/admin/test-poi">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Search className="w-8 h-8 text-spy-gold mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">{t('advanced.poiDiscovery', language)}</h3>
                <p className="text-xs text-gray-400">{t('advanced.poiDescription', language)}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Team Assignments */}
          <Link href={`/admin/events/${eventId}/assignments`}>
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Target className="w-8 h-8 text-spy-gold mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">{t('advanced.teamAssignments', language)}</h3>
                <p className="text-xs text-gray-400">{t('advanced.teamAssignmentsDescription', language)}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Schedule Simulation */}
          <Link href="/admin/test-simulation">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Timer className="w-8 h-8 text-spy-gold mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">{t('advanced.scheduleSimulation', language)}</h3>
                <p className="text-xs text-gray-400">{t('advanced.scheduleSimulationDescription', language)}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Travel Matrix */}
          <Link href="/admin/test-travel">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Route className="w-8 h-8 text-spy-gold mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">{t('advanced.travelMatrix', language)}</h3>
                <p className="text-xs text-gray-400">{t('advanced.travelMatrixDescription', language)}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Mission Management */}
          <Link href={`/admin/events/${eventId}/missions`}>
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <Clock className="w-8 h-8 text-spy-gold mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">{t('advanced.missionManagement', language)}</h3>
                <p className="text-xs text-gray-400">{t('advanced.missionManagementDescription', language)}</p>
              </CardContent>
            </Card>
          </Link>

          {/* Checklist Management */}
          <Link href="/admin/test-checklists">
            <Card className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors cursor-pointer h-full">
              <CardContent className="p-4 text-center">
                <CheckSquare className="w-8 h-8 text-spy-gold mx-auto mb-3" />
                <h3 className="font-semibold text-white mb-2">{t('advanced.checklistManagement', language)}</h3>
                <p className="text-xs text-gray-400">{t('advanced.checklistDescription', language)}</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </CardContent>
    </Card>
  )
}