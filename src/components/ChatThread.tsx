"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { sendMessage, type ChatMsg } from "@/app/(app)/chat/actions";

const TZ = "America/Denver";
const POLL_MS = 3000;

type Row = ChatMsg & { state?: "sending" | "failed" };

const timeFmt = new Intl.DateTimeFormat("en-US", { hour: "numeric", minute: "2-digit", timeZone: TZ });
const dayKeyFmt = new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone: TZ });
const dayLabelFmt = new Intl.DateTimeFormat("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: TZ });

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const key = dayKeyFmt.format(d);
  if (key === dayKeyFmt.format(new Date())) return "Today";
  if (key === dayKeyFmt.format(new Date(Date.now() - 86_400_000))) return "Yesterday";
  return dayLabelFmt.format(d);
}

function mergeRows(prev: Row[], incoming: ChatMsg[]): Row[] {
  const known = new Set(prev.map((m) => m.id));
  const fresh = incoming.filter((m) => !known.has(m.id));
  if (!fresh.length) return prev;
  return [...prev, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

function Ticks({ read }: { read: boolean }) {
  return (
    <svg
      viewBox="0 0 16 10"
      aria-label={read ? "Read" : "Sent"}
      className={`h-2.5 w-4 fill-none stroke-[1.8] ${read ? "stroke-accent" : "stroke-muted"}`}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {read ? <path d="M1 5.5l3 3 6-7M7 7.5l1.5 1.5 6-7.5" /> : <path d="M3 5.5l3 3 6-7" />}
    </svg>
  );
}

export default function ChatThread({
  conversationId,
  meId,
  isGroup,
  initial,
  initialOthersReadAt,
}: {
  conversationId: string;
  meId: string;
  isGroup: boolean;
  initial: ChatMsg[];
  initialOthersReadAt: string | null;
}) {
  const [rows, setRows] = useState<Row[]>(initial);
  const [othersReadAt, setOthersReadAt] = useState<string | null>(initialOthersReadAt);
  const [text, setText] = useState("");
  const [error, setError] = useState("");
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true); // keep the view pinned to the newest message unless the reader scrolled up
  const cursor = useRef<string>(initial.at(-1)?.createdAt ?? new Date(0).toISOString());

  // Track the newest confirmed message so each poll only asks for what is new.
  useEffect(() => {
    const confirmed = rows.filter((r) => !r.state);
    const last = confirmed.at(-1);
    if (last) cursor.current = last.createdAt;
  }, [rows]);

  useEffect(() => {
    const el = scroller.current;
    if (el && stick.current) el.scrollTop = el.scrollHeight;
  }, [rows]);

  const poll = useCallback(async () => {
    if (document.hidden) return; // a background tab should not mark the chat as read
    try {
      const res = await fetch(
        `/api/chat/${conversationId}/messages?after=${encodeURIComponent(cursor.current)}`,
        { cache: "no-store" },
      );
      if (!res.ok) return;
      const data: { messages: ChatMsg[]; othersReadAt: string | null } = await res.json();
      setOthersReadAt(data.othersReadAt);
      if (data.messages.length) setRows((prev) => mergeRows(prev, data.messages));
    } catch {
      // Offline or the server restarted. The next tick tries again.
    }
  }, [conversationId]);

  useEffect(() => {
    const timer = setInterval(poll, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) void poll();
    };
    document.addEventListener("visibilitychange", onVisible);
    void poll();
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [poll]);

  async function deliver(tempId: string, body: string) {
    const result = await sendMessage(conversationId, body).catch(() => null);
    if (!result || !result.ok) {
      setError(result && !result.ok ? result.error : "Could not send. Check your connection and try again.");
      setRows((prev) => prev.map((r) => (r.id === tempId ? { ...r, state: "failed" as const } : r)));
      return;
    }
    const sent = result.message;
    // The poll may already have delivered the real message, so merge by id after dropping the placeholder.
    setRows((prev) => mergeRows(prev.filter((r) => r.id !== tempId), [sent]));
  }

  function submit() {
    const body = text.trim();
    if (!body) return;
    setError("");
    setText("");
    stick.current = true;
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setRows((prev) => [
      ...prev,
      { id: tempId, senderId: meId, senderName: "You", body, createdAt: new Date().toISOString(), state: "sending" },
    ]);
    void deliver(tempId, body);
  }

  function retry(row: Row) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, state: "sending" as const } : r)));
    setError("");
    void deliver(row.id, row.body);
  }

  let lastDay = "";

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div
        ref={scroller}
        role="log"
        aria-live="polite"
        aria-label="Messages"
        onScroll={(e) => {
          const el = e.currentTarget;
          stick.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="flex min-h-0 flex-1 flex-col gap-1 overflow-y-auto bg-wall px-4 py-4"
      >
        {rows.length === 0 && (
          <p className="m-auto max-w-xs text-center text-sm text-muted">No messages yet. Say hello and start the conversation.</p>
        )}
        {rows.map((m) => {
          const mine = m.senderId === meId;
          const day = dayLabel(m.createdAt);
          const showDay = day !== lastDay;
          lastDay = day;
          const read = mine && !isGroup && othersReadAt !== null && new Date(othersReadAt) >= new Date(m.createdAt);
          return (
            <div key={m.id} className="contents">
              {showDay && (
                <div className="my-2 self-center rounded-full border border-line bg-surface px-3 py-0.5 text-xs font-semibold text-muted">
                  {day}
                </div>
              )}
              <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-1.5 sm:max-w-[70%] ${
                    mine ? "rounded-br-sm bg-bubble-me" : "rounded-bl-sm border border-line bg-surface"
                  } ${m.state === "sending" ? "opacity-70" : ""}`}
                >
                  {isGroup && !mine && <b className="block text-xs text-accent">{m.senderName}</b>}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <div className="mt-0.5 flex items-center justify-end gap-1.5 text-[11px] text-muted">
                    {m.state === "failed" ? (
                      <>
                        <span className="text-danger">Not sent</span>
                        <button type="button" onClick={() => retry(m)} className="font-semibold underline">
                          Retry
                        </button>
                      </>
                    ) : m.state === "sending" ? (
                      <span>Sending…</span>
                    ) : (
                      <>
                        <span>{timeFmt.format(new Date(m.createdAt))}</span>
                        {mine && !isGroup && <Ticks read={read} />}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit();
        }}
        className="border-t border-line bg-surface p-3"
      >
        {error && (
          <p role="alert" className="pb-2 text-sm text-danger">
            {error}
          </p>
        )}
        <div className="flex items-end gap-2">
          <label htmlFor="chat-text" className="sr-only">
            Message
          </label>
          <textarea
            id="chat-text"
            value={text}
            rows={1}
            maxLength={2000}
            placeholder="Write a message"
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                submit();
              }
            }}
            className="input max-h-32 min-h-[2.5rem] flex-1 resize-none rounded-2xl"
          />
          <button type="submit" disabled={!text.trim()} aria-label="Send" className="btn btn-primary h-10 w-10 shrink-0 !p-0">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
              <path d="M3 20.5l18-8.5L3 3.5l.2 6.6L14 12 3.2 13.9z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
