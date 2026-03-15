# sv-agentation Workspace

Monorepo for the `sv-agentation` Svelte package and its docs/demo app.

## Workspace Layout

- `packages/sv-agentation`: publishable Svelte 5 package
- `apps/web`: SvelteKit docs and playground app
- `.changeset`: versioning metadata for automated releases

## Common Commands

```sh
pnpm install
pnpm dev
pnpm check
pnpm build
pnpm package:pack
```

`pnpm dev` starts the docs app in `apps/web`.

## Publishing

The npm package lives in `packages/sv-agentation` and is published through Changesets plus GitHub Actions trusted publishing.

Primary component export: `Agentation`

Before the first public release, re-check npm name availability for `sv-agentation`.

## Cloudflare Pages

The docs app is prepared for Cloudflare Pages from `apps/web`.

Recommended settings:

- Root directory: `apps/web`
- Install command: `pnpm install --frozen-lockfile`
- Build command: `pnpm build`

Cloudflare deployment is intentionally separate from npm publishing.
