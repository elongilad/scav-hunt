export interface PrepStep {
  id: string
  title: string
  description: string
  type: 'location_selection' | 'photo_upload' | 'pdf_generation' | 'props_setup' | 'qr_placement' | 'activation' | 'invitation' | 'purchase_checklist'
  required: boolean
  estimatedMinutes?: number
}

export const HOME_HUNT_STEPS: PrepStep[] = [
  {
    id: 'locations',
    title: 'Select House Locations',
    description: 'Choose available locations in your house for quest stations',
    type: 'location_selection',
    required: true,
    estimatedMinutes: 5
  },
  {
    id: 'photos',
    title: 'Upload Photos',
    description: 'Take 1-2 photos that will be integrated into PDF puzzles',
    type: 'photo_upload',
    required: true,
    estimatedMinutes: 10
  },
  {
    id: 'generate_pdf',
    title: 'Generate & Download PDF',
    description: 'Download QR codes, puzzles, ciphers, and parent instructions',
    type: 'pdf_generation',
    required: true,
    estimatedMinutes: 2
  },
  {
    id: 'print_props',
    title: 'Print & Assemble Props',
    description: 'Print, cut, and assemble all quest materials',
    type: 'props_setup',
    required: true,
    estimatedMinutes: 15
  },
  {
    id: 'hide_qr',
    title: 'Hide QR Codes',
    description: 'Place QR codes at the selected locations',
    type: 'qr_placement',
    required: true,
    estimatedMinutes: 10
  },
  {
    id: 'activate',
    title: 'Activate Quest',
    description: 'Your quest is ready to begin!',
    type: 'activation',
    required: true,
    estimatedMinutes: 1
  }
]

export const PARTY_HUNT_STEPS: PrepStep[] = [
  {
    id: 'party_details',
    title: 'Set Party Details',
    description: 'Enter child\'s name, age, date, and party type',
    type: 'location_selection',
    required: true,
    estimatedMinutes: 3
  },
  {
    id: 'invitations',
    title: 'Generate Invitations',
    description: 'Create and send digital invitations with themed video',
    type: 'invitation',
    required: true,
    estimatedMinutes: 10
  },
  {
    id: 'main_location',
    title: 'Select Main Location',
    description: 'Choose home garden or park for the party',
    type: 'location_selection',
    required: true,
    estimatedMinutes: 5
  },
  {
    id: 'stations',
    title: 'Select Stations',
    description: 'Choose stations within 1-mile radius of main location',
    type: 'location_selection',
    required: true,
    estimatedMinutes: 15
  },
  {
    id: 'purchase_list',
    title: 'Purchase Checklist',
    description: 'Buy sticker paper, envelopes, and other materials',
    type: 'purchase_checklist',
    required: true,
    estimatedMinutes: 30
  },
  {
    id: 'location_photos',
    title: 'Take Location Photos/Videos',
    description: 'Visit and document each station location',
    type: 'photo_upload',
    required: true,
    estimatedMinutes: 60
  },
  {
    id: 'generate_pdf',
    title: 'Generate Props Pack',
    description: 'Download and print all party materials',
    type: 'pdf_generation',
    required: true,
    estimatedMinutes: 5
  },
  {
    id: 'day_of_setup',
    title: 'Day-of-Game Setup',
    description: 'Place QR codes and props using optimized route map',
    type: 'qr_placement',
    required: true,
    estimatedMinutes: 45
  },
  {
    id: 'activate',
    title: 'Activate Party Hunt',
    description: 'Your party hunt is ready to begin!',
    type: 'activation',
    required: true,
    estimatedMinutes: 1
  }
]

// Quest categorization based on model data
export function determineQuestType(modelName: string, stationCount: number): 'home' | 'party' {
  const lowerName = modelName.toLowerCase()

  // Party hunt indicators
  if (lowerName.includes('party') || lowerName.includes('birthday') || stationCount > 5) {
    return 'party'
  }

  // Home hunt indicators (default)
  return 'home'
}

// Generate dynamic prep steps based on quest data
export function getStepsForQuest(questData: {
  modelName: string
  stationCount: number
  stations: any[]
}): PrepStep[] {
  const questType = determineQuestType(questData.modelName, questData.stationCount)
  const baseSteps = getStepsForHuntType(questType)

  // Customize steps based on actual quest data
  return baseSteps.map(step => {
    if (step.type === 'location_selection') {
      return {
        ...step,
        description: `Choose ${questData.stationCount} locations for your quest stations`
      }
    }
    if (step.type === 'qr_placement') {
      return {
        ...step,
        description: `Place QR codes at ${questData.stationCount} station locations`
      }
    }
    return step
  })
}

export function getStepsForHuntType(huntType: 'home' | 'party'): PrepStep[] {
  return huntType === 'home' ? HOME_HUNT_STEPS : PARTY_HUNT_STEPS
}

export function getTotalEstimatedTime(steps: PrepStep[]): number {
  return steps.reduce((total, step) => total + (step.estimatedMinutes || 0), 0)
}