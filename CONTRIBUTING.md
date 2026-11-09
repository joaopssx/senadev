# Contributing

This is a personal site, but bug reports and small fixes are welcome.

## Setup

Follow "Running locally" in the [README](README.md). `npm ci` also installs the Git hooks.

## Before opening a pull request

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

New visible text needs both an English and a Portuguese entry in `src/i18n`.

## Commit messages

Commits follow [Conventional Commits](https://www.conventionalcommits.org/) and a hook checks them. Use `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore` or `ci`, and keep one subject per commit.

```
fix: keep guestbook counter in sync after reset
```

## Pull requests

1. Create a branch from `main`.
2. Make a focused change.
3. Open the pull request and fill in the template.

Report security problems through [SECURITY.md](SECURITY.md), not in a public issue.
