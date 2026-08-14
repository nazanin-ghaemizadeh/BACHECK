/* BACHECK v58 — robust universal offline service worker. */
const CACHE_NAME="bacheck-universal-v58";
const ASSETS=[
  './',
  './index.html',
  './app.js',
  './bamco-header-logo-v58.png',
  './bamco-logo-mobile.png',
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
  './icons/apple-touch-icon-v58.png',
  './icons/bacheck-icon-1024-v58.png',
  './icons/bacheck-icon-192-v58.png',
  './icons/bacheck-icon-512-v58.png',
  './icons/bacheck-icon-source-v58.png',
  './manager-icon-fix.css',
  './manager.css',
  './manager.js',
  './manifest.webmanifest',
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
  './v58-universal.css',
  './v58-universal.js',
  './vendor/exceljs.min.js',
  './vendor/html2canvas.min.js',
  './vendor/html2pdf.bundle.min.js',
  './vendor/jspdf.umd.min.js'
];
const SCOPE=self.registration.scope;
const ROOT_URL=new URL('./',SCOPE).href;
const INDEX_URL=new URL('./index.html',SCOPE).href;

async function fetchAndCache(cache, rel){
  const url=new URL(rel,SCOPE).href;
  try{
    const req=new Request(url,{cache:'reload',credentials:'same-origin'});
    const res=await fetch(req);
    if(res && res.ok){await cache.put(url,res.clone());return true;}
  }catch(_){}
  return false;
}
async function warmCache(){
  const cache=await caches.open(CACHE_NAME);
  const results=await Promise.allSettled(ASSETS.map(rel=>fetchAndCache(cache,rel)));
  const indexReady=!!(await cache.match(INDEX_URL))||!!(await cache.match(ROOT_URL));
  return {indexReady,results};
}
async function notifyReady(){
  const clientsList=await self.clients.matchAll({type:'window',includeUncontrolled:true});
  clientsList.forEach(c=>c.postMessage({type:'BACHECK_OFFLINE_READY_V58'}));
}
self.addEventListener('install',event=>{event.waitUntil((async()=>{await warmCache();await self.skipWaiting();})())});
self.addEventListener('activate',event=>{event.waitUntil((async()=>{
  const keys=await caches.keys();
  await Promise.all(keys.filter(k=>k.startsWith('bacheck-')&&k!==CACHE_NAME).map(k=>caches.delete(k)));
  await self.clients.claim();
  await warmCache();
  await notifyReady();
})())});
self.addEventListener('message',event=>{
  if(event.data?.type==='BACHECK_WARM_CACHE_V58') event.waitUntil(warmCache().then(notifyReady));
  if(event.data?.type==='SKIP_WAITING') event.waitUntil(self.skipWaiting());
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==self.location.origin) return;
  if(req.mode==='navigate'){
    event.respondWith((async()=>{
      const cache=await caches.open(CACHE_NAME);
      const cached=(await cache.match(INDEX_URL))||(await cache.match(ROOT_URL));
      if(cached){
        event.waitUntil(fetch(req).then(async res=>{if(res&&res.ok){await cache.put(ROOT_URL,res.clone());await cache.put(INDEX_URL,res.clone());}}).catch(()=>{}));
        return cached;
      }
      try{
        const res=await fetch(req);
        if(res&&res.ok){await cache.put(ROOT_URL,res.clone());await cache.put(INDEX_URL,res.clone());}
        return res;
      }catch(_){
        return new Response('<!doctype html><meta charset="utf-8"><title>BACHECK Offline</title><body style="font-family:sans-serif;padding:2rem">BACHECK offline files are not ready yet. Connect once, open the app, and wait a few seconds.</body>',{status:503,headers:{'Content-Type':'text/html; charset=utf-8'}});
      }
    })());
    return;
  }
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    const cached=await cache.match(req,{ignoreSearch:true});
    if(cached) return cached;
    try{
      const res=await fetch(req);
      if(res&&res.ok) event.waitUntil(cache.put(req,res.clone()));
      return res;
    }catch(_){return Response.error();}
  })());
});
