const CACHE='alphadesk-v2';
const SHELL=['./','./AlphaDesk_Final_Research_v2.html','./manifest.json','./icon-192.png','./icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE).then(async cache=>{
    for(const url of SHELL){try{await cache.add(url);}catch(_){}}
  }));
  self.skipWaiting();
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin || /\.(json|csv)$/i.test(url.pathname) || url.search) return;
  event.respondWith((async()=>{
    const cached=await caches.match(event.request);
    const ac=new AbortController();
    const timer=setTimeout(()=>ac.abort(),10000);
    try{
      const net=await fetch(event.request,{signal:ac.signal});
      if(net.ok){const clone=net.clone();caches.open(CACHE).then(c=>c.put(event.request,clone)).catch(()=>{});}
      return net;
    }catch(_){return cached || new Response('Offline',{status:503,headers:{'Content-Type':'text/plain'}});}
    finally{clearTimeout(timer);}
  })());
});
