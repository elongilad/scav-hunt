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

export default function NewEventPage() {
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
      if (!user) throw new Error('משתמש לא מחובר')

      const { data: orgs } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .limit(1)

      if (!orgs || orgs.length === 0) {
        throw new Error('לא נמצא ארגון')
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
        stepErrors.child_name = 'שם הילד נדרש'
      }
      if (!formData.child_age || formData.child_age < 3 || formData.child_age > 18) {
        stepErrors.child_age = 'גיל צריך להיות בין 3 ל-18'
      }
      if (!formData.date_start) {
        stepErrors.date_start = 'תאריך נדרש'
      } else {
        const selectedDate = new Date(formData.date_start)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        if (selectedDate < today) {
          stepErrors.date_start = 'תאריך חייב להיות בעתיד'
        }
      }
    }

    if (stepNumber === 2) {
      if (!formData.model_id) {
        stepErrors.model_id = 'יש לבחור מודל ציד'
      }
      if (!formData.participant_count || formData.participant_count < 1) {
        stepErrors.participant_count = 'מספר משתתפים נדרש'
      }
      
      // Validate against selected model constraints
      const selectedModel = huntModels.find(m => m.id === formData.model_id)
      if (selectedModel) {
        if (formData.participant_count > selectedModel.max_participants) {
          stepErrors.participant_count = `מקסימום ${selectedModel.max_participants} משתתפים למודל זה`
        }
        if (formData.child_age < selectedModel.min_age || formData.child_age > selectedModel.max_age) {
          stepErrors.child_age = `גיל צריך להיות בין ${selectedModel.min_age} ל-${selectedModel.max_age} למודל זה`
        }
      }
    }

    if (stepNumber === 3) {
      if (!formData.location.trim()) {
        stepErrors.location = 'מיקום נדרש'
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
      if (!user) throw new Error('משתמש לא מחובר')

      const { data: orgs } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .limit(1)

      if (!orgs || orgs.length === 0) {
        throw new Error('לא נמצא ארגון')
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
      setErrors({ submit: error.message || 'שגיאה ביצירת האירוע' })
    } finally {
      setSaving(false)
    }
  }

  const selectedModel = huntModels.find(m => m.id === formData.model_id)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-spy-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">טוען מודלי ציד...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard/events">
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            חזור
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-white">אירוע ציד חדש</h1>
          <p className="text-gray-300">צור אירוע ציד מותאם אישית</p>
        </div>
      </div>

      {/* Progress Steps */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            {[1, 2, 3].map((stepNum) => (
              <div key={stepNum} className="flex items-center">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                  step >= stepNum ? 'bg-spy-gold text-black' : 'bg-white/20 text-gray-400'
                }`}>
                  {stepNum}
                </div>
                <div className="mr-3">
                  <p className={`font-medium ${step >= stepNum ? 'text-white' : 'text-gray-400'}`}>
                    {stepNum === 1 && 'פרטי הילד והאירוע'}
                    {stepNum === 2 && 'בחירת מודל ציד'}
                    {stepNum === 3 && 'מיקום והגדרות'}
                  </p>
                </div>
                {stepNum < 3 && (
                  <div className={`w-12 h-1 mx-4 ${step > stepNum ? 'bg-spy-gold' : 'bg-white/20'}`} />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Step 1: Child & Event Details */}
      {step === 1 && (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-spy-gold" />
              פרטי הילד והאירוע
            </CardTitle>
            <CardDescription className="text-gray-400">
              הכנס את הפרטים הבסיסיים של האירוע
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="child_name" className="text-white">שם הילד</Label>
                <Input
                  id="child_name"
                  type="text"
                  value={formData.child_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, child_name: e.target.value }))}
                  placeholder="השם של יום ההולדת..."
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
                {errors.child_name && (
                  <p className="text-red-400 text-sm">{errors.child_name}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="child_age" className="text-white">גיל</Label>
                <Input
                  id="child_age"
                  type="number"
                  min="3"
                  max="18"
                  value={formData.child_age}
                  onChange={(e) => setFormData(prev => ({ ...prev, child_age: parseInt(e.target.value) || 8 }))}
                  className="bg-white/10 border-white/20 text-white"
                />
                {errors.child_age && (
                  <p className="text-red-400 text-sm">{errors.child_age}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_start" className="text-white">תאריך האירוע</Label>
                <Input
                  id="date_start"
                  type="date"
                  value={formData.date_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, date_start: e.target.value }))}
                  min={new Date().toISOString().split('T')[0]}
                  className="bg-white/10 border-white/20 text-white"
                />
                {errors.date_start && (
                  <p className="text-red-400 text-sm">{errors.date_start}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="time_start" className="text-white">שעת התחלה</Label>
                <Input
                  id="time_start"
                  type="time"
                  value={formData.time_start}
                  onChange={(e) => setFormData(prev => ({ ...prev, time_start: e.target.value }))}
                  className="bg-white/10 border-white/20 text-white"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-white">סוג אירוע</Label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="event_type"
                    checked={formData.birthday_theme}
                    onChange={() => setFormData(prev => ({ ...prev, birthday_theme: true }))}
                    className="text-spy-gold"
                  />
                  <span className="text-white">יום הולדת</span>
                  <Gift className="w-4 h-4 text-spy-gold" />
                </label>
                
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="event_type"
                    checked={!formData.birthday_theme}
                    onChange={() => setFormData(prev => ({ ...prev, birthday_theme: false }))}
                    className="text-spy-gold"
                  />
                  <span className="text-white">אירוע רגיל</span>
                </label>
              </div>
            </div>

            {!formData.birthday_theme && (
              <div className="space-y-2">
                <Label htmlFor="custom_theme" className="text-white">נושא האירוע</Label>
                <Input
                  id="custom_theme"
                  type="text"
                  value={formData.custom_theme}
                  onChange={(e) => setFormData(prev => ({ ...prev, custom_theme: e.target.value }))}
                  placeholder="למשל: חוקרי טבע, גיבורי על..."
                  className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                />
              </div>
            )}

            <div className="flex justify-end">
              <Button
                onClick={nextStep}
                className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
              >
                המשך
                <ArrowLeft className="w-4 h-4 mr-2 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Hunt Model Selection */}
      {step === 2 && (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="w-5 h-5 text-spy-gold" />
              בחירת מודל ציד
            </CardTitle>
            <CardDescription className="text-gray-400">
              בחר את מודל הציד המתאים לגיל ולמספר המשתתפים
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="participant_count" className="text-white">מספר משתתפים</Label>
              <Input
                id="participant_count"
                type="number"
                min="1"
                max="20"
                value={formData.participant_count}
                onChange={(e) => setFormData(prev => ({ ...prev, participant_count: parseInt(e.target.value) || 1 }))}
                className="bg-white/10 border-white/20 text-white"
              />
              {errors.participant_count && (
                <p className="text-red-400 text-sm">{errors.participant_count}</p>
              )}
            </div>

            <div className="space-y-4">
              <Label className="text-white">מודלי ציד זמינים</Label>
              
              {huntModels.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-white/20 rounded-lg">
                  <Video className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-400 mb-4">אין מודלי ציד זמינים</p>
                  <Link href="/admin/models/new">
                    <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                      צור מודל ראשון
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
                        className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                          formData.model_id === model.id
                            ? 'border-spy-gold bg-spy-gold/10'
                            : isCompatible
                            ? 'border-white/20 bg-white/5 hover:bg-white/10'
                            : 'border-red-500/20 bg-red-500/5 opacity-60'
                        }`}
                        onClick={() => {
                          if (isCompatible) {
                            setFormData(prev => ({ ...prev, model_id: model.id }))
                          }
                        }}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <h3 className="font-medium text-white">{model.name}</h3>
                          {!isCompatible && (
                            <AlertCircle className="w-5 h-5 text-red-400" />
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-300 mb-3 line-clamp-2">
                          {model.description}
                        </p>
                        
                        <div className="flex gap-2 mb-3 flex-wrap">
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            <Clock className="w-3 h-3 mr-1" />
                            {model.estimated_duration} דק׳
                          </Badge>
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            <Users className="w-3 h-3 mr-1" />
                            עד {model.max_participants}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            גיל {model.min_age}-{model.max_age}
                          </Badge>
                          <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                            <MapPin className="w-3 h-3 mr-1" />
                            {model.station_count} עמדות
                          </Badge>
                        </div>

                        {!isCompatible && (
                          <div className="text-xs text-red-400">
                            {formData.child_age < model.min_age || formData.child_age > model.max_age
                              ? `מתאים לגילאי ${model.min_age}-${model.max_age}`
                              : `מקסימום ${model.max_participants} משתתפים`
                            }
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              
              {errors.model_id && (
                <p className="text-red-400 text-sm">{errors.model_id}</p>
              )}
            </div>

            {selectedModel && (
              <div className="p-4 bg-spy-gold/10 border border-spy-gold/20 rounded-lg">
                <h4 className="font-medium text-spy-gold mb-2">מודל נבחר: {selectedModel.name}</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">משך:</span>
                    <p className="text-white">{selectedModel.estimated_duration} דק׳</p>
                  </div>
                  <div>
                    <span className="text-gray-400">עמדות:</span>
                    <p className="text-white">{selectedModel.station_count}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">משימות:</span>
                    <p className="text-white">{selectedModel.mission_count}</p>
                  </div>
                  <div>
                    <span className="text-gray-400">גילאים:</span>
                    <p className="text-white">{selectedModel.min_age}-{selectedModel.max_age}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                onClick={prevStep}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                חזור
              </Button>
              
              <Button
                onClick={nextStep}
                disabled={!formData.model_id}
                className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold disabled:opacity-50"
              >
                המשך
                <ArrowLeft className="w-4 h-4 mr-2 rotate-180" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Location & Settings */}
      {step === 3 && (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-spy-gold" />
              מיקום והגדרות
            </CardTitle>
            <CardDescription className="text-gray-400">
              השלם את פרטי האירוע והגדרות נוספות
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="location" className="text-white">מיקום האירוע</Label>
              <Input
                id="location"
                type="text"
                value={formData.location}
                onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
                placeholder="כתובת או שם המקום..."
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
              />
              {errors.location && (
                <p className="text-red-400 text-sm">{errors.location}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="special_notes" className="text-white">הערות מיוחדות</Label>
              <Textarea
                id="special_notes"
                value={formData.special_notes}
                onChange={(e) => setFormData(prev => ({ ...prev, special_notes: e.target.value }))}
                placeholder="הוראות מיוחדות, הערות לצוות, דרישות מיוחדות..."
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                rows={4}
              />
            </div>

            {/* Event Summary */}
            {selectedModel && (
              <div className="p-6 bg-white/5 rounded-lg border border-white/10">
                <h3 className="text-lg font-medium text-white mb-4">סיכום האירוע</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">ילד:</span>
                      <p className="text-white font-medium">{formData.child_name}, גיל {formData.child_age}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-400 text-sm">תאריך ושעה:</span>
                      <p className="text-white">
                        {new Date(formData.date_start).toLocaleDateString('he-IL')} בשעה {formData.time_start}
                      </p>
                    </div>
                    
                    <div>
                      <span className="text-gray-400 text-sm">משתתפים:</span>
                      <p className="text-white">{formData.participant_count} ילדים</p>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-400 text-sm">מודל ציד:</span>
                      <p className="text-white font-medium">{selectedModel.name}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-400 text-sm">משך צפוי:</span>
                      <p className="text-white">{selectedModel.estimated_duration} דקות</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-400 text-sm">מיקום:</span>
                      <p className="text-white">{formData.location}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Error */}
            {errors.submit && (
              <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
                <p className="text-red-400 text-sm">{errors.submit}</p>
              </div>
            )}

            <div className="flex justify-between">
              <Button
                onClick={prevStep}
                variant="outline"
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                חזור
              </Button>
              
              <Button
                onClick={handleSubmit}
                disabled={saving}
                className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                    יוצר אירוע...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    צור אירוע
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