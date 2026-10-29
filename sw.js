
const CACHE_NAME = "booklet-property-v2";

const APP_FILES = [
  "./",
  "./index.html",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./images/page-01.jpg",
  "./images/page-02.jpg",
  "./images/page-03.jpg",
  "./images/page-04.jpg",
  "./images/page-05.jpg",
  "./images/page-06.jpg",
  "./images/page-07.jpg",
  "./images/page-08.jpg",
  "./images/page-09.jpg",
  "./images/page-10.jpg",
  "./images/page-11.jpg",
  "./images/page-12.jpg"
];

// Instalasi: simpan file yang berhasil dimuat saja
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      await Promise.all(
        APP_FILES.map(async path => {
          const url = new URL(path, self.registration.scope);

          try {
            const response = await fetch(url, {
              cache: "reload"
            });

            if (response.ok) {
              await cache.put(url.href, response);
            } else {
              console.warn(
                "File gagal dimuat:",
                url.href,
                response.status
              );
            }
          } catch (error) {
            console.warn("Gagal menyimpan cache:", url.href, error);
          }
        })
      );
    })
  );

  self.skipWaiting();
});

// Aktivasi: hapus cache versi aplikasi yang lama
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key =>
            key.startsWith("booklet-property-") &&
            key !== CACHE_NAME
          )
          .map(key => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  );
});

// Muat cache terlebih dahulu, lalu gunakan jaringan jika belum tersedia
self.addEventListener("fetch", event => {
  const request = event.request;

  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const scope = new URL(self.registration.scope);

  // Jangan mengintervensi situs lain atau URL di luar folder aplikasi
  if (
    url.origin !== scope.origin ||
    !url.pathname.startsWith(scope.pathname)
  ) {
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(request);

      if (cached) return cached;

      try {
        const response = await fetch(request);

        if (response.ok && response.type === "basic") {
          await cache.put(request, response.clone());
        }

        return response;
      } catch (error) {
        // Beri tahu browser jika file tidak tersedia
        throw error;
      }
    })
  );
});
