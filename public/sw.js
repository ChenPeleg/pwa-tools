// eslint-disable-next-line no-undef
importScripts("./sw-utils.js");

// eslint-disable-next-line no-undef
class Debug extends ServiceWorkerDebug {}

/**
 * Service Worker Handler class that manages all service worker functionality
 */
class ServiceWorkerHandler {
  constructor() {
    this.IS_DEBUG_MODE = true;
    this.CACHING_STRATEGY = ServiceWorkerConfig.cachingStrategy.networkFirst;
    this.CACHE_NAME = "sw_cache_v1";

    // Network status tracking with caching
    this.isOffline = false;
    this.lastNetworkCheck = 0;
    this.NETWORK_CHECK_INTERVAL = 60000; // Check network status at most once per minute

    // Initialize debug mode
    Debug.isDebugMode = this.IS_DEBUG_MODE;

    // Bind event handlers to this instance
    this.activateEventHandler = this.activateEventHandler.bind(this);
    this.installEventHandler = this.installEventHandler.bind(this);
    this.fetchEventHandler = this.fetchEventHandler.bind(this);
    this.messageEventHandler = this.messageEventHandler.bind(this);

    // Register event listeners
    this.registerEventListeners();
  }

  /**
   * Register all service worker event listeners
   * @returns {void}
   * @memberof ServiceWorkerHandler
   */
  registerEventListeners() {
    self.addEventListener("activate", this.activateEventHandler);
    self.addEventListener("install", this.installEventHandler);
    self.addEventListener("fetch", this.fetchEventHandler);
    self.addEventListener("message", this.messageEventHandler);
  }

  /**
   * Check if the device is currently offline
   * @return {Promise<boolean>} True if offline, false if online
   */
  async checkOfflineStatus() {
    const now = Date.now();

    if (now - this.lastNetworkCheck < this.NETWORK_CHECK_INTERVAL) {
      return this.isOffline;
    }

    this.lastNetworkCheck = now;

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
      if (this.isOffline) {
        Debug.log("[Service Worker] Network is back online");
        this.isOffline = false;
      }
      return false; // We're online
    } catch (error) {
      if (!this.isOffline) {
        Debug.log("[Service Worker] Network appears to be offline");
        this.isOffline = true;
      }
      return true; // We're offline
    }
  }

  /**
   * Clear old caches
   * @return {Promise<void>}
   */
  async clearCaches() {
    Debug.log("Checking and Clearing old caches...");
    const keys = await caches.keys();
    const allKeysToDelete = keys.filter((key) => {
      return key.indexOf(this.CACHE_NAME) !== 0 && key !== this.CACHE_NAME;
    });

    let cachesFound = 0;
    await Promise.all(
      allKeysToDelete.map((key) => {
        Debug.log("Removing old cache: " + key);
        cachesFound++;
        return caches.delete(key);
      })
    );

    if (cachesFound === 0) {
      Debug.log("No old caches found");
    } else {
      Debug.log(`${cachesFound} Old caches cleared`);
    }
  }

  /**
   * Handle activate event
   * @param {Event & {waitUntil: (Promise) => Promise}} activationEvent
   * @return {Promise<void>}
   */
  async activateEventHandler(activationEvent) {
    Debug.log(
      `[Service Worker] Activating Service Worker version ${this.CACHE_NAME} ....`
    );
    await activationEvent.waitUntil(this.clearCaches());
    return self.clients.claim();
  }

  /**
   * Handle install event
   * @return {Promise<void>}
   */
  async installEventHandler() {
    Debug.log("[Service Worker] Installing Service Worker");
    if (
      this.CACHING_STRATEGY !== ServiceWorkerConfig.cachingStrategy.networkOnly
    ) {
      Debug.log("[Service Worker] Caching self and assets...");
      const cache = await caches.open(this.CACHE_NAME);
      const cacheAssets = ["/", "/index.html", "/sw.js", "/sw-utils.js"];
      await cache.addAll(cacheAssets);
      Debug.log("[Service Worker] Assets cached");
    }
    return self.skipWaiting();
  }

  /**
   * Handle fetch event
   * @param {FetchEvent} fetchEvent
   */
  async fetchEventHandler(fetchEvent) {
    fetchEvent.respondWith(this.handleFetch(fetchEvent));
  }

  /**
   * Process fetch request based on caching strategy
   * @param {FetchEvent} fetchEvent
   * @return {Promise<Response>}
   */
  async handleFetch(fetchEvent) {
    if (
      this.CACHING_STRATEGY === ServiceWorkerConfig.cachingStrategy.networkOnly
    ) {
      Debug.debounceLog(
        "[Service Worker] Network Only: " + fetchEvent.request.url
      );
      return fetch(fetchEvent.request);
    }

    const cachedResponse = await caches.match(fetchEvent.request);

    switch (this.CACHING_STRATEGY) {
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
        // Check offline status regardless of request type
        const offline = await this.checkOfflineStatus();

        // If offline and we have a cached response, use it right away
        if (offline && cachedResponse) {
          Debug.log(
            "[Service Worker] Network First - Offline mode, using cache: " +
              fetchEvent.request.url
          );
          return cachedResponse;
        }

        try {
          Debug.debounceLog(
            "[Service Worker] Network First - Trying network: " +
              fetchEvent.request.url
          );
          const networkResponse = await fetch(fetchEvent.request);

          const cache = await caches.open(this.CACHE_NAME);
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
          this.isOffline = true;
          this.lastNetworkCheck = Date.now();

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
            const cache = caches.open(this.CACHE_NAME).then((cache) => {
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
    const cache = await caches.open(this.CACHE_NAME);
    if (!fetchEvent.request.url.includes("@")) {
      // don't cache in development mode (the @ is used for the vite server files)
      Debug.log("[Service Worker] Caching resource: " + fetchEvent.request.url);
      // this needs to be async, otherwise the response will be stalled
      cache.put(fetchEvent.request, responseFromFetch.clone()).then();
    }
    return responseFromFetch;
  }

  /**
   * Handle message event
   * @param {MessageEvent} event
   */
  messageEventHandler(event) {
    if (event.data && event.data.type === "NETWORK_STATUS") {
      this.isOffline = event.data.offline;
      this.lastNetworkCheck = Date.now();
      Debug.log(
        `[Service Worker] Network status updated: ${
          this.isOffline ? "offline" : "online"
        }`
      );
    }
    console.log(event);
  }
}

new ServiceWorkerHandler();
