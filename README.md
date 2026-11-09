# senadev.com.br

Personal portfolio of João Pedro de Sena Santana. It has 3D liquid blobs, a portrait made of interactive dots, a live age counter and a guestbook.

![Site preview](public/og-image.png)

## Stack

| Part      | Choice                             | Why                                                |
| --------- | ---------------------------------- | -------------------------------------------------- |
| Frontend  | Vite and plain TypeScript          | Six sections don't need a framework runtime        |
| 3D        | Three.js, loaded after the content | Real lighting without delaying the first paint     |
| Portrait  | Canvas 2D                          | Thousands of sprites, no library needed            |
| Hosting   | Vercel                             | Serves the site and forwards `/api` to Cloudflare  |
| Backend   | Cloudflare Pages Functions         | Same origin as the site, no server to maintain     |
| Database  | Cloudflare D1                      | SQLite with a free tier that fits a guestbook      |
| Anti-spam | Cloudflare Turnstile, honeypot     | No tracking cookies or image puzzles for visitors  |
| Tests     | Vitest                             | Covers age, dates, guestbook validation, i18n keys |

The reasoning behind each choice is in [docs/DECISIONS.md](docs/DECISIONS.md).

## Running locally

You need the Node version in `.nvmrc`.

```bash
npm ci
cp .env.example .env
cp .dev.vars.example .dev.vars
```

Fill both files using the test keys described in their comments, and any random string for `IP_HASH_SALT`.

Frontend only, with the fallback project list and no guestbook backend:

```bash
npm run dev
```

Full site with Functions and a local database, at `http://localhost:8788`:

```bash
npx wrangler d1 migrations apply senadev-guestbook --local
npm run build
npx wrangler pages dev dist
```

## Scripts

| Command             | What it does                                     |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Starts the Vite dev server                       |
| `npm run build`     | Builds the site into `dist`                      |
| `npm run preview`   | Serves the build with Vite                       |
| `npm run lint`      | Runs ESLint                                      |
| `npm run format`    | Formats with Prettier                            |
| `npm run typecheck` | Checks types for the site, scripts and Functions |
| `npm test`          | Runs the tests                                   |
| `npm run dots`      | Regenerates the portrait from a private photo    |

## Structure

```
functions/api/      guestbook and GitHub repos endpoints
migrations/         database schema
public/             fonts, security headers, SEO files
scripts/            portrait generator
src/data/           generated dots and fallback projects
src/features/       one folder per page feature
src/i18n/           typed EN and PT dictionaries
src/lib/            age, date formatting, DOM helper
src/styles/         design tokens and CSS
tests/              unit tests
docs/               architecture, decisions, deploy guide
```

## Environment variables

| Name                      | Where       | Purpose                                               |
| ------------------------- | ----------- | ----------------------------------------------------- |
| `VITE_TURNSTILE_SITE_KEY` | `.env`      | Public Turnstile key, used at build                   |
| `TURNSTILE_SECRET_KEY`    | `.dev.vars` | Verifies Turnstile tokens on the server               |
| `IP_HASH_SALT`            | `.dev.vars` | Salt for hashing visitor IPs                          |
| `ORIGIN_SECRET`           | `.dev.vars` | Lets the API trust the visitor IP forwarded by Vercel |
| `GITHUB_TOKEN`            | `.dev.vars` | Optional, raises the GitHub API limit                 |

`.env` and `.dev.vars` are ignored by Git. In production these values live in the Vercel and Cloudflare dashboards.

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md). How the parts fit together is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

The code is under the [MIT License](LICENSE).

My photo, the portrait generated from it (`src/data/dots.json`) and my personal texts are not covered by that license and may not be reused without permission.

The Michroma and Montserrat fonts are under the SIL Open Font License. Their licenses are in `public/fonts`.
