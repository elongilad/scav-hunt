# 📋 Phase 1 Schema Application Guide

## 🎯 Overview
This guide will help you apply the Phase 1 architecture overhaul schema to your Supabase database.

## ⚠️ Before You Start
- ✅ Backup your current database (recommended)
- ✅ Ensure you have admin access to your Supabase project
- ✅ Have the SQL files ready: `phase1-versioning-schema.sql` and `phase1-publishing-rpc.sql`

## 🔧 Application Method: Supabase Dashboard

### Step 1: Access SQL Editor
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: **sqilidvhtoofkfjzaudr**
3. Navigate to **SQL Editor** in the left sidebar
4. Click **New Query**

### Step 2: Apply Schema (Part 1 - Tables)
Copy and paste the following sections **one at a time** from `phase1-versioning-schema.sql`:

#### 2.1 Core Tables (Execute First)
```sql
-- Copy lines 1-150 from phase1-versioning-schema.sql
-- This includes: model_versions, mv_stations, mv_missions, mv_video_scenes
```

#### 2.2 Override Tables (Execute Second)
```sql
-- Copy lines 151-250 from phase1-versioning-schema.sql
-- This includes: event_station_overrides, event_mission_overrides
```

#### 2.3 Graph Tables (Execute Third)
```sql
-- Copy lines 251-350 from phase1-versioning-schema.sql
-- This includes: event_graph_nodes, event_graph_edges
```

#### 2.4 Render Jobs (Execute Fourth)
```sql
-- Copy lines 351-450 from phase1-versioning-schema.sql
-- This includes: render_jobs table (may already exist)
```

### Step 3: Apply Indexes and Constraints
```sql
-- Copy lines 451-600 from phase1-versioning-schema.sql
-- This includes all performance indexes
```

### Step 4: Apply RLS Policies
```sql
-- Copy lines 601-end from phase1-versioning-schema.sql
-- This includes all Row Level Security policies
```

### Step 5: Apply RPC Functions
Copy and paste **all content** from `phase1-publishing-rpc.sql` in one go.

## ✅ Verification Steps

After applying the schema, run the verification script:

```bash
node apply-schema-manual.js
```

Expected output:
```
✅ model_versions table
✅ mv_stations table
✅ event_station_overrides table
✅ render_jobs table
🎉 Schema verification completed successfully!
```

## 🚨 Troubleshooting

### Common Issues:

**Issue**: "relation already exists"
- **Solution**: This is normal for `render_jobs` table. Continue with next section.

**Issue**: "permission denied"
- **Solution**: Ensure you're using the project owner account.

**Issue**: "foreign key constraint"
- **Solution**: Apply sections in order. Tables must be created before foreign keys.

**Issue**: RLS policy conflicts
- **Solution**: Existing policies may conflict. Check the error message for specific policy names.

## 📞 Support
If you encounter issues:
1. Check the error message in SQL Editor
2. Run `node apply-schema-manual.js` to see current status
3. Share the specific error message for debugging

## 🎯 Next Steps After Success
Once schema application is complete:
1. ✅ Verify all tables exist
2. ✅ Test basic functionality
3. 🚀 Ready to build frontend interfaces!