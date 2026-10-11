// UTZLINE Defects & Handover service worker -- cache-first with a network refresh, so the app opens offline.
// Bump CACHE_NAME whenever any file in this folder changes; the zip must contain EVERY file listed below.
var ICON_VERSION = "v1";
var CACHE_NAME = "utzline-defects-cache-v7";

var PRECACHE_URLS = [
  "./",
  "./index.html",
  "./pdf.min.js", // (2026-10-04) the in-app PDF viewer (shared/pdf-view)
  "./pdf.worker.min.js",
  "./jspdf.umd.min.js", // register PDF
  "./pdf-lib.min.js", // joins / builds PDFs
  "./exceljs.min.js", // Excel export (styled, with the logos)
  "./manifest.json?v=" + ICON_VERSION,
  "./icons/icon-192.png?v=" + ICON_VERSION,
  "./icons/icon-512.png?v=" + ICON_VERSION,
  "./icons/icon-192-maskable.png?v=" + ICON_VERSION,
  "./icons/icon-512-maskable.png?v=" + ICON_VERSION
];

self.addEventListener("install", function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(PRECACHE_URLS);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function(event){
  if (event.request.method !== "GET") return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      var networkFetch = fetch(event.request).then(function(response){
        if (response && response.status === 200){
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){
        return cached;
      });
      return cached || networkFetch;
    })
  );
});
