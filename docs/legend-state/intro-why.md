---
title: Why
---

# Why

Legend-State is an evolution of the state system we've been using internally in Legend since 2015 and in Bravely since 2020. It needs to be extremely fast because Legend users have documents with hundreds of thousands of items. We recently rewrote it with modern browser features, optimizing for both developer experience and best possible performance / memory usage. Comparing to other state libraries, we think you'll prefer Legend-State for these reasons:

## ⚡️ Tiny and FAST

Legend-State is the fastest React state library, designed to be as efficient as possible. It does very little extra work and minimizes renders by only re-rendering components when their observables change. And at only `4kb` it won't hurt your bundle size.

## 😌 Feels natural

Working with observables is as simple as `get()` and `set()` - they work as you'd expect, and the observable functions are right there on the prototype.

```typescript
const state$ = observable({ value: 1 });
state$.value.get();
state$.value.set(2);

// Tracks automatically and runs on every change
observe(() => {
  console.log(state$.value.get());
});
```

## 🔥 Fine-grained reactivity

Using features like Memo it's easy to isolate renders to the smallest possible change.

```typescript
import { observable } from "@legendapp/state"
import { Memo, useObservable } from "@legendapp/state/react"
import { useRef, useState } from "react"
import { useInterval } from "usehooks-ts"

function NormalComponent() {
  const [count, setCount] = useState(1)
  const renderCount = useRef(1).current++

  useInterval(() => {
    setCount((v) => v + 1)
  }, 600)

  // This re-renders when count changes
  return (
    <FlashingDiv pad>
      <h5>Normal</h5>
      <div>Renders: {renderCount}</div>
      <div>Count: {count}</div>
    </FlashingDiv>
  )
}

function FineGrained() {
  const count$ = useObservable(1)
  const renderCount = useRef(1).current++

  useInterval(() => {
    count$.set((v) => v + 1)
  }, 600)

  // The text updates itself so the component doesn't re-render
  return (
    <FlashingDiv pad>
      <h5>Fine-grained</h5>
      <div>Renders: {renderCount}</div>
      <div>Count: <Memo>{count$}</Memo></div>
    </FlashingDiv>
  )
}
```

For isolating a group of elements or computations, Legend-State has built-in helpers to easily extract children so that their changes do not affect the parent. This keeps large parent components from rendering often just because their children change.

```typescript
import { useRef } from "react"
import { useInterval } from "usehooks-ts"
import { Memo, useObservable } from "@legendapp/state/react"

function MemoArrayExample() {
  const renderCount = ++useRef(0).current
  const messages$ = useObservable([])

  useInterval(() => {
    messages$.splice(0, 0, `Message ${messages$.length + 1}`)
  }, 600)

  return (
    <Box>
      <h5 className="renders">Renders: {renderCount}</h5>
      <div className="messages">
        <Memo>
          {() => (
            messages$.map((message$, i) => (
              <div key={i}>{message$.get()}</div>
            ))
          )}
        </Memo>
      </div>
    </Box>
  )
}
```

## 👷 Does not hack React internals

Some libraries hack up React internals to make signals and fine-grained reactivity work, which often doesn't work on all platforms and may break if React internals change.

Legend-State does everything above-board using hooks, with all React functionality built on top of `useSelector`, which just uses `useSyncExternalStore`.

## 🤷‍♀️ Unopinionated

Some state libraries are for global state while some want state to reside within React. Some enourage individual atoms and others are for large global stores. Some have "actions" and "reducers" and others require immutability. But you can use Legend-State any way you want.

- **Global state or local state in React**: Up to you 🤷‍♀️
- **Individual atoms or one store**: Up to you 🤷‍♀️
- **Modify directly or in actions/reducers**: Up to you 🤷‍♀️

See [Patterns] for more examples of different ways to use Legend-State.

## 💾 Persistence and sync

> There are only two hard things in Computer Science: cache invalidation and naming things. - Phil Karlton

We built Legend-State to be both the state and sync engines shared between both Legend and Bravely. So it includes a very full-featured sync and persistence system that we've iterated on and optimized for years in production. It's designed to support local first apps: any changes made while offline are persisted between sessions to be retried whenever connected.

It currently includes plugins for local persistence with Local Storage or IndexedDB on web and react-native-mmkv or AsyncStorage in React Native.

It has a flexible sync API for all types of backends, and a growing library of plugins for backends like Keel and Firebase Realtime Database.

```typescript
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
import { synced } from '@legendapp/state/sync'
import { observable } from '@legendapp/state'

const state$ = observable({
    initial: {
        { bigObject: { ... } }
    },
    get: () => fetch('url').then(res => res.json()),
    set: ({ value }) =>
        fetch('https://url.to.set', { method: 'POST', data: JSON.stringify(value) }),
    persist: {
        name: 'test'
    }
})
```

## 🔫 It's safe from footguns

Observables prevent direct assignment, favoring more purposeful `set` and `assign` functions instead.