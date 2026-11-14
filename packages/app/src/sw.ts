// The service worker (#93): keeps the app's files at install and answers
// every request from them, never from the network. A new build has a new
// cache name (build.mjs), so its files replace the old ones together.

/** The app's files and a name made from their content, set by build.mjs. */
declare const APP_FILES: readonly string[];
declare const APP_CACHE: string;

interface WaitEvent extends Event {
  waitUntil(work: Promise<unknown>): void;
}
interface FetchEvent extends WaitEvent {
  readonly request: Request;
  respondWith(response: Promise<Response>): void;
}
interface Worker {
  addEventListener(type: 'install' | 'activate', listener: (event: WaitEvent) => void): void;
  addEventListener(type: 'fetch', listener: (event: FetchEvent) => void): void;
  skipWaiting(): Promise<void>;
  readonly clients: { claim(): Promise<void> };
}

const worker = self as unknown as Worker;

worker.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(APP_CACHE)
      .then((cache) => cache.addAll(APP_FILES))
      .then(() => worker.skipWaiting()),
  );
});

worker.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== APP_CACHE).map((name) => caches.delete(name))),
      )
      .then(() => worker.clients.claim()),
  );
});

worker.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.open(APP_CACHE).then(async (cache) => {
      const hit =
        (await cache.match(event.request, { ignoreSearch: true })) ??
        (event.request.mode === 'navigate' ? await cache.match('index.html') : undefined);
      return hit ?? Response.error();
    }),
  );
});
