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
2. Name it `senadev`, add the hostnames `senadev.com.br` and your `*.pages.dev` address, and choose **Managed** mode.
3. Select **Create** and copy the site key and the secret key.

## 4. Create the Pages project

1. Go to **Workers & Pages**, then **Create application**, **Pages**, **Connect to Git**.
2. Select GitHub, authorize it and choose the repository, then **Begin setup**.
3. Use these settings:
   - Production branch: `main`
   - Framework preset: None
   - Build command: `npm run build`
   - Build output directory: `dist`
4. Under environment variables, add `VITE_TURNSTILE_SITE_KEY` with the site key. It is read during the build.
5. Select **Save and Deploy**.

`wrangler.toml` is the source of truth for the D1 binding, so it appears as read-only in the dashboard.

## 5. Add the secrets

In your project, open **Settings** and the variables section. For Production, add each one as a secret:

| Name                   | Value                            |
| ---------------------- | -------------------------------- |
| `TURNSTILE_SECRET_KEY` | the Turnstile secret key         |
| `IP_HASH_SALT`         | output of `openssl rand -hex 32` |
| `GITHUB_TOKEN`         | optional, a token with no scopes |

Secrets only take effect on the next deployment. Open **Deployments** and retry the latest one.

## 6. Point the domain

1. In Cloudflare, go to **Domains**, select **Onboard a domain**, enter `senadev.com.br` and pick the Free plan.
2. Note the two nameservers Cloudflare assigns.
3. In [registro.br](https://registro.br), sign in and select the domain. If DNSSEC is on, turn it off first.
4. Replace the DNS servers with the two from Cloudflare and save. The change can take a few hours.
5. Once the domain is active, open your Pages project, then **Custom domains**, **Set up a domain**, and enter `senadev.com.br`.

## 7. Check it live

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
