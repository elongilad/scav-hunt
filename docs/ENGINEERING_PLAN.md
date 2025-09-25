# Spy Scavenger Hunt — Engineering Plan & Record

*Last updated: January 2025*

## 0) Executive Summary

We've transformed the project from a basic prototype to a production-grade, multi-tenant scavenger hunt platform with:

- **Complete internationalization** (Hebrew/English) with persistent language switching
- **Production-ready database** with indexes, hardened RLS, and verified performance
- **Multi-tenant architecture** with organization-based isolation and role-based access
- **Server actions** for core workflows (publish, instantiate, compile, routing)
- **Scalable data model** separating authoring (models) from runtime (events)

**Current Status**: Core infrastructure complete. Need UI wiring, player flow, and polish.

---

## 1) What's Done

### 1.1 Internationalization System ✅

**Core Infrastructure:**
- `src/lib/i18n.ts` - Complete translation system with 400+ keys
- `src/contexts/LanguageContext.tsx` - React context with localStorage persistence
- `src/components/ui/language-toggle.tsx` - Language switcher component

**Internationalized Pages:**
- Admin layout and sidebar
- Models list and creation pages
- Mission creation and edit pages
- All form validation messages
- Loading states and error messages

**Translation Coverage:**
- English and Hebrew translations for all UI text
- Form placeholders and help text
- Error messages and validation
- Navigation and action buttons
- Status badges and descriptions

### 1.2 Database Architecture ✅

**Performance Indexes:**
```sql
-- Hot path routing
CREATE INDEX idx_event_graph_edges_routing ON event_graph_edges(event_id, from_node_id, edge_type, edge_weight);

-- JSONB predicate searches
CREATE INDEX idx_traverse_conditions_gin ON event_graph_edges USING GIN(traverse_conditions);
CREATE INDEX idx_requires_conditions_gin ON event_graph_nodes USING GIN(requires_conditions);
CREATE INDEX idx_team_constraint_gin ON event_graph_nodes USING GIN(team_constraint);

-- Override lookups
CREATE INDEX idx_event_station_overrides_enabled ON event_station_overrides(event_id, station_id)
WHERE enabled_override IS TRUE;
CREATE INDEX idx_event_mission_overrides_lookup ON event_mission_overrides(event_id, mission_id);
```

**RLS Security:**
- Granular policies per operation (SELECT/INSERT/UPDATE/DELETE)
- Organization-based isolation on all tables
- Read-only access to immutable snapshots (mv_* tables)
- SECURITY DEFINER functions owned by postgres

**Schema Verification:**
- `scripts/verify_schema.sql` - Complete verification suite
- Tests indexes, policies, function ownership, and query plans
- Run after any migration to prevent regressions

### 1.3 Authentication & Authorization ✅

**Auth Helpers:**
- `src/lib/auth/requireAuth.ts` - Server-side auth verification
- `src/lib/auth/getUserOrgs.ts` - User organization membership
- `src/lib/auth/requireOrgAccess.ts` - Role-based access control

**Supabase Clients:**
- `createServerClient()` - RLS-enforced for user context
- `createAdminClient()` - Service role for system operations

**Multi-tenant Security:**
- Organization-based data isolation
- Role hierarchy: viewer < editor < admin < owner
- RLS policies enforce access at database level

### 1.4 Server Actions (Backend Complete) ✅

**Core Workflows:**
```typescript
// Publishing workflow
publishModelVersion({ huntModelId, isActive })
  → Creates model_versions entry
  → Snapshots authoring data to mv_* tables
  → Marks model as 'ready'

// Event creation workflow
instantiateEvent({ modelVersionId, title, locale })
  → Creates event record
  → Seeds per-event overrides from snapshots
  → Builds routing graph from version data

// Render workflow
compileEvent({ eventId })
  → Enqueues render jobs per mission
  → Idempotent job creation
  → Webhook updates on completion

// Runtime workflows
routeNext({ eventId, teamId, fromNodeId })
  → Computes next station via graph traversal
  → Respects conditional logic and constraints

logVisit({ eventId, teamId, nodeId, state })
  → Records team progress and timing
  → Enables analytics and live tracking
```

**Files:**
- `src/server/actions/publishModelVersion.ts`
- `src/server/actions/instantiateEvent.ts`
- `src/server/actions/compileEvent.ts`
- `src/server/actions/routeNext.ts`
- `src/server/actions/logVisit.ts`

### 1.5 Webhook Infrastructure ✅

**Render Provider Integration:**
- `src/app/api/webhooks/render/route.ts` - Processes render completion
- Updates mission status and asset URLs
- Handles success/failure states
- Secured with validation

### 1.6 Admin Interface Updates ✅

**Pages Completed:**
- Admin dashboard with model overview
- Model creation and editing
- Mission creation and editing
- Model deletion with cascade
- Language switching throughout

**UI Components:**
- Consistent dark theme
- Spy-themed color palette (spy-gold accents)
- Responsive layouts
- Loading states and error handling

---

## 2) What's Next - Implementation Roadmap

### 2.1 Wire Server Actions to UI (Priority: HIGH)

**Target:** Connect backend workflows to admin interface

**Tasks:**
```typescript
// Add to src/app/admin/models/[id]/page.tsx
<Button onClick={async () => {
  const result = await publishModelVersion({
    huntModelId: model.id,
    isActive: true
  });
  if (result.ok) toast.success('Model published!');
}}>
  {t('models.publish', language)}
</Button>

// Add to published models
<Button onClick={async () => {
  const result = await instantiateEvent({
    modelVersionId: version.id,
    title: `${model.name} Event`,
    locale: language
  });
  if (result.ok) router.push(`/admin/events/${result.eventId}`);
}}>
  {t('models.create_event', language)}
</Button>
```

**Files to Update:**
- `src/app/admin/models/[id]/page.tsx` - Add publish/create event buttons
- `src/app/admin/events/[id]/page.tsx` - Add compile button
- `src/components/ui/toast.tsx` - Success/error feedback

**Acceptance:** Admin can publish models and create events entirely through UI

### 2.2 Database RPCs (Priority: HIGH)

**Target:** Move complex logic to database for performance

**RPCs to Implement:**
```sql
-- Publishing snapshots
CREATE OR REPLACE FUNCTION publish_mv_stations(model_id uuid, version_id uuid)
CREATE OR REPLACE FUNCTION publish_mv_missions(model_id uuid, version_id uuid)
CREATE OR REPLACE FUNCTION publish_mv_video_scenes(model_id uuid, version_id uuid)

-- Event seeding
CREATE OR REPLACE FUNCTION seed_event_overrides_from_version(event_id uuid, version_id uuid)
CREATE OR REPLACE FUNCTION seed_event_graph_from_version(event_id uuid, version_id uuid)

-- Runtime routing
CREATE OR REPLACE FUNCTION route_next(event_id uuid, team_id uuid, from_node_id uuid)
RETURNS TABLE(to_node_id uuid, payload jsonb)
```

**Implementation:** Can provide complete SQL file or keep TS-based approach

**Acceptance:** Server actions execute without client-side bulk SQL operations

### 2.3 Player Flow (Priority: HIGH)

**Target:** Complete team gameplay experience

**Core Pages:**
```typescript
// Team Login
src/app/play/events/[eventId]/login/page.tsx
- Access code verification
- Team session creation
- Mobile-optimized UI

// Station Experience
src/app/play/events/[eventId]/station/[nodeId]/page.tsx
- QR code scanning
- Mission video playback
- Instructions display
- Progress tracking (logVisit calls)
- Next station routing (routeNext calls)
```

**User Flow:**
1. Team enters access code
2. Scans QR at station → loads mission
3. Watches video, reads instructions
4. Completes challenge → logs completion
5. Gets next station → navigates automatically
6. Repeats until event complete

**Mobile Considerations:**
- Touch-optimized interface
- Video preloading for offline
- Clear progress indicators
- Error recovery (offline/network issues)

**Acceptance:** Teams can complete full event on mobile devices

### 2.4 Live Event Dashboard (Priority: MEDIUM)

**Target:** Real-time event monitoring for admins

**Features:**
```typescript
// src/app/admin/events/[id]/live/page.tsx
- Team list with completion percentage
- Current station per team
- Real-time progress updates (via Supabase realtime)
- Station utilization heatmap
- Event timeline/activity feed
```

**Data Sources:**
- `event_visits` - Real-time team progress
- `event_teams` - Team metadata
- `event_graph_nodes` - Station information

**Performance:**
- Use materialized views for aggregations
- WebSocket updates for real-time data
- Pagination for large events (100+ teams)

**Acceptance:** Admin can monitor 50+ teams with <1s update latency

### 2.5 Analytics & Reporting (Priority: MEDIUM)

**Target:** Post-event analysis and insights

**Materialized Views:**
```sql
-- Team performance summary
CREATE MATERIALIZED VIEW team_progress_mv AS
SELECT
  event_id,
  team_id,
  completion_pct,
  total_time_minutes,
  stations_completed,
  stations_total
FROM event_visits_agg;

-- Station utilization analysis
CREATE MATERIALIZED VIEW station_utilization_mv AS
SELECT
  event_id,
  station_id,
  total_enters,
  total_completes,
  total_fails,
  avg_duration_minutes,
  success_rate
FROM event_visits_station_agg;
```

**Analytics Dashboard:**
- Completion rates and timing charts
- Station difficulty analysis
- Team performance comparisons
- CSV export for external analysis
- Historical event comparisons

**Acceptance:** Charts load <200ms, CSV exports include all key metrics

### 2.6 Design System Polish (Priority: MEDIUM)

**Target:** Professional, consistent visual design

**Design Tokens:**
```typescript
// tailwind.config.ts updates
const colors = {
  spy: {
    gold: '#D4AF37',
    dark: '#0A0A0A',
    gray: { 900: '#111111', 800: '#1F1F1F', ... }
  }
}
```

**Component Standardization:**
- Consistent Button variants (primary/secondary/danger/ghost)
- Card layouts with proper spacing/shadows
- Form components with validation states
- Loading states and skeleton screens
- Toast notifications
- Modal dialogs and overlays

**Accessibility:**
- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader compatibility
- High contrast mode support
- Focus visible indicators

**RTL Support:**
- Hebrew text direction
- Icon/layout mirroring where appropriate
- Date/time formatting
- Number formatting

**Acceptance:** Consistent visual quality across all pages, passes accessibility audit

### 2.7 Operations & Quality (Priority: LOW)

**Target:** Production readiness and maintainability

**Monitoring:**
- Error tracking (Sentry integration)
- Performance monitoring
- Database query performance alerts
- Webhook delivery monitoring

**Testing:**
```typescript
// E2E test scenarios
- Admin: Create model → Publish → Create event → Monitor teams
- Player: Join event → Complete stations → Finish event
- Error cases: Invalid codes, disabled stations, network failures
```

**Deployment:**
- Environment configuration management
- Database migration scripts
- Backup/restore procedures
- Rollback strategies

**Security:**
- Rate limiting on public endpoints
- Input validation and sanitization
- Secure header configuration
- Regular dependency updates

**Acceptance:** Zero production errors, <100ms p95 response times

---

## 3) Implementation Checklists

### 3.1 UI Wiring (Week 1)

**Admin Interface:**
- [ ] Add "Publish Model" button with loading/success states
- [ ] Add "Create Event" button with form dialog
- [ ] Add "Compile Event" button with job progress
- [ ] Toast notifications for all actions
- [ ] Error handling and retry logic
- [ ] Disable buttons for invalid states (already published, etc.)

**Model Management:**
- [ ] Model version history display
- [ ] Event list per model
- [ ] Delete confirmations with impact warnings

**Navigation:**
- [ ] Breadcrumb navigation
- [ ] Quick actions from dashboard
- [ ] Search/filter for large model lists

### 3.2 Player Flow (Week 2)

**Team Authentication:**
- [ ] Access code input with validation
- [ ] Team name capture/display
- [ ] Session persistence (localStorage)
- [ ] Offline capability assessment

**Station Experience:**
- [ ] QR code scanning (camera integration)
- [ ] Manual station code entry (fallback)
- [ ] Video player with controls
- [ ] Instruction rendering (markdown/rich text)
- [ ] Completion confirmation UI
- [ ] Next station navigation
- [ ] Progress indicator (X of Y stations)

**Error Handling:**
- [ ] Invalid QR codes
- [ ] Disabled/unavailable stations
- [ ] Network connectivity issues
- [ ] Event not started/ended states

### 3.3 Analytics (Week 3)

**Data Pipeline:**
- [ ] Materialized view refresh schedules
- [ ] Real-time aggregation triggers
- [ ] Data retention policies

**Reporting Interface:**
- [ ] Team progress dashboard
- [ ] Station performance metrics
- [ ] Event timeline visualization
- [ ] CSV/Excel export functionality
- [ ] Print-friendly reports

**Performance:**
- [ ] Query optimization for large datasets
- [ ] Caching for expensive aggregations
- [ ] Pagination for team lists

### 3.4 Design Polish (Week 4)

**Visual Consistency:**
- [ ] Typography system (font sizes, weights, line heights)
- [ ] Color palette refinement
- [ ] Spacing/layout grid
- [ ] Icon library consistency
- [ ] Animation/transition standards

**Component Library:**
- [ ] Storybook documentation
- [ ] Component prop standardization
- [ ] Accessibility annotations
- [ ] Usage guidelines

**Mobile Optimization:**
- [ ] Touch target sizes (44px minimum)
- [ ] Swipe gestures where appropriate
- [ ] Viewport meta tag optimization
- [ ] Performance on low-end devices

---

## 4) Technical Specifications

### 4.1 Required Environment Variables

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # Server-only!

# Feature Flags
SCHEMA_V2_ENABLED=true

# External Services (optional)
RENDER_PROVIDER_API_KEY=your-render-key
STRIPE_SECRET_KEY=your-stripe-key
SENTRY_DSN=your-sentry-dsn
```

### 4.2 Database Performance Targets

**Query Performance:**
- Model listing: <50ms
- Event dashboard: <100ms
- Player station load: <200ms
- Analytics queries: <500ms

**Scaling Expectations:**
- Models: 1,000+ per organization
- Events: 10,000+ total
- Concurrent players: 500+ per event
- Historical visits: 1M+ records

### 4.3 Mobile Performance

**Player App Targets:**
- First load: <3s on 3G
- Station transitions: <1s
- Video start: <2s
- Offline capability: Basic navigation

**Optimization Strategies:**
- Video preloading
- Image compression/WebP
- Code splitting by route
- Service worker for caching

---

## 5) Risk Mitigation

### 5.1 Technical Risks

**Database Performance:**
- *Risk:* Query slowdown with scale
- *Mitigation:* Materialized views, query monitoring, index optimization

**Mobile Compatibility:**
- *Risk:* Camera/QR issues on various devices
- *Mitigation:* Fallback manual entry, device testing, progressive enhancement

**Real-time Updates:**
- *Risk:* WebSocket connection reliability
- *Mitigation:* Polling fallback, connection retry logic, offline handling

### 5.2 Security Risks

**RLS Bypass:**
- *Risk:* Accidental admin client exposure to frontend
- *Mitigation:* Server-only admin client, verification suite testing

**Team Session Hijacking:**
- *Risk:* Access code sharing/leaking
- *Mitigation:* Short-lived codes, IP restrictions, rate limiting

### 5.3 User Experience Risks

**Complexity Overwhelm:**
- *Risk:* Too many admin options confuse users
- *Mitigation:* Progressive disclosure, guided workflows, default templates

**Mobile UX Issues:**
- *Risk:* Poor touch experience, battery drain
- *Mitigation:* Extensive mobile testing, performance budgets

---

## 6) Success Criteria

### 6.1 Technical Excellence

- [ ] All verification scripts pass post-deployment
- [ ] Query performance meets targets under load
- [ ] Zero SQL injection or RLS bypass vulnerabilities
- [ ] 99%+ uptime in production

### 6.2 User Experience

- [ ] Admin can create full event in <10 minutes
- [ ] Teams complete events with <5% technical failure rate
- [ ] Mobile experience rated 4.5+ stars in feedback
- [ ] Support requests <1% of total player sessions

### 6.3 Business Impact

- [ ] Platform supports 100+ concurrent events
- [ ] Event creation time reduced 90% vs manual setup
- [ ] Real-time monitoring prevents 95% of event issues
- [ ] Analytics insights drive event format improvements

---

## 7) Timeline Summary

**Week 1: UI Foundation**
- Wire server actions to admin interface
- Implement publish/create event workflows
- Add toast notifications and error handling

**Week 2: Player Experience**
- Complete team login and station flows
- Implement QR scanning and routing
- Mobile optimization and offline handling

**Week 3: Analytics & Monitoring**
- Live event dashboard
- Progress analytics and reporting
- Performance optimization

**Week 4: Polish & Launch**
- Design system consistency
- Accessibility compliance
- Production deployment and monitoring

---

## 8) Definition of Done

✅ **Complete Workflow:** Admin creates model → publishes → creates event → teams play end-to-end

✅ **Real-time Monitoring:** Admin can track 50+ teams with live updates

✅ **Analytics Insights:** Post-event reporting with actionable metrics

✅ **Production Ready:** Handles scale, secure, monitored, maintainable

✅ **Professional Quality:** Consistent design, accessible, bilingual, mobile-optimized

---

*This document is a living record. Update it as implementation progresses and requirements evolve.*