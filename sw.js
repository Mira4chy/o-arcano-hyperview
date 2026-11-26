/* O Arcano — service worker
   Por enquanto só entrega os avisos de nova mensagem e abre a mesa ao tocar neles.
   Não guarda nada em cache. */
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const hash = (event.notification.data && event.notification.data.hash) || '#/Mesas';
  event.waitUntil((async () => {
    const windows = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    const open = windows.find((client) => client.url.startsWith(self.registration.scope));
    if (open) {
      await open.focus();
      open.postMessage({ type: 'open', hash });
      return;
    }
    await self.clients.openWindow(new URL(`./${hash}`, self.registration.scope).href);
  })());
});
