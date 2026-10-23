/* Only the public offline screen is cached. API data, account links and app pages stay on the network. */
const OFFLINE_CACHE = "hundo-offline-v1";
const OFFLINE_FILES = ["/offline.html", "/offline.css", "/icons/app-192.png"];
self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(OFFLINE_CACHE).then((cache) => cache.addAll(OFFLINE_FILES)));
});
self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys
    .filter((key) => key.startsWith("hundo-offline-") && key !== OFFLINE_CACHE)
    .map((key) => caches.delete(key)))));
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "APPLY_UPDATE") self.skipWaiting();
});
self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/api/")) return;
  if (event.request.mode === "navigate") {
    event.respondWith(fetch(event.request).catch(() => caches.match("/offline.html")));
  } else if (OFFLINE_FILES.includes(url.pathname)) {
    event.respondWith(fetch(event.request).catch(() => caches.match(url.pathname)));
  }
});
self.addEventListener("push", (event) => {
  let payload = {};
  try { payload = event.data?.json() || {}; } catch { /* Show a generic, bounded alert. */ }
  const title = typeof payload.title === "string" ? payload.title.slice(0, 64) : "Hundo update";
  const body = typeof payload.body === "string" ? payload.body.slice(0, 48) : "";
  const path = typeof payload.url === "string" && /^\/(notifications|leagues)(\/|\?|$)/.test(payload.url)
    ? payload.url : "/notifications";
  event.waitUntil(self.registration.showNotification(title, {
    body, icon: "/icons/app-192.png", badge: "/icons/app-192.png",
    tag: typeof payload.tag === "string" ? payload.tag.slice(0, 100) : "hundo-update",
    data: { url: path },
  }));
});
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const target = new URL(event.notification.data?.url || "/notifications", self.location.origin);
  if (target.origin !== self.location.origin) return;
  event.waitUntil(self.clients.openWindow(target.href));
});
