import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";

export async function getOrCreateDm(a: string, b: string) {
  const key = [a, b].sort().join(":");
  const existing = await prisma.conversation.findUnique({ where: { dmKey: key } });
  if (existing) return existing;
  try {
    return await prisma.conversation.create({
      data: { isGroup: false, dmKey: key, members: { create: [{ userId: a }, { userId: b }] } },
    });
  } catch (e) {
    // Two people opened the same chat at once; the other request won.
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      const again = await prisma.conversation.findUnique({ where: { dmKey: key } });
      if (again) return again;
    }
    throw e;
  }
}

/** Unread message counts per conversation for one user, in a single query. */
export async function unreadByConversation(userId: string): Promise<Record<string, number>> {
  const rows = await prisma.$queryRaw<{ id: string; n: number }[]>`
    SELECT m."conversationId" AS id, COUNT(*)::int AS n
    FROM "Message" m
    JOIN "ConversationMember" cm
      ON cm."conversationId" = m."conversationId" AND cm."userId" = ${userId}
    WHERE m."senderId" <> ${userId} AND m."createdAt" > cm."lastReadAt"
    GROUP BY m."conversationId"`;
  return Object.fromEntries(rows.map((r) => [r.id, r.n]));
}
