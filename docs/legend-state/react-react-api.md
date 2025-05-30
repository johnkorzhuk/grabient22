---
title: React API
---

# React API

## Reading state

### use$

> Note: In previous version this was called useSelector. If you were using `useSelector` it will still work for a while, but we suggest changing them to `use$` as we'll remove `useSelector` in a later version. Many people were unsure of what a "selector" was so it was unclear what it did. Plus, `use$` is shorter 😀

`use$` computes a value and automatically listens to any observables accessed while running, and only re-renders if the computed value changes. This can take either an observable or a function that consumes observables.

Props:
- `selector`: Observable or computation function that listens to observables accessed while running
- `options`: `{ suspense: boolean }`: Enable suspense when the value is a Promise and you're using it within React.Suspense.

```typescript
import { observable } from "@legendapp/state"
import { use$ } from "@legendapp/state/react"

const state$ = observable({ selected: 1, theme })

const Component = ({ id }) => {
    // Only re-renders if the return value changes
    const isSelected = use$(() => id === state$.selected.get())

    // Get the raw value of an observable and re-render when it changes
    const theme = use$(state$.theme)
    ...
}
```

#### Using with React Suspense

Using `{ suspense: true }` as the second parameter makes the component work with Suspense. If the observable is a Promise, Suspense will render the fallback until it resolves to a non-undefined value.

```typescript
import { useObservable, useSelector } from "@legendapp/state/react"
import { Suspense } from "react"

function Test({ state$ }) {
  const value = useSelector(state$, { suspense: true })
  return <div>{value}</div>
}

export default function App() {
  const state$ = useObservable(
    new Promise((resolve) => {
      setTimeout(() => {
        resolve("hello")
      }, 1000)
    })
  )

  return (
    <div>
      <div>Suspense test</div>
      <Suspense fallback={<div>Loading...</div>}>
        <Test state$={state$} />
      </Suspense>
    </div>
  )
}
```

### observer

`observer` is a good optimization if you have want to consume observables/selectors conditionally or if you consume many of them in one component. It inserts a single hook into the component and tracks all observables in the one hook. Because `use$` normally runs three hooks, this can drastically reduce the number of hooks in your components if you use `use$` many times.

> Note: Although observer looks like an HOC, it actually creates a Proxy around the component, with effectively no performance cost. It tracks all overable access with a single hook so it is much more efficient than using multiple hooks.

```typescript
import { observable } from "@legendapp/state"
import { observer, use$ } from "@legendapp/state/react"

const state$ = observable({ count: 0 })

const Component = observer(function Component() {
  // Accessing state automatically makes this component track changes to re-render
  const count = use$(state$.count)

  // Re-renders whenever count changes
  return <div>{count}</div>
})
```

### useObserve

`useObserve` creates an observe which you can use to take actions when observables change. This can be effectively similar to `useEffect` for observables, except that it runs when observables change and not because of a deps array changing.

Like `observe`, `useObserve` has an optional second callback parameter which will run after the selector, and does not track changes. This can be useful for observing an `event` or a single `observable`.

Note that `useObserve` runs during component render, not after render like `useEffect`. If you want an observer that runs after render, see useObserveEffect.

```typescript
import { event } from "@legendapp/state"
import { $React } from "@legendapp/state/react-web"
import { useObserve, useObservable, $React } from "@legendapp/state/react"

const eventUpdateTitle = event()

function ProfilePage() {
  const profile$ = useObservable({ name: "" })

  // This runs whenever profile changes
  useObserve(() => {
    document.title = `${profile$.name.get()} - Profile`
  })

  // Observe a single observable with a callback when it changes
  useObserve(profile$.name, ({ value }) => {
    document.title = `${value} - Profile`
  })

  // Observe an event with a callback when it changes
  useObserve(eventUpdateTitle, () => {
    document.title = `${profile$.name.get()} - Profile`
  })

  return (
    <div>
      <span>Name:</span>
      <$React.input $value={profile$.name} />
    </div>
  )
}
```

### useObserveEffect

`useObserveEffect` is the same as useObserve except that it runs after the component is mounted.

### useWhen, useWhenReady

These are hook versions of when.

## Hooks for creating local state

### useObservable

The `useObservable` hook creates an observable within a React component. This can be useful when state is specific to the lifetime of the component, or to hold multiple values in local state.

Its observables will not be automatically tracked for re-rendering, so you can track them the same as any other observable.

As with normal observables you can create a computed observable by just using a function.

```typescript
import { observer, useObservable } from "@legendapp/state/react"

const Component = function Component() {
    const state$ = useObservable({
        title: 'Title',
        first: '',
        last: '',
        profile: {...}
    })

    const fullname$ = useObservable(() => `${state$.fname.get()} ${state$.lname.get()}`)

    return (
        <div>
            <div>{fullname$}</div>
            <Input text={state$.first} />
            <Input text={state$.last} />
            <Profile name={fullname$} />
        </div>
    )
}
```

### useObservableReducer

`useObservableReducer` works the same way as `useReducer` but sets an observable rather than triggering a render.

```typescript
import { useObservableReducer } from "@legendapp/state/react"

function reducer(state, action) {
    if (action.type === 'incremented_age') {
        return {
            age: state.age + 1
        }
    }
}

const Component = () => {
    // Only re-renders if the return value changes
    const [age$, dispatch] = useObservableReducer(reducer, { age: 42 })

    // Get the value of the reducer
    const theme = age$.get()
}
```

### Using with Context

Passing an observable object through Context gives you all the benefits of Context without the downsides, like any change to context normally re-renders all consumers.

Simply set an observable as a Context value and consume it from a child component as usual. The observable itself is a stable object so useContext will never cause a re-render - only observing contexts will be updated as usual.

```typescript
import { createContext, useContext } from "react"
import { observer, useObservable } from "@legendapp/state/react"

interface UserState {
    profile: {
        name: string;
    };
}

// Create a typed context. It can have a default value of undefined because
// the Provider will always be created with an Observable.
const StateContext = createContext<Observable<UserState>>(undefined as any);

function App() {
  const state$ = useObservable({
    profile: {
      name: "",
    },
  })

  return (
    <StateContext.Provider value={state$}>
      <div>
        <Sidebar />
        <Main />
      </div>
    </StateContext.Provider>
  )
}

const Sidebar = function Sidebar() {
  // StateContext will never change so this will never cause a render
  const state$ = useContext(StateContext)

  // This component never re-renders, but name re-renders itself
  return (
    <div>
      Name: <Memo>{state$.profile.name}</Memo>
    </div>
  )
}
```

## Miscellaneous hooks

### useEffectOnce

This is `useEffect` with a workaround in development mode to make sure it only runs once.

```typescript
import { useEffectOnce } from "@legendapp/state/react"

const Component = () => {
  useEffectOnce(() => {
    console.log("mounted")
  }, [])
}
```

### useMount

Using observable hooks we generally avoid the built-in hooks and dependency arrays, so we have `useMount` and `useUnmount` hooks for convenience, which are just `useEffectOnce` under the hood.

```typescript
import { useMount } from "@legendapp/state/react"

const Component = () => {
  useMount(() => console.log("mounted"))
}
```

### useUnmount

Like the `useMount` hook, `useUnmount` just uses `useEffectOnce` under the hood.

```typescript
import { useUnmount } from "@legendapp/state/react"

const Component = () => {
  useUnmount(() => console.log("mounted"))
}
```

### usePauseProvider

This creates a React Context Provider with a `paused$` observable. Set `paused$` to `true` to pause all rendering from observable changes under the context, and set it `false` to resume. This applies to everything within Legend-State like observer, useSelector, $React, Memo, etc... But normal renders coming from React or other state is not affected.

This can be very useful to stop all updating when UI is not even visible, such as when a fullscreen modal is covering app UI or in inactivate tabs in React Native.

```typescript
import { useInterval } from "usehooks-ts"
import { Memo, usePauseProvider, useObservable } from '@legendapp/state/react'

function App() {
    const { PauseProvider, isPaused$ } = usePauseProvider()
    const int$ = useObservable(0)
    
    useInterval(() => {
        int$.set((val) => val + 1)
    }, 100)

    return (
        <Box center>
            <Button onClick={isPaused$.toggle}>
                <Memo>{() => (isPaused$.get() ? 'Resume' : 'Pause')}</Memo>
            </Button>
            <PauseProvider>
                <Memo>{int$}</Memo>
            </PauseProvider>
        </Box>
    )
}