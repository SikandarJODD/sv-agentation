# Docs update workflow

Use this file when you changed docs and want to know if you should publish the package.

## Short answer

Not every docs change needs an npm release.

## If you changed only website docs

Examples:

- `apps/web` content
- root `README.md`
- guide files in the repo

Do this:

```sh
pnpm check
pnpm build
```

Then commit and push.

No package release is needed if the package code did not change.

## If you changed `packages/sv-agentation/README.md`

Important:

- the npm package page reads from the published package README
- npm will not show that README change until a new package version is published

Use this rule:

- if you want the npm page to show the new README, do a `patch` release
- if the README change is only for this repo and npm does not need it yet, you can wait

## If docs changed because the API changed

That is not a docs-only update.

Do this:

1. update the docs
2. create a changeset
3. release the package with the correct version type

Use the version guide in `PACKAGE-RELEASE-GUIDE.md`.

## Docs-only checklist

Before pushing a docs-only change:

- examples still match the real API
- install commands are still correct
- component name is still `Agentation`
- event names are still correct
- screenshots or steps are not outdated

## Safe docs-only command flow

```sh
pnpm check
pnpm build
git add .
git commit -m "docs: update package docs"
git push
```

## Quick decision table

- changed only docs site text: no package release
- changed only repo markdown guides: no package release
- changed package README and want npm page updated: `patch` release
- changed docs because package behavior changed: release the package too
