import { headers } from "next/headers";
import { createServerClient } from "@/lib/supabase/server";

/** Ensures there is a signed-in user; throws if not. */
export async function requireAuth() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    // In RSC, throw to let you handle redirect from the page boundary
    // or show a link to /login
    throw new Error("UNAUTHENTICATED");
  }
  return user;
}
