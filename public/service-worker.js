const CACHE_NAME = 'static-cache-v1';
const DATA_CACHE_NAME = 'data-cache-v1';

const FILES_TO_CACHE = [
    '/',
    './public/index.html',
    './public/css/styles.css',
    './public/js/index.js,',
    './public/js/idb.js,',
    "https://cdn.jsdelivr.net/npm/chart.js@2.8.0",
];

// Install the service worker
self.addEventListener('install', function(e) {
    e.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            console.log('install cache : ' + CACHE_NAME)
            return cache.addAll(FILES_TO_CACHE)
        })
    );
    self.skipWaiting();
});

// Activate the service worker
self.addEventListener('activate', function(e) {
    e.waitUntil(
        caches.keys().then(function(keyList) {
            return Promise.all(
                keyList.map(function(key) {
                    if (key != CACHE_NAME && key != DATA_CACHE_NAME) {
                        console.log('Removing old cahce data : ' + key);
                        return caches.delete(key);
                    }
                })
            );
        })
    );
    self.clients.claim();
});

// Intercept fecth requests
self.addEventListener('fetch', function(e) {
    console.log('fecth request : ' + e.request.url)
    e.respondWith(
        caches.match(e.request).then(function(request) {
            if (request) { // if cache is available, respond with cache
                console.log('responding with cache : ' + e.request.url)
                return request;
            } else { // if there are no cache, try fetching request
                console.log('file is not cached, fetching : ' + e.request.url)
                return fetch(e.request);
            }
        })
    )
});