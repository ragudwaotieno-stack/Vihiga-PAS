/* Vihiga SPMS service worker.
   Goal: make the app installable and launch quickly, WITHOUT ever serving a
   stale version of the app after a fix is deployed.
   - Page/app shell (navigations): NETWORK FIRST. The newest deploy always wins
     when online; the cached copy is only a fallback when there's no signal.
   - Same-origin static files (icons, manifest): cache-first, refreshed in the
     background.
   - Everything cross-origin (Supabase API, auth, storage, signed evidence
     URLs, CDNs) is NOT touched at all - passes straight to the network, so
     no appraisal data or login token is ever cached by this worker.
   Bump CACHE_VERSION only if you change this file's caching rules. */
const CACHE_VERSION = "spms-v3";
const CACHE = CACHE_VERSION;
const SHELL = ["./", "manifest.json", "config.js", "icons/icon-192.png", "icons/icon-512.png", "icons/icon-maskable-512.png", "icons/apple-touch-icon.png"];

self.addEventListener("install", (e)=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL).catch(()=>{})).then(()=>self.skipWaiting()));
});
self.addEventListener("activate", (e)=>{
  e.waitUntil(
    caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))
      .then(()=>self.clients.claim())
  );
});
self.addEventListener("fetch", (e)=>{
  const req = e.request;
  if(req.method !== "GET") return;
  const url = new URL(req.url);
  if(url.origin !== self.location.origin) return; // Supabase etc: never intercepted
  if(url.searchParams.has("vcheck")) return; // in-app update check: always straight to the network

  // config.js says which server the app talks to: always network-first, so a
  // server change is picked up at once (cached copy only when offline).
  if(url.pathname.endsWith("/config.js")){
    e.respondWith(fetch(req).then(res=>{
      if(res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{}); }
      return res;
    }).catch(()=>caches.match(req).then(r=>r || Response.error())));
    return;
  }

  if(req.mode === "navigate"){
    e.respondWith(
      fetch(req).then(res=>{
        const copy = res.clone();
        caches.open(CACHE).then(c=>c.put("./", copy)).catch(()=>{});
        return res;
      }).catch(()=>caches.match("./").then(r=>r || Response.error()))
    );
    return;
  }
  e.respondWith(
    caches.match(req).then(hit=>{
      const net = fetch(req).then(res=>{
        if(res && res.ok){ const copy = res.clone(); caches.open(CACHE).then(c=>c.put(req, copy)).catch(()=>{}); }
        return res;
      }).catch(()=>hit);
      return hit || net;
    })
  );
});
