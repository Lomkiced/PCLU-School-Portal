import { defaultCache } from "@serwist/next/worker";
import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { Serwist } from "serwist";
import { NetworkFirst, StaleWhileRevalidate } from "serwist";

declare global {
    interface WorkerGlobalScope extends SerwistGlobalConfig {
        __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
    }
}

declare const self: ServiceWorkerGlobalScope;

const serwist = new Serwist({
    precacheEntries: self.__SW_MANIFEST,
    skipWaiting: true,
    clientsClaim: true,
    navigationPreload: true,
    runtimeCaching: [
        {
            // NetworkFirst for API GET requests to ensure fresh data, fallback to cache if offline
            matcher: ({ request, url }) => request.method === "GET" && url.pathname.startsWith("/api/"),
            handler: new NetworkFirst({
                cacheName: "sms-api-cache",
                plugins: [
                    {
                        cacheWillUpdate: async ({ response }) => {
                            if (response && response.status === 200) {
                                return response;
                            }
                            return null;
                        },
                    },
                ],
            }),
        },
        {
            // StaleWhileRevalidate for Next.js assets, images, and other static content
            matcher: ({ request, url }) => request.method === "GET" && !url.pathname.startsWith("/api/"),
            handler: new StaleWhileRevalidate({
                cacheName: "sms-static-assets",
            }),
        },
        ...defaultCache,
    ],
});

serwist.addEventListeners();
