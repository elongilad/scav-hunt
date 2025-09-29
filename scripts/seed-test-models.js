#!/usr/bin/env node

// Seed test quest models for development
import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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

async function seedModels() {
  console.log('🌱 Seeding test quest models...');

  try {
    // Check if models already exist
    const { data: existingModels } = await supabase
      .from('hunt_models')
      .select('name')
      .in('name', testModels.map(m => m.name));

    if (existingModels && existingModels.length > 0) {
      console.log('📋 Some test models already exist:', existingModels.map(m => m.name));
      console.log('🔄 Updating existing models to published=true...');

      // Update existing models to be published
      const { error: updateError } = await supabase
        .from('hunt_models')
        .update({ published: true })
        .in('name', testModels.map(m => m.name));

      if (updateError) {
        console.error('❌ Error updating models:', updateError);
        return;
      }

      console.log('✅ Updated existing models to published=true');
    } else {
      // Insert new models
      const { data, error } = await supabase
        .from('hunt_models')
        .insert(testModels)
        .select();

      if (error) {
        console.error('❌ Error creating models:', error);
        return;
      }

      console.log('✅ Created', data.length, 'new quest models');
    }

    // Verify published models
    const { data: publishedModels, error: fetchError } = await supabase
      .from('hunt_models')
      .select('id, name, published')
      .eq('published', true);

    if (fetchError) {
      console.error('❌ Error fetching published models:', fetchError);
      return;
    }

    console.log('🎉 Published models in catalog:');
    publishedModels.forEach(model => {
      console.log(`  - ${model.name} (ID: ${model.id})`);
    });

  } catch (error) {
    console.error('💥 Unexpected error:', error);
  }
}

seedModels();