self.addEventListener("install", () => {
  console.log("Service Worker Installed");
});

self.addEventListener("fetch", () => {
  // basic offline support placeholder
});

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  self.clients.claim();
});

self.addEventListener("fetch", () => {});
