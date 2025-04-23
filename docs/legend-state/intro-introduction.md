---
title: Introduction
---

# Introduction

Caution

Version 3 is in Beta and you can use it by installing the @beta version. If you're starting a new project we suggest starting with version 3 since it's much improved over version 2.

Legend-State is a super fast all-in-one local and remote state library that helps you write less code to make faster apps. We think you'll love it because it brings some huge benefits:

##### 1. Local and remote state

Legend-State handles local, global, and remote state all in one. Just `get()` and `set()` observables, and a robust sync engine makes sure your state is persisted locally and synced with your server.

##### 2. Great DX and less code

Just `use$` an observable to automatically re-render whenever it changes, and `set()` to update it. With the reduced boilerplate and everything that Legend-State does for you, you'll build better apps with less code.

```typescript
const state$ = observable({
    settings: { theme: 'dark' }
})

state$.settings.theme.set('light')

const Component = () => {
    const theme = use$(state$.settings.theme)
    return <div>Theme: {theme}</div>
}
```

##### 3. Fine grained reactivity for the best possible performance

Legend-State achieves much better performance than vanilla React and other state libraries because it does smaller re-renders less often, so your apps will load faster and run more smoothly.

## Legend-State has four primary goals:

### 1. 🦄 As easy as possible to use

There is no boilerplate and there are no contexts, actions, reducers, dispatchers, sagas, thunks, or epics. You can structure your data however you want in local state or global stores. It doesn't modify your data at all, and you can just call `get()` to get the raw data and `set()` to change it.

```typescript
import { observable, observe } from "@legendapp/state"
import { observer } from "@legendapp/state/react"

// Observables can be primitives or deep objects
const settings$ = observable({
    theme: 'dark'
    // Computed observables with just a function
    isDark: () => settings$.theme.get() === 'dark'
})

// get returns the raw data
settings$.theme.get() // 'dark'
// set sets
settings$.theme.set('light')

// observing contexts re-run when tracked observables change
observe(() => {
  console.log(settings$.theme.get())
})

function Component() {
    const theme = use$(state$.settings.theme)
    // use$ tracks get() calls to automatically re-render on changes
    const isDark = use$(() => state$.settings.theme.get() === 'dark')

    return <div>Theme: {theme}</div>
}
```

### 2. ⚡️ The fastest React state library

Legend-State beats every other state library on just about every metric and is so optimized for arrays that it even beats vanilla JS in some benchmarks. At only `4kb` and with the massive reduction in boilerplate code, you'll have big savings in file size too.

### 3. 🔥 Fine-grained reactivity for minimal renders

Legend-State helps your re-renders be smaller and less frequent, making your apps faster 🔥.

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

  return (
    <FlashingDiv pad>
      <h5>Fine-grained</h5>
      <div>Renders: {renderCount}</div>
      <div>Count: <Memo>{count$}</Memo></div>
    </FlashingDiv>
  )
}
```

### 4. 💾 Powerful sync and persistence

Legend-State includes a powerful persistence and sync engine. It easily enables local first apps by optimistically applying all changes locally first, retrying changes even after restart until they eventually sync, and syncing minimal diffs.

```typescript
const state$ = observable(
    users: syncedKeel({
        list: queries.getUsers,
        create: mutations.createUsers,
        update: mutations.updateUsers,
        delete: mutations.deleteUsers,
        persist: { name: 'users', retrySync: true },
        debounceSet: 500,
        retry: {
            infinite: true,
        },
        changesSince: 'last-sync',
    }),
    // direct link to my user within the users observable
    me: () => state$.users['myuid']
)

observe(() => {
    // get() activates through to state$.users and starts syncing.
    // it updates itself and re-runs observers when name changes
    const name = me$.name.get()
})

// Setting a value goes through to state$.users and saves update to server
me$.name.set('Annyong')
```

## Install

Version 3 is currently available in the @beta version and may change slightly before the final release.

## Highlights

- ✨ Super easy to use 😌
- ✨ Super fast ⚡️
- ✨ Super small at 4kb 🐥
- ✨ Fine-grained reactivity 🔥
- ✨ Built-in sync engine
- ✨ Works great with React Compiler
- ✨ No boilerplate
- ✨ Designed for maximum performance and scalability
- ✨ React components re-render only on changes
- ✨ Very strongly typed with TypeScript
- ✨ Persistence plugins for automatically saving/loading from storage
- ✨ State can be global or within components

The core is platform agnostic so you can use it in vanilla JS or any framework to create and listen to observables. It includes support for React and React Native, and has plugins for automatically persisting to storage.

