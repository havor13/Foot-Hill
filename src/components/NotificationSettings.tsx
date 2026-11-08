"use client";

import { useEffect, useState } from "react";
import { removePushSubscription, savePushSubscription, sendTestPush } from "@/app/(app)/push-actions";

type Status = "loading" | "not-configured" | "unsupported" | "ios-install" | "denied" | "off" | "on";

/** Converts the public key from its URL-safe text form into the bytes the browser asks for. */
function keyToBytes(base64Url: string) {
  const padded = (base64Url + "=".repeat((4 - (base64Url.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded);
  const bytes = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

async function currentSubscription(): Promise<PushSubscription | null> {
  const reg = await navigator.serviceWorker.getRegistration("/sw.js");
  return reg ? reg.pushManager.getSubscription() : null;
}

export default function NotificationSettings({ publicKey }: { publicKey: string }) {
  const [status, setStatus] = useState<Status>("loading");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const set = (s: Status) => !cancelled && setStatus(s);
      if (!publicKey) return set("not-configured");
      const supported = "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
      if (!supported) return set(/iphone|ipad|ipod/i.test(navigator.userAgent) ? "ios-install" : "unsupported");
      if (Notification.permission === "denied") return set("denied");
      try {
        const sub = await currentSubscription();
        set(sub && Notification.permission === "granted" ? "on" : "off");
      } catch {
        set("off");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [publicKey]);

  async function enable() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "off");
        return;
      }
      await navigator.serviceWorker.register("/sw.js");
      const reg = await navigator.serviceWorker.ready;
      const sub =
        (await reg.pushManager.getSubscription()) ??
        (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(publicKey) }));
      const saved = await savePushSubscription(sub.toJSON());
      if (!saved.ok) {
        await sub.unsubscribe().catch(() => false);
        setError(saved.error);
        return;
      }
      setStatus("on");
      setMessage("Notifications are on for this device.");
    } catch {
      setError("Could not turn on notifications in this browser. Try again, or use a different browser.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const sub = await currentSubscription();
      if (sub) {
        await removePushSubscription(sub.endpoint);
        await sub.unsubscribe();
      }
      setStatus("off");
      setMessage("Notifications are off for this device.");
    } catch {
      setError("Could not turn off notifications. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function test() {
    setBusy(true);
    setError("");
    setMessage("");
    const result = await sendTestPush().catch(() => null);
    setBusy(false);
    if (result?.ok) setMessage("Sent. A notification should appear in a few seconds.");
    else setError(result && !result.ok ? result.error : "Could not send the test.");
  }

  return (
    <section aria-label="Notifications" className="card grid gap-3 shadow-sm">
      <div>
        <h2 className="font-display text-lg font-bold">Message notifications</h2>
        <p className="text-sm text-muted">Get a pop-up on this device when someone messages you, even when the app is closed.</p>
      </div>

      {status === "loading" && <p className="text-sm text-muted">Checking this device…</p>}

      {status === "not-configured" && (
        <p className="text-sm text-muted">Notifications are not set up on this site yet. The person who runs the app needs to finish setup.</p>
      )}

      {status === "unsupported" && (
        <p className="text-sm text-muted">This browser cannot show notifications. Try Chrome, Edge, Firefox or Safari on a recent device.</p>
      )}

      {status === "ios-install" && (
        <p className="text-sm text-muted">
          On iPhone and iPad, notifications work only from the home screen. Tap the Share button in Safari, choose{" "}
          <b className="text-ink">Add to Home Screen</b>, open Foothill from there, and come back to this page.
        </p>
      )}

      {status === "denied" && (
        <p className="text-sm text-muted">
          Notifications are blocked for this site. Open your browser's site settings (the lock or tune icon next to the address), allow
          Notifications, then reload this page.
        </p>
      )}

      {status === "off" && (
        <div>
          <button type="button" className="btn btn-primary" onClick={enable} disabled={busy}>
            {busy ? "Turning on…" : "Turn on notifications"}
          </button>
        </div>
      )}

      {status === "on" && (
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn" onClick={test} disabled={busy}>
            Send a test
          </button>
          <button type="button" className="btn" onClick={disable} disabled={busy}>
            Turn off
          </button>
        </div>
      )}

      {message && (
        <p role="status" className="text-sm font-semibold text-accent">
          {message}
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
      {(status === "on" || status === "off") && (
        <p className="text-xs text-muted">This applies to this browser or phone only. Turn it off before you sign out on a shared computer.</p>
      )}
    </section>
  );
}
