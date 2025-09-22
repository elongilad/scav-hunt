import { requireAuth, getUserOrgs } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import Link from 'next/link'
import { 
  Video, 
  Search,
  Eye,
  Download,
  Trash2,
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Play,
  Film
} from 'lucide-react'

export default async function RendersPage() {
  const user = await requireAuth()
  const orgs = await getUserOrgs(user.id)
  const supabase = await createClient()

  // Get render jobs for user's organizations
  const { data: renderJobs } = await supabase
    .from('render_jobs')
    .select(`
      id,
      status,
      progress,
      output_path,
      error_message,
      created_at,
      updated_at,
      events!inner (
        id,
        child_name,
        org_id,
        orgs (name)
      ),
      teams (
        id,
        name
      )
    `)
    .in('events.org_id', orgs.map(org => org.id))
    .order('created_at', { ascending: false })

  // Get stats
  const totalJobs = renderJobs?.length || 0
  const completedJobs = renderJobs?.filter(j => j.status === 'completed').length || 0
  const processingJobs = renderJobs?.filter(j => j.status === 'processing').length || 0
  const failedJobs = renderJobs?.filter(j => j.status === 'failed').length || 0

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'processing': return <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
      case 'failed': return <XCircle className="w-5 h-5 text-red-400" />
      case 'pending': return <Clock className="w-5 h-5 text-yellow-400" />
      default: return <AlertCircle className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/20 text-green-400 border-green-500/30'
      case 'processing': return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
      case 'failed': return 'bg-red-500/20 text-red-400 border-red-500/30'
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
    }
  }

  const formatDuration = (startTime: string, endTime?: string) => {
    const start = new Date(startTime)
    const end = endTime ? new Date(endTime) : new Date()
    const diffMs = end.getTime() - start.getTime()
    const minutes = Math.floor(diffMs / 60000)
    const seconds = Math.floor((diffMs % 60000) / 1000)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">עיבוד וידאו</h1>
          <p className="text-gray-300">
            נהל משימות עיבוד וידאו וצפה בתוצאות
          </p>
        </div>
        
        <div className="flex gap-4">
          <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
            <RefreshCw className="w-4 h-4 mr-2" />
            רענן
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{totalJobs}</p>
                <p className="text-sm text-gray-400">סה"כ משימות</p>
              </div>
              <Video className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{processingJobs}</p>
                <p className="text-sm text-gray-400">בעיבוד</p>
              </div>
              <RefreshCw className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{completedJobs}</p>
                <p className="text-sm text-gray-400">הושלמו</p>
              </div>
              <CheckCircle className="w-8 h-8 text-spy-gold/60" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-2xl font-bold text-spy-gold">{failedJobs}</p>
                <p className="text-sm text-gray-400">נכשלו</p>
              </div>
              <XCircle className="w-8 h-8 text-spy-gold/60" />
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
                placeholder="חפש משימות עיבוד..."
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-spy-gold focus:border-transparent"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                כל המשימות
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                בעיבוד
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                הושלמו
              </Button>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                נכשלו
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Render Jobs List */}
      {renderJobs && renderJobs.length > 0 ? (
        <div className="space-y-4">
          {renderJobs.map((job) => (
            <Card key={job.id} className="bg-white/10 border-white/20 text-white hover:bg-white/15 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4 flex-1">
                    <div className="flex-shrink-0">
                      {getStatusIcon(job.status)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-medium text-white truncate">
                          {(job as any).events?.child_name 
                            ? `וידאו לציד של ${(job as any).events.child_name}` 
                            : 'וידאו ציד'
                          }
                        </h3>
                        <Badge variant="outline" className={getStatusColor(job.status)}>
                          {job.status === 'pending' && 'ממתין'}
                          {job.status === 'processing' && 'מעבד'}
                          {job.status === 'completed' && 'הושלם'}
                          {job.status === 'failed' && 'נכשל'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-300 mb-2">
                        <span>צוות: {(job as any).teams?.name || 'לא מוגדר'}</span>
                        <span>•</span>
                        <span>ארגון: {(job as any).events?.orgs?.name}</span>
                        <span>•</span>
                        <span>נוצר: {new Date(job.created_at).toLocaleDateString('he-IL')}</span>
                      </div>
                      
                      {job.status === 'processing' && (
                        <div className="mb-2">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-gray-400">התקדמות</span>
                            <span className="text-blue-400">{job.progress}%</span>
                          </div>
                          <Progress value={job.progress} className="h-2" />
                        </div>
                      )}
                      
                      {job.status === 'failed' && job.error_message && (
                        <div className="mt-2 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
                          <p className="text-red-400 text-sm">{job.error_message}</p>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-gray-400">
                        <span>משך עיבוד: {formatDuration(job.created_at, job.updated_at)}</span>
                        {job.output_path && (
                          <span className="text-green-400">• קובץ זמין להורדה</span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {job.status === 'completed' && job.output_path && (
                      <>
                        <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                          <Download className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    
                    {job.status === 'failed' && (
                      <Button size="sm" variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                        <RefreshCw className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button size="sm" variant="ghost" className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white/10 border-white/20 text-white">
          <CardContent className="text-center py-12">
            <Film className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-400 mb-2">אין משימות עיבוד</h3>
            <p className="text-gray-500 mb-6">
              משימות עיבוד וידאו יופיעו כאן כאשר צוותים ישלימו ציד
            </p>
            <Link href="/dashboard/events">
              <Button className="bg-spy-gold hover:bg-spy-gold/90 text-black font-semibold">
                <Eye className="w-4 h-4 mr-2" />
                צפה באירועים
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Processing Queue Info */}
      <Card className="bg-white/10 border-white/20 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="w-5 h-5 text-spy-gold" />
            מידע על עיבוד וידאו
          </CardTitle>
          <CardDescription className="text-gray-400">
            איך פועל מערך עיבוד הווידאו
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-white mb-3">תהליך העיבוד</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-spy-gold rounded-full"></div>
                  איסוף קטעי וידאו מהמשתתפים
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-spy-gold rounded-full"></div>
                  שילוב עם תבנית הוידאו
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-spy-gold rounded-full"></div>
                  הוספת כיתובים ואפקטים
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-spy-gold rounded-full"></div>
                  יצירת וידאו סופי מותאם אישית
                </li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-3">זמני עיבוד</h4>
              <ul className="text-sm text-gray-300 space-y-2">
                <li>• וידאו קצר (עד 2 דקות): 2-5 דקות</li>
                <li>• וידאו בינוני (2-5 דקות): 5-10 דקות</li>
                <li>• וידאו ארוך (מעל 5 דקות): 10-20 דקות</li>
                <li>• עיבוד במקביל: עד 5 וידאו בו זמנית</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}