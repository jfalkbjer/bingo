var CACHE = "rim-bingo-v14";
var THEMES = [
  "./themes/rim/theme.js",
  "./themes/halloween/theme.js",
  "./themes/sammansatta/theme.js"
];

self.window = self;
importScripts.apply(null, ["./js/bingo.js", "./themes/registry.js"].concat(THEMES));

var PRECACHE = [
  "./",
  "./index.html",
  "./css/app.css",
  "./js/bingo.js",
  "./js/sound.js",
  "./js/app.js",
  "./themes/registry.js",
  "./manifest.webmanifest",
  "./icon.svg",
  "./icon-192.png",
  "./icon-512.png",
  "./fonts/nunito-400.woff2",
  "./fonts/nunito-700.woff2"
].concat(THEMES);

self.BINGO_THEMES.forEach(function (theme) {
  self.Bingo.themeImages(theme).forEach(function (image) {
    PRECACHE.push("./" + self.Bingo.imagePath(theme, image));
  });
});

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
