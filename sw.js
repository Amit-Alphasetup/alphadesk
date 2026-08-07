
const CACHE='alphadesk-v1';
const SHELL=['./'];
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(SHELL)));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))));
  self.clients.claim();
});
self.addEventListener('fetch',e=>{
  // Network-first for API/data calls, cache-first for the app shell
  const url=new URL(e.request.url);
  if(url.origin!==self.location.origin||url.pathname.match(/\.(json|csv)$/)||url.search){
    return; // pass through — don't cache dynamic data
  }
  e.respondWith(
    caches.match(e.request).then(cached=>{
      const net=fetch(e.request).then(r=>{
        if(r.ok){const cl=r.clone();caches.open(CACHE).then(c=>c.put(e.request,cl));}
        return r;
      }).catch(()=>cached);
      return cached||net;
    })
  );
});
