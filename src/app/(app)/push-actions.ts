"use server";

import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { pushConfigured, sendPush } from "@/lib/push";

const MAX_DEVICES = 10;

const subscriptionSchema = z.object({
  endpoint: z.string().url().max(1000).startsWith("https://"),
  keys: z.object({ p256dh: z.string().min(10).max(200), auth: z.string().min(8).max(100) }),
});

type Result = { ok: true } | { ok: false; error: string };

/** Saves this browser as a place to send notifications. Safe to call again for the same device. */
export async function savePushSubscription(raw: unknown): Promise<Result> {
  const user = await requireUser({ allowPendingAlumni: true });
  if (!pushConfigured()) return { ok: false, error: "Notifications are not set up on this site yet." };
  const parsed = subscriptionSchema.safeParse(raw);
  if (!parsed.success) return { ok: false, error: "This browser sent an unusable notification address." };
  const { endpoint, keys } = parsed.data;

  // An endpoint belongs to one browser profile. If someone else signs in there, it moves to them.
  await prisma.pushSubscription.upsert({
    where: { endpoint },
    update: { userId: user.id, p256dh: keys.p256dh, auth: keys.auth },
    create: { userId: user.id, endpoint, p256dh: keys.p256dh, auth: keys.auth },
  });

  const all = await prisma.pushSubscription.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true },
  });
  if (all.length > MAX_DEVICES) {
    await prisma.pushSubscription.deleteMany({ where: { id: { in: all.slice(MAX_DEVICES).map((s) => s.id) } } });
  }
  return { ok: true };
}

export async function removePushSubscription(endpoint: string): Promise<Result> {
  const user = await requireUser({ allowPendingAlumni: true });
  await prisma.pushSubscription.deleteMany({ where: { endpoint: String(endpoint).slice(0, 1000), userId: user.id } });
  return { ok: true };
}

/** Sends a sample notification to the student's own devices so they can check that it works. */
export async function sendTestPush(): Promise<Result> {
  const user = await requireUser({ allowPendingAlumni: true });
  if (!pushConfigured()) return { ok: false, error: "Notifications are not set up on this site yet." };
  const delivered = await sendPush([user.id], {
    title: "Foothill Commons",
    body: "Notifications are on. You will see new messages here.",
    url: "/settings",
    tag: "test",
    force: true,
  });
  return delivered > 0 ? { ok: true } : { ok: false, error: "No device answered. Turn notifications off and on again." };
}
