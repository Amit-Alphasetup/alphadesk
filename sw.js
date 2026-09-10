// AlphaDesk service worker — deploy alongside index.html at the same origin.
// Bump CACHE on every release or clients keep serving the previous build.
const CACHE='alphadesk-v318';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];

self.addEventListener('install',e=>{
  // addAll is all-or-nothing: one missing shell file aborts the whole install,
  // so cache entries individually and tolerate a miss.
  e.waitUntil(caches.open(CACHE).then(c=>Promise.all(
    SHELL.map(u=>c.add(u).catch(err=>console.warn('AlphaDesk SW: skipped',u,err)))
  )));
  self.skipWaiting();
});

self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(
    keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))
  )));
  self.clients.claim();
});

self.addEventListener('fetch',e=>{
  if(e.request.method!=='GET')return;
  const url=new URL(e.request.url);
  // Never cache market data, bridge calls, or anything cross-origin or query-bearing.
  if(url.origin!==self.location.origin||/\.(json|csv)$/.test(url.pathname)||url.search)return;
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const ac=new AbortController();
      const timer=setTimeout(()=>ac.abort(),10000);
      const net=fetch(e.request,{signal:ac.signal}).then(r=>{
        if(r.ok){const cl=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}
        return r;
      }).catch(()=>cached).finally(()=>clearTimeout(timer));
      return cached||net;
    })
  );
});
