# Package release guide

Use this file when you changed the package and want to know what to release.

## Quick rule

- `patch`: safe fix, no breaking API
- `minor`: new feature, still backward compatible
- `major`: breaking change

## Best rule for `sv-agentation` right now

The package is still `0.x`.

For `0.x`, use this simple rule:

- `patch` for fixes and safe cleanup
- `minor` for new features
- `minor` for breaking changes too, until you reach `1.0.0`

Reason:

- in `0.x`, consumers already expect the API to still be settling
- npm version ranges for `0.x` are stricter than normal `1.x` packages
- using `minor` for breaking changes is the safest practical rule for now

After `1.0.0`:

- `patch` = fixes
- `minor` = new backward-compatible feature
- `major` = breaking change

## When to use `patch`

Use `patch` when you:

- fix a bug
- improve internal code without changing the public API
- improve styles or behavior without breaking existing usage
- fix docs inside the package and want the npm package page to refresh
- fix type issues without breaking consumers

Examples:

- note restore bug fixed
- open-in-editor error fixed
- better selection behavior without changing props or events

## When to use `minor`

Use `minor` when you:

- add a new prop
- add a new event
- add a new export
- add a new feature that old consumers do not need to change code for
- change public behavior in a way that may require consumer updates while still in `0.x`

Examples:

- new keyboard shortcut
- new annotation mode
- new exported helper type
- remove a compatibility alias during `0.x`

## When to use `major`

Use `major` only after `1.0.0` when you make a breaking change.

Examples:

- rename `Agentation`
- remove an event or export
- change prop names
- require a new incompatible Svelte version

## Package change workflow

1. Make the package change.
2. Run checks:

```sh
pnpm check
pnpm build
pnpm package:pack
```

3. Create a changeset:

```sh
pnpm changeset
```

4. Choose the release type:

- `patch` for fixes
- `minor` for features
- `minor` for breaking changes while still in `0.x`

5. Write a short human-readable summary.
6. Commit your changes, including the new `.changeset/*.md` file.
7. Push your branch and merge it to `master`.
8. GitHub Actions opens or updates the release PR.
9. Merge the release PR.
10. GitHub Actions publishes the new version to npm.

## Do not use this for normal releases

Do not run these for the normal automated flow:

- `npm version patch`
- `npm version minor`
- `npm version major`
- manual GitHub Releases
- manual npm publish from your laptop

This repo already uses Changesets for automated releases.

Your normal release command is:

```sh
pnpm changeset
```

That is the version instruction for this repo.

## First publish

For the first publish:

1. make sure the GitHub secret is named `NPM_TOKEN`
2. commit and push the current repo state to `master`
3. let `.github/workflows/release.yml` run
4. check the Actions tab for the publish result
5. verify the package on npm

If `sv-agentation` is still unpublished, the workflow can publish the current package version.

## Before publishing

Check these every time:

- package builds
- types build
- docs/demo still works
- release note text is clear
- version choice matches the change

## Simple examples

- fixed selection bug only: `patch`
- added a new prop: `minor`
- removed a compatibility alias while still on `0.x`: `minor`
- after `1.0.0`, removing an old export: `major`
