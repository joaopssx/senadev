# senadev.com.br

Personal portfolio of João Pedro de Sena Santana. It has 3D liquid blobs, a portrait made of interactive dots, a live age counter and a guestbook.

![Site preview](public/og-image.png)

## Stack

| Part      | Choice                             | Why                                                   |
| --------- | ---------------------------------- | ----------------------------------------------------- |
| Frontend  | Vite and plain TypeScript          | Six sections don't need a framework runtime           |
| 3D        | Three.js, loaded after the content | Real lighting without delaying the first paint        |
| Portrait  | Canvas 2D                          | Thousands of sprites, no library needed               |
| Hosting   | Vercel                             | Site, API and database in one place                   |
| Backend   | Vercel Functions                   | Same origin as the site, no server to maintain        |
| Database  | Neon Postgres                      | Serverless SQL with a free tier that fits a guestbook |
| Anti-spam | Cloudflare Turnstile, honeypot     | No tracking cookies or image puzzles for visitors     |
| Tests     | Vitest                             | Covers age, dates, guestbook validation, i18n keys    |

The reasoning behind each choice is in [docs/DECISIONS.md](docs/DECISIONS.md).

## Running locally

You need the Node version in `.nvmrc`.

```bash
npm ci
cp .env.example .env.local
```

Frontend only, with the fallback project list and no guestbook backend:

```bash
npm run dev
```

The full site with the API runs through the Vercel CLI and needs a linked project with a database:

```bash
npx vercel link
npx vercel env pull .env.local
npx vercel dev
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
api/                guestbook and GitHub repos endpoints
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

| Name                      | Purpose                                          |
| ------------------------- | ------------------------------------------------ |
| `VITE_TURNSTILE_SITE_KEY` | Public Turnstile key, used at build              |
| `TURNSTILE_SECRET_KEY`    | Verifies Turnstile tokens on the server          |
| `IP_HASH_SALT`            | Salt for hashing visitor IPs                     |
| `DATABASE_URL`            | Neon connection, added by the Vercel integration |
| `GITHUB_TOKEN`            | Optional, raises the GitHub API limit            |

Local values go in `.env.local`, which Git ignores. In production they live in the Vercel dashboard.

## Deploy

See [docs/DEPLOY.md](docs/DEPLOY.md). How the parts fit together is in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## License

The code is under the [MIT License](LICENSE).

My photo, the portrait generated from it (`src/data/dots.json`) and my personal texts are not covered by that license and may not be reused without permission.

The Michroma and Montserrat fonts are under the SIL Open Font License. Their licenses are in `public/fonts`.
