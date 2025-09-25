"use server";

import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const InstantiateInput = z.object({
  modelVersionId: z.string().uuid(),
  title: z.string().min(1),
  locale: z.string().min(2).max(5).default("he"),
  startsAt: z.string().optional(), // ISO
  endsAt: z.string().optional(),   // ISO
});

export type InstantiateResult =
  | { ok: true; eventId: string }
  | { ok: false; error: string };

export async function instantiateEvent(input: z.infer<typeof InstantiateInput>): Promise<InstantiateResult> {
  const parsed = InstantiateInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const user = await requireAuth();
  const rls = await createServerClient();
  const admin = createAdminClient();

  // Validate model_version and owning org for authorization
  const { data: version, error: vErr } = await rls
    .from("model_versions")
    .select("id, model_id, hunt_models!inner(org_id)")
    .eq("id", parsed.data.modelVersionId)
    .maybeSingle();

  if (vErr) return { ok: false, error: vErr.message };
  if (!version) return { ok: false, error: "Model version not found" };

  const orgId = (version as any).hunt_models.org_id as string;
  await requireOrgAccess({ userId: user.id, orgId, minRole: "editor" });

  // 1) Create event
  const { data: evt, error: eErr } = await admin
    .from("events")
    .insert({
      org_id: orgId,
      model_version_id: version.id,
      title: parsed.data.title,
      locale: parsed.data.locale,
      starts_at: parsed.data.startsAt ?? null,
      ends_at: parsed.data.endsAt ?? null,
      status: "draft",
      buyer_user_id: user.id, // optional
    })
    .select("id")
    .single();

  if (eErr) return { ok: false, error: eErr.message };
  const eventId = evt.id as string;

  // 2) Seed per-event overrides from snapshots
  const { error: seedOverridesErr } = await admin.rpc("seed_event_overrides_from_version", {
    p_event_id: eventId,
    p_version_id: version.id,
  });
  if (seedOverridesErr) return { ok: false, error: seedOverridesErr.message };

  // 3) Seed routing graph from snapshots
  const { error: seedGraphErr } = await admin.rpc("seed_event_graph_from_version", {
    p_event_id: eventId,
    p_version_id: version.id,
  });
  if (seedGraphErr) return { ok: false, error: seedGraphErr.message };

  return { ok: true, eventId };
}
