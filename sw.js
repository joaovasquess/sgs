var CACHE = 'sgs-v2';
var ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png'];

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
  var url = new URL(e.request.url);

  // Página principal: SEMPRE busca a versão nova no servidor (network-first)
  if(e.request.mode==='navigate' || /\/index\.html$/.test(url.pathname)){
    e.respondWith(
      fetch(e.request).then(function(net){
        var clone = net.clone();
        caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        return net;
      }).catch(function(){
        return caches.match(e.request).then(function(res){ return res || caches.match('./index.html'); });
      })
    );
    return;
  }

  // Demais arquivos: usa a cópia salva (mais rápido), atualiza em segundo plano
  e.respondWith(
    caches.match(e.request).then(function(res){
      if(res) return res;
      return fetch(e.request).then(function(net){
        if(net && net.status===200 && url.origin===location.origin){
          var clone = net.clone();
          caches.open(CACHE).then(function(c){ c.put(e.request, clone); });
        }
        return net;
      }).catch(function(){});
    })
  );
});
