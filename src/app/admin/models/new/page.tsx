'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Save, Eye, MapPin, Users, Video } from 'lucide-react'
import Link from 'next/link'

interface FormData {
  name: string
  description: string
  locale: 'he' | 'en'
  active: boolean
}

export default function NewHuntModelPage() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    description: '',
    locale: 'he',
    active: true
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  
  const router = useRouter()
  const supabase = createClient()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.name.trim()) {
      newErrors.name = 'שם המודל נדרש'
    } else if (formData.name.length < 3) {
      newErrors.name = 'שם המודל חייב להכיל לפחות 3 תווים'
    }
    
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'התיאור יכול להכיל עד 500 תווים'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      // Get user's default org
      const { data: orgs } = await supabase
        .from('org_members')
        .select('org_id')
        .eq('user_id', user.id)
        .eq('role', 'owner')
        .limit(1)

      if (!orgs || orgs.length === 0) {
        throw new Error('No organization found')
      }

      // Create hunt model
      const { data: huntModel, error } = await supabase
        .from('hunt_models')
        .insert({
          org_id: orgs[0].org_id,
          name: formData.name.trim(),
          description: formData.description.trim() || null,
          locale: formData.locale,
          active: formData.active
        })
        .select()
        .single()

      if (error) throw error

      // Redirect to the new model's edit page
      router.push(`/admin/models/${huntModel.id}`)
      
    } catch (error: any) {
      console.error('Error creating hunt model:', error)
      setErrors({ submit: error.message || 'שגיאה ביצירת המודל' })
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/admin/models">
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            חזור
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-white">מודל ציד חדש</h1>
          <p className="text-gray-300">צור תבנית חדשה למסע ציד אוצרות</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle>מידע בסיסי</CardTitle>
            <CardDescription className="text-gray-400">
              הגדר את השם, התיאור והשפה של המודל
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">שם המודל *</Label>
              <Input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="למשל: ציד ריגול לגילאי 7-9"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                disabled={loading}
              />
              {errors.name && (
                <p className="text-red-400 text-sm">{errors.name}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">תיאור</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="תאר את המודל, קהל היעד, וההתאמות המיוחדות..."
                rows={4}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>תיאור אופציונלי שיעזור לזהות את המודל</span>
                <span>{formData.description.length}/500</span>
              </div>
              {errors.description && (
                <p className="text-red-400 text-sm">{errors.description}</p>
              )}
            </div>

            {/* Language */}
            <div className="space-y-2">
              <Label className="text-white">שפה</Label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleInputChange('locale', 'he')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.locale === 'he'
                      ? 'bg-spy-gold text-black border-spy-gold'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                  disabled={loading}
                >
                  עברית
                </button>
                <button
                  type="button"
                  onClick={() => handleInputChange('locale', 'en')}
                  className={`px-4 py-2 rounded-lg border transition-colors ${
                    formData.locale === 'en'
                      ? 'bg-spy-gold text-black border-spy-gold'
                      : 'bg-white/10 text-white border-white/20 hover:bg-white/20'
                  }`}
                  disabled={loading}
                >
                  English
                </button>
              </div>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label className="text-white">סטטוס</Label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => handleInputChange('active', !formData.active)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    formData.active ? 'bg-spy-gold' : 'bg-gray-600'
                  }`}
                  disabled={loading}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-transform ${
                      formData.active ? 'transform translate-x-6' : 'transform translate-x-0.5'
                    }`}
                  />
                </button>
                <Badge 
                  variant={formData.active ? "default" : "secondary"}
                  className={formData.active ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-gray-500/20 text-gray-400 border-gray-500/30"}
                >
                  {formData.active ? 'פעיל' : 'לא פעיל'}
                </Badge>
                <span className="text-gray-400 text-sm">
                  {formData.active ? 'המודל יהיה זמין לשימוש' : 'המודל לא יהיה זמין לשימוש'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps Preview */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-spy-gold" />
              השלבים הבאים
            </CardTitle>
            <CardDescription className="text-gray-400">
              לאחר יצירת המודל תוכל להוסיף תוכן
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <MapPin className="w-5 h-5 text-spy-gold" />
                <div>
                  <h4 className="font-medium">הוסף עמדות</h4>
                  <p className="text-sm text-gray-400">צור עמדות שונות עם פעילויות והוראות</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Users className="w-5 h-5 text-spy-gold" />
                <div>
                  <h4 className="font-medium">הגדר משימות</h4>
                  <p className="text-sm text-gray-400">צור משימות שמקשרות בין העמדות</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3 p-3 bg-white/5 rounded-lg">
                <Video className="w-5 h-5 text-spy-gold" />
                <div>
                  <h4 className="font-medium">הוסף תבניות וידאו</h4>
                  <p className="text-sm text-gray-400">צור תבניות לסרטוני משימות</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit */}
        <div className="flex gap-4 pt-4">
          <Button
            type="submit"
            disabled={loading}
            className="flex-1 bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin mr-2" />
                יוצר מודל...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                צור מודל
              </>
            )}
          </Button>
          
          <Link href="/admin/models">
            <Button 
              type="button" 
              variant="outline" 
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
              disabled={loading}
            >
              ביטול
            </Button>
          </Link>
        </div>

        {/* Submit Error */}
        {errors.submit && (
          <div className="p-4 bg-red-500/20 border border-red-500/30 rounded-lg">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}
      </form>
    </div>
  )
}