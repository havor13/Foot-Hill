"use client";

import { useCalls } from "@/components/CallProvider";

const icon = "h-5 w-5 fill-none stroke-current stroke-[1.8]";

/** Audio and video call buttons for a chat's header. */
export default function CallButtons({ conversationId }: { conversationId: string }) {
  const { start, busy, inCall } = useCalls();
  const disabled = busy || inCall;
  return (
    <div className="flex shrink-0 gap-1">
      <button type="button" className="btn !h-9 !w-9 !p-0" disabled={disabled} aria-label="Start an audio call" title="Audio call" onClick={() => void start(conversationId, "AUDIO")}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className={icon} strokeLinecap="round" strokeLinejoin="round">
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z" />
        </svg>
      </button>
      <button type="button" className="btn !h-9 !w-9 !p-0" disabled={disabled} aria-label="Start a video call" title="Video call" onClick={() => void start(conversationId, "VIDEO")}>
        <svg viewBox="0 0 24 24" aria-hidden="true" className={icon} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h9A1.5 1.5 0 0 1 15 7.5v9a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 3 16.5zM15 10.5l6-3.5v10l-6-3.5z" />
        </svg>
      </button>
    </div>
  );
}
