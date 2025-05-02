// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ServiceWorkerConfig {
    static cachingStrategy = {
        cacheFirst: 'cacheFirst',
        networkFirst: 'networkFirst',
        staleWhileRevalidate: 'staleWhileRevalidate',
        networkOnly: 'networkOnly',
    };

}


// eslint-disable-next-line @typescript-eslint/no-unused-vars
class ServiceWorkerDebug {
    static isDebugMode = false;
    static intervalId = null;
    static logsRecord = [];
    static debounceTime = 1000;

    static isLoggingToConsole() {
        return self.location.hostname === 'localhost' && ServiceWorkerDebug.isDebugMode;
    }

    static log(...args) {
        if (!ServiceWorkerDebug.isLoggingToConsole()) {
            return;
        }
        console.log(...args);
    }

    static debounceLog(...args) {
        if (args && args.length === 1) {
            ServiceWorkerDebug.logsRecord.push(args[0]);
        } else {
            ServiceWorkerDebug.logsRecord.push(args);
        }
        if (!ServiceWorkerDebug.intervalId) {
            ServiceWorkerDebug.intervalId = setTimeout(() => {
                if (ServiceWorkerDebug.logsRecord.length > 10) {
                    ServiceWorkerDebug.log({logRecords: ServiceWorkerDebug.logsRecord});
                } else {

                    ServiceWorkerDebug.log(ServiceWorkerDebug.logsRecord);
                }
                ServiceWorkerDebug.logsRecord = [];
                clearTimeout(ServiceWorkerDebug.intervalId);
            }, ServiceWorkerDebug.debounceTime);
        }

    }
}

