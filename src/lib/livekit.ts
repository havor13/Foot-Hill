import crypto from "node:crypto";
import { AccessToken } from "livekit-server-sdk";

export type CallKindName = "AUDIO" | "VIDEO";

/** Calls run on LiveKit Cloud. Without these three settings the call buttons report that calls are not set up. */
export const livekitConfigured = () =>
  Boolean(process.env.LIVEKIT_URL && process.env.LIVEKIT_API_KEY && process.env.LIVEKIT_API_SECRET);

/** The address the browser connects to, such as wss://your-project.livekit.cloud. */
export const livekitUrl = () => process.env.LIVEKIT_URL ?? "";

/** Rooms need no set-up call: LiveKit creates one the first time someone with a valid pass joins it. */
export const newRoomName = () => `fc-${crypto.randomBytes(9).toString("hex")}`;

/** A one-person pass for one room. Only chat members are given one. */
export async function createToken(opts: {
  roomName: string;
  userId: string;
  userName: string;
  lifetimeMs: number;
}): Promise<string> {
  const token = new AccessToken(process.env.LIVEKIT_API_KEY, process.env.LIVEKIT_API_SECRET, {
    identity: opts.userId,
    name: opts.userName.slice(0, 60),
    ttl: Math.floor(opts.lifetimeMs / 1000),
  });
  token.addGrant({
    room: opts.roomName,
    roomJoin: true,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true, // lets the in-call chat work
  });
  return token.toJwt();
}
