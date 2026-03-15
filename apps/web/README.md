# apps/web

Docs and playground app for `sv-agentation`.

## Local Dev

```sh
pnpm --filter @sv-agentation/web dev
```

## Cloudflare Pages

Use Cloudflare Pages with this workspace as the project root.

- Root directory: `apps/web`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`

The docs app is deployed separately from the npm package release flow.
