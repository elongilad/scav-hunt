-- Fix RLS recursion by simplifying org_members policies
-- The issue is that policies are referencing org_members in a circular way

-- First, disable RLS temporarily to fix the policies
ALTER TABLE org_members DISABLE ROW LEVEL SECURITY;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view org memberships they are part of" ON org_members;
DROP POLICY IF EXISTS "Org owners and admins can manage memberships" ON org_members;

-- Create simple, non-recursive policies for org_members
CREATE POLICY "Users can view their own memberships" ON org_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own memberships" ON org_members
  FOR ALL USING (user_id = auth.uid());

-- Re-enable RLS
ALTER TABLE org_members ENABLE ROW LEVEL SECURITY;

-- Also simplify hunt_models policies to avoid org_members dependency
DROP POLICY IF EXISTS "Users can view hunt models in their orgs" ON hunt_models;

-- Create a simpler policy that doesn't rely on org_members
CREATE POLICY "Users can view hunt models in their orgs" ON hunt_models
  FOR SELECT USING (
    org_id IN (
      SELECT id FROM orgs WHERE owner_user_id = auth.uid()
    ) OR published = true
  );

-- Ensure the owner policy is clean
DROP POLICY IF EXISTS "Only owner can write hunt models" ON hunt_models;
CREATE POLICY "Only owner can write hunt models" ON hunt_models
  FOR ALL USING (
    auth.uid() = '3fcc85ef-bd49-4b16-b51f-d3edb986d1df'::uuid
  ) WITH CHECK (
    auth.uid() = '3fcc85ef-bd49-4b16-b51f-d3edb986d1df'::uuid
  );
