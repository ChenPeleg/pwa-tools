// eslint-disable-next-line no-undef
importScripts('./sw-utils.js');

const DEBUG_MODE = true;

const swConstants = // eslint-disable-next-line no-undef
    new ServiceWorkerConstants({ version: 'version_09' });

// eslint-disable-next-line no-undef
class Debug extends ServiceWorkerDebug {}

Debug.isDebugMode = !DEBUG_MODE;


const clearCaches = async () => {
    Debug.log('Checking and Clearing old caches...');
    const keys = await caches.keys();
    const allKeysToDelete = keys.filter(function(key) {
        return key.indexOf(swConstants.CACHE_NAME) !== 0 && key !==
            swConstants.CACHE_CORE_NAME;
    });
    let letCachesFound = 0;
    await Promise.all(allKeysToDelete.map((key) => {
        Debug.log('Removing old cache: ' + key);
        letCachesFound++;
        return caches.delete(key);
    }));
    if (letCachesFound === 0) {
        Debug.log('No old caches found');
    } else {
        Debug.log(`${letCachesFound} Old caches cleared`);
    }
};

/**
 * @param { Event & {waitUntil : (Promise) =>Promise  }} activationEvent
 * @return {Promise<void>}
 */
const activateEventHandler = async (activationEvent) => {
    Debug.log(`[Service Worker] Activating Service Worker version ${swConstants.version} ....`);
    await activationEvent.waitUntil(clearCaches());
    return self.clients.claim();
};
/**
 *
 * @return {Promise<void>}
 */
const installEventHandler = async () => {
    Debug.log(`[Service Worker] Installing Service Worker ${swConstants.swName}`);
    return self.skipWaiting();
};


/**
 * @param {FetchEvent} fetchEvent
 * @return {Promise<FetchEvent>}
 */
const fetchEventHandler = async (fetchEvent) => {
    const responsePromise = async (fetchEvent) => {
        const cachedResponse = await caches.match(fetchEvent.request);
        if (cachedResponse) {
            Debug.debounceLog('[Service Worker] From cache: ' + fetchEvent.request.url);
            return cachedResponse;
        } else {
            const responseFromFetch = await fetch(fetchEvent.request);
            const cache = await caches.open(swConstants.CACHE_NAME);
            if (!fetchEvent.request.url.includes('@')) {
                // don't cache in development mode (the @ is used for the vite
                // server files)
                Debug.log('[Service Worker] Caching resource: ' + fetchEvent.request.url);
                // this needs to be async, otherwise the response will be stalled
                cache.put(fetchEvent.request, responseFromFetch.clone()).then();
            }
            return responseFromFetch;
        }
    };

    fetchEvent.respondWith(responsePromise(fetchEvent),
    );
};


self.addEventListener('activate', activateEventHandler);

self.addEventListener('install', installEventHandler);

self.addEventListener('fetch', fetchEventHandler);

self.addEventListener('message', (event) => {
    console.log(event);
});

