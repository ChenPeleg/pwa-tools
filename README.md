# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```

# PWA Files Cache for Vite React Applications

This project provides a simple solution to add offline capabilities to your Vite React applications using Service Workers.

## Features

- ✅ Offline-first functionality
- ✅ Multiple caching strategies
- ✅ Easy integration with existing Vite React projects
- ✅ App installation prompt (Add to Home Screen)
- ✅ Debugging utilities for service workers

## Quick Start

Follow these steps to add offline capabilities to your existing Vite React application:

### Step 1: Copy Required Files

Copy the following files from this repository to your project:

1. `public/sw.js` → to your project's `public/` folder
2. `public/sw-utils.js` → to your project's `public/` folder
3. `src/pwa/init.ts` → to a new `src/pwa/` folder in your project

### Step 2: Register the Service Worker

Add the service worker registration script to your main HTML file by adding this line in your `index.html` before your main script:

```html
<script type="module" src="/src/pwa/init.ts"></script>
```

### Step 3: Configure Install Prompt (Optional)

If you want to enable the "Add to Home Screen" functionality, add the following script to your `index.html` before the closing `</body>` tag:

```html
<script>
  const customPrompt = document.createElement('div');
  customPrompt.innerHTML = `<div class="install-app-prompt">
    <div class="inner-prompt">
      <span>Install as App</span>
      <div class="buttons-container">
        <button id="approve-install-btn">Install</button>
        <button id="disapprove-install-btn">Continue in Browser</button>
      </div>
    </div>
  </div>`;

  let installPrompt = null;

  const appendToBody = () => {
    // Optional: You can add conditions to control when the prompt appears
    // For example: if (localStorage.getItem('install-prompt') === 'disapproved') return;
    
    document.body.appendChild(customPrompt);
    document.querySelector('#disapprove-install-btn').addEventListener('click', () => {
      localStorage.setItem('install-prompt', 'disapproved');
      customPrompt.setAttribute('hidden', '');
    });
    document.querySelector('#approve-install-btn').addEventListener('click', async () => {
      if (!installPrompt) return;
      const result = await installPrompt.prompt();
      console.log(`Install prompt was: ${result.outcome}`);
      installPrompt = null;
      customPrompt.setAttribute('hidden', '');
    });
  };

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPrompt = event;
    appendToBody();
  });
</script>
```

Don't forget to add appropriate CSS for the install prompt.

### Step 4: Build and Test

Run your application and verify it works offline:

1. Build your application: `npm run build`
2. Serve the build locally: `npm run preview`
3. Open DevTools, go to Application tab > Service Workers to verify registration
4. Turn off your network connection and reload to test offline functionality

## How It Works

### Service Worker Architecture

The offline capability is built on three key components:

#### 1. Service Worker Registration (`init.ts`)

This file is responsible for registering the service worker when the application loads. It:

- Checks if the browser supports Service Workers
- Registers the service worker file located in the public directory
- Sets up event listeners for service worker updates
- Provides lifecycle hooks for managing updates

#### 2. Service Worker Implementation (`sw.js`)

The main service worker file that:

- Intercepts fetch requests
- Manages the cache based on defined strategies
- Handles installation and activation lifecycle events
- Updates cached files when needed

#### 3. Utility Functions (`sw-utils.js`)

Provides helper functions and configurations:

- Defines available caching strategies
- Provides debugging utilities
- Handles logging for development purposes

### Caching Strategies

The implementation supports four caching strategies that you can configure in the `sw.js` file:

1. **Cache First (`cacheFirst`)**: Tries to retrieve the resource from the cache first, falling back to the network if not found. Best for static assets that rarely change.

2. **Network First (`networkFirst`)**: Tries to fetch the resource from the network first, falling back to the cache if the network is unavailable. Best for dynamic content that should be fresh.

3. **Stale While Revalidate (`staleWhileRevalidate`)**: Returns the cached resource immediately (if available) while updating the cache in the background. Good balance between speed and freshness.

4. **Network Only (`networkOnly`)**: Always fetches from the network and never uses the cache. Use for resources that should never be cached.

To change the caching strategy, modify the `CACHING_STRATEGY` constant in `sw.js`:

```javascript
const CACHING_STRATEGY = ServiceWorkerConfig.cachingStrategy.networkFirst;
```

### Debug Mode

You can enable debug mode to see detailed logs in the console by setting:

```javascript
const IS_DEBUG_MODE = true;
```

This is especially helpful when developing and testing your service worker implementation.

## Advanced Usage

### Customizing Cached Assets

By default, the service worker caches critical files like `index.html`. You can customize this list by editing the `cacheAssets` array in the `sw.js` file:

```javascript
const cacheAssets = ["/", "/index.html", "/sw.js", "/sw-utils.js"];
```

Add any other static assets you want cached during installation.

### Cache Versioning

The service worker uses a cache version identifier (`CACHE_NAME`) to manage cache updates. When you make significant changes to your application, update this value to ensure all clients receive the latest version:

```javascript
const CACHE_NAME = "sw_cache_v1"; // Change to v2, v3, etc. when needed
```

### Handling Service Worker Updates

The init.ts file includes code to detect when a new service worker version becomes active. You can customize this code to show notifications to users or prompt them to refresh for the latest version:

```typescript
newWorker.addEventListener('statechange', () => {
  if (newWorker.state === 'activated') {
    // Show notification or prompt to refresh
    // Example: showUpdateNotification();
  }
});
```

## Compatibility

This solution works with Vite 4+ and React 18+. It uses standard Service Worker APIs supported in all modern browsers.

## License

MIT
