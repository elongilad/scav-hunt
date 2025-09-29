'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { useLanguage } from '@/contexts/LanguageContext'
import { t } from '@/lib/i18n'
import Link from 'next/link'
import {
  Plus,
  Map,
  Users,
  Video,
  Image,
  CheckCircle
} from 'lucide-react'

interface Stats {
  huntModels: number
  activeModels: number
  mediaAssets: number
  videoAssets: number
  recentEvents: number
  activeEvents: number
}

interface HuntModel {
  id: string
  name: string
  description?: string
  active: boolean
  created_at: string
  org_id: string
}

interface AdminDashboardProps {
  stats: Stats
  huntModels: HuntModel[]
}

export default function AdminDashboard({ stats, huntModels }: AdminDashboardProps) {
  const { language } = useLanguage()

  return (
    <div className="p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-white font-display">{t('admin.title', language)}</h1>
        <LanguageToggle />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.models', language)}</CardTitle>
            <Map className="h-4 w-4 text-brand-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-teal">{stats.huntModels}</div>
            <p className="text-xs text-gray-400">
              {stats.activeModels} {t('admin.active', language)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.media', language)}</CardTitle>
            <Image className="h-4 w-4 text-brand-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-teal">{stats.mediaAssets}</div>
            <p className="text-xs text-gray-400">
              {stats.videoAssets} {t('admin.videos', language)}
            </p>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin.events', language)}</CardTitle>
            <Users className="h-4 w-4 text-brand-teal" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-brand-teal">{stats.recentEvents}</div>
            <p className="text-xs text-gray-400">
              {stats.activeEvents} {t('admin.active', language)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quest Management Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/admin/quests">
          <Card className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Map className="h-6 w-6 text-brand-teal" />
                Quest Templates
              </CardTitle>
              <CardDescription className="text-gray-400">
                Create and manage professional quest templates for your marketplace
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-brand-teal">{stats.huntModels}</div>
                <div className="text-sm text-gray-400">Templates</div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/models">
          <Card className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Video className="h-6 w-6 text-brand-teal" />
                Legacy Models
              </CardTitle>
              <CardDescription className="text-gray-400">
                View and manage legacy hunt models (deprecated)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-2xl font-bold text-brand-teal">{stats.activeModels}</div>
                <div className="text-sm text-gray-400">Active</div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/admin/quests/new">
          <Card className="bg-brand-teal/20 border-brand-teal/30 text-white hover:bg-brand-teal/25 transition-all cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <Plus className="h-6 w-6 text-brand-teal" />
                Create New Quest
              </CardTitle>
              <CardDescription className="text-gray-300">
                Build a new quest template with guided setup
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <div className="text-4xl text-brand-teal">+</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Recent Quest Templates */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Recent Quest Templates</h2>
        <Link href="/admin/quests">
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            View All Quests
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {huntModels?.slice(0, 3).map((model) => (
          <div
            key={model.id}
            className="flex justify-between items-center p-4 bg-white/5 rounded-lg border border-white/10"
          >
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="font-medium text-white">{model.name}</h3>
                <Badge
                  variant={model.active ? 'default' : 'secondary'}
                  className={model.active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-500/20 text-gray-400 border-gray-500/30'}
                >
                  {model.active ? 'Active' : 'Draft'}
                </Badge>
              </div>
              {model.description && (
                <p className="text-gray-400 text-sm">{model.description}</p>
              )}
              <p className="text-gray-500 text-xs mt-1">
                Created {new Date(model.created_at).toLocaleDateString()}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Link href={`/admin/quests/${model.id}`}>
                <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  View
                </Button>
              </Link>
              <Link href={`/admin/quests/${model.id}/edit`}>
                <Button size="sm" className="bg-brand-teal hover:bg-brand-teal/90">
                  Edit
                </Button>
              </Link>
            </div>
          </div>
        ))}

        {(!huntModels || huntModels.length === 0) && (
          <div className="text-center py-12 text-gray-400">
            <Map className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">No quest templates yet</h3>
            <p className="mb-6">Create your first quest template to start building amazing scavenger hunt experiences.</p>
            <Link href="/admin/quests/new">
              <Button className="bg-brand-teal hover:bg-brand-teal/90">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Quest
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}