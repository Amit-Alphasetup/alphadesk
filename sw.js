const CACHE='alphadesk-v321';
const SHELL=['./','./index.html','./manifest.json','./icon-192.png','./icon-512.png'];
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
  if(url.origin!==self.location.origin||url.pathname.match(/\\.(json|csv)$/)||url.search){
    return; // pass through — don't cache dynamic data
  }
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
