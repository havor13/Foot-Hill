import * as webpush from "web-push";
import { prisma } from "@/lib/db";

export type PushPayload = { title: string; body: string; url: string; tag?: string; force?: boolean };

let ready: boolean | null = null;

/** True when the three VAPID settings exist. Without them the app simply skips notifications. */
export function pushConfigured(): boolean {
  if (ready !== null) return ready;
  const pub = process.env.VAPID_PUBLIC_KEY;
  const priv = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;
  if (!pub || !priv || !subject) return (ready = false);
  try {
    webpush.setVapidDetails(subject, pub, priv);
    ready = true;
  } catch (e) {
    console.error("Push notifications are misconfigured:", e instanceof Error ? e.message : e);
    ready = false;
  }
  return ready;
}

/** Sends one notification to every saved device of the given students. Dead devices are removed. */
export async function sendPush(userIds: string[], payload: PushPayload): Promise<number> {
  if (!userIds.length || !pushConfigured()) return 0;
  const subs = await prisma.pushSubscription.findMany({ where: { userId: { in: userIds } } });
  const data = JSON.stringify(payload);
  let delivered = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, data, {
          TTL: 60 * 60 * 24,
          urgency: "high",
        });
        delivered += 1;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) {
          // The browser says this device unsubscribed or expired.
          await prisma.pushSubscription.deleteMany({ where: { id: s.id } });
        } else {
          console.error("Push notification failed:", status ?? (e instanceof Error ? e.message : e));
        }
      }
    }),
  );
  return delivered;
}

/** Tells everyone else in a chat that a message arrived. */
export async function notifyNewMessage(opts: {
  conversationId: string;
  senderId: string;
  senderName: string;
  body: string;
  attachmentKind?: "IMAGE" | "FILE";
}): Promise<void> {
  if (!pushConfigured()) return;
  const convo = await prisma.conversation.findUnique({
    where: { id: opts.conversationId },
    select: { isGroup: true, name: true, members: { where: { userId: { not: opts.senderId } }, select: { userId: true } } },
  });
  if (!convo || !convo.members.length) return;

  const text = opts.body.trim();
  const preview = text
    ? text.length > 110
      ? `${text.slice(0, 107)}…`
      : text
    : opts.attachmentKind === "IMAGE"
      ? "Sent a photo"
      : "Sent a file";
  const first = opts.senderName.split(" ")[0];

  await sendPush(
    convo.members.map((m) => m.userId),
    {
      title: convo.isGroup ? (convo.name ?? "Group chat") : opts.senderName,
      body: convo.isGroup ? `${first}: ${preview}` : preview,
      url: `/chat/${opts.conversationId}`,
      tag: `chat-${opts.conversationId}`,
    },
  );
}