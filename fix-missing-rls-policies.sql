-- Fix missing RLS policies for tables that have RLS enabled but no policies
-- This prevents access to data even for authorized users

-- Policies for model_stations (inherit permissions from hunt_models)
CREATE POLICY "Users can view model stations in their orgs" ON model_stations
  FOR SELECT USING (
    model_id IN (
      SELECT id FROM hunt_models hm
      WHERE hm.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage model stations in their orgs" ON model_stations
  FOR ALL USING (
    model_id IN (
      SELECT id FROM hunt_models hm
      WHERE hm.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- Policies for model_missions (inherit permissions from hunt_models)
CREATE POLICY "Users can view model missions in their orgs" ON model_missions
  FOR SELECT USING (
    model_id IN (
      SELECT id FROM hunt_models hm
      WHERE hm.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage model missions in their orgs" ON model_missions
  FOR ALL USING (
    model_id IN (
      SELECT id FROM hunt_models hm
      WHERE hm.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- Policies for video_template_scenes (inherit permissions from media_assets)
CREATE POLICY "Users can view video template scenes in their orgs" ON video_template_scenes
  FOR SELECT USING (
    template_asset_id IN (
      SELECT id FROM media_assets ma
      WHERE ma.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage video template scenes in their orgs" ON video_template_scenes
  FOR ALL USING (
    template_asset_id IN (
      SELECT id FROM media_assets ma
      WHERE ma.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- Policies for event_stations (inherit permissions from events)
CREATE POLICY "Users can view event stations they have access to" ON event_stations
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events e
      WHERE e.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      ) OR e.buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage event stations in their orgs or events they bought" ON event_stations
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events e
      WHERE (
        e.org_id IN (
          SELECT org_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        )
      ) OR e.buyer_user_id = auth.uid()
    )
  );

-- Policies for event_missions (inherit permissions from events)
CREATE POLICY "Users can view event missions they have access to" ON event_missions
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events e
      WHERE e.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      ) OR e.buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage event missions in their orgs or events they bought" ON event_missions
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events e
      WHERE (
        e.org_id IN (
          SELECT org_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        )
      ) OR e.buyer_user_id = auth.uid()
    )
  );

-- Policies for event_teams (inherit permissions from events)
CREATE POLICY "Users can view event teams they have access to" ON event_teams
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events e
      WHERE e.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      ) OR e.buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage event teams in their orgs or events they bought" ON event_teams
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events e
      WHERE (
        e.org_id IN (
          SELECT org_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        )
      ) OR e.buyer_user_id = auth.uid()
    )
  );

-- Policies for event_transitions (inherit permissions from events)
CREATE POLICY "Users can view event transitions they have access to" ON event_transitions
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events e
      WHERE e.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      ) OR e.buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage event transitions in their orgs or events they bought" ON event_transitions
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events e
      WHERE (
        e.org_id IN (
          SELECT org_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        )
      ) OR e.buyer_user_id = auth.uid()
    )
  );

-- Policies for event_visits (special case - allow team password access for gameplay)
CREATE POLICY "Users can view event visits they have access to" ON event_visits
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events e
      WHERE e.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      ) OR e.buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can log visits for events they have access to" ON event_visits
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM events e
      WHERE e.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      ) OR e.buyer_user_id = auth.uid()
    )
  );

-- Allow anonymous visits for gameplay (teams don't need to be authenticated)
CREATE POLICY "Allow team password visits" ON event_visits
  FOR INSERT WITH CHECK (
    team_password IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM event_teams et
      WHERE et.password = event_visits.team_password
      AND et.event_id = event_visits.event_id
    )
  );

CREATE POLICY "Users can manage event visits in their orgs" ON event_visits
  FOR UPDATE USING (
    event_id IN (
      SELECT id FROM events e
      WHERE e.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      ) OR e.buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete event visits in their orgs" ON event_visits
  FOR DELETE USING (
    event_id IN (
      SELECT id FROM events e
      WHERE e.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      ) OR e.buyer_user_id = auth.uid()
    )
  );

-- Policies for purchases (inherit permissions from events)
CREATE POLICY "Users can view purchases for events they have access to" ON purchases
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events e
      WHERE e.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      ) OR e.buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create purchases for events they have access to" ON purchases
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM events e
      WHERE e.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid()
      ) OR e.buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage purchases in their orgs" ON purchases
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events e
      WHERE e.org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      ) OR e.buyer_user_id = auth.uid()
    )
  );