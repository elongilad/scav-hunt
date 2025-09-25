import { createServerClient } from "@/lib/supabase/server";

/** Returns orgs the current user belongs to (id, name, role). */
export async function getUserOrgs(userId: string) {
  const supabase = await createServerClient();
  const { data, error } = await supabase
    .from("org_members")
    .select("org_id, role, orgs(id, name)")
    .eq("user_id", userId);

  if (error) throw error;

  return (data ?? []).map((row) => ({
    id: (row.orgs as any)?.id as string,
    name: (row.orgs as any)?.name as string,
    role: row.role as "owner" | "admin" | "editor" | "viewer",
  }));
}
