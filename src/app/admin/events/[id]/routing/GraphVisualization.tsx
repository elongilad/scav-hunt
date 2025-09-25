'use client'

import { useEffect, useRef, useState } from 'react'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

interface Node {
  id: string
  event_id: string
  version_id: string
  node_type: string
  node_ref_id: string
  node_label: string
  node_order: number | null
  team_constraint?: any
  requires_conditions?: any
  unlock_conditions?: any
}

interface Edge {
  id: string
  event_id: string
  version_id: string
  from_node_id: string
  to_node_id: string
  edge_weight: number
  edge_type: string
  traverse_conditions?: any
  traverse_probability: number
  team_constraint?: any
  edge_label?: string
}

interface GraphNode {
  id: string
  x: number
  y: number
  node: Node
  radius: number
}

interface GraphEdge {
  id: string
  from: GraphNode
  to: GraphNode
  edge: Edge
}

interface GraphVisualizationProps {
  nodes: Node[]
  edges: Edge[]
  stations: any[]
  missions: any[]
}

export function GraphVisualization({ nodes, edges, stations, missions }: GraphVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selectedNode, setSelectedNode] = useState<Node | null>(null)
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([])
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([])
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })

  // Initialize graph layout
  useEffect(() => {
    if (nodes.length === 0) return

    const width = canvasSize.width
    const height = canvasSize.height
    const padding = 80

    // Create graph nodes with positions
    const newGraphNodes: GraphNode[] = nodes.map((node, index) => {
      // Simple circular layout
      const angle = (index / nodes.length) * 2 * Math.PI
      const radiusFromCenter = Math.min(width, height) / 3
      const centerX = width / 2
      const centerY = height / 2

      return {
        id: node.id,
        x: centerX + Math.cos(angle) * radiusFromCenter,
        y: centerY + Math.sin(angle) * radiusFromCenter,
        node,
        radius: node.node_type === 'station' ? 25 : 20
      }
    })

    // Create graph edges
    const newGraphEdges: GraphEdge[] = edges.map(edge => {
      const fromNode = newGraphNodes.find(n => n.id === edge.from_node_id)
      const toNode = newGraphNodes.find(n => n.id === edge.to_node_id)

      if (!fromNode || !toNode) {
        throw new Error(`Invalid edge: ${edge.id}`)
      }

      return {
        id: edge.id,
        from: fromNode,
        to: toNode,
        edge
      }
    })

    setGraphNodes(newGraphNodes)
    setGraphEdges(newGraphEdges)
  }, [nodes, edges, canvasSize])

  // Draw the graph
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw edges
    graphEdges.forEach(graphEdge => {
      const { from, to, edge } = graphEdge

      ctx.beginPath()
      ctx.moveTo(from.x, from.y)
      ctx.lineTo(to.x, to.y)

      // Style based on edge type
      if (edge.edge_type === 'conditional') {
        ctx.strokeStyle = '#fb923c' // orange
        ctx.setLineDash([5, 5])
      } else if (edge.edge_type === 'fallback') {
        ctx.strokeStyle = '#ef4444' // red
        ctx.setLineDash([2, 2])
      } else if (edge.edge_type === 'shortcut') {
        ctx.strokeStyle = '#a855f7' // purple
        ctx.setLineDash([10, 2])
      } else {
        ctx.strokeStyle = '#6b7280' // gray
        ctx.setLineDash([])
      }

      ctx.lineWidth = Math.max(1, edge.edge_weight)
      ctx.stroke()

      // Draw arrow
      const angle = Math.atan2(to.y - from.y, to.x - from.x)
      const arrowLength = 10
      const arrowAngle = Math.PI / 6

      const endX = to.x - Math.cos(angle) * to.radius
      const endY = to.y - Math.sin(angle) * to.radius

      ctx.beginPath()
      ctx.moveTo(endX, endY)
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle - arrowAngle),
        endY - arrowLength * Math.sin(angle - arrowAngle)
      )
      ctx.moveTo(endX, endY)
      ctx.lineTo(
        endX - arrowLength * Math.cos(angle + arrowAngle),
        endY - arrowLength * Math.sin(angle + arrowAngle)
      )
      ctx.stroke()

      // Draw probability if not 1
      if (edge.traverse_probability !== 1) {
        const midX = (from.x + to.x) / 2
        const midY = (from.y + to.y) / 2

        ctx.fillStyle = '#fbbf24' // amber
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(`${(edge.traverse_probability * 100).toFixed(0)}%`, midX, midY - 5)
      }
    })

    // Draw nodes
    graphNodes.forEach(graphNode => {
      const { x, y, node, radius } = graphNode
      const isSelected = selectedNode?.id === node.id

      ctx.beginPath()
      ctx.arc(x, y, radius, 0, 2 * Math.PI)

      // Fill based on node type
      if (node.node_type === 'station') {
        ctx.fillStyle = isSelected ? '#3b82f6' : '#60a5fa' // blue
      } else if (node.node_type === 'mission') {
        ctx.fillStyle = isSelected ? '#10b981' : '#34d399' // green
      } else if (node.node_type === 'checkpoint') {
        ctx.fillStyle = isSelected ? '#8b5cf6' : '#a78bfa' // purple
      } else {
        ctx.fillStyle = isSelected ? '#ef4444' : '#f87171' // red (terminus)
      }

      ctx.fill()

      // Stroke
      ctx.strokeStyle = isSelected ? '#fbbf24' : '#374151'
      ctx.lineWidth = isSelected ? 3 : 1
      ctx.stroke()

      // Draw conditions indicators
      if (node.requires_conditions) {
        ctx.beginPath()
        ctx.arc(x + radius - 5, y - radius + 5, 3, 0, 2 * Math.PI)
        ctx.fillStyle = '#fb923c' // orange
        ctx.fill()
      }

      if (node.team_constraint) {
        ctx.beginPath()
        ctx.arc(x - radius + 5, y - radius + 5, 3, 0, 2 * Math.PI)
        ctx.fillStyle = '#8b5cf6' // purple
        ctx.fill()
      }

      // Draw node label
      ctx.fillStyle = '#000000'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(
        node.node_ref_id.length > 3 ? node.node_ref_id.substring(0, 3) : node.node_ref_id,
        x,
        y + 4
      )

      // Draw full label below
      ctx.fillStyle = '#ffffff'
      ctx.font = '10px Arial'
      ctx.fillText(
        node.node_label.length > 12 ? node.node_label.substring(0, 12) + '...' : node.node_label,
        x,
        y + radius + 15
      )
    })

    ctx.setLineDash([]) // Reset line dash
  }, [graphNodes, graphEdges, selectedNode])

  // Handle canvas click
  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Find clicked node
    const clickedNode = graphNodes.find(graphNode => {
      const distance = Math.sqrt(
        Math.pow(x - graphNode.x, 2) + Math.pow(y - graphNode.y, 2)
      )
      return distance <= graphNode.radius
    })

    setSelectedNode(clickedNode?.node || null)
  }

  // Update canvas size on container resize
  useEffect(() => {
    const updateCanvasSize = () => {
      const container = canvasRef.current?.parentElement
      if (container) {
        const { width } = container.getBoundingClientRect()
        setCanvasSize({ width: Math.max(width - 32, 600), height: 500 })
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  if (nodes.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="w-16 h-16 bg-gray-600 rounded-full mx-auto mb-4 flex items-center justify-center">
          <span className="text-gray-400 text-2xl">∅</span>
        </div>
        <h3 className="text-lg font-medium text-white mb-2">אין נתונים לתצוגה</h3>
        <p className="text-gray-400">
          גרף הניתוב יופיע כאן לאחר יצירת צמתים וחיבורים
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-400 rounded-full" />
          <span className="text-gray-300">עמדות</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-400 rounded-full" />
          <span className="text-gray-300">משימות</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-purple-400 rounded-full" />
          <span className="text-gray-300">נקודות ביקורת</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-400 rounded-full" />
          <span className="text-gray-300">נקודות סיום</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-orange-400 rounded-full" />
          <span className="text-gray-300">תנאים</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 bg-purple-400 rounded-full" />
          <span className="text-gray-300">הגבלת קבוצה</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Canvas */}
        <div className="lg:col-span-2">
          <div className="bg-gray-900 rounded-lg p-4 border border-white/10">
            <canvas
              ref={canvasRef}
              width={canvasSize.width}
              height={canvasSize.height}
              onClick={handleCanvasClick}
              className="cursor-pointer rounded"
              style={{ maxWidth: '100%' }}
            />
          </div>
        </div>

        {/* Node Details */}
        <div>
          {selectedNode ? (
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-white">{selectedNode.node_label}</h3>
                    <Badge
                      variant="outline"
                      className={`text-xs ${
                        selectedNode.node_type === 'station' ? 'border-blue-400/30 text-blue-400' :
                        selectedNode.node_type === 'mission' ? 'border-green-400/30 text-green-400' :
                        selectedNode.node_type === 'checkpoint' ? 'border-purple-400/30 text-purple-400' :
                        'border-red-400/30 text-red-400'
                      }`}
                    >
                      {selectedNode.node_type}
                    </Badge>
                  </div>

                  <div className="text-sm space-y-2">
                    <div>
                      <span className="text-gray-400">מזהה:</span>
                      <p className="text-white">{selectedNode.node_ref_id}</p>
                    </div>

                    {selectedNode.node_order !== null && (
                      <div>
                        <span className="text-gray-400">סדר:</span>
                        <p className="text-white">{selectedNode.node_order}</p>
                      </div>
                    )}

                    {selectedNode.requires_conditions && (
                      <div>
                        <span className="text-orange-400">תנאים נדרשים:</span>
                        <div className="p-2 bg-orange-500/10 rounded mt-1">
                          <p className="text-xs text-orange-300">
                            צומת זה דורש עמידה בתנאים מסוימים לפני הגישה
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedNode.team_constraint && (
                      <div>
                        <span className="text-purple-400">הגבלת קבוצה:</span>
                        <div className="p-2 bg-purple-500/10 rounded mt-1">
                          <p className="text-xs text-purple-300">
                            צומת זה זמין רק לקבוצות מסוימות
                          </p>
                        </div>
                      </div>
                    )}

                    {selectedNode.unlock_conditions && (
                      <div>
                        <span className="text-blue-400">תנאי פתיחה:</span>
                        <div className="p-2 bg-blue-500/10 rounded mt-1">
                          <p className="text-xs text-blue-300">
                            צומת זה נפתח בתנאים מיוחדים
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Connected edges */}
                  <div>
                    <span className="text-gray-400 text-sm">חיבורים:</span>
                    <div className="mt-1 space-y-1">
                      {graphEdges
                        .filter(e => e.from.id === selectedNode.id || e.to.id === selectedNode.id)
                        .map(edge => (
                          <div key={edge.id} className="text-xs bg-white/5 p-2 rounded">
                            <div className="flex items-center gap-1">
                              <span className="text-white">
                                {edge.from.id === selectedNode.id ? '→' : '←'}
                              </span>
                              <span className="text-gray-300">
                                {edge.from.id === selectedNode.id
                                  ? edge.to.node.node_label
                                  : edge.from.node.node_label
                                }
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xs ${
                                  edge.edge.edge_type === 'conditional' ? 'border-orange-400/30 text-orange-400' :
                                  edge.edge.edge_type === 'fallback' ? 'border-red-400/30 text-red-400' :
                                  'border-white/20 text-gray-300'
                                }`}
                              >
                                {edge.edge.edge_type}
                              </Badge>
                            </div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-white/10 border-white/20 text-white">
              <CardContent className="p-4 text-center">
                <p className="text-gray-400">הקש על צומת בגרף לצפייה בפרטים</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}