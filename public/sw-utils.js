/**
 * Configuration class for Service Worker caching strategies
 * Defines different caching approaches that can be used by the service worker
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ServiceWorkerConfig {
  /**
   * Available caching strategies for the service worker
   * @property {string} cacheFirst - Prioritizes cached content over network requests
   * @property {string} networkFirst - Tries network first, falls back to cache
   * @property {string} staleWhileRevalidate - Returns cache immediately while updating in background
   * @property {string} networkOnly - Always uses network, never cache
   */
  static cachingStrategy = {
    cacheFirst: "cacheFirst",
    networkFirst: "networkFirst",
    staleWhileRevalidate: "staleWhileRevalidate",
    networkOnly: "networkOnly",
  };
}

/**
 * Debug utilities for the Service Worker
 * Provides logging functionality with different modes
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ServiceWorkerDebug {
    static isDebugMode = false;
    static intervalId = null;
    static logsRecord = [];
    static debounceTime = 1000;

  /**
   * Determines if console logging is enabled
   * @return {boolean} True if on localhost and debug mode is on
   */
  static isLoggingToConsole() {
    return (
      self.location.hostname === "localhost" && ServiceWorkerDebug.isDebugMode
    );
  }

  /**
   * Log messages to console if debugging is enabled
   * @param  {...any} args Arguments to log to the console
   */
  static log(...args) {
    if (!ServiceWorkerDebug.isLoggingToConsole()) {
      return;
    }
    console.log(...args);
  }

  /**
   * Log messages with debouncing to avoid console flooding
   * Collects logs and outputs them in batches
   * @param  {...any} args Arguments to log
   */
  static debounceLog(...args) {
    if (args && args.length === 1) {
      ServiceWorkerDebug.logsRecord.push(args[0]);
    } else {
      ServiceWorkerDebug.logsRecord.push(args);
    }
    if (!ServiceWorkerDebug.intervalId) {
      ServiceWorkerDebug.intervalId = setTimeout(() => {
        if (ServiceWorkerDebug.logsRecord.length > 10) {
          ServiceWorkerDebug.log({ logRecords: ServiceWorkerDebug.logsRecord });
        } else {
          ServiceWorkerDebug.log(ServiceWorkerDebug.logsRecord);
        }
        ServiceWorkerDebug.logsRecord = [];
        clearTimeout(ServiceWorkerDebug.intervalId);
      }, ServiceWorkerDebug.debounceTime);
    }
  }
}
