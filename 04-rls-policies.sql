-- Phase 1: RLS Policies (Apply Fourth)
-- This creates the security policies for all new tables

-- Model version policies
CREATE POLICY "Users can view model versions in their orgs" ON model_versions
  FOR SELECT USING (
    model_id IN (
      SELECT id FROM hunt_models WHERE org_id IN (
        SELECT org_id FROM org_members WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can manage model versions in their orgs" ON model_versions
  FOR ALL USING (
    model_id IN (
      SELECT id FROM hunt_models WHERE org_id IN (
        SELECT org_id FROM org_members
        WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
      )
    )
  );

-- Snapshot table policies (inherit from model_versions)
CREATE POLICY "Users can view mv_stations in their orgs" ON mv_stations
  FOR SELECT USING (
    version_id IN (
      SELECT id FROM model_versions WHERE model_id IN (
        SELECT id FROM hunt_models WHERE org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can view mv_missions in their orgs" ON mv_missions
  FOR SELECT USING (
    version_id IN (
      SELECT id FROM model_versions WHERE model_id IN (
        SELECT id FROM hunt_models WHERE org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
      )
    )
  );

CREATE POLICY "Users can view mv_video_scenes in their orgs" ON mv_video_scenes
  FOR SELECT USING (
    version_id IN (
      SELECT id FROM model_versions WHERE model_id IN (
        SELECT id FROM hunt_models WHERE org_id IN (
          SELECT org_id FROM org_members WHERE user_id = auth.uid()
        )
      )
    )
  );

-- Override table policies (inherit from events)
CREATE POLICY "Users can view event station overrides" ON event_station_overrides
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) OR
        buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage event station overrides" ON event_station_overrides
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (
          SELECT org_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        ) OR
        buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view event mission overrides" ON event_mission_overrides
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) OR
        buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage event mission overrides" ON event_mission_overrides
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (
          SELECT org_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        ) OR
        buyer_user_id = auth.uid()
    )
  );

-- Graph table policies (inherit from events)
CREATE POLICY "Users can view event graph nodes" ON event_graph_nodes
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) OR
        buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage event graph nodes" ON event_graph_nodes
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (
          SELECT org_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        ) OR
        buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view event graph edges" ON event_graph_edges
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (SELECT org_id FROM org_members WHERE user_id = auth.uid()) OR
        buyer_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage event graph edges" ON event_graph_edges
  FOR ALL USING (
    event_id IN (
      SELECT id FROM events WHERE
        org_id IN (
          SELECT org_id FROM org_members
          WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
        ) OR
        buyer_user_id = auth.uid()
    )
  );