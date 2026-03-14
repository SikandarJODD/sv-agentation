# How `element-source-inspector.svelte` Works

This file explains the flow inside [src/lib/interesting-codes/element-source-inspector.svelte](/s:/advance_svelte/exp/svelte-learning/src/lib/interesting-codes/element-source-inspector.svelte) in a very basic way.

## Big Picture

```text
Mouse moves over page
        |
        v
handleMouseMove(event)
        |
        +--> ignore inspector buttons / ignore outside root / ignore outside selector
        |
        +--> target = event.target
        |
        +--> Promise.all([
               resolveComponentName(target),
               resolveSource(target),
               resolveElementInfo(target)
             ])
        |
        v
combine results
        |
        v
buildHoverInfo(...)
        |
        +--> rectangle for outline
        +--> text for label
        +--> copy text
        +--> VS Code URL
        |
        v
hoverInfo state updates
        |
        v
UI overlay renders
```

The important call happens here:

- [src/lib/interesting-codes/element-source-inspector.svelte:152](/s:/advance_svelte/exp/svelte-learning/src/lib/interesting-codes/element-source-inspector.svelte#L152)

That block asks the `element-source` package three separate questions about the same DOM element:

- What component name should we show?
- What file/line/column is the best source location?
- What is the full combined info object?

## Why call all 3?

Because the component tries to be practical, not theoretical.

```text
resolveComponentName() -> best name to display
resolveSource()        -> best single source location
resolveElementInfo()   -> fallback bundle: tagName + componentName + source + stack
```

Then it merges them like this:

```text
resolvedSource = source ?? elementInfo.source
shownName      = componentName ?? elementInfo.componentName
```

So if one helper returns `null`, the inspector still has a fallback.

## What the library is doing underneath

The package you installed is `element-source@0.0.4`.

Its generic resolver logic is here:

- [node_modules/element-source/dist/index.js:677](/s:/advance_svelte/exp/svelte-learning/node_modules/element-source/dist/index.js#L677)

For Svelte, the package does not magically read `.svelte` files directly at runtime.
It reads metadata placed on DOM nodes, mainly `__svelte_meta`.

Relevant Svelte internals are here:

- [node_modules/element-source/dist/index.js:301](/s:/advance_svelte/exp/svelte-learning/node_modules/element-source/dist/index.js#L301)

Very roughly, it looks for metadata like this:

```text
element
  `-- __svelte_meta
       |-- loc
       |    |-- file
       |    |-- line
       |    `-- column
       `-- parent
            |-- componentTag
            |-- file
            |-- line
            |-- column
            `-- parent
```

That means:

- `loc` gives the current element source location.
- `parent` links upward through component ownership info.
- `componentTag` is used to figure out a component name.

## Step By Step Inside Your Inspector

### 1. Mouse target filtering

Inside `handleMouseMove`, the code first rejects targets that should not be inspected:

- not an `Element`
- part of the inspector UI itself
- outside the root wrapper
- outside `selector` which defaults to `.playground-container`
- same element as the previous hover

This is why the inspector feels stable and does not constantly recompute.

Main code:

- [src/lib/interesting-codes/element-source-inspector.svelte:137](/s:/advance_svelte/exp/svelte-learning/src/lib/interesting-codes/element-source-inspector.svelte#L137)

### 2. The 3 resolver calls

After a target is accepted:

```text
target
  |
  +--> resolveComponentName(target)
  +--> resolveSource(target)
  +--> resolveElementInfo(target)
```

All 3 run together with `Promise.all(...)`.

This is nice because:

- they resolve in parallel
- the UI waits once
- you get name + location + full fallback object in one pass

### 3. Result merging

After the promises finish:

```text
component name = direct name OR name from elementInfo
source info    = direct source OR source from elementInfo
```

Then `buildHoverInfo(...)` converts raw library output into display-ready UI data:

- label text
- short filename
- copy text
- bounding box
- VS Code deep link

Main code:

- [src/lib/interesting-codes/element-source-inspector.svelte:160](/s:/advance_svelte/exp/svelte-learning/src/lib/interesting-codes/element-source-inspector.svelte#L160)

## How `resolveSource()` Works

At the generic library level:

- `resolveSource(node)` calls `resolveStack(node)`
- then returns `stack[0] ?? null`

Source:

- [node_modules/element-source/dist/index.js:688](/s:/advance_svelte/exp/svelte-learning/node_modules/element-source/dist/index.js#L688)

So the real question becomes:

```text
How is stack built?
```

For Svelte:

```text
resolveStack(element)
    |
    +--> getNearestSvelteMeta(element)
    |
    +--> readSvelteLocation(meta)
    |
    +--> create first frame from meta.loc
    |
    +--> readParentStackFrames(meta)
    |
    +--> append parent frames
    |
    +--> remove duplicates
    |
    v
  [frame0, frame1, frame2, ...]
```

Relevant code:

- [node_modules/element-source/dist/index.js:303](/s:/advance_svelte/exp/svelte-learning/node_modules/element-source/dist/index.js#L303)
- [node_modules/element-source/dist/index.js:354](/s:/advance_svelte/exp/svelte-learning/node_modules/element-source/dist/index.js#L354)

So for Svelte:

- `resolveSource(target)` usually means "give me the first source frame from Svelte metadata"
- that first frame is usually the hovered DOM node's file/line/column

In short:

```text
resolveSource(target)
  = first stack frame
  = closest direct source location
```

## How `resolveComponentName()` Works

At the generic library level:

- it first asks the React resolver for a name
- if React gives nothing, it asks framework stack frames for a `componentName`

Source:

- [node_modules/element-source/dist/index.js:692](/s:/advance_svelte/exp/svelte-learning/node_modules/element-source/dist/index.js#L692)

In your Svelte case, the useful part is this:

```text
frameworkStack.find(frame => frame.componentName)?.componentName
```

Where does that `componentName` come from for Svelte?

From parent metadata:

```text
readComponentNameFromParent(meta)
    |
    +--> meta.parent
    +--> meta.parent.parent
    +--> meta.parent.parent.parent
    |
    v
first place with componentTag
```

Source:

- [node_modules/element-source/dist/index.js:325](/s:/advance_svelte/exp/svelte-learning/node_modules/element-source/dist/index.js#L325)

So the mental model is:

```text
Hovered DOM node
   |
   +--> current node tells us location
   |
   +--> parent ownership chain tells us component tag/name
```

In short:

```text
resolveComponentName(target)
  = walk the stack
  = find first frame that has componentName
  = for Svelte, this comes from parent.componentTag
```

## How `resolveElementInfo()` Works

`resolveElementInfo()` is the "give me everything together" helper.

At the generic level it does:

```text
stack = resolveStack(node)
source = stack[0] ?? null
componentName =
  first stack frame with componentName
  OR react fallback
  OR null

return {
  tagName,
  componentName,
  source,
  stack
}
```

Source:

- [node_modules/element-source/dist/index.js:702](/s:/advance_svelte/exp/svelte-learning/node_modules/element-source/dist/index.js#L702)

So this one is basically:

```text
resolveElementInfo(target)
  = summary object
```

That is why your inspector uses it as the fallback safety net.

If `resolveSource()` returns `null`, `elementInfo.source` may still help.
If `resolveComponentName()` returns `null`, `elementInfo.componentName` may still help.

## Tiny Comparison

```text
resolveSource(target)
  -> one best source frame

resolveComponentName(target)
  -> one best component name

resolveElementInfo(target)
  -> full object:
     { tagName, componentName, source, stack }
```

## How Hover UI gets built

Once the source info is known, your component adds UI-specific data that the library does not know about:

```text
library result
   |
   +--> getBoundingClientRect() for overlay box
   +--> shortenPath() for display
   +--> buildCopyText()
   +--> buildVsCodeUrl()
   |
   v
hoverInfo
```

This happens inside:

- [src/lib/interesting-codes/element-source-inspector.svelte:96](/s:/advance_svelte/exp/svelte-learning/src/lib/interesting-codes/element-source-inspector.svelte#L96)

So the library answers:

- where did this element come from?
- what component likely owns it?

And your component answers:

- where should the overlay box be?
- what label should be shown?
- what should copy do?
- can we open VS Code for this path?

## Super Short Summary

```text
handleMouseMove()
  -> pick hovered DOM element
  -> ask element-source for name + source + full info
  -> use Svelte __svelte_meta to build stack
  -> take first frame as source
  -> take first componentTag-based frame as component name
  -> convert that into hoverInfo
  -> render overlay + buttons
```

## One important note

This works best in development, because it depends on framework metadata being available on DOM nodes.
It should be treated as a debugging helper, not a production guarantee.
