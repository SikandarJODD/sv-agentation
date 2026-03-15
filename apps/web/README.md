# apps/web

Docs and playground app for `sv-agentation`.

## Local Dev

```sh
pnpm --filter @sv-agentation/web dev
```

## Cloudflare Pages

Deploy this app to Cloudflare Pages as a monorepo app.

- Root directory: `apps/web`
- Build command: `pnpm --filter @sv-agentation/web build`
- Build output directory: `.svelte-kit/cloudflare`

The app depends on the local workspace package `sv-agentation`, so Cloudflare should install dependencies from the repo root rather than treating `apps/web` as a standalone repo.

See `../../CLOUDFLARE-PAGES-DEPLOYMENT.md` for the full deployment and domain steps.
