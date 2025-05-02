/**
 * PWA Caching functionality
 * Handles service worker registration and caching for offline use
 */

const applyCaching = () => {
  if ('serviceWorker' in navigator) {
    const BASE_URL = import.meta.env.BASE_URL;
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(`${BASE_URL}sw.js`, {scope: BASE_URL})
        .then(registration => {

          /**
           * @description  Fires when the service worker registration acquires a new installing worker
           * This occurs when a new service worker is detected and begins installation
           */
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing as ServiceWorker;

            /**
             * @description Tracks changes in the service worker lifecycle state
             * States include 'installing', 'installed', 'activating', 'activated', 'redundant'
             */
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                // can show a notification to the user
              }
            });
          });
        })
        .catch(error => console.error('SW registration failed:', error));
    });
  }
};

export { applyCaching };