import { getUserOrgs } from "./getUserOrgs";

/** Throws if the user lacks the required role in the given org. */
export async function requireOrgAccess(opts: {
  userId: string;
  orgId: string;
  minRole?: "viewer" | "editor" | "admin" | "owner";
}) {
  const { userId, orgId, minRole = "viewer" } = opts;
  const roleOrder = ["viewer", "editor", "admin", "owner"] as const;
  const minIndex = roleOrder.indexOf(minRole);

  const orgs = await getUserOrgs(userId);
  const membership = orgs.find((o) => o.id === orgId);
  if (!membership) throw new Error("FORBIDDEN: not a member of org");

  const ok = roleOrder.indexOf(membership.role) >= minIndex;
  if (!ok) throw new Error("FORBIDDEN: insufficient role");

  return membership;
}
