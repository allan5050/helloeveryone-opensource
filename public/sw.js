if (!self.define) {
  let e,
    a = {}
  const s = (s, t) => (
    (s = new URL(s + '.js', t).href),
    a[s] ||
      new Promise(a => {
        if ('document' in self) {
          const e = document.createElement('script')
          ;((e.src = s), (e.onload = a), document.head.appendChild(e))
        } else ((e = s), importScripts(s), a())
      }).then(() => {
        let e = a[s]
        if (!e) throw new Error(`Module ${s} didn’t register its module`)
        return e
      })
  )
  self.define = (t, c) => {
    const i =
      e ||
      ('document' in self ? document.currentScript.src : '') ||
      location.href
    if (a[i]) return
    let n = {}
    const r = e => s(e, i),
      d = { module: { uri: i }, exports: n, require: r }
    a[i] = Promise.all(t.map(e => d[e] || r(e))).then(e => (c(...e), n))
  }
}
define(['./workbox-4754cb34'], function (e) {
  'use strict'
  ;(importScripts(),
    self.skipWaiting(),
    e.clientsClaim(),
    e.precacheAndRoute(
      [
        {
          url: '/_next/app-build-manifest.json',
          revision: '04604fff26d8e9763dca56309598ac78',
        },
        {
          url: '/_next/static/chunks/1255-a8a27324c0cc6129.js',
          revision: 'a8a27324c0cc6129',
        },
        {
          url: '/_next/static/chunks/1356-55692d5ef6a323df.js',
          revision: '55692d5ef6a323df',
        },
        {
          url: '/_next/static/chunks/1435-1ff130d030eb4e35.js',
          revision: '1ff130d030eb4e35',
        },
        {
          url: '/_next/static/chunks/1646.a93085a0445ba909.js',
          revision: 'a93085a0445ba909',
        },
        {
          url: '/_next/static/chunks/1964-f716f86d1238f6a5.js',
          revision: 'f716f86d1238f6a5',
        },
        {
          url: '/_next/static/chunks/2619-04bc32f026a0d946.js',
          revision: '04bc32f026a0d946',
        },
        {
          url: '/_next/static/chunks/3989-753f10a5857df8bc.js',
          revision: '753f10a5857df8bc',
        },
        {
          url: '/_next/static/chunks/4094-a1553fbb80264b66.js',
          revision: 'a1553fbb80264b66',
        },
        {
          url: '/_next/static/chunks/4639-87c97ee8c4a08adf.js',
          revision: '87c97ee8c4a08adf',
        },
        {
          url: '/_next/static/chunks/4909-725bb5626f16c299.js',
          revision: '725bb5626f16c299',
        },
        {
          url: '/_next/static/chunks/4bd1b696-19a235f16481c2a5.js',
          revision: '19a235f16481c2a5',
        },
        {
          url: '/_next/static/chunks/5139.e4ff9cc3669129ed.js',
          revision: 'e4ff9cc3669129ed',
        },
        {
          url: '/_next/static/chunks/7216-9681206d7265b5f6.js',
          revision: '9681206d7265b5f6',
        },
        {
          url: '/_next/static/chunks/7559-6cb3b63831248d6f.js',
          revision: '6cb3b63831248d6f',
        },
        {
          url: '/_next/static/chunks/7855-33e4b732336a05ee.js',
          revision: '33e4b732336a05ee',
        },
        {
          url: '/_next/static/chunks/8321-8322efd4fd2b4b21.js',
          revision: '8322efd4fd2b4b21',
        },
        {
          url: '/_next/static/chunks/9425-3ea8b66f15cff5b1.js',
          revision: '3ea8b66f15cff5b1',
        },
        {
          url: '/_next/static/chunks/app/(protected)/admin/analytics/page-cfbfc9e18813f621.js',
          revision: 'cfbfc9e18813f621',
        },
        {
          url: '/_next/static/chunks/app/(protected)/admin/events/%5Bid%5D/edit/page-49823226cf6e34e8.js',
          revision: '49823226cf6e34e8',
        },
        {
          url: '/_next/static/chunks/app/(protected)/admin/events/create/page-49823226cf6e34e8.js',
          revision: '49823226cf6e34e8',
        },
        {
          url: '/_next/static/chunks/app/(protected)/admin/events/page-a59f97e5cc097d89.js',
          revision: 'a59f97e5cc097d89',
        },
        {
          url: '/_next/static/chunks/app/(protected)/admin/layout-fd9a0399f1d63b4f.js',
          revision: 'fd9a0399f1d63b4f',
        },
        {
          url: '/_next/static/chunks/app/(protected)/admin/page-fdc5117c6bb0ba7d.js',
          revision: 'fdc5117c6bb0ba7d',
        },
        {
          url: '/_next/static/chunks/app/(protected)/admin/users/page-5158e8da428b5d25.js',
          revision: '5158e8da428b5d25',
        },
        {
          url: '/_next/static/chunks/app/(protected)/chat/%5BuserId%5D/page-cd3562b5c091e821.js',
          revision: 'cd3562b5c091e821',
        },
        {
          url: '/_next/static/chunks/app/(protected)/chat/page-fef580cff47f3f6a.js',
          revision: 'fef580cff47f3f6a',
        },
        {
          url: '/_next/static/chunks/app/(protected)/dashboard/page-3786193ce7c24a23.js',
          revision: '3786193ce7c24a23',
        },
        {
          url: '/_next/static/chunks/app/(protected)/demo-mode/page-b2a2b2f48af79b00.js',
          revision: 'b2a2b2f48af79b00',
        },
        {
          url: '/_next/static/chunks/app/(protected)/dev/analytics/page-497616923f81a37f.js',
          revision: '497616923f81a37f',
        },
        {
          url: '/_next/static/chunks/app/(protected)/dev/page-603f9b25d5a5398b.js',
          revision: '603f9b25d5a5398b',
        },
        {
          url: '/_next/static/chunks/app/(protected)/events/%5Bid%5D/loading-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/(protected)/events/%5Bid%5D/page-928b73afce1400dc.js',
          revision: '928b73afce1400dc',
        },
        {
          url: '/_next/static/chunks/app/(protected)/events/error-1c807dba54d56396.js',
          revision: '1c807dba54d56396',
        },
        {
          url: '/_next/static/chunks/app/(protected)/events/loading-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/(protected)/events/page-68605b37e786190b.js',
          revision: '68605b37e786190b',
        },
        {
          url: '/_next/static/chunks/app/(protected)/events/past/page-f248b4764d552048.js',
          revision: 'f248b4764d552048',
        },
        {
          url: '/_next/static/chunks/app/(protected)/favorites/page-8d6730cc2d605829.js',
          revision: '8d6730cc2d605829',
        },
        {
          url: '/_next/static/chunks/app/(protected)/layout-62d2a0c3e1c0530b.js',
          revision: '62d2a0c3e1c0530b',
        },
        {
          url: '/_next/static/chunks/app/(protected)/matches/%5BuserId%5D/page-78b63555717646cd.js',
          revision: '78b63555717646cd',
        },
        {
          url: '/_next/static/chunks/app/(protected)/matches/page-0ff8d789ffdb62c1.js',
          revision: '0ff8d789ffdb62c1',
        },
        {
          url: '/_next/static/chunks/app/(protected)/profile/edit/page-6207cd4ddac77aa6.js',
          revision: '6207cd4ddac77aa6',
        },
        {
          url: '/_next/static/chunks/app/(protected)/profile/error-d10d38642369849b.js',
          revision: 'd10d38642369849b',
        },
        {
          url: '/_next/static/chunks/app/(protected)/profile/loading-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/(protected)/profile/page-78a81a56e6f6a71a.js',
          revision: '78a81a56e6f6a71a',
        },
        {
          url: '/_next/static/chunks/app/(protected)/profile/setup/page-769cb9d924bd5032.js',
          revision: '769cb9d924bd5032',
        },
        {
          url: '/_next/static/chunks/app/(protected)/settings/notifications/page-021f482712047b4f.js',
          revision: '021f482712047b4f',
        },
        {
          url: '/_next/static/chunks/app/(protected)/settings/page-51e50e527733038e.js',
          revision: '51e50e527733038e',
        },
        {
          url: '/_next/static/chunks/app/(protected)/settings/privacy/page-c7c1fcc2d1e6f0f6.js',
          revision: 'c7c1fcc2d1e6f0f6',
        },
        {
          url: '/_next/static/chunks/app/(public)/auth/reset-password/page-82edea75022cf1c4.js',
          revision: '82edea75022cf1c4',
        },
        {
          url: '/_next/static/chunks/app/(public)/layout-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/(public)/login/page-0d5023fec57edd6f.js',
          revision: '0d5023fec57edd6f',
        },
        {
          url: '/_next/static/chunks/app/(public)/signup/page-f4e432d747257240.js',
          revision: 'f4e432d747257240',
        },
        {
          url: '/_next/static/chunks/app/(public)/signup/password/page-9f075a5d692987a9.js',
          revision: '9f075a5d692987a9',
        },
        {
          url: '/_next/static/chunks/app/_not-found/page-19acc5f2c2eac509.js',
          revision: '19acc5f2c2eac509',
        },
        {
          url: '/_next/static/chunks/app/api/calendar/event/%5BeventId%5D/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/chat/conversations/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/chat/messages/%5BuserId%5D/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/chat/send/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/dev/analytics/match-scores/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/dev/analytics/recalculate-enhanced/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/dev/analytics/recalculate/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/dev/analytics/users/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/dev/create-profile/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/events/%5BeventId%5D/attendees/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/events/%5BeventId%5D/rsvp/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/events/rsvp/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/events/social-proof/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/events/suggested/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/health/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/match/batch/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/match/calculate/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/match/event/%5BeventId%5D/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/match/generate-embeddings/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/match/refresh/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/matches/explain-simple/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/matches/explain/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/block/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/delete/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/privacy/export/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/api/profile/favorite/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/auth/callback/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/app/layout-57924c1cff736bbb.js',
          revision: '57924c1cff736bbb',
        },
        {
          url: '/_next/static/chunks/app/page-f614b1f0994af8f5.js',
          revision: 'f614b1f0994af8f5',
        },
        {
          url: '/_next/static/chunks/app/sitemap.xml/route-976d8933a4e4b00a.js',
          revision: '976d8933a4e4b00a',
        },
        {
          url: '/_next/static/chunks/framework-b9fd9bcc3ecde907.js',
          revision: 'b9fd9bcc3ecde907',
        },
        {
          url: '/_next/static/chunks/main-40edcc2347e339d2.js',
          revision: '40edcc2347e339d2',
        },
        {
          url: '/_next/static/chunks/main-app-f80ccfb44370fd0d.js',
          revision: 'f80ccfb44370fd0d',
        },
        {
          url: '/_next/static/chunks/pages/_app-e8b861c87f6f033c.js',
          revision: 'e8b861c87f6f033c',
        },
        {
          url: '/_next/static/chunks/pages/_error-c8f84f7bd11d43d4.js',
          revision: 'c8f84f7bd11d43d4',
        },
        {
          url: '/_next/static/chunks/polyfills-42372ed130431b0a.js',
          revision: '846118c33b2c0e922d7b3a7676f81f6f',
        },
        {
          url: '/_next/static/chunks/webpack-11b7ac849aa93c61.js',
          revision: '11b7ac849aa93c61',
        },
        {
          url: '/_next/static/css/99dd4e9f709e4125.css',
          revision: '99dd4e9f709e4125',
        },
        {
          url: '/_next/static/media/19cfc7226ec3afaa-s.woff2',
          revision: '9dda5cfc9a46f256d0e131bb535e46f8',
        },
        {
          url: '/_next/static/media/21350d82a1f187e9-s.woff2',
          revision: '4e2553027f1d60eff32898367dd4d541',
        },
        {
          url: '/_next/static/media/8e9860b6e62d6359-s.woff2',
          revision: '01ba6c2a184b8cba08b0d57167664d75',
        },
        {
          url: '/_next/static/media/ba9851c3c22cd980-s.woff2',
          revision: '9e494903d6b0ffec1a1e14d34427d44d',
        },
        {
          url: '/_next/static/media/c5fe6dc8356a8c31-s.woff2',
          revision: '027a89e9ab733a145db70f09b8a18b42',
        },
        {
          url: '/_next/static/media/df0a9ae256c0569c-s.woff2',
          revision: 'd54db44de5ccb18886ece2fda72bdfe0',
        },
        {
          url: '/_next/static/media/e4af272ccee01ff0-s.p.woff2',
          revision: '65850a373e258f1c897a2b3d75eb74de',
        },
        {
          url: '/_next/static/ujv9fMnmsEoiNgrAJA0-F/_buildManifest.js',
          revision: 'fefd1d2db8e4d51482f5307a38c0d4d9',
        },
        {
          url: '/_next/static/ujv9fMnmsEoiNgrAJA0-F/_ssgManifest.js',
          revision: 'b6652df95db52feb4daf4eca35380933',
        },
        {
          url: '/browserconfig.xml',
          revision: '8979177e378278422ad9b2b3918fc996',
        },
        { url: '/favicon.ico', revision: '6a99c575ab87f8c7d1ed1e52e7e349ce' },
        {
          url: '/icons/apple-touch-icon.png',
          revision: 'bfc6d4ff1098d978b4fde747dc9ad45b',
        },
        {
          url: '/icons/favicon-16x16.png',
          revision: '7af6495e5294bf40dd93315005d5d9a6',
        },
        {
          url: '/icons/favicon-32x32.png',
          revision: '995342dc1b661aa43a23c6ad2fdfbbbd',
        },
        {
          url: '/icons/generate-icons.html',
          revision: '1f93e9f776ee646eae3e144a837400b1',
        },
        {
          url: '/icons/icon-128x128.png',
          revision: '32724155db2a5e93a9f1934b5d20159b',
        },
        {
          url: '/icons/icon-144x144.png',
          revision: '7ca407dfa6dc2fc58f97554fd827ea25',
        },
        {
          url: '/icons/icon-152x152.png',
          revision: '620f6f991f6134eb8af4e8715eb5d53f',
        },
        {
          url: '/icons/icon-192x192.png',
          revision: 'bf7ddccda7d310037e6ab88fc5f7c7fc',
        },
        {
          url: '/icons/icon-192x192.svg',
          revision: 'bdc35c1b4eeca0b876c7179cd96a72b0',
        },
        {
          url: '/icons/icon-384x384.png',
          revision: '165ec503d37a5c6d89cbaa744d778aa1',
        },
        {
          url: '/icons/icon-512x512.png',
          revision: '7b6d7e2e4cfe0da105901c0188289dcd',
        },
        {
          url: '/icons/icon-512x512.svg',
          revision: 'f269e6898d38c22c37f387db26ff7918',
        },
        {
          url: '/icons/icon-72x72.png',
          revision: 'f2f694ab096cc2a0fbbb425302104870',
        },
        {
          url: '/icons/icon-96x96.png',
          revision: '6d83a46474109c7c66bf0f8d415d8179',
        },
        {
          url: '/images/emily_zhang.jpg',
          revision: '19c7d6322e74f3b1d8d95b6b15b44ab8',
        },
        {
          url: '/images/helloeveryone.png',
          revision: '317144efc9b17c46d7d7bc8751c278e7',
        },
        {
          url: '/images/homepage_helloeveryone.jpg',
          revision: 'ca1080d860d57d75f840e32093ddb37a',
        },
        {
          url: '/images/james_miller.jpg',
          revision: 'e7d6263dfa8c327d3370152aa849a8d1',
        },
        {
          url: '/images/lisa_park.jpg',
          revision: '78f35175bca830b0297864a24a2fdbc9',
        },
        {
          url: '/images/michael_brown.jpg',
          revision: 'f6e1393220ef89e5398cbc145bcb1ed9',
        },
        {
          url: '/images/tom_anderson.jpg',
          revision: '259a171c0ef5a5ed04b1320d3e14ee52',
        },
        { url: '/manifest.json', revision: 'bed0513287608c4c838438355863f983' },
        { url: '/robots.txt', revision: '8556401e5752875d82fe09b3837d1c5c' },
      ],
      { ignoreURLParametersMatching: [] }
    ),
    e.cleanupOutdatedCaches(),
    e.registerRoute(
      '/',
      new e.NetworkFirst({
        cacheName: 'start-url',
        plugins: [
          {
            cacheWillUpdate: async ({
              request: e,
              response: a,
              event: s,
              state: t,
            }) =>
              a && 'opaqueredirect' === a.type
                ? new Response(a.body, {
                    status: 200,
                    statusText: 'OK',
                    headers: a.headers,
                  })
                : a,
          },
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:gstatic)\.com\/.*/i,
      new e.CacheFirst({
        cacheName: 'google-fonts-webfonts',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 31536e3 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /^https:\/\/fonts\.(?:googleapis)\.com\/.*/i,
      new e.StaleWhileRevalidate({
        cacheName: 'google-fonts-stylesheets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:eot|otf|ttc|ttf|woff|woff2|font.css)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-font-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 4, maxAgeSeconds: 604800 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:jpg|jpeg|gif|png|svg|ico|webp)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-image-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\/_next\/image\?url=.+$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-image',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 64, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:mp3|wav|ogg)$/i,
      new e.CacheFirst({
        cacheName: 'static-audio-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:mp4)$/i,
      new e.CacheFirst({
        cacheName: 'static-video-assets',
        plugins: [
          new e.RangeRequestsPlugin(),
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:js)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-js-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:css|less)$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'static-style-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\/_next\/data\/.+\/.+\.json$/i,
      new e.StaleWhileRevalidate({
        cacheName: 'next-data',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      /\.(?:json|xml|csv)$/i,
      new e.NetworkFirst({
        cacheName: 'static-data-assets',
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1
        const a = e.pathname
        return !a.startsWith('/api/auth/') && !!a.startsWith('/api/')
      },
      new e.NetworkFirst({
        cacheName: 'apis',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 16, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      ({ url: e }) => {
        if (!(self.origin === e.origin)) return !1
        return !e.pathname.startsWith('/api/')
      },
      new e.NetworkFirst({
        cacheName: 'others',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 86400 }),
        ],
      }),
      'GET'
    ),
    e.registerRoute(
      ({ url: e }) => !(self.origin === e.origin),
      new e.NetworkFirst({
        cacheName: 'cross-origin',
        networkTimeoutSeconds: 10,
        plugins: [
          new e.ExpirationPlugin({ maxEntries: 32, maxAgeSeconds: 3600 }),
        ],
      }),
      'GET'
    ))
})
