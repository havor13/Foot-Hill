"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { usePathname } from "next/navigation";
import { joinCall, leaveCall, pingCall, startCall, type CallResult, type CallSession } from "@/app/(app)/call-actions";

type Kind = "AUDIO" | "VIDEO";
type Incoming = { id: string; conversationId: string; kind: Kind; title: string; startedBy: string; inCall: number };

type CallContext = {
  /** Starts a call in a chat, or joins the one already going. Resolves when the call screen is up. */
  start: (conversationId: string, kind: Kind) => Promise<void>;
  busy: boolean;
  inCall: boolean;
};

const Ctx = createContext<CallContext>({ start: async () => {}, busy: false, inCall: false });
export const useCalls = () => useContext(Ctx);

const POLL_MS = 4000;
const PING_MS = 15000;

/** A short double ring and a buzz. Browsers only allow sound after the student has tapped something on the site. */
function ring() {
  try {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AC();
    [0, 0.4, 1.4, 1.8].forEach((t) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 880;
      gain.gain.value = 0.08;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t);
      osc.stop(ctx.currentTime + t + 0.28);
    });
    setTimeout(() => void ctx.close().catch(() => undefined), 3000);
  } catch {
    // No audio available. The banner is still there.
  }
  try {
    navigator.vibrate?.([300, 150, 300]);
  } catch {
    // Not supported on this device.
  }
}

const LiveCall = dynamic(() => import("@/components/LiveCall"), {
  ssr: false,
  loading: () => <p className="p-4 text-sm text-white/80">Connecting…</p>,
});

function CallScreen({ session, onClose }: { session: CallSession; onClose: () => void }) {
  const [problem, setProblem] = useState("");

  // While the call is open, check in often so everyone else can see that it is still going.
  useEffect(() => {
    void pingCall(session.callId).catch(() => undefined);
    const timer = setInterval(() => void pingCall(session.callId).catch(() => undefined), PING_MS);
    return () => {
      clearInterval(timer);
      void leaveCall(session.callId).catch(() => undefined);
    };
  }, [session.callId]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`${session.kind === "VIDEO" ? "Video" : "Audio"} call with ${session.title}`} className="fixed inset-0 z-[60] flex flex-col bg-black">
      <div className="flex items-center gap-2 px-4 py-2 text-white">
        <b className="min-w-0 flex-1 truncate text-sm">{session.title}</b>
        <button type="button" onClick={onClose} className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold hover:bg-red-700">
          Leave call
        </button>
      </div>
      {problem && (
        <p role="alert" className="px-4 pb-2 text-sm text-red-300">
          {problem}
        </p>
      )}
      <div className="min-h-0 flex-1">
        <LiveCall session={session} onDisconnected={onClose} onProblem={setProblem} />
      </div>
    </div>
  );
}

export default function CallProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<CallSession | null>(null);
  const [incoming, setIncoming] = useState<Incoming[]>([]);
  const [dismissed, setDismissed] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const pathname = usePathname();
  const rung = useRef<Set<string>>(new Set());

  const open = useCallback((result: CallResult) => {
    if (result.ok) {
      setError("");
      setSession(result.session);
    } else setError(result.error);
  }, []);

  const start = useCallback(
    async (conversationId: string, kind: Kind) => {
      if (session) {
        setError("You are already in a call.");
        return;
      }
      setBusy(true);
      open(await startCall(conversationId, kind).catch(() => ({ ok: false as const, error: "Could not start the call." })));
      setBusy(false);
    },
    [open, session],
  );

  const join = useCallback(
    async (callId: string) => {
      setBusy(true);
      open(await joinCall(callId).catch(() => ({ ok: false as const, error: "Could not join the call." })));
      setBusy(false);
    },
    [open],
  );

  // Look for calls other people have started in your chats, wherever you are in the app.
  useEffect(() => {
    if (session) return;
    let stopped = false;
    async function check() {
      try {
        const res = await fetch("/api/calls/active", { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data: { calls: Incoming[] } = await res.json();
        setIncoming(data.calls);
      } catch {
        // Offline. The next check tries again.
      }
    }
    void check();
    const timer = setInterval(check, POLL_MS);
    // Look again straight away when the student comes back to the tab, regains internet or opens another page.
    document.addEventListener("visibilitychange", check);
    window.addEventListener("focus", check);
    window.addEventListener("online", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
      window.removeEventListener("focus", check);
      window.removeEventListener("online", check);
    };
  }, [session, pathname]);

  const closeCall = useCallback(() => {
    setSession(null);
    setIncoming([]);
  }, []);

  const value = useMemo(() => ({ start, busy, inCall: session !== null }), [start, busy, session]);
  const banners = session ? [] : incoming.filter((c) => !dismissed.includes(c.id));

  // Ring once for each new call.
  useEffect(() => {
    const fresh = banners.filter((b) => !rung.current.has(b.id));
    if (!fresh.length) return;
    fresh.forEach((b) => rung.current.add(b.id));
    ring();
  });

  return (
    <Ctx.Provider value={value}>
      {children}

      {banners.length > 0 && (
        <div className="fixed inset-x-0 top-3 z-40 mx-auto grid w-[min(28rem,calc(100%-1.5rem))] gap-2" role="region" aria-label="Incoming calls">
          {banners.map((c) => (
            <div key={c.id} role="alert" className="flex items-center gap-3 rounded-2xl border border-line bg-surface p-3 shadow-lg">
              <span aria-hidden="true" className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-accent-soft text-lg">
                {c.kind === "VIDEO" ? "🎥" : "📞"}
              </span>
              <div className="min-w-0 flex-1">
                <b className="block truncate text-sm">{c.title}</b>
                <span className="block truncate text-xs text-muted">
                  {c.startedBy} started a {c.kind === "VIDEO" ? "video" : "audio"} call
                  {c.inCall > 1 ? ` · ${c.inCall} in the call` : ""}
                </span>
              </div>
              <button type="button" className="btn btn-primary !px-3 !py-1.5 text-sm" disabled={busy} onClick={() => void join(c.id)}>
                Join
              </button>
              <button type="button" className="btn !px-2.5 !py-1.5 text-sm" aria-label="Dismiss" onClick={() => setDismissed((d) => [...d, c.id])}>
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div role="alert" className="fixed inset-x-0 bottom-20 z-40 mx-auto flex w-[min(28rem,calc(100%-1.5rem))] items-center gap-3 rounded-xl border border-line bg-surface p-3 text-sm shadow-lg md:bottom-6">
          <span className="min-w-0 flex-1 text-danger">{error}</span>
          <button type="button" className="btn !px-2.5 !py-1 text-xs" onClick={() => setError("")}>
            Close
          </button>
        </div>
      )}

      {session && <CallScreen session={session} onClose={closeCall} />}
    </Ctx.Provider>
  );
}
