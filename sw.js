var CACHE = 'sgs-v1';
var ASSETS = ['./', './index.html', './manifest.json', './icon.svg', './logo.png'];

self.addEventListener('install', function(e){
  e.waitUntil(
    caches.open(CACHE).then(function(c){ return c.addAll(ASSETS).catch(function(){}); })
    .then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET') return;
  e.respondWith(
    caches.match(e.request).then(function(res){
      if(res) return res;
      return fetch(e.request).then(function(net){
        if(net && net.status===200 && new URL(e.request.url).origin===location.origin){
          var clone = net.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return net;
      }).catch(function(){
        if(e.request.mode==='navigate') return caches.match('./index.html');
      });
    })
  );
});