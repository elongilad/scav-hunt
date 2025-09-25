'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { TrendingUp, Brain, Lightbulb, Target, AlertTriangle, CheckCircle } from 'lucide-react'

interface Props {
  eventId: string
}

interface AIInsight {
  id: string
  type: 'performance' | 'engagement' | 'optimization' | 'prediction'
  priority: 'high' | 'medium' | 'low'
  title: string
  description: string
  recommendation: string
  confidence: number
  impact: 'high' | 'medium' | 'low'
}

export function AutomatedInsights({ eventId }: Props) {
  const [insights, setInsights] = useState<AIInsight[]>([])
  const [isGenerating, setIsGenerating] = useState(false)

  useEffect(() => {
    generateInsights()
  }, [eventId])

  const generateInsights = async () => {
    setIsGenerating(true)
    
    // Simulate AI analysis
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    const mockInsights: AIInsight[] = [
      {
        id: '1',
        type: 'performance',
        priority: 'high',
        title: 'Station 3 Performance Bottleneck Detected',
        description: 'Teams are spending 40% more time at Station 3 compared to similar complexity stations.',
        recommendation: 'Consider adding clearer instructions or an additional hint mechanism for Station 3.',
        confidence: 87,
        impact: 'high'
      },
      {
        id: '2',
        type: 'engagement',
        priority: 'medium',
        title: 'Peak Engagement Period Identified',
        description: 'Team performance peaks between 2-4 PM with 25% faster completion rates.',
        recommendation: 'Schedule similar events during afternoon hours for optimal engagement.',
        confidence: 92,
        impact: 'medium'
      },
      {
        id: '3',
        type: 'optimization',
        priority: 'medium',
        title: 'Team Size Optimization Opportunity',
        description: 'Teams of 4-5 members show 30% better completion rates than larger teams.',
        recommendation: 'Set optimal team size recommendations for future events.',
        confidence: 78,
        impact: 'medium'
      },
      {
        id: '4',
        type: 'prediction',
        priority: 'low',
        title: 'Completion Rate Forecast',
        description: 'Based on current trends, final completion rate projected at 82-85%.',
        recommendation: 'Current event trajectory is healthy, maintain current support levels.',
        confidence: 95,
        impact: 'low'
      }
    ]

    setInsights(mockInsights)
    setIsGenerating(false)
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'performance': return <TrendingUp className="w-4 h-4" />
      case 'engagement': return <Target className="w-4 h-4" />
      case 'optimization': return <Lightbulb className="w-4 h-4" />
      case 'prediction': return <Brain className="w-4 h-4" />
      default: return <TrendingUp className="w-4 h-4" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500'
      case 'medium': return 'bg-yellow-500'
      case 'low': return 'bg-green-500'
      default: return 'bg-gray-500'
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return 'text-green-400'
    if (confidence >= 70) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div className="space-y-6">
      <Card className="bg-white/10 border-white/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="w-5 h-5" />
                AI-Powered Insights
              </CardTitle>
              <CardDescription className="text-gray-400">
                Machine learning analysis of event patterns and performance
              </CardDescription>
            </div>
            <Button
              onClick={generateInsights}
              disabled={isGenerating}
              className="bg-spy-gold hover:bg-spy-gold/90 text-black"
            >
              {isGenerating ? (
                <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
              ) : (
                <Brain className="w-4 h-4 mr-2" />
              )}
              {isGenerating ? 'Analyzing...' : 'Regenerate'}
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Insights Grid */}
      <div className="space-y-4">
        {insights.map(insight => (
          <Card key={insight.id} className="bg-white/10 border-white/20">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${getPriorityColor(insight.priority)} text-white`}>
                    {getTypeIcon(insight.type)}
                  </div>
                  <div>
                    <h3 className="text-white font-medium">{insight.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge className={`${getPriorityColor(insight.priority)} text-white text-xs`}>
                        {insight.priority} priority
                      </Badge>
                      <Badge variant="outline" className="text-xs border-white/20 text-gray-300">
                        {insight.type}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-lg font-bold ${getConfidenceColor(insight.confidence)}`}>
                    {insight.confidence}%
                  </div>
                  <div className="text-xs text-gray-400">Confidence</div>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <h4 className="text-sm font-medium text-gray-300 mb-1">Analysis</h4>
                  <p className="text-sm text-gray-200">{insight.description}</p>
                </div>

                <div className="p-3 bg-spy-gold/10 border border-spy-gold/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Lightbulb className="w-4 h-4 text-spy-gold mt-0.5 flex-shrink-0" />
                    <div>
                      <h4 className="text-sm font-medium text-spy-gold mb-1">Recommendation</h4>
                      <p className="text-sm text-gray-200">{insight.recommendation}</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Impact:</span>
                    <Badge className={`${insight.impact === 'high' ? 'bg-red-500/20 text-red-400' : insight.impact === 'medium' ? 'bg-yellow-500/20 text-yellow-400' : 'bg-green-500/20 text-green-400'} text-xs`}>
                      {insight.impact}
                    </Badge>
                  </div>
                  <span className="text-gray-400">Generated by AI Analysis Engine</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Summary */}
      <Card className="bg-gradient-to-r from-spy-gold/10 to-white/5 border-spy-gold/20">
        <CardHeader>
          <CardTitle className="text-spy-gold text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5" />
            AI Analysis Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">
                {insights.filter(i => i.priority === 'high').length}
              </div>
              <div className="text-sm text-gray-400">High Priority</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">
                {insights.length > 0 ? Math.round(insights.reduce((sum, i) => sum + i.confidence, 0) / insights.length) : 0}%
              </div>
              <div className="text-sm text-gray-400">Avg Confidence</div>
            </div>
            <div className="text-center p-4 bg-white/5 rounded-lg">
              <div className="text-2xl font-bold text-white mb-1">
                {insights.filter(i => i.impact === 'high' || i.impact === 'medium').length}
              </div>
              <div className="text-sm text-gray-400">Actionable Items</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}