import { initInstallPrompt } from './install-prompt';
import { applyCaching } from './apply-caching';

/**
 * Initialize PWA functionality
 * This function serves as the entry point for all PWA features
 */
const init = () => {
  // Initialize installation prompt functionality
  initInstallPrompt();
  
  // Initialize service worker and caching
  applyCaching();
}

// Execute initialization
init();
