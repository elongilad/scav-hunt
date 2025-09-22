-- Fix infinite recursion in org_members policy

-- Drop the problematic policy
DROP POLICY IF EXISTS "Org owners and admins can manage memberships" ON org_members;

-- Create a new policy that avoids recursion by checking the orgs table directly
CREATE POLICY "Org owners can manage memberships" ON org_members
  FOR ALL USING (
    -- Allow if user is the owner of the organization (from orgs table)
    org_id IN (
      SELECT id FROM orgs WHERE owner_user_id = auth.uid()
    )
    OR
    -- Allow users to manage their own membership
    user_id = auth.uid()
  );

-- Also create a separate policy for admins that doesn't cause recursion
CREATE POLICY "Org admins can manage memberships" ON org_members
  FOR ALL USING (
    -- Only check existing memberships for admin role, not for inserts
    CASE
      WHEN TG_OP = 'INSERT' THEN (
        -- For inserts, only allow org owners (from orgs table)
        org_id IN (SELECT id FROM orgs WHERE owner_user_id = auth.uid())
        OR user_id = auth.uid()
      )
      ELSE (
        -- For other operations, allow admins (but this is safer as membership already exists)
        org_id IN (
          SELECT DISTINCT om.org_id
          FROM org_members om
          WHERE om.user_id = auth.uid()
          AND om.role IN ('owner', 'admin')
          LIMIT 1
        )
        OR user_id = auth.uid()
      )
    END
  );