# Deploy

Dashboard labels change over time, so a button may be worded slightly differently from this guide.

## 1. Push the code to GitHub

Check that nothing private is about to be published. The second command must print nothing:

```bash
git status
git log --all -- .env
```

Create an empty repository on GitHub, then:

```bash
git remote add origin https://github.com/joaopssx/senadev.git
git push -u origin main
```

## 2. Create the database

```bash
npx wrangler login
npx wrangler d1 create senadev-guestbook
```

Copy the `database_id` it prints into `wrangler.toml`, commit and push. Then create the table:

```bash
npx wrangler d1 migrations apply senadev-guestbook --remote
```

## 3. Create the Turnstile widget

1. In the Cloudflare dashboard, open **Turnstile** and select **Add widget**.
2. Name it `senadev`, add the hostname `senadev.com.br`, and choose **Managed** mode.
3. Select **Create** and copy the site key and the secret key.

## 4. Create the Pages project (API)

Cloudflare Pages runs the Functions and the database. Vercel serves the site and forwards `/api/*` here.

1. Go to **Workers & Pages**, then **Create application**, **Pages**, **Connect to Git**.
2. Select GitHub, authorize it and choose the repository, then **Begin setup**.
3. Name the project `senadev`, because `vercel.json` forwards to `senadev.pages.dev`. If the address you get differs, update `vercel.json`.
4. Use these settings:
   - Production branch: `main`
   - Framework preset: None
   - Build command: `npm run build`
   - Build output directory: `dist`
5. Select **Save and Deploy**.

`wrangler.toml` is the source of truth for the D1 binding, so it appears as read-only in the dashboard.

## 5. Add the Cloudflare secrets

In your Pages project, open **Settings** and the variables section. For Production, add each one as a secret:

| Name                   | Value                            |
| ---------------------- | -------------------------------- |
| `TURNSTILE_SECRET_KEY` | the Turnstile secret key         |
| `IP_HASH_SALT`         | output of `openssl rand -hex 32` |
| `ORIGIN_SECRET`        | output of `openssl rand -hex 32` |
| `GITHUB_TOKEN`         | optional, a token with no scopes |

Secrets only take effect on the next deployment. Open **Deployments** and retry the latest one.

## 6. Create the Vercel project (site)

1. In Vercel, select **Add New**, **Project**, and import the repository. `vercel.json` already sets the build.
2. Add these environment variables for Production:
   - `VITE_TURNSTILE_SITE_KEY`: the Turnstile site key
   - `ORIGIN_SECRET`: the same value used on Cloudflare
3. Select **Deploy**. Add your `*.vercel.app` address to the Turnstile widget hostnames.

## 7. Point the domain

1. In the Vercel project, open **Settings**, **Domains**, and add `senadev.com.br`.
2. Vercel shows the DNS records or nameservers to use. Set them where the domain's DNS is managed, which is [registro.br](https://registro.br) by default. If DNSSEC is on and you change nameservers, turn it off first.
3. Wait for Vercel to mark the domain as valid. The change can take a few hours.

## 8. Check it live

- The site loads over HTTPS, and the blobs and portrait appear.
- Projects shows real repositories.
- A guestbook message is sent and appears in the list.
- A fourth message in the same hour shows the limit error.
- A wrong address shows the 404 page.
- The browser console has no Content Security Policy errors.

## Moderating the guestbook

List recent messages:

```bash
npx wrangler d1 execute senadev-guestbook --remote --command "SELECT id, name, message, hidden FROM guestbook ORDER BY id DESC LIMIT 20"
```

Hide a message (replace 123 with its id):

```bash
npx wrangler d1 execute senadev-guestbook --remote --command "UPDATE guestbook SET hidden = 1 WHERE id = 123"
```

Delete it permanently:

```bash
npx wrangler d1 execute senadev-guestbook --remote --command "DELETE FROM guestbook WHERE id = 123"
```

In the dashboard, the same is available under the D1 section: open `senadev-guestbook`, then edit `hidden` in the table view or run the SQL in the console.

## If a key leaks

Removing it from Git is not enough, because copies stay in the history and on other machines. Create a new key in the provider, update the secret in Cloudflare, redeploy, and revoke the old key.
