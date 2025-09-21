#!/usr/bin/env node
/**
 * Data Export Script for Scavenger Hunt Application
 * 
 * This script exports all station configurations and team progress
 * from your Supabase database to local JSON files for backup.
 * 
 * Usage:
 *   node export-data.js
 * 
 * Requirements:
 *   - Node.js installed
 *   - Environment variables set (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
 *   - Internet connection to reach Supabase
 */

const fs = require('fs');
const path = require('path');

// Configuration - Update these with your Supabase details
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL');
  console.error('   NEXT_PUBLIC_SUPABASE_ANON_KEY');
  console.error('');
  console.error('Set these in your .env.local file or as environment variables.');
  process.exit(1);
}

// Fetch function for making API calls
async function fetchData(endpoint) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json();
}

// Main export function
async function exportData() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = `backup-${timestamp}`;
  
  console.log('🚀 Starting data export...');
  console.log(`📁 Creating backup directory: ${backupDir}`);
  
  // Create backup directory
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  try {
    // Export stations
    console.log('📊 Exporting stations...');
    const stations = await fetchData('stations?order=created_at.asc');
    fs.writeFileSync(
      path.join(backupDir, 'stations.json'), 
      JSON.stringify(stations, null, 2)
    );
    console.log(`✅ Exported ${stations.length} stations`);

    // Export team visits
    console.log('📈 Exporting team visits...');
    const teamVisits = await fetchData('team_visits?order=timestamp.desc');
    fs.writeFileSync(
      path.join(backupDir, 'team_visits.json'), 
      JSON.stringify(teamVisits, null, 2)
    );
    console.log(`✅ Exported ${teamVisits.length} team visits`);

    // Create summary report
    const summary = {
      exportDate: new Date().toISOString(),
      totalStations: stations.length,
      totalVisits: teamVisits.length,
      stationList: stations.map(s => ({ id: s.id, name: s.name })),
      teamStats: generateTeamStats(teamVisits)
    };

    fs.writeFileSync(
      path.join(backupDir, 'export_summary.json'), 
      JSON.stringify(summary, null, 2)
    );

    // Create restoration script
    createRestorationScript(backupDir);

    console.log('');
    console.log('🎉 Export completed successfully!');
    console.log(`📂 Backup saved to: ${backupDir}/`);
    console.log('');
    console.log('Files created:');
    console.log(`   📄 stations.json (${stations.length} stations)`);
    console.log(`   📄 team_visits.json (${teamVisits.length} visits)`);
    console.log(`   📄 export_summary.json (backup metadata)`);
    console.log(`   📄 restore.js (restoration script)`);
    console.log('');
    console.log('💡 To restore this backup, run: node restore.js');

  } catch (error) {
    console.error('❌ Export failed:', error.message);
    process.exit(1);
  }
}

// Generate team statistics
function generateTeamStats(visits) {
  const stats = {};
  
  visits.forEach(visit => {
    if (!stats[visit.team_password]) {
      stats[visit.team_password] = {
        totalVisits: 0,
        successfulVisits: 0,
        lastVisit: null,
        stations: new Set()
      };
    }
    
    const teamStats = stats[visit.team_password];
    teamStats.totalVisits++;
    
    if (visit.success) {
      teamStats.successfulVisits++;
      teamStats.stations.add(visit.station_id);
    }
    
    if (!teamStats.lastVisit || new Date(visit.timestamp) > new Date(teamStats.lastVisit)) {
      teamStats.lastVisit = visit.timestamp;
    }
  });

  // Convert Set to Array for JSON serialization
  Object.keys(stats).forEach(team => {
    stats[team].uniqueStations = Array.from(stats[team].stations);
    stats[team].stationCount = stats[team].stations.size;
    delete stats[team].stations;
  });

  return stats;
}

// Create restoration script
function createRestorationScript(backupDir) {
  const restoreScript = `#!/usr/bin/env node
/**
 * Data Restoration Script
 * Generated automatically during export on ${new Date().toISOString()}
 */

const fs = require('fs');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY');
  process.exit(1);
}

async function restoreData() {
  console.log('🔄 Starting data restoration...');
  
  try {
    // Load backup data
    const stations = JSON.parse(fs.readFileSync('stations.json', 'utf8'));
    const teamVisits = JSON.parse(fs.readFileSync('team_visits.json', 'utf8'));
    
    console.log(\`📊 Restoring \${stations.length} stations...\`);
    
    // Restore stations
    for (const station of stations) {
      const response = await fetch(\`\${SUPABASE_URL}/rest/v1/stations\`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`,
          'Content-Type': 'application/json',
          'Prefer': 'resolution=merge-duplicates'
        },
        body: JSON.stringify(station)
      });
      
      if (!response.ok) {
        console.warn(\`⚠️  Failed to restore station \${station.id}: \${response.statusText}\`);
      }
    }
    
    console.log(\`📈 Restoring \${teamVisits.length} team visits...\`);
    
    // Restore team visits
    for (const visit of teamVisits) {
      const response = await fetch(\`\${SUPABASE_URL}/rest/v1/team_visits\`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': \`Bearer \${SUPABASE_ANON_KEY}\`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visit)
      });
      
      if (!response.ok) {
        console.warn(\`⚠️  Failed to restore visit: \${response.statusText}\`);
      }
    }
    
    console.log('✅ Data restoration completed!');
    
  } catch (error) {
    console.error('❌ Restoration failed:', error.message);
    process.exit(1);
  }
}

restoreData();
`;

  fs.writeFileSync(path.join(backupDir, 'restore.js'), restoreScript);
  fs.chmodSync(path.join(backupDir, 'restore.js'), '755');
}

// Run the export
exportData();