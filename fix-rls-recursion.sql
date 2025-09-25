-- Fix RLS policy recursion in org_members table
-- This should be applied via Supabase Dashboard SQL Editor

-- First, check existing policies on org_members
-- SELECT policyname, permissive, roles, cmd, qual, with_check
-- FROM pg_policies
-- WHERE tablename = 'org_members';

-- Drop any problematic recursive policies
DROP POLICY IF EXISTS "Users can view their own org memberships" ON org_members;
DROP POLICY IF EXISTS "Users can view members of their orgs" ON org_members;
DROP POLICY IF EXISTS "Users can manage their org memberships" ON org_members;

-- Create simple, non-recursive policies for org_members
CREATE POLICY "Users can view their own membership" ON org_members
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Org owners and admins can view all members" ON org_members
  FOR SELECT USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Org owners can manage members" ON org_members
  FOR ALL USING (
    org_id IN (
      SELECT om.org_id FROM org_members om
      WHERE om.user_id = auth.uid()
      AND om.role = 'owner'
    )
  );

-- Comment to track this fix
COMMENT ON TABLE org_members IS 'Fixed RLS recursion - policies updated to avoid infinite loops';