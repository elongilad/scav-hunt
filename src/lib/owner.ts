export function isOwner(userId?: string) {
  return !!userId && userId === process.env.OWNER_USER_ID;
}