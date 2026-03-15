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

Helpful guides in this repo:

- `PACKAGE-RELEASE-GUIDE.md`
- `DOCS-UPDATE-WORKFLOW.md`

## Cloudflare Pages

The docs app in `apps/web` is prepared for Cloudflare Pages and should be deployed as a monorepo app.

Recommended settings:

- Root directory: `apps/web`
- Build command: `pnpm --filter @sv-agentation/web build`
- Build output directory: `.svelte-kit/cloudflare`

Cloudflare deployment is intentionally separate from npm publishing.

See `CLOUDFLARE-PAGES-DEPLOYMENT.md` for the full deployment and custom-domain guide.

## License

MIT
