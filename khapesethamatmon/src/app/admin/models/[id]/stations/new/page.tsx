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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowLeft, Save, MapPin, Lightbulb, Users, Settings } from 'lucide-react'
import Link from 'next/link'

interface FormData {
  id: string
  display_name: string
  type: string
  default_activity: {
    description: string
    instructions: string
    props_needed: string[]
    estimated_duration_minutes: number
  }
}

const STATION_TYPES = [
  { value: 'qr', label: 'QR Code Station', description: 'עמדה עם סריקת QR' },
  { value: 'puzzle', label: 'Puzzle Challenge', description: 'חידה או תחמץ לפתרון' },
  { value: 'actor', label: 'Actor Mission', description: 'משימה עם שחקן בתפקיד' },
  { value: 'bomb', label: 'Bomb Defuse', description: 'חבלה לנטרול' },
  { value: 'book-cipher', label: 'Book Cipher', description: 'צופן ספר או מסמך' },
  { value: 'photo', label: 'Photo Challenge', description: 'משימת צילום' },
  { value: 'physical', label: 'Physical Task', description: 'משימה פיזית' },
  { value: 'hidden-object', label: 'Hidden Object', description: 'איתור חפץ נסתר' }
]

interface PageProps {
  params: {
    id: string
  }
}

export default function NewStationPage({ params }: PageProps) {
  const [formData, setFormData] = useState<FormData>({
    id: '',
    display_name: '',
    type: '',
    default_activity: {
      description: '',
      instructions: '',
      props_needed: [],
      estimated_duration_minutes: 10
    }
  })
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [propsInput, setPropsInput] = useState('')
  
  const router = useRouter()
  const supabase = createClient()

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.id.trim()) {
      newErrors.id = 'מזהה העמדה נדרש'
    } else if (!/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(formData.id)) {
      newErrors.id = 'מזהה חייב להתחיל באות ולהכיל רק אותיות, מספרים, _ או -'
    }
    
    if (!formData.display_name.trim()) {
      newErrors.display_name = 'שם התצוגה נדרש'
    }
    
    if (!formData.type) {
      newErrors.type = 'יש לבחור סוג עמדה'
    }
    
    if (!formData.default_activity.description.trim()) {
      newErrors.description = 'תיאור הפעילות נדרש'
    }
    
    if (formData.default_activity.estimated_duration_minutes < 1 || formData.default_activity.estimated_duration_minutes > 120) {
      newErrors.duration = 'משך זמן חייב להיות בין 1-120 דקות'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setLoading(true)
    
    try {
      // Parse props from comma-separated string
      const props_needed = propsInput
        .split(',')
        .map(prop => prop.trim())
        .filter(prop => prop.length > 0)

      // Create station
      const { error } = await supabase
        .from('model_stations')
        .insert({
          id: formData.id.trim(),
          model_id: params.id,
          display_name: formData.display_name.trim(),
          type: formData.type,
          default_activity: {
            ...formData.default_activity,
            props_needed
          }
        })

      if (error) {
        if (error.code === '23505') { // Unique constraint violation
          setErrors({ id: 'מזהה העמדה כבר קיים' })
          return
        }
        throw error
      }

      // Redirect back to model detail page
      router.push(`/admin/models/${params.id}`)
      
    } catch (error: any) {
      console.error('Error creating station:', error)
      setErrors({ submit: error.message || 'שגיאה ביצירת העמדה' })
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

  const handleActivityChange = (field: keyof FormData['default_activity'], value: any) => {
    setFormData(prev => ({
      ...prev,
      default_activity: { ...prev.default_activity, [field]: value }
    }))
    // Clear field error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const selectedType = STATION_TYPES.find(type => type.value === formData.type)

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/admin/models/${params.id}`}>
          <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <ArrowLeft className="w-4 h-4 mr-2" />
            חזור למודל
          </Button>
        </Link>
        
        <div>
          <h1 className="text-3xl font-bold text-white">עמדה חדשה</h1>
          <p className="text-gray-300">צור עמדה חדשה במודל הציד</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-spy-gold" />
              מידע בסיסי
            </CardTitle>
            <CardDescription className="text-gray-400">
              הגדר את המזהה, השם וסוג העמדה
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Station ID */}
            <div className="space-y-2">
              <Label htmlFor="id" className="text-white">מזהה עמדה *</Label>
              <Input
                id="id"
                type="text"
                value={formData.id}
                onChange={(e) => handleInputChange('id', e.target.value)}
                placeholder="למשל: SchoolGate, Pizza, BookCipher"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                מזהה ייחודי באנגלית, ללא רווחים. ישמש ליצירת QR ולניתוב.
              </p>
              {errors.id && (
                <p className="text-red-400 text-sm">{errors.id}</p>
              )}
            </div>

            {/* Display Name */}
            <div className="space-y-2">
              <Label htmlFor="display_name" className="text-white">שם תצוגה *</Label>
              <Input
                id="display_name"
                type="text"
                value={formData.display_name}
                onChange={(e) => handleInputChange('display_name', e.target.value)}
                placeholder="למשל: שער בית הספר, פיצריה, צופן הספר"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                השם שיופיע לשחקנים בממשק
              </p>
              {errors.display_name && (
                <p className="text-red-400 text-sm">{errors.display_name}</p>
              )}
            </div>

            {/* Station Type */}
            <div className="space-y-2">
              <Label className="text-white">סוג עמדה *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => handleInputChange('type', value)}
                disabled={loading}
              >
                <SelectTrigger className="bg-white/10 border-white/20 text-white">
                  <SelectValue placeholder="בחר סוג עמדה" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-600">
                  {STATION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value} className="text-white hover:bg-gray-700">
                      <div>
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-gray-400">{type.description}</div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {selectedType && (
                <div className="p-3 bg-spy-gold/10 border border-spy-gold/20 rounded-lg">
                  <p className="text-spy-gold text-sm">{selectedType.description}</p>
                </div>
              )}
              {errors.type && (
                <p className="text-red-400 text-sm">{errors.type}</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Activity Details */}
        <Card className="bg-white/10 border-white/20 text-white">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="w-5 h-5 text-spy-gold" />
              פרטי הפעילות
            </CardTitle>
            <CardDescription className="text-gray-400">
              הגדר מה הקבוצות צריכות לעשות בעמדה זו
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-white">תיאור הפעילות *</Label>
              <Textarea
                id="description"
                value={formData.default_activity.description}
                onChange={(e) => handleActivityChange('description', e.target.value)}
                placeholder="תאר מה הקבוצות צריכות לעשות בעמדה זו..."
                rows={3}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none"
                disabled={loading}
              />
              {errors.description && (
                <p className="text-red-400 text-sm">{errors.description}</p>
              )}
            </div>

            {/* Instructions */}
            <div className="space-y-2">
              <Label htmlFor="instructions" className="text-white">הוראות מפורטות</Label>
              <Textarea
                id="instructions"
                value={formData.default_activity.instructions}
                onChange={(e) => handleActivityChange('instructions', e.target.value)}
                placeholder="הוראות מפורטות לביצוע הפעילות..."
                rows={4}
                className="bg-white/10 border-white/20 text-white placeholder-gray-400 resize-none"
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                הוראות מפורטות למארגני האירוע
              </p>
            </div>

            {/* Props Needed */}
            <div className="space-y-2">
              <Label htmlFor="props" className="text-white">ציוד נדרש</Label>
              <Input
                id="props"
                type="text"
                value={propsInput}
                onChange={(e) => setPropsInput(e.target.value)}
                placeholder="למשל: נעילות, מפתחות, חמצן, פנס"
                className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                רשימת פריטים מופרדת בפסיקים
              </p>
              {propsInput && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {propsInput.split(',').map((prop, index) => {
                    const trimmed = prop.trim()
                    return trimmed ? (
                      <Badge key={index} variant="outline" className="border-white/20 text-gray-300">
                        {trimmed}
                      </Badge>
                    ) : null
                  })}
                </div>
              )}
            </div>

            {/* Duration */}
            <div className="space-y-2">
              <Label htmlFor="duration" className="text-white">משך זמן משוער (דקות)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                max="120"
                value={formData.default_activity.estimated_duration_minutes}
                onChange={(e) => handleActivityChange('estimated_duration_minutes', parseInt(e.target.value) || 10)}
                className="bg-white/10 border-white/20 text-white"
                disabled={loading}
              />
              <p className="text-xs text-gray-400">
                כמה זמן צפוי שייקח לקבוצה להשלים את הפעילות
              </p>
              {errors.duration && (
                <p className="text-red-400 text-sm">{errors.duration}</p>
              )}
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
                יוצר עמדה...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                צור עמדה
              </>
            )}
          </Button>
          
          <Link href={`/admin/models/${params.id}`}>
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