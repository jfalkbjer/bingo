var CACHE = "rim-bingo-v11";
var PRECACHE = [
  "./",
  "./index.html",
  "./css/app.css",
  "./js/bingo.js",
  "./js/sound.js",
  "./js/app.js",
  "./themes/registry.js",
  "./themes/rim/theme.js",
  "./themes/halloween/theme.js",
  "./themes/halloween/pumpa.png",
  "./themes/halloween/spoke.png",
  "./themes/halloween/katt.png",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./fonts/nunito-400.woff2",
  "./fonts/nunito-700.woff2",
  "./themes/rim/katt.png",
  "./themes/rim/mus.png",
  "./themes/rim/bil.png",
  "./themes/rim/sol.png",
  "./themes/rim/ko.png",
  "./themes/rim/bok.png",
  "./themes/rim/boll.png",
  "./themes/rim/hand.png",
  "./themes/rim/mas.png",
  "./themes/rim/far.png",
  "./themes/rim/tag.png",
  "./themes/rim/docka.png",
  "./themes/rim/flagga.png",
  "./themes/rim/svan.png",
  "./themes/rim/sten.png",
  "./themes/rim/ros.png",
  "./themes/rim/gris.png",
  "./themes/rim/sang.png",
  "./themes/rim/anka.png",
  "./themes/rim/napp.png",
  "./themes/rim/ballonger.png",
  "./themes/rim/agg.png",
  "./themes/rim/paket.png",
  "./themes/rim/fyra.png",
  "./themes/rim/byxa.png",
  "./themes/rim/hatt.png",
  "./themes/rim/hus.png",
  "./themes/rim/pil.png",
  "./themes/rim/stol.png",
  "./themes/rim/sko.png",
  "./themes/rim/krok.png",
  "./themes/rim/troll.png",
  "./themes/rim/tand.png",
  "./themes/rim/las.png",
  "./themes/rim/tar.png",
  "./themes/rim/sag.png",
  "./themes/rim/klocka.png",
  "./themes/rim/vagga.png",
  "./themes/rim/gran.png",
  "./themes/rim/ren.png",
  "./themes/rim/nos.png",
  "./themes/rim/is.png",
  "./themes/rim/ang.png",
  "./themes/rim/planka.png",
  "./themes/rim/knapp.png",
  "./themes/rim/kalsonger.png",
  "./themes/rim/skagg.png",
  "./themes/rim/raket.png",
  "./themes/rim/myra.png",
  "./themes/rim/yxa.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE).then(function (cache) {
      return cache.addAll(PRECACHE);
    }).then(function () {
      return self.skipWaiting();
    })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (key) {
        return key !== CACHE;
      }).map(function (key) {
        return caches.delete(key);
      }));
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  var request = event.request;
  if (request.method !== "GET") {
    return;
  }
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) {
    return;
  }
  event.respondWith(
    fetch(request).then(function (response) {
      if (response && response.ok && response.type === "basic") {
        var copy = response.clone();
        caches.open(CACHE).then(function (cache) {
          cache.put(request, copy);
        });
      }
      return response;
    }).catch(function () {
      return caches.match(request).then(function (cached) {
        if (cached) {
          return cached;
        }
        if (request.mode === "navigate") {
          return caches.match("./index.html");
        }
        return new Response("", { status: 504, statusText: "Offline" });
      });
    })
  );
});
