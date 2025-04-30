import packageJson from '../../package.json'
const projectName = packageJson.name

console.log(`Project name: ${projectName}`)

export function init() {
  if ('serviceWorker' in navigator) {
    const BASE_URL = location.hostname === 'localhost' ? '/' : '/Rotem-fortune/';

    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register(`${BASE_URL}sw.js`, { scope: BASE_URL })
        .then(registration => {
          console.log('SW registered:', registration);

          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing as ServiceWorker;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'activated') {
                // Show update notification instead of forcing reload
               // showUpdateNotification();
              }
            });
          });
        })
        .catch(error => console.error('SW registration failed:', error));
    });
  }
}
init()
