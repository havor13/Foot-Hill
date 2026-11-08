"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { sendMessage, toggleMessageReaction, type ChatMsg } from "@/app/(app)/chat/actions";
import { REACTION_EMOJIS, sameReactions, type ReactionSummary } from "@/lib/reactions";
import { isImageType, UPLOAD_NOTE, type AttachmentInput } from "@/lib/uploads";
import { useAttachmentUploader } from "@/components/useAttachmentUploader";
import { AttachButton, AttachChips } from "@/components/AttachControls";
import AttachmentList from "@/components/AttachmentList";

const POLL_MS = 3000;

type Row = ChatMsg & { state?: "sending" | "failed" };

/** Formats times in the reader's own time zone. The server does not know it, so this runs in the browser only. */
function makeFormats(timeZone: string) {
  return {
    time: new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "2-digit", timeZone }),
    dayKey: new Intl.DateTimeFormat("en-CA", { year: "numeric", month: "2-digit", day: "2-digit", timeZone }),
    dayLabel: new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "numeric", timeZone }),
  };
}
type Formats = ReturnType<typeof makeFormats>;

function dayLabel(iso: string, f: Formats): string {
  const d = new Date(iso);
  const key = f.dayKey.format(d);
  if (key === f.dayKey.format(new Date())) return "Today";
  if (key === f.dayKey.format(new Date(Date.now() - 86_400_000))) return "Yesterday";
  return f.dayLabel.format(d);
}

function mergeRows(prev: Row[], incoming: ChatMsg[]): Row[] {
  const known = new Set(prev.map((m) => m.id));
  const fresh = incoming.filter((m) => !known.has(m.id));
  if (!fresh.length) return prev;
  return [...prev, ...fresh].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

/** Applies the reaction counts the server sent for recent messages, leaving other rows alone. */
function applyReactions(prev: Row[], incoming: Record<string, ReactionSummary>, since: string): Row[] {
  let changed = false;
  const next = prev.map((r) => {
    if (r.state || r.createdAt < since) return r;
    const fresh = incoming[r.id] ?? [];
    if (sameReactions(r.reactions, fresh)) return r;
    changed = true;
    return { ...r, reactions: fresh };
  });
  return changed ? next : prev;
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
  const [timeZone, setTimeZone] = useState<string | null>(null);
  const [picker, setPicker] = useState<string | null>(null); // message whose emoji picker is open
  const uploader = useAttachmentUploader(meId);
  const scroller = useRef<HTMLDivElement>(null);
  const stick = useRef(true); // keep the view pinned to the newest message unless the reader scrolled up
  const cursor = useRef<string>(initial.at(-1)?.createdAt ?? new Date(0).toISOString());

  // Times need the browser's time zone, so they appear right after the page loads.
  useEffect(() => setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC"), []);
  const formats = useMemo(() => (timeZone ? makeFormats(timeZone) : null), [timeZone]);

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
      const data: {
        messages: ChatMsg[];
        othersReadAt: string | null;
        reactions: Record<string, ReactionSummary>;
        reactionsSince: string;
      } = await res.json();
      setOthersReadAt(data.othersReadAt);
      setRows((prev) => applyReactions(data.messages.length ? mergeRows(prev, data.messages) : prev, data.reactions, data.reactionsSince));
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

  async function deliver(tempId: string, body: string, files: AttachmentInput[]) {
    const result = await sendMessage(conversationId, body, files).catch(() => null);
    if (!result || !result.ok) {
      setError(result && !result.ok ? result.error : "Could not send. Check your connection and try again.");
      setRows((prev) => prev.map((r) => (r.id === tempId ? { ...r, state: "failed" as const } : r)));
      return;
    }
    const sent = result.message;
    // The poll may already have delivered the real message, so merge by id after dropping the placeholder.
    setRows((prev) => mergeRows(prev.filter((r) => r.id !== tempId), [sent]));
  }

  const canSend = (text.trim().length > 0 || uploader.ready.length > 0) && !uploader.uploading;

  function submit() {
    if (!canSend) return;
    const body = text.trim();
    const files = uploader.ready;
    setError("");
    setText("");
    uploader.clear();
    stick.current = true;
    const tempId = `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setRows((prev) => [
      ...prev,
      {
        id: tempId,
        senderId: meId,
        senderName: "You",
        body,
        createdAt: new Date().toISOString(),
        attachments: files.map((f, i) => ({ ...f, id: `${tempId}-${i}`, kind: isImageType(f.contentType) ? "IMAGE" : "FILE" })),
        reactions: [],
        state: "sending",
      },
    ]);
    void deliver(tempId, body, files);
  }

  async function react(messageId: string, emoji: string) {
    setPicker(null);
    const flip = (list: ReactionSummary): ReactionSummary => {
      const existing = list.find((x) => x.emoji === emoji);
      const merged = existing
        ? list.flatMap((x) =>
            x.emoji !== emoji ? [x] : x.mine ? (x.count > 1 ? [{ ...x, count: x.count - 1, mine: false }] : []) : [{ ...x, count: x.count + 1, mine: true }],
          )
        : [...list, { emoji, count: 1, mine: true }];
      return REACTION_EMOJIS.filter((e) => merged.some((x) => x.emoji === e)).map((e) => merged.find((x) => x.emoji === e)!);
    };
    setRows((prev) => prev.map((r) => (r.id === messageId ? { ...r, reactions: flip(r.reactions) } : r)));
    const result = await toggleMessageReaction(messageId, emoji).catch(() => null);
    if (!result || !result.ok) {
      setError(result && !result.ok ? result.error : "Could not save the reaction.");
      setRows((prev) => prev.map((r) => (r.id === messageId ? { ...r, reactions: flip(r.reactions) } : r))); // undo
      return;
    }
    setRows((prev) => prev.map((r) => (r.id === messageId ? { ...r, reactions: result.reactions } : r)));
  }

  function retry(row: Row) {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, state: "sending" as const } : r)));
    setError("");
    void deliver(row.id, row.body, row.attachments);
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
          const day = formats ? dayLabel(m.createdAt, formats) : "";
          const showDay = Boolean(day) && day !== lastDay;
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
                  className={`grid max-w-[85%] gap-1.5 rounded-2xl px-3 py-1.5 sm:max-w-[70%] ${
                    mine ? "rounded-br-sm bg-bubble-me" : "rounded-bl-sm border border-line bg-surface"
                  } ${m.state === "sending" ? "opacity-70" : ""}`}
                >
                  {isGroup && !mine && <b className="block text-xs text-accent">{m.senderName}</b>}
                  {m.body && <p className="whitespace-pre-wrap break-words">{m.body}</p>}
                  <AttachmentList items={m.attachments} compact />
                  {!m.state && (
                    <div className="flex flex-wrap items-center gap-1">
                      {m.reactions.map((r) => (
                        <button
                          key={r.emoji}
                          type="button"
                          onClick={() => void react(m.id, r.emoji)}
                          aria-pressed={r.mine}
                          aria-label={`${r.emoji} ${r.count}${r.mine ? ", you reacted" : ""}`}
                          className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                            r.mine ? "border-accent bg-accent-soft text-accent" : "border-line bg-surface text-muted"
                          }`}
                        >
                          <span aria-hidden="true">{r.emoji}</span>
                          {r.count}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setPicker(picker === m.id ? null : m.id)}
                        aria-expanded={picker === m.id}
                        aria-label="Add a reaction"
                        className="rounded-full border border-transparent px-1.5 py-0.5 text-xs text-muted hover:border-line"
                      >
                        {picker === m.id ? "Close" : "+ 😊"}
                      </button>
                      {picker === m.id && (
                        <div role="group" aria-label="Choose a reaction" className="flex w-full flex-wrap gap-1 rounded-xl border border-line bg-surface p-1">
                          {REACTION_EMOJIS.map((e) => (
                            <button
                              key={e}
                              type="button"
                              onClick={() => void react(m.id, e)}
                              aria-label={`React with ${e}`}
                              className="rounded-lg px-2 py-1 text-lg hover:bg-surface2"
                            >
                              {e}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted">
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
                        <span>{formats ? formats.time.format(new Date(m.createdAt)) : ""}</span>
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
        className="grid gap-2 border-t border-line bg-surface p-3"
      >
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
        <AttachChips uploader={uploader} />
        <div className="flex items-end gap-2">
          <AttachButton uploader={uploader} />
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
          <button type="submit" disabled={!canSend} aria-label="Send" className="btn btn-primary h-10 w-10 shrink-0 !p-0">
            <svg viewBox="0 0 24 24" aria-hidden="true" className="h-5 w-5 fill-current">
              <path d="M3 20.5l18-8.5L3 3.5l.2 6.6L14 12 3.2 13.9z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-muted">{uploader.uploading ? "Uploading. You can send once it finishes." : UPLOAD_NOTE}</p>
      </form>
    </div>
  );
}
