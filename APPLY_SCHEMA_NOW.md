# 🚀 Apply Phase 1 Schema - Step by Step Guide

## ⚡ Quick Start (5 Minutes)

### Step 1: Access Supabase
1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Select project: **sqilidvhtoofkfjzaudr**
3. Click **SQL Editor** → **New Query**

### Step 2: Apply SQL Files (In Order)

#### 📁 **File 1: Core Tables**
Copy and paste **ALL content** from `01-core-tables.sql` → Click **Run**
```
Expected: ✅ 4 tables created (model_versions, mv_stations, mv_missions, mv_video_scenes)
```

#### 📁 **File 2: Override Tables**
Copy and paste **ALL content** from `02-override-tables.sql` → Click **Run**
```
Expected: ✅ 2 tables created (event_station_overrides, event_mission_overrides)
```

#### 📁 **File 3: Graph Tables**
Copy and paste **ALL content** from `03-graph-tables.sql` → Click **Run**
```
Expected: ✅ 2 tables created (event_graph_nodes, event_graph_edges)
```

#### 📁 **File 4: Security Policies**
Copy and paste **ALL content** from `04-rls-policies.sql` → Click **Run**
```
Expected: ✅ Multiple policies created (no errors)
```

#### 📁 **File 5: Core Functions**
Copy and paste **ALL content** from `05-core-functions.sql` → Click **Run**
```
Expected: ✅ Functions and triggers created
```

### Step 3: Verify Success
Run this command in your terminal:
```bash
node apply-schema-manual.js
```

**Expected Output:**
```
✅ model_versions table
✅ mv_stations table
✅ event_station_overrides table
✅ render_jobs table
🎉 Schema verification completed successfully!
```

## 🆘 Troubleshooting

### ❌ "relation already exists"
**Solution:** This is OK for `render_jobs`. Continue with next file.

### ❌ "permission denied"
**Solution:** Ensure you're logged in as project owner.

### ❌ "foreign key constraint"
**Solution:** Apply files in exact order (1→2→3→4→5).

### ❌ Policy conflicts
**Solution:** Run each policy section individually if batch fails.

## ✅ Success Indicators

After applying all files, you should see:
- ✅ 8 new tables in your database
- ✅ All RLS policies active
- ✅ Functions available for use
- ✅ Verification script passes

## 🎯 What Happens Next

Once schema is applied:
1. **Immediate**: Database supports new versioning system
2. **Next**: Build frontend interfaces to use these tables
3. **Future**: Advanced routing and rendering features

---

## 📋 Files to Apply (In Order):
1. `01-core-tables.sql` ← **Start here**
2. `02-override-tables.sql`
3. `03-graph-tables.sql`
4. `04-rls-policies.sql`
5. `05-core-functions.sql` ← **End here**

**Total Time: ~5 minutes**

Ready? Start with `01-core-tables.sql` in Supabase SQL Editor! 🚀