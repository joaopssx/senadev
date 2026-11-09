# Architecture

A static site built by Vite plus two Vercel Functions on the same origin.

```
Browser
  |- static files (HTML, CSS, JS, fonts) -> Vercel CDN
  |- GET /api/repos                      -> Function -> GitHub API (cached 1 hour)
  |- GET, POST /api/guestbook            -> Function -> Turnstile, Neon Postgres
```

## Loading order

The HTML holds all the content in English, so the page is readable before any script runs. `src/main.ts` then starts each feature. The heavy parts load separately:

| Chunk    | Loaded                              | Size (gzip)  |
| -------- | ----------------------------------- | ------------ |
| main     | at start                            | about 7 kB   |
| dots     | right after start                   | about 12 kB  |
| Three.js | when the browser is idle after load | about 137 kB |

## Translation

`src/i18n/en.ts` defines the keys and `pt.ts` must have the same ones, which TypeScript enforces. Elements in the HTML use `data-i18n` or `data-i18n-label`. Text created by code calls `t(key)` and re-renders through `onLocaleChange`.

## Guestbook flow

1. The visitor scrolls near the section. The list loads and the Turnstile script is added.
2. On submit, the browser posts the name, message, honeypot field and Turnstile token.
3. `api/guestbook.ts` handles the request in this order:
   - accepts only JSON up to 4 KB
   - validates and normalizes the fields (`_lib/validate.ts`)
   - verifies the token with Turnstile (`_lib/turnstile.ts`)
   - hashes the IP with SHA-256 and a secret salt (`_lib/hash-ip.ts`)
   - runs one transaction that takes a lock per visitor and only writes if they sent fewer than 3 messages in the last hour
4. After a successful insert, hashes older than one hour are cleared.
5. The server sets `created_at` in UTC. The browser displays it in the Sao Paulo time zone.

Errors are short codes such as `rate_limited`, which the frontend translates. All SQL uses bound parameters and all visitor text is rendered with `textContent`.

## Dot portrait

`scripts/make-dots.ts` crops a private photo, converts it to greyscale and reduces it to a grid, so each pixel is one cell. A gamma curve, contrast and a threshold decide which cells get a dot and which of the three sizes it has. The result is `src/data/dots.json`, a grid size and flat triples of x, y and size. The photo never enters the repository.

In the browser, `src/features/dots` draws pre-rendered sprites on a canvas. Each dot is a critically damped spring pulled to its home position and pushed by the pointer. The loop stops when the canvas is off screen. With reduced motion, the portrait is drawn once.

## Blobs

One fixed canvas sits behind the page and one renderer draws both blobs. Each blob is an icosphere displaced by simplex noise in the vertex shader, through `onBeforeCompile` on a `MeshPhysicalMaterial`. Normals are recalculated from nearby displaced points so the lighting follows the surface.

The position of each blob comes from an invisible element in the layout, the `.blob-fallback` that is also the CSS gradient. CSS stays in charge of where a blob goes at every screen size. Scrolling adds rotation and drift, and each section has its own color and amplitude.

The gradient stays visible if the visitor prefers reduced motion, the device is weak, WebGL2 is missing or Three.js fails to load.
