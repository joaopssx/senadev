# Deploy

The site, API and database all run on Vercel. Dashboard labels change over time, so a button may be worded slightly differently from this guide.

## 1. Push the code to GitHub

Check that nothing private is about to be published. The second command must print nothing:

```bash
git status
git log --all -- .env
```

```bash
git push origin main
```

## 2. Create the Turnstile widget

Turnstile is a Cloudflare service, but it works on any host.

1. In the Cloudflare dashboard, open **Turnstile** and select **Add widget**.
2. Name it `senadev`, add the hostname `senadev.com.br` and choose **Managed** mode.
3. Select **Create** and copy the site key and the secret key.

## 3. Create the Vercel project

1. In Vercel, select **Add New**, **Project**, and import the repository. `vercel.json` already sets the build.
2. Add these environment variables for Production:

| Name                      | Value                            |
| ------------------------- | -------------------------------- |
| `VITE_TURNSTILE_SITE_KEY` | the Turnstile site key           |
| `TURNSTILE_SECRET_KEY`    | the Turnstile secret key         |
| `IP_HASH_SALT`            | output of `openssl rand -hex 32` |
| `GITHUB_TOKEN`            | optional, a token with no scopes |

3. Select **Deploy**.

Add your `*.vercel.app` address to the Turnstile hostnames so the guestbook works before the domain is ready.

## 4. Create the database

1. In the Vercel project, open **Storage**, create a **Neon** Postgres database and connect it to the project. This adds `DATABASE_URL`.
2. Open the database in the Neon console and go to the **SQL Editor**.
3. Paste the contents of `migrations/0001_create_guestbook.sql` and run it.
4. In Vercel, open **Deployments** and redeploy the latest one, so it receives `DATABASE_URL`.

## 5. Point the domain

1. In the Vercel project, open **Settings**, **Domains**, and add `senadev.com.br`.
2. Vercel shows the DNS records or nameservers to use. Set them where the domain's DNS is managed, which is [registro.br](https://registro.br) by default. If DNSSEC is on and you change nameservers, turn it off first.
3. Wait for Vercel to mark the domain as valid. The change can take a few hours.

## 6. Check it live

- The site loads over HTTPS, and the blobs and portrait appear.
- Projects shows real repositories.
- A guestbook message is sent and appears in the list.
- A fourth message in the same hour shows the limit error.
- A wrong address shows the 404 page.
- The browser console has no Content Security Policy errors.

## Moderating the guestbook

Run these in the Neon SQL Editor.

List recent messages:

```sql
SELECT id, name, message, hidden FROM guestbook ORDER BY id DESC LIMIT 20;
```

Hide a message (replace 123 with its id):

```sql
UPDATE guestbook SET hidden = 1 WHERE id = 123;
```

Delete it permanently:

```sql
DELETE FROM guestbook WHERE id = 123;
```

## If a key leaks

Removing it from Git is not enough, because copies stay in the history and on other machines. Create a new key in the provider, update the variable in Vercel, redeploy, and revoke the old key.
