"use client";

import "@livekit/components-styles";
import { LiveKitRoom, VideoConference } from "@livekit/components-react";
import type { CallSession } from "@/app/(app)/call-actions";

/** The call window itself. Loaded only when a call starts, so the rest of the app stays light. */
export default function LiveCall({
  session,
  onDisconnected,
  onProblem,
}: {
  session: CallSession;
  onDisconnected: () => void;
  onProblem: (message: string) => void;
}) {
  return (
    <LiveKitRoom
      serverUrl={session.url}
      token={session.token}
      connect
      audio
      video={session.kind === "VIDEO"}
      data-lk-theme="default"
      style={{ height: "100%" }}
      onDisconnected={onDisconnected}
      onError={() => onProblem("The call lost its connection. Check your internet and try again.")}
      onMediaDeviceFailure={() =>
        onProblem("Could not use your camera or microphone. Allow them for this site in your browser settings, then rejoin.")
      }
    >
      <VideoConference />
    </LiveKitRoom>
  );
}
