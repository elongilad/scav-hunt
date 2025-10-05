'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, CheckCircle } from 'lucide-react'

const TEMPLATE_MAPPING: Record<string, string> = {
  'spy-mission': 'Secret Agent Mission',
  'pirate-treasure': 'Pirate Treasure Hunt',
  'detective-mystery': 'Detective Mystery',
  'space-exploration': 'Space Exploration'
}

export default function PurchasePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const templateId = searchParams?.get('template')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [eventId, setEventId] = useState<string | null>(null)

  useEffect(() => {
    const createEvent = async () => {
      if (!templateId) {
        setError('No template selected')
        setLoading(false)
        return
      }

      try {
        const supabase = createClient()

        // Get the user
        const { data: { user }, error: userError } = await supabase.auth.getUser()
        if (userError || !user) {
          router.push(`/auth/login?template=${templateId}`)
          return
        }

        // Get user's organization
        const { data: orgMember, error: orgError } = await supabase
          .from('org_members')
          .select('org_id')
          .eq('user_id', user.id)
          .single()

        if (orgError || !orgMember) {
          setError('No organization found. Please contact support.')
          setLoading(false)
          return
        }

        // Get or create a published model for this template
        const templateName = TEMPLATE_MAPPING[templateId] || 'Adventure Quest'

        let { data: model, error: modelError } = await supabase
          .from('hunt_models')
          .select('id')
          .eq('org_id', orgMember.org_id)
          .eq('name', templateName)
          .eq('published', true)
          .single()

        // If no model exists, create one
        if (!model) {
          const { data: newModel, error: createError } = await supabase
            .from('hunt_models')
            .insert({
              org_id: orgMember.org_id,
              name: templateName,
              description: `${templateName} adventure template`,
              published: true
            })
            .select('id')
            .single()

          if (createError || !newModel) {
            setError('Failed to create quest template')
            setLoading(false)
            return
          }
          model = newModel
        }

        // Create an event from this model
        const { data: newEvent, error: eventError } = await supabase
          .from('events')
          .insert({
            org_id: orgMember.org_id,
            hunt_model_id: model.id,
            name: `My ${templateName}`,
            event_date: new Date().toISOString(),
            status: 'draft'
          })
          .select('id')
          .single()

        if (eventError || !newEvent) {
          setError('Failed to create event')
          setLoading(false)
          return
        }

        setEventId(newEvent.id)

        // Redirect to setup wizard after a brief delay
        setTimeout(() => {
          router.push(`/dashboard/events/${newEvent.id}/setup`)
        }, 1500)

      } catch (err: any) {
        console.error('Purchase error:', err)
        setError(err.message || 'An unexpected error occurred')
        setLoading(false)
      }
    }

    createEvent()
  }, [templateId, router])

  if (error) {
    return (
      <main className="container mx-auto p-6 max-w-md min-h-screen flex items-center justify-center">
        <Card>
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-4">{error}</p>
            <Button onClick={() => router.push('/catalog')}>
              Back to Catalog
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="container mx-auto p-6 max-w-md min-h-screen flex items-center justify-center">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {eventId ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                Quest Created!
              </>
            ) : (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Creating Your Quest...
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventId ? (
            <p>Redirecting to setup wizard...</p>
          ) : (
            <p>Please wait while we set up your adventure...</p>
          )}
        </CardContent>
      </Card>
    </main>
  )
}
