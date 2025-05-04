// eslint-disable-next-line no-undef
importScripts("./sw-utils.js");

const IS_DEBUG_MODE = true;
const CACHING_STRATEGY = ServiceWorkerConfig.cachingStrategy.networkFirst;
const CACHE_NAME = "sw_cache_v1";

// Network status tracking with caching
let isOffline = false;
let lastNetworkCheck = 0;
const NETWORK_CHECK_INTERVAL = 60000; // Check network status at most once per minute

// eslint-disable-next-line no-undef
class Debug extends ServiceWorkerDebug {}

Debug.isDebugMode = IS_DEBUG_MODE;

// Function to check if we're offline, with time-based caching
const checkOfflineStatus = async () => {
  const now = Date.now();

  // Only check network status if it's been more than NETWORK_CHECK_INTERVAL since last check
  if (now - lastNetworkCheck < NETWORK_CHECK_INTERVAL) {
    return isOffline;
  }

  lastNetworkCheck = now;

  try {
    // Try a quick HEAD request to detect network status
    const controller = new AbortController();
    const signal = controller.signal;
    const timeout = setTimeout(() => controller.abort(), 2000);

    await fetch("./offline-check.txt", {
      method: "HEAD",
      cache: "no-store",
      signal,
    });

    clearTimeout(timeout);
    if (isOffline) {
      Debug.log("[Service Worker] Network is back online");
      isOffline = false;
    }
    return false; // We're online
  } catch (error) {
    if (!isOffline) {
      Debug.log("[Service Worker] Network appears to be offline");
      isOffline = true;
    }
    return true; // We're offline
  }
};

const clearCaches = async () => {
  Debug.log("Checking and Clearing old caches...");
  const keys = await caches.keys();
  const allKeysToDelete = keys.filter(function (key) {
    return key.indexOf(CACHE_NAME) !== 0 && key !== CACHE_NAME;
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
    if (CACHING_STRATEGY === ServiceWorkerConfig.cachingStrategy.networkOnly) {
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
        const isNavigationRequest = fetchEvent.request.mode === "navigate";

        if (isNavigationRequest || Math.random() < 0.05) {
          const offline = await checkOfflineStatus();

          // If offline and we have a cached response, use it right away
          if (offline && cachedResponse) {
            Debug.log(
              "[Service Worker] Network First - Offline mode, using cache: " +
                fetchEvent.request.url
            );
            return cachedResponse;
          }
        } else if (isOffline && cachedResponse) {
          // Use the cached value we already know about offline status
          return cachedResponse;
        }

        try {
          Debug.debounceLog(
            "[Service Worker] Network First - Trying network: " +
              fetchEvent.request.url
          );
          const networkResponse = await fetch(fetchEvent.request);

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
          // If network request fails, we might be offline
          // Mark as offline to skip checks on subsequent requests
          isOffline = true;
          lastNetworkCheck = Date.now();

          Debug.log(
            "[Service Worker] Network First - Network failed, using cache: " +
              fetchEvent.request.url
          );
          if (cachedResponse) {
            return cachedResponse;
          }

          throw error;
        }

      case ServiceWorkerConfig.cachingStrategy.staleWhileRevalidate:
        const fetchPromise = fetch(fetchEvent.request)
          .then((networkResponse) => {
            const cache = caches.open(CACHE_NAME).then((cache) => {
              // don't cache in development mode (the @ is used for the vite server files)
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
    const responseFromFetch = await fetch(fetchEvent.request);
    const cache = await caches.open(CACHE_NAME);
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

// Update network status via message
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "NETWORK_STATUS") {
    isOffline = event.data.offline;
    lastNetworkCheck = Date.now();
    Debug.log(
      `[Service Worker] Network status updated: ${
        isOffline ? "offline" : "online"
      }`
    );
  }
  console.log(event);
});
