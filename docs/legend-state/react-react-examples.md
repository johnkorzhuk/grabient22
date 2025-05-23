---
title: React Examples
---

# React Examples

The examples on this page use [Tailwind CSS](https://tailwindcss.com) for styling and [Framer Motion](https://www.framer.com/motion) for animations. These examples all use the fine grained reactivity components so that the parent component renders only once and all renders are optimized to be as small as possible.

## Persisted global state

This example creates a global state object and persists it to Local Storage. Try changing the username and toggling the sidebar and refreshing - it will restore it to the previous state.

```typescript
import { observable } from "@legendapp/state"
import { syncObservable } from "@legendapp/state/sync"
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage"
import { $React } from "@legendapp/state/react-web"
import { motion } from "framer-motion"
import { useRef } from "react"

const state$ = observable({
  settings: { showSidebar: false, theme: 'light' },
  user: {
    profile: { name: '', avatar: '' },
    messages: {}
  }
})

// Persist state
syncObservable(state$, {
  local: 'persistenceExample',
  pluginLocal: ObservablePersistLocalStorage,
})

// Create a reactive Framer-Motion div
const MotionDiv = reactive(motion.div)

function App() {
  const renderCount = ++useRef(0).current

  const sidebarHeight = () => (
    state$.settings.showSidebar.get() ? 96 : 0
  )

  return (
    <Box>
      <div>Renders: {renderCount}</div>
      <div>Username:</div>
      <$React.input
        className="input"
        $value={state$.user.profile.name}
      />
      <Button onClick={state$.settings.showSidebar.toggle}>
        Toggle footer
      </Button>
      <MotionDiv
        className="footer"
        $animate={() => ({
           height: state$.settings.showSidebar.get() ?
             96 : 0
        })}
      >
        <div className="p-4">Footer</div>
      </MotionDiv>
    </Box>
  )
}
```

## Auto-saving Form

This example uses the `useObservableSyncedQuery` hook to create an observable using [TanStack Query](https://tanstack.com/query/) that automatically sends mutations back to the server whenever the observable changes.

It then uses the `Reactive` two-way binding components to bind those observable directly to the inputs.

So in effect this binds the inputs directly to your server data.

```typescript
import axios from "axios"
import { useRef } from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useObservable, $React, Memo } from "@legendapp/state/react"
import { useObservableSyncedQuery } from
    '@legendapp/state/sync-plugins/tanstack-react-query'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Example />
    </QueryClientProvider>
  )
}

function Example() {
  const renderCount = ++useRef(0).current
  const lastSaved$ = useObservable(0)
  const data$ = useObservableSyncedQuery({
    queryClient,
    query: {
      queryKey: ["data"],
      queryFn: () =>
        axios.get("https://reqres.in/api/users/1")
          .then((res) => res.data.data),
    },
    mutation: {
      mutationFn: (newData) => {
        // Uncomment to actually save
        /*
        debounce(() => {
          axios
            .post("https://reqres.in/api/users/1", newData)
            .then((res) =>
              lastSaved$.set(Date.now())
            )
        }, 1000)
        */
        lastSaved$.set(Date.now())
      }
    }
  })

  return (
    <Box>
      <div>
        Renders: {renderCount}
      </div>
      <div>Name:</div>
      <$React.input
        className="input"
        $value={data$.first_name}
      />
      <div>Email:</div>
      <$React.input
        className="input"
        $value={data$.email}
      />
      <div>
        Last saved: <Memo>{lastSaved$}</Memo>
      </div>
    </Box>
  )
}
```

## Form validating

This example uses `useObserve` to listen to changes in the form state to update the error messages as you type. It waits for the first click of the Save button for a better user experience.

```typescript
import { useRef } from "react"
import { useObservable, useObserve, $React, Memo, Show } from "@legendapp/state/react"

function App() {
  const renderCount = ++useRef(0).current

  const username$ = useObservable('')
  const password$ = useObservable('')
  const usernameError$ = useObservable('')
  const passwordError$ = useObservable('')
  const didSave$ = useObservable(false)
  const successMessage$ = useObservable('')

  useObserve(() => {
    if (didSave$.get()) {
      usernameError$.set(username$.get().length < 3 ?
        'Username must be > 3 characters' :
        ''
      )
      const pass = password$.get()
      passwordError$.set(
        pass.length < 10 ?
          'Password must be > 10 characters' :
          !pass.match(/\d/) ?
            'Password must include a number' :
            ''
      )
    }
  })

  const onClickSave = () => {
    // setting triggers useObserve, updating error messages
    didSave$.set(true)

    if (!usernameError$.get() && !passwordError$.get()) {
      console.log('Submit form')
      passwordError$.delete()
      successMessage$.set('Saved!')
    }
  }

  return (
    <Box>
      <div>Renders: {renderCount}</div>
      <div>Username:</div>
      <$React.input
        className="input"
        $value={username$}
      />
      <div className="error">
        <Memo>{usernameError$}</Memo>
      </div>
      <div>Password:</div>
      <$React.input
        type="password"
        className="input"
        $value={password$}
      />
      <div className="error">
        <Memo>{passwordError$}</Memo>
      </div>
      <Show if={successMessage$}>
        {() => (
          <div>
            {successMessage$.get()}
          </div>
        )}
      </Show>
      <Button onClick={onClickSave}>
        Save
      </Button>
    </Box>
  )
}
```

## List of messages

This example uses the `syncedFetch` helper to get data from a server as an observable, `useComputed` to create a computed observable, and `For` to display the array of messages in a high-performance way.

```typescript
import { For, $React, Show, useObservable, useObservable } from "@legendapp/state/react"
import { syncedFetch } from "@legendapp/state/sync-plugins/fetch"

let nextID = 0
function generateID() {
  return nextID ++
}

function App() {
  const renderCount = ++useRef(0).current

  // Create profile from fetch promise
  const profile$ = useObservable(syncedFetch({
    get: 'https://reqres.in/api/users/1'
  }))

  // Username
  const userName = useObservable(() => {
    const p = profile$.data.get()
    return p ?
        p.first_name + ' ' + p.last_name :
        ''
  })

  // Chat state
  const { messages, currentMessage } = useObservable({
    messages: [],
    currentMessage: ''
  })

  // Button click
  const onClickAdd = () => {
    messages.push({
      id: generateID(),
      text: currentMessage.get(),
    })
    currentMessage.set('')
  }

  return (
    <Box>
      <div>Renders: {renderCount}</div>
      <Show if={userName} else={<div>Loading...</div>}>
        <div>Chatting with <Memo>{userName}</Memo></div>
      </Show>
      <div className="messages">
        <For each={messages}>
          {(message) => <div>{message.text.get()}</div>}
        </For>
      </div>
      <div className="flex gap-2 items-center">
        <$React.input
          className="input"
          placeholder="Enter message"
          $value={currentMessage}
          onKeyDown={e => e.key === 'Enter' && onClickAdd()}
        />
        <Button onClick={onClickAdd}>
          Send
        </Button>
      </div>
    </Box>
  )
}
```

## Animations with reactive props

This example uses `reactive` to make a version of `motion.div` with reactive props that can animate using observable values. Animating with reactive props is faster than re-rendering the whole component because when the tracked observable changes it triggers a render of only the `motion.div`, so it doesn't need to re-render the parent or children.

This example also creates a computed observable text value from the boolean and renders it directly in JSX, which (under the hood) creates a reactive text element that re-renders itself when it changes.

```typescript
import { reactive } from "@legendapp/state/react"
import { motion } from "framer-motion"
import { useRef } from "react"
import { observable } from "@legendapp/state"
import { useComputed, useObservable, Memo } from "@legendapp/state/react"

const MotionDiv = reactive(motion.div)

function Toggle({ $value }) {
  return (
    <MotionDiv
      className="toggle"
      $animate={() => ({
        backgroundColor: $value.get() ? '#6ACB6C' : '#515153'
      })}
      style={{ width: 64, height: 32 }}
      onClick={$value.toggle}
    >
      <MotionDiv
        className="thumb"
        style={{ width: 24, height: 24, marginTop: 3 }}
        $animate={() => ({
          x: $value.get() ? 34 : 4
        })}
      />
    </MotionDiv>
  )
}

const settings$ = observable({ enabled: false })

function App() {
  const renderCount = ++useRef(0).current

  // Computed text value
  const text$ = useObservable(() => (
    settings$.enabled.get() ? 'Yes' : 'No'
))

  return (
    <Box>
      <div>Renders: {renderCount}</div>
      <div>
        Enabled: <Memo>{text$}</Memo>
      </div>
      <Toggle $value={settings$.enabled} />
    </Box>
  )
}
```


## Persistence with animations

This example shows:

1. State persisted to local storage
2. Reactive components

```typescript
import { observable } from "@legendapp/state"
import { syncObservable } from "@legendapp/state/sync"
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage"
import { $React } from "@legendapp/state/react-web"
import { motion } from "framer-motion"
import { useRef } from "react"

const state$ = observable({
  settings: { showSidebar: false, theme: 'light' },
  user: {
    profile: { name: '', avatar: '' },
    messages: {}
  }
})

// Persist state
syncObservable(state$, {
  local: 'persistenceExample',
  pluginLocal: ObservablePersistLocalStorage,
})

// Create a reactive Framer-Motion div
const MotionDiv = reactive(motion.div)

function App() {
  const renderCount = ++useRef(0).current

  const sidebarHeight = () => (
    state$.settings.showSidebar.get() ? 96 : 0
  )

  return (
    <Box>
      <div>Renders: {renderCount}</div>
      <div>Username:</div>
      <$React.input
        className="input"
        $value={state$.user.profile.name}
      />
      <Button onClick={state$.settings.showSidebar.toggle}>
        Toggle footer
      </Button>
      <MotionDiv
        className="footer"
        $animate={() => ({
           height: state$.settings.showSidebar.get() ?
             96 : 0
        })}
      >
        <div className="p-4">Footer</div>
      </MotionDiv>
    </Box>
  )
}
```

## Show a modal with multiple pages
```typescript
const MotionDiv = reactive(motion.div)
const MotionButton = reactive(motion.button)

const TransitionBounce = {
  type: 'spring',
  duration: 0.4,
  bounce: 0.3,
}

function Modal({ show }) {
  const renderCount = ++useRef(0).current
  const page$ = useObservable(0)

  return (
    <motion.div
      className="flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/60"
        onClick={() => show.set(false)}
      />
      <motion.div
        className="modal"
        initial={{ opacity: 0, scale: 0.7, translateY: 40 }}
        animate={{ opacity: 1, scale: 1, translateY: 0 }}
        exit={{ scale: 0.7, opacity: 0 }}
        style={{ width: 240, height: 320 }}
        transition={TransitionBounce}
      >
        <div>
          Renders: {renderCount}
        </div>
        <div className="pageText">
          <Switch value={page$}>
            {{
              0: () => <div>First Page</div>,
              1: () => <div>Second Page</div>,
              2: () => <div>Third Page</div>
            }}
          </Switch>
        </div>
        <div className="modalButtons">
          <MotionButton
            className="pageButton"
            animate={() => ({ opacity: page$.get() === 0 ? 0.5 : 1 })}
            $disabled={() => page$.get() === 0}
            onClick={() => page$.set(p => p - 1)}
            transition={{ duration: 0.15 }}
          >
            Prev
          </MotionButton>
          <MotionButton
            className="pageButton"
            animate={() => ({ opacity: page$.get() === 2 ? 0.5 : 1 })}
            $disabled={() => page$.get() === 2}
            onClick={() => page$.set(p => p + 1)}
            transition={{ duration: 0.15 }}
          >
            Next
          </MotionButton>
        </div>
      </motion.div>
    </motion.div>
  )
}


function App() {
  const renderCount = ++useRef(0).current

  const showModal = useObservable(false)

  return (
    <Box height={512}>
      <div>Renders: {renderCount}</div>
      <Button onClick={showModal.toggle}>
        Show modal
      </Button>
      <Show if={showModal} wrap={AnimatePresence}>
        {() => <Modal show={showModal} />}
      </Show>
    </Box>
  )
}
```

This example uses `Show` to show/hide a modal based on an observable value, and `Switch` to render the active page in the modal.

## Router

```typescript
import { useRef } from "react"
import { Memo, Switch } from "@legendapp/state/react"
import { pageHash } from "@legendapp/state/helpers/pageHash"
import { pageHashParams } from "@legendapp/state/helpers/pageHashParams"

function RouterExample() {
  const renderCount = ++useRef(0).current

  return (
    <Box width={240}>
      <div>Renders: {renderCount}</div>
      <div>
        <Button onClick={() => pageHashParams.page.delete()}>
          Go to root
        </Button>
        <Button onClick={() => pageHashParams.page.set('')}>
          Go to Page
        </Button>
        <Button onClick={() => pageHashParams.page.set('Home')}>
          Go Home
        </Button>
        <Button onClick={() => pageHashParams.page.set('asdf')}>
          Go to unknown
        </Button>
      </div>
        <div>Hash: <Memo>{pageHash}</Memo></div>
        <div className="p-4 bg-gray-600 rounded-xl">
          <Switch value={pageHashParams.page}>
            {{
              undefined: () => <div>Root</div>,
              '': () => <div>Page</div>,
              Home: () => <div>Home</div>,
              default: () => <div>Unknown page</div>,
            }}
          </Switch>
        </div>
    </Box>
  )
}
```

This section demonstrates how to implement routing functionality with Legend State.