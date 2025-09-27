-- Emergency RLS fix - completely disable and rebuild policies

-- Disable RLS on all problematic tables
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;
ALTER TABLE orgs DISABLE ROW LEVEL SECURITY;
ALTER TABLE hunt_models DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to break recursion
DROP POLICY IF EXISTS "Users can view orgs they are members of" ON orgs;
DROP POLICY IF EXISTS "Users can create orgs" ON orgs;
DROP POLICY IF EXISTS "Org owners can update their orgs" ON orgs;
DROP POLICY IF EXISTS "Users can view org memberships they are part of" ON org_members;
DROP POLICY IF EXISTS "Org owners and admins can manage memberships" ON org_members;
DROP POLICY IF EXISTS "Users can view their own memberships" ON org_members;
DROP POLICY IF EXISTS "Users can manage their own memberships" ON org_members;
DROP POLICY IF EXISTS "Users can view hunt models in their orgs" ON hunt_models;
DROP POLICY IF EXISTS "Only owner can write hunt models" ON hunt_models;
DROP POLICY IF EXISTS "Anyone can read published models" ON hunt_models;

-- Create simple, working policies

-- Orgs: Only allow viewing orgs you own
ALTER TABLE orgs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own orgs" ON orgs
  FOR SELECT USING (owner_user_id = auth.uid());
CREATE POLICY "Users can create orgs" ON orgs
  FOR INSERT WITH CHECK (owner_user_id = auth.uid());
CREATE POLICY "Users can update their own orgs" ON orgs
  FOR UPDATE USING (owner_user_id = auth.uid());

-- Org members: Only allow viewing your own memberships
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view their own memberships" ON org_members
  FOR SELECT USING (user_id = auth.uid());

-- Hunt models: Simple owner + published access
ALTER TABLE hunt_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Owner can do anything with hunt models" ON hunt_models
  FOR ALL USING (
    auth.uid() = '3fcc85ef-bd49-4b16-b51f-d3edb986d1df'::uuid
  ) WITH CHECK (
    auth.uid() = '3fcc85ef-bd49-4b16-b51f-d3edb986d1df'::uuid
  );

CREATE POLICY "Anyone can read published hunt models" ON hunt_models
  FOR SELECT USING (published = true);
