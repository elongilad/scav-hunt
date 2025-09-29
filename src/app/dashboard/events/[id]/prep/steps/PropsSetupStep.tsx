import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Scissors, Printer, CheckCircle, Package } from 'lucide-react'

interface PropsSetupStepProps {
  event: any
  onComplete: () => void
  isCompleted: boolean
}

// Generate dynamic checklist based on quest data
function generatePrintChecklist(event: any) {
  const baseChecklist = [
    { id: 'download_pdf', task: 'Download the quest materials PDF', required: true },
    { id: 'print_qr', task: `Print ${event?.stations?.length || 0} QR codes on regular paper`, required: true }
  ]

  // Add quest-specific tasks based on station types
  const stationTypes = event?.stations?.map((s: any) => s.type) || []

  if (stationTypes.includes('puzzle')) {
    baseChecklist.push({ id: 'print_puzzles', task: 'Print puzzles and cipher wheels', required: true })
    baseChecklist.push({ id: 'cut_pieces', task: 'Cut out cipher wheels and puzzle pieces', required: true })
  }

  if (stationTypes.includes('craft') || stationTypes.includes('investigation')) {
    baseChecklist.push({ id: 'assemble_props', task: 'Assemble props and investigation materials', required: true })
  }

  return baseChecklist
}

const SUPPLIES_NEEDED = [
  'Printer with color ink',
  'Regular paper (8.5" x 11")',
  'Scissors',
  'Optional: Laminator or plastic sleeves for durability',
  'Optional: Double-sided tape for securing QR codes'
]

export default function PropsSetupStep({ event, onComplete, isCompleted }: PropsSetupStepProps) {
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set())

  const printChecklist = generatePrintChecklist(event)

  const handleTaskToggle = (taskId: string, checked: boolean) => {
    setCompletedTasks(prev => {
      const newSet = new Set(prev)
      if (checked) {
        newSet.add(taskId)
      } else {
        newSet.delete(taskId)
      }
      return newSet
    })
  }

  const requiredTasks = printChecklist.filter(task => task.required)
  const allRequiredCompleted = requiredTasks.every(task => completedTasks.has(task.id))

  return (
    <div className="space-y-6">
      <div className="text-center">
        <Package className="w-12 h-12 text-blue-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold mb-2">Print & Assemble Props</h3>
        <p className="text-gray-600">
          Print your quest materials and assemble any props needed for the adventure.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Printer className="w-5 h-5" />
            <span>Supplies Needed</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {SUPPLIES_NEEDED.map((supply, index) => (
              <li key={index} className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                <span>{supply}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Scissors className="w-5 h-5" />
            <span>Preparation Checklist</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {printChecklist.map((task, index) => (
              <div
                key={task.id}
                className={`flex items-start space-x-3 p-3 rounded-lg border ${
                  completedTasks.has(task.id)
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                <Checkbox
                  checked={completedTasks.has(task.id)}
                  onCheckedChange={(checked) => handleTaskToggle(task.id, checked === true)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className={`${
                      completedTasks.has(task.id)
                        ? 'text-green-800 line-through'
                        : 'text-gray-900'
                    }`}>
                      {task.task}
                    </span>
                    {task.required && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Required
                      </span>
                    )}
                  </div>
                </div>
                {completedTasks.has(task.id) && (
                  <CheckCircle className="w-5 h-5 text-green-600" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-medium text-blue-900 mb-2">💡 Pro Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Laminate QR codes to protect them from weather if placing outdoors</li>
          <li>• Keep spare copies of puzzles in case pieces get lost</li>
          <li>• Test that QR codes scan properly after printing</li>
          <li>• Assemble cipher wheels carefully - they're key to solving puzzles!</li>
        </ul>
      </div>

      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center space-x-4">
          <div className="text-sm">
            <span className="font-medium">{completedTasks.size}</span> of{' '}
            <span className="font-medium">{printChecklist.length}</span> tasks completed
          </div>
          {allRequiredCompleted && (
            <div className="flex items-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              All required tasks completed
            </div>
          )}
        </div>

        <Button
          onClick={onComplete}
          disabled={!allRequiredCompleted || isCompleted}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isCompleted ? 'Completed' : 'Complete Step'}
        </Button>
      </div>
    </div>
  )
}