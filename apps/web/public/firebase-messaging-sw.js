const CACHE_NAME = "el-bannawy-v1";
const STATIC_ASSETS = [
  "/",
  "/logo.svg",
  "/logo-splash.svg",
  "/favicon.svg",
  "/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)));
    }),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (event.request.url.includes("/api/")) {
    event.respondWith(fetch(event.request).catch(() => new Response(null, { status: 503 })));
    return;
  }
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached ?? fetch(event.request).then((response) => {
        if (response.ok && response.type === "basic") {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => cached ?? new Response(null, { status: 503 }));
    }),
  );
});

importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.15.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyA3tYGPqgMBW1vvnUHLj18oihxTKLDREyQ",
  authDomain: "elbannawy-platform-f0a73.firebaseapp.com",
  projectId: "elbannawy-platform-f0a73",
  messagingSenderId: "423891283480",
  appId: "1:423891283480:web:8d077cb506122fba585d6d",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const notificationTitle = payload.notification?.title || payload.data?.title || "إشعار جديد";
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || "",
    icon: "/logo.svg",
    badge: "/favicon.svg",
    data: payload.data || {},
  };
  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const link = data.link || "/dashboard";
  const urlToOpen = new URL(link, self.location.origin).href;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url === urlToOpen && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    }),
  );
});
