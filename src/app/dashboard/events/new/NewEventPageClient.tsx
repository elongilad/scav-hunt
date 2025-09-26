'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { LanguageToggle } from '@/components/ui/language-toggle'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  ArrowLeft,
  Save,
  Calendar,
  Users,
  Clock,
  MapPin,
  Video,
  User,
  Gift,
  AlertCircle
} from 'lucide-react'
import Link from 'next/link'

interface HuntModel {
  id: string
  name: string
  description: string
  estimated_duration: number
  max_participants: number
  min_age: number
  max_age: number
  station_count?: number
  mission_count?: number
}

interface FormData {
  child_name: string
  child_age: number
  date_start: string
  time_start: string
  participant_count: number
  model_id: string
  location: string
  special_notes: string
  birthday_theme: boolean
  custom_theme: string
}

export function NewEventPageClient() {
  const { language } = useLanguage()
  const [formData, setFormData] = useState<FormData>({
    child_name: '',
    child_age: 8,
    date_start: '',
    time_start: '14:00',
    participant_count: 6,
    model_id: '',
    location: '',
    special_notes: '',
    birthday_theme: true,
    custom_theme: ''
  })

  const [huntModels, setHuntModels] = useState<HuntModel[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [step, setStep] = useState(1)

  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadHuntModels()
  }, [])

  const loadHuntModels = async () => {
    try {
      // Get current user and org
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(language === 'he' ? 'משתמש לא מחובר' : 'User not authenticated')

      let { data: orgs } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .limit(1)

      // If no organization exists, create one automatically
      if (!orgs || orgs.length === 0) {
        console.log('No organization found, creating default organization for user:', user.id)

        // Create a default organization via API
        const orgName = `${user.email?.split('@')[0] || 'User'} Organization`
        console.log('Attempting to create organization:', orgName)

        const response = await fetch('/api/organizations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: orgName })
        })

        if (!response.ok) {
          const error = await response.json()
          throw new Error(`Failed to create organization: ${error.error}`)
        }

        const { organization: newOrg } = await response.json()
        console.log('Created new organization:', newOrg.id)

        // Update orgs array to use the new organization
        orgs = [{ org_id: newOrg.id }]
      }

      const orgId = orgs[0].org_id

      // Get hunt models with stats
      const { data: models } = await supabase
        .from('hunt_models')
        .select(`
          id,
          name,
          description,
          estimated_duration,
          max_participants,
          min_age,
          max_age,
          model_stations (id),
          model_missions (id)
        `)
        .eq('org_id', orgId)
        .eq('active', true)
        .order('name')

      const modelsWithCounts = models?.map(model => ({
        ...model,
        station_count: (model as any).model_stations?.length || 0,
        mission_count: (model as any).model_missions?.length || 0
      })) || []

      setHuntModels(modelsWithCounts)
    } catch (error) {
      console.error('Error loading hunt models:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateStep = (stepNumber: number) => {
    const stepErrors: Record<string, string> = {}

    if (stepNumber === 1) {
      if (!formData.child_name.trim()) {
        stepErrors.child_name = language === 'he' ? 'שם הילד נדרש' : 'Child name is required'
      }
      if (!formData.child_age || formData.child_age < 3 || formData.child_age > 18) {
        stepErrors.child_age = language === 'he' ? 'גיל צריך להיות בין 3 ל-18' : 'Age must be between 3 and 18'
      }
      if (!formData.date_start) {
        stepErrors.date_start = language === 'he' ? 'תאריך נדרש' : 'Date is required'
      } else {
        const selectedDate = new Date(formData.date_start)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (selectedDate < today) {
          stepErrors.date_start = language === 'he' ? 'תאריך חייב להיות בעתיד' : 'Date must be in the future'
        }
      }
    }

    if (stepNumber === 2) {
      if (!formData.model_id) {
        stepErrors.model_id = language === 'he' ? 'יש לבחור מודל ציד' : 'Please select a quest model'
      }
      if (!formData.participant_count || formData.participant_count < 1) {
        stepErrors.participant_count = language === 'he' ? 'מספר משתתפים נדרש' : 'Number of participants is required'
      }

      // Validate against selected model constraints
      const selectedModel = huntModels.find(m => m.id === formData.model_id)
      if (selectedModel) {
        if (formData.participant_count > selectedModel.max_participants) {
          stepErrors.participant_count = language === 'he'
            ? `מקסימום ${selectedModel.max_participants} משתתפים למודל זה`
            : `Maximum ${selectedModel.max_participants} participants for this model`
        }
        if (formData.child_age < selectedModel.min_age || formData.child_age > selectedModel.max_age) {
          stepErrors.child_age = language === 'he'
            ? `גיל צריך להיות בין ${selectedModel.min_age} ל-${selectedModel.max_age} למודל זה`
            : `Age must be between ${selectedModel.min_age} and ${selectedModel.max_age} for this model`
        }
      }
    }

    if (stepNumber === 3) {
      if (!formData.location.trim()) {
        stepErrors.location = language === 'he' ? 'מיקום נדרש' : 'Location is required'
      }
    }

    setErrors(stepErrors)
    return Object.keys(stepErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(step)) {
      setStep(step + 1)
    }
  }

  const prevStep = () => {
    setStep(step - 1)
    setErrors({})
  }

  const handleSubmit = async () => {
    if (!validateStep(3)) return

    setSaving(true)
    setErrors({})

    try {
      // Get current user and org
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error(language === 'he' ? 'משתמש לא מחובר' : 'User not authenticated')

      const { data: orgs } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .limit(1)

      if (!orgs || orgs.length === 0) {
        throw new Error(language === 'he' ? 'לא נמצא ארגון' : 'No organization found')
      }

      const orgId = orgs[0].org_id

      // Calculate event duration from selected model
      const selectedModel = huntModels.find(m => m.id === formData.model_id)
      const durationMinutes = selectedModel?.estimated_duration || 60

      // Combine date and time
      const eventStart = new Date(`${formData.date_start}T${formData.time_start}:00`)
      const eventEnd = new Date(eventStart.getTime() + durationMinutes * 60000)

      // Create event
      const { data: event, error } = await supabase
        .from('events')
        .insert({
          org_id: orgId,
          model_id: formData.model_id,
          child_name: formData.child_name.trim(),
          child_age: formData.child_age,
          date_start: eventStart.toISOString(),
          date_end: eventEnd.toISOString(),
          participant_count: formData.participant_count,
          duration_minutes: durationMinutes,
          location: formData.location.trim(),
          special_notes: formData.special_notes.trim(),
          meta: {
            birthday_theme: formData.birthday_theme,
            custom_theme: formData.custom_theme.trim(),
            created_via: 'dashboard'
          },
          status: 'draft'
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to event details
      router.push(`/dashboard/events/${event.id}`)

    } catch (error: any) {
      console.error('Error creating event:', error)
      setErrors({
        submit: error.message || (language === 'he' ? 'שגיאה ביצירת האירוע' : 'Error creating event')
      })
    } finally {
      setSaving(false)
    }
  }

  const selectedModel = huntModels.find(m => m.id === formData.model_id)

  const getStepTitle = (stepNum: number) => {
    if (language === 'he') {
      if (stepNum === 1) return 'פרטי הילד והאירוע'
      if (stepNum === 2) return 'בחירת מודל ציד'
      if (stepNum === 3) return 'מיקום והגדרות'
    } else {
      if (stepNum === 1) return 'Child & Event Details'
      if (stepNum === 2) return 'Select Quest Model'
      if (stepNum === 3) return 'Location & Settings'
    }
    return ''
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-brand-teal border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">
            {language === 'he' ? 'טוען מודלי ציד...' : 'Loading quest models...'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link href="/dashboard/events">
            <Button variant="outline" size="sm" className="border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5">
              <ArrowLeft className="w-4 h-4 mr-2" />
              {language === 'he' ? 'חזור' : 'Back'}
            </Button>
          </Link>

          <div>
            <h1 className="text-3xl font-bold text-brand-navy">
              {language === 'he' ? 'אירוע ציד חדש' : 'New Quest Event'}
            </h1>
            <p className="text-gray-600">
              {language === 'he' ? 'צור אירוע ציד מותאם אישית' : 'Create a custom quest adventure'}
            </p>
          </div>
        </div>

        <LanguageToggle />
      </div>

      {/* Progress Steps */}
      <Card className="bg-white/70 border-brand-teal/20 shadow-lg">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= stepNum ? 'bg-brand-teal text-white' : 'bg-gray-200 text-gray-500'
                }`}>
                  {stepNum}
                </div>
                <div className="mr-3">
                  <p className={`font-medium ${step >= stepNum ? 'text-brand-navy' : 'text-gray-500'}`}>
                    {getStepTitle(stepNum)}
                  </p>
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-1 mx-4 ${step > stepNum ? 'bg-brand-teal' : 'bg-gray-200'}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Child & Event Details */}
      {step === 1 && (
        <Card className="bg-white/70 border-brand-teal/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-navy">
              <User className="w-5 h-5 text-brand-teal" />
              {language === 'he' ? 'פרטי הילד והאירוע' : 'Child & Event Details'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {language === 'he' ? 'הכנס את הפרטים הבסיסיים של האירוע' : 'Enter the basic event information'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="child_name" className="text-brand-navy">
                  {language === 'he' ? 'שם הילד' : 'Child\'s Name'}
                </Label>
                <Input
                  id="child_name"
                  type="text"
                  value={formData.child_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, child_name: e.target.value }))}
                  placeholder={language === 'he' ? 'השם של יום ההולדת...' : 'Birthday child\'s name...'}
                  className="border-brand-teal/20 focus:ring-brand-teal"
                />
                {errors.child_name && (
                  <p className="text-red-500 text-sm">{errors.child_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="child_age" className="text-brand-navy">
                  {language === 'he' ? 'גיל' : 'Age'}
                </Label>
                <Input
                  id="child_age"
                  type="number"
                  min="3"
                  max="18"
                  value={formData.child_age}
                  onChange={(e) => setFormData(prev => ({ ...prev, child_age: parseInt(e.target.value) || 8 }))}
                  className="border-brand-teal/20 focus:ring-brand-teal"
                />
                {errors.child_age && (
                  <p className="text-red-500 text-sm">{errors.child_age}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_start" className="text-brand-navy">
                  {language === 'he' ? 'תאריך האירוע' : 'Event Date'}
                </Label>
                <Input
                  id="date_start"
                  type="date"
                  value={formData.date_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_start: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="border-brand-teal/20 focus:ring-brand-teal"
                />
                {errors.date_start && (
                  <p className="text-red-500 text-sm">{errors.date_start}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_start" className="text-brand-navy">
                  {language === 'he' ? 'שעת התחלה' : 'Start Time'}
                </Label>
                <Input
                  id="time_start"
                  type="time"
                  value={formData.time_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, time_start: e.target.value }))}
                  className="border-brand-teal/20 focus:ring-brand-teal"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-brand-navy">
                {language === 'he' ? 'סוג אירוע' : 'Event Type'}
              </Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="event_type"
                    checked={formData.birthday_theme}
                    onChange={() => setFormData(prev => ({ ...prev, birthday_theme: true }))}
                    className="text-brand-teal"
                  />
                  <span className="text-brand-navy">
                    {language === 'he' ? 'יום הולדת' : 'Birthday Party'}
                  </span>
                  <Gift className="w-4 h-4 text-brand-teal" />
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="event_type"
                    checked={!formData.birthday_theme}
                    onChange={() => setFormData(prev => ({ ...prev, birthday_theme: false }))}
                    className="text-brand-teal"
                  />
                  <span className="text-brand-navy">
                    {language === 'he' ? 'אירוע רגיל' : 'Regular Event'}
                  </span>
                </label>
              </div>
            </div>

            {!formData.birthday_theme && (
              <div className="space-y-2">
                <Label htmlFor="custom_theme" className="text-brand-navy">
                  {language === 'he' ? 'נושא האירוע' : 'Event Theme'}
                </Label>
                <Input
                  id="custom_theme"
                  type="text"
                  value={formData.custom_theme}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_theme: e.target.value }))}
                  placeholder={language === 'he' ? 'למשל: חוקרי טבע, גיבורי על...' : 'e.g.: Nature Explorers, Superheroes...'}
                  className="border-brand-teal/20 focus:ring-brand-teal"
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={nextStep}
                className="bg-brand-teal hover:bg-brand-teal/90 text-white font-semibold"
              >
                {language === 'he' ? 'המשך' : 'Continue'}
                <ArrowLeft className="w-4 h-4 mr-2 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Hunt Model Selection */}
      {step === 2 && (
        <Card className="bg-white/70 border-brand-teal/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-navy">
              <Video className="w-5 h-5 text-brand-teal" />
              {language === 'he' ? 'בחירת מודל ציד' : 'Select Quest Model'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {language === 'he' ? 'בחר את מודל הציד המתאים לגיל ולמספר המשתתפים' : 'Choose a quest model suitable for the age and number of participants'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="participant_count" className="text-brand-navy">
                {language === 'he' ? 'מספר משתתפים' : 'Number of Participants'}
              </Label>
              <Input
                id="participant_count"
                type="number"
                min="1"
                max="20"
                value={formData.participant_count}
                onChange={(e) => setFormData(prev => ({ ...prev, participant_count: parseInt(e.target.value) || 1 }))}
                className="border-brand-teal/20 focus:ring-brand-teal"
              />
              {errors.participant_count && (
                <p className="text-red-500 text-sm">{errors.participant_count}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label className="text-brand-navy">
                {language === 'he' ? 'מודלי ציד זמינים' : 'Available Quest Models'}
              </Label>

              {huntModels.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-brand-teal/30 rounded-lg bg-white/50">
                  <Video className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 mb-4">
                    {language === 'he' ? 'אין מודלי ציד זמינים' : 'No quest models available'}
                  </p>
                  <Link href="/admin/models/new">
                    <Button className="bg-brand-teal hover:bg-brand-teal/90 text-white font-semibold">
                      {language === 'he' ? 'צור מודל ראשון' : 'Create First Model'}
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {huntModels.map((model) => {
                    const isCompatible =
                      formData.child_age >= model.min_age &&
                      formData.child_age <= model.max_age &&
                      formData.participant_count <= model.max_participants

                    return (
                      <div
                        key={model.id}
                        className={`p-4 rounded-lg border cursor-pointer transition-all ${
                          formData.model_id === model.id
                            ? 'border-brand-teal bg-brand-teal/10 shadow-md'
                            : isCompatible
                            ? 'border-brand-teal/20 bg-white/50 hover:bg-white/70 shadow-sm hover:shadow-md'
                            : 'border-red-300 bg-red-50 opacity-60'
                        }`}
                        onClick={() => {
                          if (isCompatible) {
                            setFormData(prev => ({ ...prev, model_id: model.id }))
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-brand-navy">{model.name}</h3>
                          {!isCompatible && (
                            <AlertCircle className="w-5 h-5 text-red-500" />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {model.description}
                        </p>

                        <div className="flex gap-2 mb-3 flex-wrap">
                          <Badge variant="outline" className="text-xs border-brand-teal/30 text-brand-navy">
                            <Clock className="w-3 h-3 mr-1" />
                            {model.estimated_duration} {language === 'he' ? 'דק׳' : 'min'}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-brand-teal/30 text-brand-navy">
                            <Users className="w-3 h-3 mr-1" />
                            {language === 'he' ? `עד ${model.max_participants}` : `up to ${model.max_participants}`}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-brand-teal/30 text-brand-navy">
                            {language === 'he' ? `גיל ${model.min_age}-${model.max_age}` : `Age ${model.min_age}-${model.max_age}`}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-brand-teal/30 text-brand-navy">
                            <MapPin className="w-3 h-3 mr-1" />
                            {model.station_count} {language === 'he' ? 'עמדות' : 'stations'}
                          </Badge>
                        </div>

                        {!isCompatible && (
                          <div className="text-xs text-red-600">
                            {formData.child_age < model.min_age || formData.child_age > model.max_age
                              ? (language === 'he' ? `מתאים לגילאי ${model.min_age}-${model.max_age}` : `Suitable for ages ${model.min_age}-${model.max_age}`)
                              : (language === 'he' ? `מקסימום ${model.max_participants} משתתפים` : `Maximum ${model.max_participants} participants`)
                            }
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}

              {errors.model_id && (
                <p className="text-red-500 text-sm">{errors.model_id}</p>
              )}
            </div>

            {selectedModel && (
              <div className="p-4 bg-brand-teal/10 border border-brand-teal/30 rounded-lg">
                <h4 className="font-medium text-brand-teal mb-2">
                  {language === 'he' ? `מודל נבחר: ${selectedModel.name}` : `Selected Model: ${selectedModel.name}`}
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">
                      {language === 'he' ? 'משך:' : 'Duration:'}
                    </span>
                    <p className="text-brand-navy font-medium">
                      {selectedModel.estimated_duration} {language === 'he' ? 'דק׳' : 'min'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {language === 'he' ? 'עמדות:' : 'Stations:'}
                    </span>
                    <p className="text-brand-navy font-medium">{selectedModel.station_count}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {language === 'he' ? 'משימות:' : 'Missions:'}
                    </span>
                    <p className="text-brand-navy font-medium">{selectedModel.mission_count}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">
                      {language === 'he' ? 'גילאים:' : 'Ages:'}
                    </span>
                    <p className="text-brand-navy font-medium">{selectedModel.min_age}-{selectedModel.max_age}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                onClick={prevStep}
                variant="outline"
                className="border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'he' ? 'חזור' : 'Back'}
              </Button>

              <Button
                onClick={nextStep}
                disabled={!formData.model_id}
                className="bg-brand-teal hover:bg-brand-teal/90 text-white font-semibold disabled:opacity-50"
              >
                {language === 'he' ? 'המשך' : 'Continue'}
                <ArrowLeft className="w-4 h-4 mr-2 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Location & Settings */}
      {step === 3 && (
        <Card className="bg-white/70 border-brand-teal/20 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-brand-navy">
              <MapPin className="w-5 h-5 text-brand-teal" />
              {language === 'he' ? 'מיקום והגדרות' : 'Location & Settings'}
            </CardTitle>
            <CardDescription className="text-gray-600">
              {language === 'he' ? 'השלם את פרטי האירוע והגדרות נוספות' : 'Complete event details and additional settings'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-brand-navy">
                {language === 'he' ? 'מיקום האירוע' : 'Event Location'}
              </Label>
              <Input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder={language === 'he' ? 'כתובת או שם המקום...' : 'Address or venue name...'}
                className="border-brand-teal/20 focus:ring-brand-teal"
              />
              {errors.location && (
                <p className="text-red-500 text-sm">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_notes" className="text-brand-navy">
                {language === 'he' ? 'הערות מיוחדות' : 'Special Notes'}
              </Label>
              <Textarea
                id="special_notes"
                value={formData.special_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, special_notes: e.target.value }))}
                placeholder={language === 'he' ? 'הוראות מיוחדות, הערות לצוות, דרישות מיוחדות...' : 'Special instructions, team notes, special requirements...'}
                className="border-brand-teal/20 focus:ring-brand-teal"
                rows={4}
              />
            </div>

            {/* Event Summary */}
            {selectedModel && (
              <div className="p-6 bg-white/50 rounded-lg border border-brand-teal/20">
                <h3 className="text-lg font-medium text-brand-navy mb-4">
                  {language === 'he' ? 'סיכום האירוע' : 'Event Summary'}
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 text-sm">
                        {language === 'he' ? 'ילד:' : 'Child:'}
                      </span>
                      <p className="text-brand-navy font-medium">
                        {formData.child_name}, {language === 'he' ? `גיל ${formData.child_age}` : `age ${formData.child_age}`}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-600 text-sm">
                        {language === 'he' ? 'תאריך ושעה:' : 'Date & Time:'}
                      </span>
                      <p className="text-brand-navy">
                        {new Date(formData.date_start).toLocaleDateString(language === 'he' ? 'he-IL' : 'en-US')}
                        {language === 'he' ? ` בשעה ${formData.time_start}` : ` at ${formData.time_start}`}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-600 text-sm">
                        {language === 'he' ? 'משתתפים:' : 'Participants:'}
                      </span>
                      <p className="text-brand-navy">
                        {formData.participant_count} {language === 'he' ? 'ילדים' : 'children'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-600 text-sm">
                        {language === 'he' ? 'מודל ציד:' : 'Quest Model:'}
                      </span>
                      <p className="text-brand-navy font-medium">{selectedModel.name}</p>
                    </div>

                    <div>
                      <span className="text-gray-600 text-sm">
                        {language === 'he' ? 'משך צפוי:' : 'Expected Duration:'}
                      </span>
                      <p className="text-brand-navy">
                        {selectedModel.estimated_duration} {language === 'he' ? 'דקות' : 'minutes'}
                      </p>
                    </div>

                    <div>
                      <span className="text-gray-600 text-sm">
                        {language === 'he' ? 'מיקום:' : 'Location:'}
                      </span>
                      <p className="text-brand-navy">{formData.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-red-600 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                onClick={prevStep}
                variant="outline"
                className="border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {language === 'he' ? 'חזור' : 'Back'}
              </Button>

              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-brand-teal hover:bg-brand-teal/90 text-white font-semibold"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    {language === 'he' ? 'יוצר אירוע...' : 'Creating Event...'}
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    {language === 'he' ? 'צור אירוע' : 'Create Event'}
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}