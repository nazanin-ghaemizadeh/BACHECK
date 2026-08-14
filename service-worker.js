/* BACHECK v57 universal offline service worker. */
const CACHE_NAME="bacheck-universal-v57";
const PRECACHE=[
  './index.html',
  './manifest.webmanifest',
  './bamco-logo-mobile.png',
  './vendor/exceljs.min.js',
  './app.js',
  './bamco-logo.png',
  './data.js',
  './executive.css',
  './expert.css',
  './expert.js',
  './features.css',
  './features.js',
  './fresh-start.js',
  './guide.css',
  './guide.js',
  './icons/apple-touch-icon.png',
  './icons/bacheck-1024.png',
  './icons/bacheck-source.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './manager-icon-fix.css',
  './manager.css',
  './manager.js',
  './mobile-save.js',
  './mobile.css',
  './mobile.js',
  './polished.css',
  './refinement.css',
  './styles.css',
  './v14.css',
  './v15.css',
  './v20.css',
  './v20.js',
  './v21.css',
  './v21.js',
  './v22.css',
  './v22.js',
  './v23.css',
  './v23.js',
  './v24.css',
  './v24.js',
  './v25.css',
  './v26.css',
  './v26.js',
  './v29.css',
  './v29.js',
  './v30.js',
  './v32.css',
  './v32.js',
  './v37.css',
  './v39.css',
  './v40.css',
  './v40.js',
  './v41.css',
  './v42.css',
  './v42.js',
  './v43.css',
  './v44.css',
  './v45.css',
  './v45.js',
  './v46.css',
  './v46.js',
  './v47.css',
  './v48.css',
  './v48.js',
  './v49.css',
  './v49.js',
  './v53-mobile.css',
  './v53-mobile.js',
  './v54-mobile.css',
  './v54-mobile.js',
  './v56-mobile.css',
  './v56-mobile.js',
  './v57-universal.css',
  './v57-universal.js',
  './vendor/html2canvas.min.js',
  './vendor/html2pdf.bundle.min.js',
  './vendor/jspdf.umd.min.js'
];
const INDEX_URL=new URL("./index.html",self.registration.scope).href;

async function warmCache(){
  const cache=await caches.open(CACHE_NAME);
  const missing=[];
  for(const rel of PRECACHE){
    const url=new URL(rel,self.registration.scope).href;
    if(!(await cache.match(url))) missing.push(url);
  }
  if(missing.length) await cache.addAll(missing);
}

self.addEventListener("install",event=>{event.waitUntil(warmCache().then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)));
  await self.clients.claim();
})())});
self.addEventListener("message",event=>{if(event.data?.type==="BACHECK_WARM_CACHE") event.waitUntil(warmCache())});

self.addEventListener("fetch",event=>{
  const req=event.request;if(req.method!=="GET")return;
  const url=new URL(req.url);if(url.origin!==self.location.origin)return;
  if(req.mode==="navigate"){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const cached=await cache.match(INDEX_URL);
      if(cached){
        event.waitUntil(fetch(req).then(res=>{if(res&&res.ok) return cache.put(INDEX_URL,res.clone())}).catch(()=>{}));
        return cached;
      }
      try{const res=await fetch(req);if(res&&res.ok)await cache.put(INDEX_URL,res.clone());return res;}catch(_){return new Response("BACHECK is not cached yet. Open it once while online.",{status:503,headers:{"Content-Type":"text/plain; charset=utf-8"}})}
    })());return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(req);if(cached)return cached;
    try{const res=await fetch(req);if(res&&res.ok)await cache.put(req,res.clone());return res;}catch(_){return Response.error();}
  })());
});
