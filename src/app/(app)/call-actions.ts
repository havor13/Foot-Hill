"use server";

import { after } from "next/server";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { createToken, livekitConfigured, livekitUrl, newRoomName, type CallKindName } from "@/lib/livekit";
import { MAX_IN_CALL, PING_TTL_MS, ROOM_LIFETIME_MS, activeCallWhere, chatTitle } from "@/lib/calls";
import { sendPush } from "@/lib/push";

export type CallSession = { callId: string; url: string; token: string; kind: CallKindName; title: string };
export type CallResult = { ok: true; session: CallSession } | { ok: false; error: string };

const MEMBER_SELECT = {
  isGroup: true,
  name: true,
  members: { select: { userId: true, user: { select: { name: true } } } },
} as const;

/** Gives the signed-in student a pass for the call's private room and marks them as in the call. */
async function enter(
  call: { id: string; roomName: string; roomUrl: string; kind: CallKindName },
  user: { id: string; name: string },
  title: string,
): Promise<CallResult> {
  const inside = await prisma.callParticipant.count({
    where: { callId: call.id, userId: { not: user.id }, lastSeenAt: { gt: new Date(Date.now() - PING_TTL_MS) } },
  });
  if (inside >= MAX_IN_CALL) return { ok: false, error: "This call is full." };
  try {
    const token = await createToken({
      roomName: call.roomName,
      userId: user.id,
      userName: user.name,
      lifetimeMs: ROOM_LIFETIME_MS,
    });
    await prisma.callParticipant.upsert({
      where: { callId_userId: { callId: call.id, userId: user.id } },
      update: { lastSeenAt: new Date() },
      create: { callId: call.id, userId: user.id },
    });
    return { ok: true, session: { callId: call.id, url: livekitUrl(), token, kind: call.kind, title } };
  } catch {
    return { ok: false, error: "Could not join the call. Try again." };
  }
}

/** Starts a call in a chat you belong to, or joins the one already going. */
export async function startCall(conversationId: string, kind: CallKindName): Promise<CallResult> {
  const user = await requireUser();
  if (kind !== "AUDIO" && kind !== "VIDEO") return { ok: false, error: "Choose an audio or video call." };
  if (!livekitConfigured()) return { ok: false, error: "Calls are not set up on this site yet." };

  const convo = await prisma.conversation.findFirst({
    where: { id: conversationId, members: { some: { userId: user.id } } },
    select: MEMBER_SELECT,
  });
  if (!convo) return { ok: false, error: "You are not in this chat." };
  if (convo.members.length < 2) return { ok: false, error: "There is no one else in this chat to call." };
  const title = chatTitle(convo, user.id);

  const going = await prisma.call.findFirst({
    where: { conversationId, ...activeCallWhere() },
    orderBy: { startedAt: "desc" },
  });
  if (going) return enter(going, user, title);

  // A cap on new rooms keeps a stuck button from creating dozens of them.
  const recent = await prisma.call.count({ where: { startedById: user.id, startedAt: { gt: new Date(Date.now() - 60_000) } } });
  if (recent >= 5) return { ok: false, error: "Too many calls started. Wait a minute and try again." };

  let call: Awaited<ReturnType<typeof prisma.call.create>>;
  try {
    const roomName = newRoomName();
    await prisma.call.updateMany({ where: { conversationId, endedAt: null }, data: { endedAt: new Date() } }); // close stale ones
    call = await prisma.call.create({
      data: { conversationId, startedById: user.id, kind, roomName, roomUrl: livekitUrl() },
    });
  } catch {
    return { ok: false, error: "Could not start the call. Try again in a moment." };
  }

  // Ring the others with a notification, after the reply has gone out.
  const newCallId = call.id;
  const others = convo.members.filter((m) => m.userId !== user.id).map((m) => m.userId);
  after(() =>
    sendPush(others, {
      title: convo.isGroup ? title : user.name,
      body: `${convo.isGroup ? `${user.name.split(" ")[0]} started` : "Incoming"} ${kind === "VIDEO" ? "video" : "audio"} call. Tap to join.`,
      url: `/chat/${conversationId}`,
      tag: `call-${newCallId}`,
    }).catch((e) => console.error("Could not send call notifications:", e)),
  );

  return enter(call, user, title);
}

/** Joins a call that is going on in one of your chats. */
export async function joinCall(callId: string): Promise<CallResult> {
  const user = await requireUser();
  if (!livekitConfigured()) return { ok: false, error: "Calls are not set up on this site yet." };
  const call = await prisma.call.findFirst({
    where: { id: callId, ...activeCallWhere(), conversation: { members: { some: { userId: user.id } } } },
    include: { conversation: { select: MEMBER_SELECT } },
  });
  if (!call) return { ok: false, error: "This call has ended." };
  return enter(call, user, chatTitle(call.conversation, user.id));
}

/** Called every few seconds from an open call so everyone else can see that it is still going. */
export async function pingCall(callId: string): Promise<{ ok: boolean }> {
  const user = await requireUser();
  const call = await prisma.call.findFirst({
    where: { id: callId, endedAt: null, startedAt: { gt: new Date(Date.now() - ROOM_LIFETIME_MS) }, conversation: { members: { some: { userId: user.id } } } },
    select: { id: true },
  });
  if (!call) return { ok: false };
  await prisma.callParticipant.upsert({
    where: { callId_userId: { callId, userId: user.id } },
    update: { lastSeenAt: new Date() },
    create: { callId, userId: user.id },
  });
  return { ok: true };
}

/**
 * Leaves a call. A call needs no closing step: once nobody has checked in for a short while it
 * stops counting as active, so a lost connection and a normal hang-up end the same way.
 */
export async function leaveCall(callId: string): Promise<void> {
  const user = await requireUser();
  await prisma.callParticipant.deleteMany({ where: { callId, userId: user.id } });
}
