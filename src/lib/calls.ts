/** Rules for deciding whether a call is still going. Shared by the call actions and the "incoming call" route. */

export const ROOM_LIFETIME_MS = 3 * 60 * 60 * 1000; // a call room lasts at most three hours
export const JOIN_GRACE_MS = 60_000; // a brand new call counts as active while the caller's screen opens
export const MAX_IN_CALL = 12; // people in one call at the same time
export const PING_TTL_MS = 45_000; // a participant who has not checked in for this long has left

/** Prisma `where` that matches calls that can still be joined. */
export function activeCallWhere(now = Date.now()) {
  return {
    endedAt: null,
    startedAt: { gt: new Date(now - ROOM_LIFETIME_MS) },
    OR: [
      { startedAt: { gt: new Date(now - JOIN_GRACE_MS) } },
      { participants: { some: { lastSeenAt: { gt: new Date(now - PING_TTL_MS) } } } },
    ],
  };
}

/** The name to show for a chat: the group's name, or the other person in a private chat. */
export function chatTitle(
  convo: { isGroup: boolean; name: string | null; members: { userId: string; user: { name: string } }[] },
  meId: string,
): string {
  if (convo.isGroup) return convo.name ?? "Group chat";
  return convo.members.find((m) => m.userId !== meId)?.user.name ?? "Chat";
}
