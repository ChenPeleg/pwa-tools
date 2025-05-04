# PWA Tools for Vite React Applications

This project provides simple solutions to enhance your Vite React applications with Progressive Web App (PWA) capabilities, including offline functionality and app installation prompts.

## Download Latest Release

You can download and extract the latest release using the following command:

```bash
curl -s https://api.github.com/repos/ChenPeleg/pwa-tools/releases/latest | grep "browser_download_url.*zip" | cut -d : -f 2,3 | tr -d \" | wget -qi - && unzip pwa-tools-package.zip && rm pwa-tools-package.zip
```

This command will:
1. Fetch the latest release information
2. Extract the download URL for the zip file
3. Download the zip file
4. Extract its contents
5. Remove the zip file after extraction

## Features

- ✅ Offline-first functionality with multiple caching strategies
- ✅ Easy integration with existing Vite React projects
- ✅ Customizable PWA installation prompt
- ✅ Multi-language support for installation UI
- ✅ App installation prompt with attractive UI
- ✅ Debugging utilities for service workers

## Quick Start

Follow these steps to add PWA capabilities to your existing Vite React application:

### Step 1: Copy Required Files

Copy the following files from this repository to your project:

1. **For Offline Functionality**
   - `public/sw.js` → to your project's `public/` folder
   - `public/sw-utils.js` → to your project's `public/` folder
   - `src/pwa/init.ts` → to a new `src/pwa/` folder in your project
   - Change the `CACHE_NAME` in `sw.js` to a unique name for your application (e.g., `my_cool_app_v1`)

2. **For PWA Installation Prompt**
   - `src/pwa/pwa-install-prompt.ts` → to your `src/pwa/` folder
   - `src/pwa/pwa-install-prompt-style.ts` → to your `src/pwa/` folder
   - `public/splash.png` → to your project's `public/` folder (or use your own app icon)

### Step 2: Register the Service Worker and Initialize PWA Features

Add the following to your main entry file (e.g., `main.tsx`):

```typescript
import { addInstallPrompt } from './pwa/pwa-install-prompt';
import './pwa/init'; // Service worker registration

// Initialize PWA installation prompt with your preferred language ('en' or 'he')
addInstallPrompt({ language: 'en' });
```

### Step 3: Add Web App Manifest

Ensure you have a proper manifest file in your public directory. If you don't have one already, copy the `manifest.webmanifest` file to your project's `public/` folder and customize it for your application.

### Step 4: Build and Test

Run your application and verify it works offline and shows the installation prompt:

1. Build your application: `npm run build`
2. Serve the build locally: `npm run preview`
3. Open DevTools, go to Application tab > Service Workers to verify registration
4. Turn off your network connection and reload to test offline functionality
5. The installation prompt should appear when the conditions for installation are met

## How It Works

### Service Worker Architecture (Offline Functionality)

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

### PWA Installation Prompt

The PWA installation prompt provides a customizable way to invite users to install your web app to their home screen. It offers:

#### 1. Installation Manager (`pwa-install-prompt.ts`)

This file includes:

- A singleton manager to handle the installation process
- Support for multiple languages (currently English and Hebrew)
- Custom styling for the installation prompt
- User preference storage to avoid showing the prompt repeatedly

#### 2. Customizable Styling (`pwa-install-prompt-style.ts`)

The prompt is styled using CSS-in-JS. The style file provides:

- Responsive design that works on various screen sizes
- Custom styling for buttons, icons, and text
- Shadow DOM encapsulation to prevent style conflicts with your application

#### 3. Multi-Language Support

The installation prompt supports multiple languages and automatically sets the text direction (LTR or RTL) based on the language. Currently supported languages:

- English (`en`)
- Hebrew (`he`)

You can select your preferred language when initializing the prompt.

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

### Customizing the Installation Prompt

You can customize the appearance and behavior of the installation prompt by modifying the `pwa-install-prompt-style.ts` file. The prompt uses Shadow DOM to isolate its styles from the rest of your application.

### Adding Additional Languages

To add support for additional languages, extend the `PromptLanguage` type and `textContent` object in `pwa-install-prompt.ts`:

```typescript
export type PromptLanguage = 'en' | 'he' | 'fr'; // Add your language code

private readonly textContent: Record<PromptLanguage, PromptText> = {
  // Existing languages
  fr: {
    installAsApp: 'Installer comme application',
    approve: 'Installer',
    onlyBrowser: 'Continuer dans le navigateur'
  }
  // Add more languages as needed
};
```

## Compatibility

This solution works with Vite 4+ and React 18+. It uses standard Service Worker and Web App Install APIs supported in all modern browsers.

## License

MIT
