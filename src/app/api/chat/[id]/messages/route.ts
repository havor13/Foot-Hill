import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { attachmentSelect } from "@/lib/uploads.server";
import { summarizeReactions } from "@/lib/reactions";

export const dynamic = "force-dynamic";

const REACTION_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Polled by the chat window every few seconds. Returns messages created at or after `after`
 * (the client drops duplicates by id), the latest time anyone else read the chat, and marks
 * the chat as read for the caller.
 */
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return Response.json({ error: "Sign in to see this chat." }, { status: 401 });

  const { id } = await params;
  const raw = new URL(req.url).searchParams.get("after");
  const after = raw ? new Date(raw) : new Date(0);
  if (Number.isNaN(after.getTime())) return Response.json({ error: "Bad cursor." }, { status: 400 });

  const [me, member] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { emailVerified: true } }),
    prisma.conversationMember.findUnique({
      where: { conversationId_userId: { conversationId: id, userId } },
      select: { userId: true },
    }),
  ]);
  if (!me?.emailVerified || !member) return Response.json({ error: "Chat not found." }, { status: 404 });

  // Reactions on messages the window already holds can change, so recent ones are sent on every poll.
  const reactionsSince = new Date(Date.now() - REACTION_WINDOW_MS);
  const [messages, others, recentReactions] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: id, createdAt: { gte: after } },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: {
        sender: { select: { name: true } },
        attachments: { select: attachmentSelect, orderBy: { createdAt: "asc" } },
        reactions: { select: { emoji: true, userId: true } },
      },
    }),
    prisma.conversationMember.findMany({
      where: { conversationId: id, userId: { not: userId } },
      select: { lastReadAt: true },
    }),
    prisma.reaction.findMany({
      where: { message: { conversationId: id, createdAt: { gte: reactionsSince } } },
      select: { emoji: true, userId: true, messageId: true },
    }),
  ]);

  const grouped = new Map<string, { emoji: string; userId: string }[]>();
  for (const r of recentReactions) {
    if (!r.messageId) continue;
    const list = grouped.get(r.messageId) ?? [];
    list.push(r);
    grouped.set(r.messageId, list);
  }
  const reactions: Record<string, ReturnType<typeof summarizeReactions>> = {};
  for (const [messageId, list] of grouped) reactions[messageId] = summarizeReactions(list, userId);

  await prisma.conversationMember.update({
    where: { conversationId_userId: { conversationId: id, userId } },
    data: { lastReadAt: new Date() },
  });

  const othersReadAt = others.length
    ? new Date(Math.max(...others.map((o) => o.lastReadAt.getTime()))).toISOString()
    : null;

  return Response.json({
    messages: messages.map((m) => ({
      id: m.id,
      senderId: m.senderId,
      senderName: m.sender.name,
      body: m.body,
      createdAt: m.createdAt.toISOString(),
      attachments: m.attachments,
      reactions: summarizeReactions(m.reactions, userId),
    })),
    othersReadAt,
    reactions,
    reactionsSince: reactionsSince.toISOString(),
  });
}
