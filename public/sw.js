// eslint-disable-next-line no-undef
importScripts("./sw-utils.js");

const IS_DEBUG_MODE = true;
const CACHING_STRATEGY = ServiceWorkerConfig.cachingStrategy.networkFirst;
const CACHE_NAME = "sw_cache_v1";


// eslint-disable-next-line no-undef
class Debug extends ServiceWorkerDebug {}

Debug.isDebugMode =  IS_DEBUG_MODE;

const clearCaches = async () => {
  Debug.log("Checking and Clearing old caches...");
  const keys = await caches.keys();
  const allKeysToDelete = keys.filter(function (key) {
    return (
      key.indexOf(CACHE_NAME) !== 0 &&
      key !== CACHE_NAME
    );
  });
  let letCachesFound = 0;
  await Promise.all(
    allKeysToDelete.map((key) => {
      Debug.log("Removing old cache: " + key);
      letCachesFound++;
      return caches.delete(key);
    })
  );
  if (letCachesFound === 0) {
    Debug.log("No old caches found");
  } else {
    Debug.log(`${letCachesFound} Old caches cleared`);
  }
};

/**
 * @param { Event & {waitUntil : (Promise) =>Promise  }} activationEvent
 * @return {Promise<void>}
 */
const activateEventHandler = async (activationEvent) => {
  Debug.log(
    `[Service Worker] Activating Service Worker version ${CACHE_NAME} ....`
  );
  await activationEvent.waitUntil(clearCaches());
  return self.clients.claim();
};
/**
 *
 * @return {Promise<void>}
 */
const installEventHandler = async () => {
  Debug.log("[Service Worker] Installing Service Worker");
  if (CACHING_STRATEGY !== ServiceWorkerConfig.cachingStrategy.networkOnly) {
    Debug.log("[Service Worker] Caching self and assets...");
    const cache = await caches.open(CACHE_NAME);
    const cacheAssets = ["/", "/index.html", "/sw.js", "/sw-utils.js"];
    await cache.addAll(cacheAssets);
    Debug.log("[Service Worker] Assets cached");
  }
  return self.skipWaiting();
};

/**
 * @param {FetchEvent} fetchEvent
 * @return {Promise<FetchEvent>}
 */
const fetchEventHandler = async (fetchEvent) => {
  const responsePromise = async (fetchEvent) => {
    if (
      CACHING_STRATEGY === ServiceWorkerConfig.cachingStrategy.networkOnly
    ) {
      Debug.debounceLog(
        "[Service Worker] Network Only: " + fetchEvent.request.url
      );
      return fetch(fetchEvent.request);
    }

    const cachedResponse = await caches.match(fetchEvent.request);

    switch (CACHING_STRATEGY) {
      case ServiceWorkerConfig.cachingStrategy.cacheFirst:
        if (cachedResponse) {
          Debug.debounceLog(
            "[Service Worker] Cache First - From cache: " +
              fetchEvent.request.url
          );
          return cachedResponse;
        }
        break;

      case ServiceWorkerConfig.cachingStrategy.networkFirst:
        try {
          // Try network first
          Debug.debounceLog(
            "[Service Worker] Network First - Trying network: " +
              fetchEvent.request.url
          );
          const networkResponse = await fetch(fetchEvent.request);

          // Cache the fresh response
          const cache = await caches.open(CACHE_NAME);
          if (!fetchEvent.request.url.includes("@")) {
            Debug.log(
              "[Service Worker] Network First - Caching fresh resource: " +
                fetchEvent.request.url
            );
            cache.put(fetchEvent.request, networkResponse.clone()).then();
          }

          return networkResponse;
        } catch (error) {
          // Network failed, try cache
          Debug.log(
            "[Service Worker] Network First - Network failed, using cache: " +
              fetchEvent.request.url
          );
          if (cachedResponse) {
            return cachedResponse;
          }
          // If no cache, propagate the error
          throw error;
        }

      case ServiceWorkerConfig.cachingStrategy.staleWhileRevalidate:
        // Start network fetch in the background
        const fetchPromise = fetch(fetchEvent.request)
          .then((networkResponse) => {
            const cache = caches.open(CACHE_NAME).then((cache) => {
              if (!fetchEvent.request.url.includes("@")) {
                Debug.log(
                  "[Service Worker] Stale While Revalidate - Updating cache: " +
                    fetchEvent.request.url
                );
                cache.put(fetchEvent.request, networkResponse.clone());
              }
            });
            return networkResponse;
          })
          .catch((error) => {
            Debug.log(
              "[Service Worker] Stale While Revalidate - Network error: ",
              error
            );
          });

        // Return cached response immediately if available (stale)
        if (cachedResponse) {
          Debug.debounceLog(
            "[Service Worker] Stale While Revalidate - Returning stale cache: " +
              fetchEvent.request.url
          );
          // Background update already started
          return cachedResponse;
        }

        // If no cache, wait for the network response
        Debug.debounceLog(
          "[Service Worker] Stale While Revalidate - No cache, waiting for network: " +
            fetchEvent.request.url
        );
        return fetchPromise;
    }

    // Default behavior for cacheFirst or when no cached response exists:
    // Fetch from network, cache the response, and return
    const responseFromFetch = await fetch(fetchEvent.request);
    const cache = await caches.open( CACHE_NAME);
    if (!fetchEvent.request.url.includes("@")) {
      // don't cache in development mode (the @ is used for the vite server files)
      Debug.log("[Service Worker] Caching resource: " + fetchEvent.request.url);
      // this needs to be async, otherwise the response will be stalled
      cache.put(fetchEvent.request, responseFromFetch.clone()).then();
    }
    return responseFromFetch;
  };

  fetchEvent.respondWith(responsePromise(fetchEvent));
};

self.addEventListener("activate", activateEventHandler);

self.addEventListener("install", installEventHandler);

self.addEventListener("fetch", fetchEventHandler);

self.addEventListener("message", (event) => {
  console.log(event);
});
