---
title: Reactivity
---

# Reactivity

Listening for changes is the core purpose of observables, so Legend-State provides many options. You can listen to changes at any level in an object's hierarchy and it will be notified by changes in any children.

## Observing contexts

The core power of Legend-State is the "observing contexts". Calling `get()` within an observing context will track changes in that node, and re-run itself whenever it changes.

Most functions in Legend-State take what we call a "Selector", which is either a single observable or a function that calls `get()` on some observables and returns a value.

Most functions in Legend-State are observing contexts, including computed observables, `observe`, `when`, linked/synced `get` functions, as well as `observer` and reactive components in React. When you call `get()` on an observable inside an observing context it will track it for changes and re-run whenever it changes.

```typescript
observe(() => {
    console.log(settings$.theme.get())
})
```

### What tracks

`get()` is the primary way to access observables and track for changes, but there are actually a few ways:

1. Call `get()` on an observable: `settings.get()`
2. Array looping functions (shallow listener): `arr.map(settings.accounts, () => ...)`
3. Accessing array length (shallow listener): `if (arr.length > 0) ...`
4. Object.keys (shallow listener): `Object.keys(settings)`
5. Object.values (shallow listener): `Object.values(settings)`

These operations do not track:

1. Accessing through an observable: `state$.settings`
2. Call `peek()` on an observable: `settings.peek()`

### Observing examples

```typescript
const state$ = observable({
  settings: {
    theme: "dark",
  },
  chats: {
    messages: [{ id: 0, text: "hi" }],
  },
});

observe(() => {
  const theme = state$.settings.theme.get();
  // Tracking [state$.settings.theme] because of get()

  const theme = state$.settings.theme.peek();
  // Not tracking because of peek()

  const theme = state$.settings.get(true);
  // Tracking [state$.settings (shallow)] because of get(true)

  const settings$ = state$.settings;
  // Not tracking, just a reference to an observable

  state$.chats.messages.map((m) => <Message key={m.peek().id} message={m} />);
  // Tracking [state$.chats.messages (shallow)] because of map()

  const keys = Object.keys(state$.settings);
  // Tracking [state$.settings (shallow)] because of Object.keys
});
```

The automatic behavior can be modified with two observable functions:

| Function | Tracked |
|----------|---------|
| `get()` | yes |
| `peek()` | no |
| `get(true)` | shallow |
| `arr$.map(...)` | shallow |
| `arr$.length` | shallow |
| `Object.keys(state$)` | shallow |
| `Object.values(state$)` | shallow |

### get()

`get` returns the raw data of an observable and tracks it, so you can work with it without doing any further tracking. You may want to use `get()` to:

- Get the value of an observable wrapper of a primitive
- Track this object and not its individual fields. Minimizing the number of listeners is better for performance.

```typescript
const theme = state.settings.theme.get();
// Tracking [state.settings.theme]
```

### Shallow tracking

`get()` observes recursively by default, so any child changing will cause an update. You can modify it to be a shallow listener by just adding a `true` parameter. This can be useful when a component only needs to re-render if an object's keys or an array's items change. Array and Object functions also track shallowly - see [What tracks](#what-tracks) above.

```typescript
const state$ = observable({ messages: [] });

observe(() => {
  // Only need this to update when messages added/removed
  const messages = state$.messages.get(true);
  console.log("Latest message", messages[0]);
});
```

### Selectors

Many of the functions in Legend-State take a Selector, which can be either an observable or a function that returns a value based on observables. The selector is run in an observing context so that `get()` tracks an observable for changes. Whenever an observable changes, it re-runs the function.

Using `when` as an example of using Selectors:

```typescript
const isSignedIn$ = observable(false);
const isOnline$ = observable(false);

// A selector can be just an observable, which will be tracked for changes
await when(isSignedIn$);

// Or selector can be a function which tracks all get() calls for changes
await when(() => isSignedIn$.get() && isOnline$.get());
```

### observe

`observe` can run arbitrary code when observables change, and automatically tracks the observables accessed while running, so it will update whenever any accessed observable changes.

This can be useful to use multiple observables at once, for the benefit of cleanup effects, or if you just like it more than [onChange](#onchange).

The callback parameter has some useful properties:

- `num`: How many times it's run. Use this to do something only the first time or not the first time.
- `previous`: The previous value, which will be undefined on the first run and set to the return value
- `cancel`: Set to `true` to stop tracking the observables when you are done observing
- `onCleanup`: A function to call before running the selector again

`observe` has an optional second `reaction` parameter which will run after the selector, and does not track changes. This can be useful for observing an `event` or a single `observable`.

```typescript
import { observe, observable } from "@legendapp/state";

const state$ = observable({ isOnline: false, toasts: [] });

const dispose = observe((e) => {
  // This observe will automatically track state.isOnline for changes
  if (!state$.isOnline.get()) {
    // Show an "Offline" toast when offline
    const toast = { id: "offline", text: "Offline", color: "red" };
    state$.toasts.push(toast);

    // Remove the toast when the observe is re-run, which will be when isOnline becomes true
    e.onCleanup = () => state$.toasts.splice(state$.toasts.indexOf(toast), 1);
  }
});

// Cancel the observe
dispose();
```

Or use the second parameter to run a reaction when a selector changes. It has an additional `value` parameter, which contains the value of the selector.

```typescript
// Observe the return value of a selector and observe all accessed observables
observe(state$.isOnline, (e) => {
  console.log("Online status", e.value);
});

// Observe the return value of a selector and observe all accessed observables
observe(
  () => state$.isOnline.get() && state$.user.get(),
  (e) => {
    console.log("Signed in status", e.value);
  }
);
```

### when

`when` runs the given callback **only once** when the Selector returns a truthy value, and automatically tracks the observables accessed while running the Selector so it will update whenever one of them changes. When the value becomes truthy it will call the callback function and dispose the listeners.

It also returns a Promise that resolves when the Selector returns a truthy value that can be used instead of the callback function.

```typescript
import { when } from "@legendapp/state";

const state$ = observable({ ok: false });

// Option 1: Promise
await when(state$.ok);

// Option 2: callback
when(
  () => state$.ok.get(),
  () => console.log("Don't worry, it's ok")
);
```

### whenReady

`whenReady` is the same as `when` except it waits for objects and arrays to not be empty.

```typescript
import { whenReady } from "@legendapp/state";

const state$ = observable({ arr: [] });

whenReady(state$.arr, () => console.log("Array has some values"));
// Not ready yet

state$.arr.push("hello");
// "Array has some values"
```

### onChange

`onChange` listens to an observable for any changes anywhere within it. Use this as specifically as possible because it will fire notifications for every change recursively up the tree.

```typescript
const state$ = observable({ text: "hi" });

state$.text.onChange(({ value }) => console.log("text changed to", value));
state$.onChange(({ value }) => console.log("state changed to", value));

state$.text.set("hello");
// Log: text changed to "hello"
// Log: state changed to { text: "hello" }
```

`onChange` has some extra options for more advanced use:

1. `getPrevious`: Function to compare with the previous value. It is a function to let you opt into getting the previous value if needed, because it has some performance cost in cloning the object to compute the previous value.
2. `changes`: Array of all of the changes to this observable in the latest batch. This is intended mainly for internal usage by the persistence plugins to know what to sync/update and the history plugin to track all changes, but it may be good for other uses too.
3. `trackingType`: Whether to track only shallow changes
4. `initial`: Whether to run the callback immediately with the current value
5. `immediate`: Whether to run the callback immediately instead of within a batch. This is used internally by `computed` to make sure its value is always correct, but it may be useful for other specific uses.

```typescript
// Full example
state$.onChange(
  ({ value, getPrevious, changes }) => {
    const prev = getPrevious();
    changes.forEach(({ path, valueAtPath, prevAtPath }) => {
      console.log(valueAtPath, "changed at", path, "from", prevAtPath);
    });
  },
  { initial: true, trackingType: true }
);
```

#### Dispose of listeners

Listening to an observable returns a dispose function to stop listening. Just call it when you want to stop listening.

```typescript
const state$ = observable({ text: 'hello' })

const onChange = () => { ... }
const dispose = state$.text.onChange(onChange)

// Cancel listening manually
dispose()
```

## Batching

You may want to modify multiple observables at once without triggering callbacks for each change. Batching postpones renders and listeners until the end of the batch.

Batching can be done in two ways, wrapping between `beginBatch()` and `endBatch()` or in a callback with `batch(callback)`.

```typescript
import { batch, beginBatch, endBatch } from "@legendapp/state";

// Wrap in begin and end
beginBatch();
doManyChanges();
endBatch();

// Or batch with a callback
batch(() => {
  doManyChanges();
});
```

As we all know, you generally shouldn't optimize pre-emptively. `observable` functions like `assign` already batch changes under the hood, so listeners don't get called until the full change is complete. In many cases like setting unrelated observables you don't need to worry about it.

Batching is important in a few key situations:

### When observables depend on each other

Use `batch` to delay computations/renders until all dependent changes are complete or you might get weird intermediary states.

```typescript
const name$ = observable({ first: "", last: "" });
const fullName = observable(() => `${name$.first} ${name$.last}`);

observe(() => console.log("fullName = ", fullName.get()));

// Not batched:
name$.first.set("First");
name$.last.set("Last");
// fullName notifies its listeners with incomplete state
// fullName = "First "
// fullName = "First Last"

// Batched:
batch(() => {
  name$.first.set("First");
  name$.last.set("Last");
});
// fullName notifies only with final state
// fullName = "First Last"
```

### To prevent excessive renders

Making multiple changes in a row can cause React components and observers to re-run multiple times when they should wait until changes are complete.

```typescript
const state$ = observable({ items: [] });

function addItems() {
  for (let i = 0; i < 1000; i++) {
    state$.items.push({ text: `Item ${i}` });
  }
}

// This can render 1000 times while pushing to the array
addItems();

// Batching delays until complete and renders once
batch(addItems);
```

### When persisting

If you are using `synced` or `syncObservable` to automatically persist your changes, you can prevent excessive writes by delaying persistence until changes are complete. Pushing to an array 1000 times could save to storage 1000 times, which could be very slow!