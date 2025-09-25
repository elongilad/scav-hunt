"use server";

import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";
import { createServerClient } from "@/lib/supabase/server";

const PublishInput = z.object({
  huntModelId: z.string().uuid(),
  isActive: z.boolean().default(true),
});

export type PublishResult =
  | { ok: true; modelVersionId: string }
  | { ok: false; error: string };

export async function publishModelVersion(input: z.infer<typeof PublishInput>): Promise<PublishResult> {
  const parsed = PublishInput.safeParse(input);
  if (!parsed.success) return { ok: false, error: parsed.error.message };

  const user = await requireAuth();
  const rls = await createServerClient();
  const admin = createAdminClient();

  // Load model and org to check authorization via helpers
  const { data: model, error: modelErr } = await rls
    .from("hunt_models")
    .select("id, org_id, status")
    .eq("id", parsed.data.huntModelId)
    .maybeSingle();

  if (modelErr) return { ok: false, error: modelErr.message };
  if (!model) return { ok: false, error: "Model not found" };

  // Must be editor+ in the org to publish
  await requireOrgAccess({ userId: user.id, orgId: model.org_id, minRole: "editor" });

  // Create model_version record (admin client bypasses RLS)
  const { data: mv, error: mvErr } = await admin
    .from("model_versions")
    .insert({
      model_id: model.id,
      is_active: parsed.data.isActive,
      // Add any extra version metadata here
    })
    .select("id")
    .single();

  if (mvErr) return { ok: false, error: mvErr.message };

  const versionId = mv.id as string;

  // Populate snapshots from authoring tables.
  // These statements assume your authoring tables are named model_stations/model_missions/video_template_scenes.
  // Adjust names if needed.
  const { error: snapStationsErr } = await admin.rpc("publish_mv_stations", {
    p_model_id: model.id,
    p_version_id: versionId,
  });
  if (snapStationsErr) return { ok: false, error: snapStationsErr.message };

  const { error: snapMissionsErr } = await admin.rpc("publish_mv_missions", {
    p_model_id: model.id,
    p_version_id: versionId,
  });
  if (snapMissionsErr) return { ok: false, error: snapMissionsErr.message };

  const { error: snapScenesErr } = await admin.rpc("publish_mv_video_scenes", {
    p_model_id: model.id,
    p_version_id: versionId,
  });
  if (snapScenesErr) return { ok: false, error: snapScenesErr.message };

  // Optionally flip hunt_models.status to 'ready'
  await admin.from("hunt_models").update({ status: "ready" }).eq("id", model.id);

  return { ok: true, modelVersionId: versionId };
}
