import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { PING_TTL_MS, activeCallWhere, chatTitle } from "@/lib/calls";

export const dynamic = "force-dynamic";

/**
 * Polled by every open page. Lists calls going on in the student's chats that they have not joined,
 * so an "incoming call" banner can show wherever they are in the app.
 */
export async function GET() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ calls: [] }, { status: 401 });

  const me = await prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } });
  if (!me?.emailVerified) return Response.json({ calls: [] });

  const now = Date.now();
  const calls = await prisma.call.findMany({
    where: {
      ...activeCallWhere(now),
      conversation: { members: { some: { userId } } },
      participants: { none: { userId, lastSeenAt: { gt: new Date(now - PING_TTL_MS) } } },
    },
    orderBy: { startedAt: "desc" },
    take: 5,
    include: {
      startedBy: { select: { id: true, name: true } },
      conversation: { select: { isGroup: true, name: true, members: { select: { userId: true, user: { select: { name: true } } } } } },
      participants: { where: { lastSeenAt: { gt: new Date(now - PING_TTL_MS) } }, select: { userId: true } },
    },
  });

  return Response.json({
    calls: calls.map((c) => ({
      id: c.id,
      conversationId: c.conversationId,
      kind: c.kind,
      title: chatTitle(c.conversation, userId),
      startedBy: c.startedBy.name,
      inCall: c.participants.length,
    })),
  });
}
