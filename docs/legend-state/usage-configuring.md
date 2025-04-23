---
title: Configuring
---

# Configuring

Legend-State is designed to have a lean core that allows you and your team to add additional features, so it has configuration functions to add features as you like.

These functions add features and augment the TypeScript interface to add the new functions, so just importing the file adds the interface.

These configuration functions only need to be called once, before their effects are used, and then they will work anywhere. It should generally be at the top of the file that's the entry point of your app or is imported everywhere, or it could be at the top of a global state file.

## enable$GetSet

This enables accessing and setting the raw value of an observable directly. It's a shorthand for `get()` and `set(...)`.

```typescript
import { enable$GetSet } from "@legendapp/state/config/enable$GetSet";
enable$GetSet();
```

Now you can access/modify observables directly.

```typescript
import { observable } from "@legendapp/state"

const state$ = observable({ test: "hi", num: 0 })

// $ is a shorthand for get()
const testValue = state$.test.$

// Assign to $ as a shorthand for set()
state$.test.$ = "hello"

// Assign objects too just like you can with set()
state$.$ = { test: "hello" }

// Incrementing works as you'd expect
state$.num.$++
```

## enable_PeekAssign

This enables accessing and setting the raw value of an observable directly without tracking or notifying listeners. Getting with `._` is a shorthand for `peek()` and assigning to `._` modifies the underlying data without notifying. Modifying data without notifying is likely necessary in only very specific scenarios so use it with care.

```typescript
import { enable_PeekAssign } from "@legendapp/state/config/enable_PeekAssign";
enable_PeekAssign();
```

Now you can access/modify observables directly without notifying.

```typescript
import { observable } from "@legendapp/state"

const state$ = observable({ test: "hi", num: 0 })

// _ is a shorthand for peek()
const testValue = state$.test._

// Assign to _ to modify the underlying object without notifying listeners
state$.test._ = "hello"

// Assign objects too
state$._ = { test: "hello" }
```

## enableReactTracking

`enableReactTracking` is useful to warn if a `get()` is called within a React component without being wrapped in `use$`, which would break the reactivity.

### warnMissingUse

This will log a warning whenever `get()` is called within a React component. This can help you find places where you meant to use `use$` to track the observable in React, or you may want to change it to `peek()` to be clearer that it should not trigger updates.

```typescript
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking"

enableReactTracking({
    warnMissingUse: true,
})
```

> Note: In previous versions Legend State had some hacks that were unstable and broke compatibility with the React Compiler, and the following deprecated options were to help with those. They will still work for now but will be removed in a later version.

### (Deprecated) warnUnobserved

This makes React components warn if using `get()` without being wrapped in `observer`. This is a very helpful way to catch the easy mistake of forgetting `observer`.

It only runs when `process.env.NODE_ENV === 'development'` so it won't disrupt your app in production.

```typescript
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking"

enableReactTracking({
    warnUnobserved: true,
})
```

### (Deprecated) auto tracking

> Caution: Not working in React 19

This is deprecated because it depends on secret React internals which don't work in React 19.

This makes React components auto-track observables without using `observer`, so all you need to do is `get()` an observable and the component will re-render when it changes. This is useful for rapid prototyping as observing is done for you.

```typescript
import { enableReactTracking } from "@legendapp/state/config/enableReactTracking"

enableReactTracking({
    auto: true,
})
```

Now you can just `get()` and components will be automatically reactive.

```typescript
import { observable } from "@legendapp/state"

const state$ = observable({ test: "hi" })

function Component() {
  // This makes this component responsive to test changing
  const test = state$.test.get()

  return <div>{test}</div>
}
```

Note that `enableReactTracking` and `observer` can be used together - observer will optimize away the auto tracking behavior in favor of its more efficient tracking.

> Caution: Rules of hooks

Under the hood this replaces the `get()` with a `useSelector` hook so it is subject to the rules of hooks. That means it can cause problems if you use `get()` conditionally or within a dynamic loop.

We recommend that you use this while getting started and for rapid prototyping. Then wrap your components with `observer` for improved performance and safety.