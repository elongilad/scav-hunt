"use server";
import { z } from "zod";
import { createAdminClient, createServerClient } from "@/lib/supabase/server";
import { requireAuth } from "@/lib/auth/requireAuth";
import { requireOrgAccess } from "@/lib/auth/requireOrgAccess";

const Input = z.object({
  eventId: z.string().uuid(),
  name: z.string().min(1).max(100),
  color: z.string().optional(),
  emblemUrl: z.string().url().optional(),
  maxMembers: z.number().int().min(1).max(50).default(8)
});

export async function createTeam(input: z.infer<typeof Input>) {
  const p = Input.parse(input);
  const user = await requireAuth();
  const rls = await createServerClient();

  const { data: evt, error: eErr } = await rls.from("events").select("id, org_id").eq("id", p.eventId).maybeSingle();
  if (eErr || !evt) throw eErr || new Error("Event not found");
  await requireOrgAccess({ userId: user.id, orgId: evt.org_id, minRole: "editor" });

  const admin = createAdminClient();

  // Generate a unique access code
  const generateAccessCode = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid confusing characters
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  };

  let accessCode = generateAccessCode();
  let attempts = 0;
  const maxAttempts = 10;

  // Ensure unique access code
  while (attempts < maxAttempts) {
    const { data: existing } = await admin
      .from("event_teams")
      .select("id")
      .eq("event_id", p.eventId)
      .eq("access_code", accessCode)
      .maybeSingle();

    if (!existing) break;
    accessCode = generateAccessCode();
    attempts++;
  }

  if (attempts >= maxAttempts) {
    throw new Error("Unable to generate unique access code");
  }

  const teamData = {
    event_id: p.eventId,
    name: p.name,
    access_code: accessCode,
    color: p.color || `#${Math.floor(Math.random()*16777215).toString(16)}`,
    emblem_url: p.emblemUrl,
    max_members: p.maxMembers,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await admin
    .from("event_teams")
    .insert(teamData)
    .select("*")
    .single();

  if (error) throw error;

  return {
    ok: true,
    team: data
  };
}