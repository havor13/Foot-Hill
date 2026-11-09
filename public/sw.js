/* Foothill Commons service worker: shows push notifications and opens the right chat when one is tapped. */

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = { body: event.data ? event.data.text() : "" };
  }
  const title = data.title || "Foothill Commons";
  const url = new URL(data.url || "/chat", self.location.origin);

  event.waitUntil(
    (async () => {
      // No banner when the student is already looking at that chat. A visible tab also keeps the browser
      // from showing its generic "this site was updated in the background" notice.
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const watching = windows.some((c) => c.visibilityState === "visible" && new URL(c.url).pathname === url.pathname);
      if (watching && !data.force) return;

      await self.registration.showNotification(title, {
        body: data.body || "",
        icon: "/icon-192.png",
        badge: "/icon-192.png",
        tag: data.tag || undefined,
        renotify: Boolean(data.tag),
        // A call stays on screen until it is tapped, and buzzes where the device allows it.
        requireInteraction: Boolean(data.sticky),
        vibrate: data.sticky ? [300, 150, 300, 150, 300] : undefined,
        data: { url: url.href },
      });
    })(),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || new URL("/chat", self.location.origin).href;

  event.waitUntil(
    (async () => {
      const windows = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      const exact = windows.find((c) => c.url === target);
      if (exact) return exact.focus();
      const any = windows[0];
      if (any) {
        await any.focus();
        try {
          await any.navigate(target);
          return;
        } catch {
          // Some browsers refuse to navigate a window they did not open. Fall through to a new one.
        }
      }
      await self.clients.openWindow(target);
    })(),
  );
});
