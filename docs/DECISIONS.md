# Decisions

## No React or other UI framework

The page is mostly static content and a few independent widgets, and there is little shared state. A framework would add runtime weight and a build model with no matching benefit. Small feature modules and `textContent` cover it.

Trade-off: if the site grew into an app with lots of shared state, this would need revisiting.

## Cloudflare Pages instead of Workers with static assets

Cloudflare's new features are going to Workers, and Workers has more of them. This site needs none of those, while Pages gives file-based routes in `functions/` and simple Git deploys. Moving later means writing a small router for two endpoints.

## D1 for the guestbook

The data is one small table and needs simple queries, ordering and an atomic limit. D1 is SQLite with SQL migrations, and it binds directly to Functions with no connection strings or separate service.

Trade-off: it ties the backend to Cloudflare. The SQL itself is ordinary SQLite.

## Turnstile as the captcha

It usually needs no interaction from visitors, is free, and is verified on the server. It also comes from the same provider as the hosting. A honeypot field and the hourly limit back it up.

## Hashing the IP instead of storing it

The hourly limit only needs to know whether two requests came from the same visitor. A SHA-256 hash with a secret salt answers that without keeping the address, in line with data minimization under the LGPD. The salt stops anyone from reversing the hash by trying every possible IP.

A salted hash is still pseudonymous data, not anonymous data, so each new message also clears hashes older than the one-hour window.

## Rate limit inside the INSERT

A separate count followed by an insert would let simultaneous requests pass the limit. A single statement avoids that with no extra locking.

## Portrait generated at build time

Processing the photo in the browser would mean shipping the photo. Generating a small JSON file keeps it private and keeps the runtime simple.

## Pre-drawn sprites for the dots

Using `shadowBlur` for thousands of dots on every frame is slow. Each of the three dot sizes is drawn once with its glow and then copied.

## Own i18n dictionary

There are two languages and no complex plurals. A typed object gives compile-time key checks with no dependency.

## Strict CSP with no inline scripts

The policy allows only same-origin scripts plus Turnstile. The cost is a brief flash of English for returning visitors who chose Portuguese, since fixing it would need an inline script.
