import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/server";

// Shape depends on your render provider. Adjust fields accordingly.
const Payload = z.object({
  event_mission_id: z.string().uuid(),
  status: z.enum(["queued", "processing", "ready", "failed"]),
  asset_url: z.string().url().optional(),
  error_message: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const json = await req.json();
    const parsed = Payload.parse(json);

    const admin = createAdminClient();

    if (parsed.status === "ready" && parsed.asset_url) {
      // Mark mission ready and attach asset reference
      const { error } = await admin
        .from("event_mission_overrides")
        .update({
          render_status: "ready",
          render_asset_url: parsed.asset_url,
        })
        .eq("id", parsed.event_mission_id);

      if (error) throw error;
    } else {
      // Update status only (processing/failed)
      const { error } = await admin
        .from("event_mission_overrides")
        .update({
          render_status: parsed.status,
          render_error: parsed.error_message ?? null,
        })
        .eq("id", parsed.event_mission_id);

      if (error) throw error;
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 400 });
  }
}
