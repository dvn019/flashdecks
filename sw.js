/* Flashdecks offline support: the app opens with no signal.
   Page: network first (so updates arrive), cached copy when offline. Icons/images: cache first. */
const V='flashdecks-v2';
const CORE=['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png','favicon.svg','favicon-32.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url); if(u.origin!==location.origin) return; // analytics, fonts, feedback: straight to network
  if(r.mode==='navigate'||u.pathname.endsWith('.html')||u.pathname.endsWith('/')){
    e.respondWith(fetch(r).then(res=>{const c=res.clone();caches.open(V).then(x=>x.put('index.html',c));return res}).catch(()=>caches.match('index.html').then(m=>m||caches.match('./'))));
    return}
  e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{if(res.ok){const c=res.clone();caches.open(V).then(x=>x.put(r,c))}return res})));
});

/* daily reminders */
self.addEventListener('push',e=>{
  let d={};try{d=e.data?e.data.json():{}}catch(_){d={body:e.data&&e.data.text()}}
  e.waitUntil(self.registration.showNotification(d.title||'Flashdecks',{body:d.body||'Time for today\'s cards.',icon:'icon-192.png',badge:'icon-192.png',tag:'flashdecks-daily',data:{url:d.url||'./'}}));
});
self.addEventListener('notificationclick',e=>{
  e.notification.close();
  const url=(e.notification.data&&e.notification.data.url)||'./';
  e.waitUntil(clients.matchAll({type:'window',includeUncontrolled:true}).then(ws=>{for(const w of ws){if('focus' in w)return w.focus()}return clients.openWindow(url)}));
});
