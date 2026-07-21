const C='alphadesk-v3';
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['./'])));});
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==C).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{
  const u=e.request.url;
  if(u.includes('yahoo')||u.includes('allorigins')||u.includes('corsproxy')||
     u.includes('script.google')||u.includes('supabase')||u.includes('github'))
    {e.respondWith(fetch(e.request));return;}
  e.respondWith(caches.match(e.request).then(r=>r||fetch(e.request)));
});
