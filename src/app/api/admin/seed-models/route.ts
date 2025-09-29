import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

const testModels = [
  {
    name: "Spy Mission: Secret Agent Training",
    description: "Transform your party into an elite spy training academy! Kids will decode secret messages, complete stealth missions, and save the world from villains. Perfect for ages 8-14.",
    age_min: 8,
    age_max: 14,
    duration_min: 60,
    published: true,
    cover_image_url: null
  },
  {
    name: "Pirate Treasure Hunt Adventure",
    description: "Ahoy mateys! Set sail on an epic treasure hunting adventure. Young pirates will solve riddles, navigate by map, and discover hidden treasures. Arrr-some fun for ages 6-12!",
    age_min: 6,
    age_max: 12,
    duration_min: 45,
    published: true,
    cover_image_url: null
  },
  {
    name: "Detective Mystery: Case of the Missing Birthday Cake",
    description: "Someone stole the birthday cake! Young detectives must gather clues, interview suspects, and solve the mystery before the party ends. Great for budding investigators ages 7-13.",
    age_min: 7,
    age_max: 13,
    duration_min: 50,
    published: true,
    cover_image_url: null
  }
];

const stationTemplates = {
  spy: [
    {
      id: "1",
      display_name: "Code Breaking Station",
      station_type: "puzzle",
      activity_description: "Decode secret messages using cipher wheels and special codes. Learn to communicate like real spies!",
      props_needed: ["Cipher wheels", "Secret message cards", "Pencils", "Timer"]
    },
    {
      id: "2",
      display_name: "Stealth Training Course",
      station_type: "physical",
      activity_description: "Navigate through laser beams (string) without triggering alarms. Test your spy agility!",
      props_needed: ["Red yarn/string", "Bell", "Masking tape", "Chair/poles"]
    },
    {
      id: "3",
      display_name: "Gadget Assembly",
      station_type: "craft",
      activity_description: "Build your own spy gadgets including periscopes and invisible ink pens.",
      props_needed: ["Cardboard tubes", "Mirrors", "Lemon juice", "Cotton swabs", "Small mirrors"]
    }
  ],
  pirate: [
    {
      id: "1",
      display_name: "Treasure Map Reading",
      station_type: "navigation",
      activity_description: "Follow clues on an authentic treasure map to find the next location. X marks the spot!",
      props_needed: ["Treasure map", "Compass", "Magnifying glass", "Pencil"]
    },
    {
      id: "2",
      display_name: "Pirate Ship Battle",
      station_type: "game",
      activity_description: "Defend your ship from enemy pirates using foam cannon balls and strategy.",
      props_needed: ["Foam balls", "Cardboard ship cutouts", "Buckets", "Pirate flags"]
    },
    {
      id: "3",
      display_name: "Buried Treasure Dig",
      station_type: "discovery",
      activity_description: "Use shovels and treasure hunting tools to uncover buried pirate loot!",
      props_needed: ["Small shovels", "Sand/dirt box", "Treasure chest", "Gold coins", "Gems"]
    }
  ],
  detective: [
    {
      id: "1",
      display_name: "Crime Scene Investigation",
      station_type: "investigation",
      activity_description: "Examine the crime scene for clues about the missing birthday cake. Look for fingerprints, footprints, and evidence!",
      props_needed: ["Magnifying glasses", "Evidence bags", "Measuring tape", "Camera/phone", "Notebook"]
    },
    {
      id: "2",
      display_name: "Witness Interviews",
      station_type: "roleplay",
      activity_description: "Interview suspects and witnesses to gather information about who might have taken the cake.",
      props_needed: ["Interview sheets", "Pens", "Character cards", "Detective badges", "Timer"]
    },
    {
      id: "3",
      display_name: "Evidence Analysis Lab",
      station_type: "puzzle",
      activity_description: "Analyze collected evidence using detective tools to solve the mystery of the missing cake.",
      props_needed: ["Evidence charts", "Fingerprint kit", "Puzzle pieces", "Conclusion worksheet", "Detective certificate"]
    }
  ]
};

export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV !== 'development') {
      return NextResponse.json({ error: 'Only available in development' }, { status: 403 });
    }

    const supabase = createAdminClient();

    // Check if models already exist
    const { data: existingModels } = await supabase
      .from('hunt_models')
      .select('name')
      .in('name', testModels.map(m => m.name));

    let modelData;

    if (existingModels && existingModels.length > 0) {
      console.log('📋 Some test models already exist:', existingModels.map(m => m.name));

      // Update existing models to be published
      const { error: updateError } = await supabase
        .from('hunt_models')
        .update({ published: true })
        .in('name', testModels.map(m => m.name));

      if (updateError) {
        console.error('❌ Error updating models:', updateError);
        return NextResponse.json({ error: 'Failed to update models' }, { status: 500 });
      }

      // Get the updated models
      const { data: updatedModels } = await supabase
        .from('hunt_models')
        .select('id, name')
        .in('name', testModels.map(m => m.name));

      modelData = updatedModels;
      console.log('✅ Updated existing models to published=true');
    } else {
      // Insert new models
      const { data, error } = await supabase
        .from('hunt_models')
        .insert(testModels)
        .select();

      if (error) {
        console.error('❌ Error creating models:', error);
        return NextResponse.json({ error: 'Failed to create models' }, { status: 500 });
      }

      modelData = data;
      console.log('✅ Created', data.length, 'new quest models');
    }

    // Create stations for each model
    if (modelData) {
      for (const model of modelData) {
        let stationSet;
        if (model.name.includes('Spy')) {
          stationSet = stationTemplates.spy;
        } else if (model.name.includes('Pirate')) {
          stationSet = stationTemplates.pirate;
        } else if (model.name.includes('Detective')) {
          stationSet = stationTemplates.detective;
        }

        if (stationSet) {
          // Check if stations already exist for this model
          const { data: existingStations } = await supabase
            .from('model_stations')
            .select('id')
            .eq('model_id', model.id);

          if (!existingStations || existingStations.length === 0) {
            // Create stations for this model using the existing schema
            const stationsToInsert = stationSet.map(station => ({
              id: `${model.id}_station_${station.id}`,
              model_id: model.id,
              display_name: station.display_name,
              type: station.station_type,
              default_activity: {
                description: station.activity_description,
                props_needed: station.props_needed,
                station_id: station.id,
                station_type: station.station_type
              }
            }));

            const { error: stationsError } = await supabase
              .from('model_stations')
              .insert(stationsToInsert);

            if (stationsError) {
              console.error('❌ Error creating stations for', model.name, ':', stationsError);
            } else {
              console.log('✅ Created', stationsToInsert.length, 'stations for', model.name);
            }
          } else {
            console.log('📋 Stations already exist for', model.name);
          }
        }
      }
    }

    // Verify published models
    const { data: publishedModels, error: fetchError } = await supabase
      .from('hunt_models')
      .select('id, name, published')
      .eq('published', true);

    if (fetchError) {
      console.error('❌ Error fetching published models:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch models' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully seeded ${publishedModels.length} published quest models`,
      models: publishedModels
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}