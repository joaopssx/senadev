# Decisions

## No React or other UI framework

The page is mostly static content and a few independent widgets, and there is little shared state. A framework would add runtime weight and a build model with no matching benefit. Small feature modules and `textContent` cover it.

Trade-off: if the site grew into an app with lots of shared state, this would need revisiting.

## Everything on Vercel

Site, Functions and database live on one platform with one deploy, one set of environment variables and Git previews.

Trade-off: Turnstile is still a Cloudflare service, because it is a standalone captcha that works on any host.

## Neon Postgres for the guestbook

The data is one small table and needs simple queries, ordering and a reliable limit. Neon speaks over HTTP, which fits short-lived Functions, and connects through the Vercel Marketplace.

## Turnstile as the captcha

It usually needs no interaction from visitors, is free, and is verified on the server. It also comes from the same provider as the hosting. A honeypot field and the hourly limit back it up.

## Hashing the IP instead of storing it

The hourly limit only needs to know whether two requests came from the same visitor. A SHA-256 hash with a secret salt answers that without keeping the address, in line with data minimization under the LGPD. The salt stops anyone from reversing the hash by trying every possible IP.

A salted hash is still pseudonymous data, not anonymous data, so each new message also clears hashes older than the one-hour window.

## Rate limit with a lock per visitor

Postgres runs concurrent statements side by side, so two requests could both see a count below the limit. An advisory lock on the IP hash makes requests from the same visitor run one at a time, in the same transaction as the insert.

## Portrait generated at build time

Processing the photo in the browser would mean shipping the photo. Generating a small JSON file keeps it private and keeps the runtime simple.

## Pre-drawn sprites for the dots

Using `shadowBlur` for thousands of dots on every frame is slow. Each of the three dot sizes is drawn once with its glow and then copied.

## Own i18n dictionary

There are two languages and no complex plurals. A typed object gives compile-time key checks with no dependency.

## Strict CSP with no inline scripts

The policy allows only same-origin scripts plus Turnstile. The cost is a brief flash of English for returning visitors who chose Portuguese, since fixing it would need an inline script.
