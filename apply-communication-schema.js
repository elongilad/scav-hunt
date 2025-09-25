import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function applySchema() {
  try {
    console.log('Applying communication schema...')

    const schema = readFileSync('./team-communication-schema.sql', 'utf8')

    const { data, error } = await supabase.rpc('exec_sql', { sql: schema })

    if (error) {
      console.error('Error applying schema:', error)
      process.exit(1)
    }

    console.log('Communication schema applied successfully!')
    console.log('Result:', data)

  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

applySchema()