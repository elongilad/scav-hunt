-- Phase 1: Graph Routing Tables (Apply Third)
-- This creates the advanced routing engine

-- 1. Event Graph Nodes
CREATE TABLE event_graph_nodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES model_versions(id),

  -- Node identification
  node_type text NOT NULL CHECK (node_type IN ('station', 'mission', 'checkpoint', 'terminus')),
  node_ref_id text NOT NULL,

  -- Graph metadata
  node_label text NOT NULL,
  node_order integer,

  -- Team filtering (null = applies to all teams)
  team_constraint jsonb,

  -- Conditional predicates
  requires_conditions jsonb,
  unlock_conditions jsonb,

  -- Metadata
  created_at timestamptz DEFAULT now(),

  UNIQUE(event_id, node_type, node_ref_id)
);

-- 2. Event Graph Edges
CREATE TABLE event_graph_edges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  version_id uuid NOT NULL REFERENCES model_versions(id),

  -- Edge definition
  from_node_id uuid NOT NULL REFERENCES event_graph_nodes(id) ON DELETE CASCADE,
  to_node_id uuid NOT NULL REFERENCES event_graph_nodes(id) ON DELETE CASCADE,

  -- Edge properties
  edge_weight integer DEFAULT 1,
  edge_type text NOT NULL DEFAULT 'normal' CHECK (edge_type IN ('normal', 'conditional', 'fallback', 'shortcut')),

  -- Conditions for traversal
  traverse_conditions jsonb,
  traverse_probability decimal(3,2) DEFAULT 1.0 CHECK (traverse_probability BETWEEN 0.0 AND 1.0),

  -- Team constraints
  team_constraint jsonb,

  -- Metadata
  edge_label text,
  created_at timestamptz DEFAULT now(),

  -- Prevent self-loops and duplicate edges
  CHECK (from_node_id != to_node_id),
  UNIQUE(event_id, from_node_id, to_node_id, team_constraint)
);

-- Indexes for graph tables
CREATE INDEX idx_event_graph_nodes_event ON event_graph_nodes(event_id);
CREATE INDEX idx_event_graph_nodes_version ON event_graph_nodes(version_id);
CREATE INDEX idx_event_graph_nodes_type_ref ON event_graph_nodes(node_type, node_ref_id);
CREATE INDEX idx_event_graph_edges_event ON event_graph_edges(event_id);
CREATE INDEX idx_event_graph_edges_from ON event_graph_edges(from_node_id);
CREATE INDEX idx_event_graph_edges_to ON event_graph_edges(to_node_id);

-- Enable RLS
ALTER TABLE event_graph_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_graph_edges ENABLE ROW LEVEL SECURITY;