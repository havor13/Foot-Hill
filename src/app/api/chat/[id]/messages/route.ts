import { auth } from "@/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

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

  const [messages, others] = await Promise.all([
    prisma.message.findMany({
      where: { conversationId: id, createdAt: { gte: after } },
      orderBy: { createdAt: "asc" },
      take: 100,
      include: { sender: { select: { name: true } } },
    }),
    prisma.conversationMember.findMany({
      where: { conversationId: id, userId: { not: userId } },
      select: { lastReadAt: true },
    }),
  ]);

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
    })),
    othersReadAt,
  });
}
