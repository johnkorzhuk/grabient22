A primary goal of Legend-State is to make automatic persisting and syncing both easy and very robust, as it’s meant to be used to power all storage and sync of complex apps - it was built as the backbone of both [Legend](https://legendapp.com) and [Bravely](https://bravely.io). It’s designed to support local first apps: any changes made while offline are persisted between sessions to be retried whenever connected. To do this, the sync engine subscribes to changes on an observable, then on change goes through a multi-step flow to ensure that changes are persisted and synced.

1.  Save the pending changes to local persistence
2.  Save the changes to local persistence
3.  Save the changes to remote persistence
4.  On remote save, set any needed changes (like updatedAt) back into the observable and local persistence
5.  Clear the pending changes in local persistence

## Plugins

The sync features are designed to be used through a plugin for your backend of choice. The plugins are all built on top of [synced](#synced) and are configurable with their own options as well as general sync and persist options.

### Database plugins

*   [Keel](../keel): Powerful schema-driven SQL backend we use in Bravely
*   [Supabase](../supabase): Popular PostgreSQL backend
*   Firebase RTDB: Documentation under construction

These are built on top of the CRUD plugin.

### General

*   [CRUD](../crud): Supports any backend with list, get, create, update, delete actions
*   [Fetch](../fetch): A wrapper around fetch to reduce boilerplate
*   [TanStack Query](../tanstack-query): Query updates observables rather than re-rendering

## Example

We’ll start with an example to give you an idea of how Legend-State’s sync works. Because sync and persistence are defined in the observables, your app and UI just needs to work with observables. That immediately updates the UI optimistically, persists changes, and syncs to your database with eventual consistency.

This example binds inputs directly to the remote data and shows you when the changes save. Try going offline and making some changes, then refresh and the changes are still there. Then go back online and watch the saved time update. You may want to open the Network panel of the dev tools to see it in action.

This is a live playground so you can experiment with the different options.

(()=>{var i=t=>{let e=async()=>{await(await t())()};"requestIdleCallback"in window?window.requestIdleCallback(e):setTimeout(e,200)};(self.Astro||(self.Astro={})).idle=i;window.dispatchEvent(new Event("astro:idle"));})();

import { observable } from "@legendapp/state"
import { use$ } from "@legendapp/state/react"
import { configureSynced } from "@legendapp/state/sync"
import { syncedFetch } from "@legendapp/state/sync-plugins/fetch";
import { ObservablePersistLocalStorage } from
    "@legendapp/state/persist-plugins/local-storage"
// Setup global sync and persist configuration. These can be overriden
// per observable.
const mySyncedFetch \= configureSynced(syncedFetch, {
    persist: {        plugin: ObservablePersistLocalStorage,        retrySync: true // Persist pending changes and retry    },    retry: {        infinite: true // Retry changes with exponential backoff    }
})
// Create a synced observable
const profile$ \= observable(mySyncedFetch({
    get: 'https://reqres.in/api/users/1',    set: 'https://reqres.in/api/users/1',    setInit: { method: 'PUT' },
    // Transform server data to local format    transform: {        load: (value, method) \=> method \=== 'get' ? value.data : value    },
    // Update observable with updatedAt time from server    onSaved: (result) \=> ({ updatedAt: new Date(result.saved.updatedAt) }),
    // Persist in local storage    persist: {        name: 'persistSyncExample',    },
    // Don't want to overwrite updatedAt    mode: 'assign'
}))
function App() {
    const updatedAt \= use$(profile$.updatedAt)    const saved \= updatedAt ? new Date(updatedAt).toLocaleString() : 'Never'
    return (        <Box\>            <$React.input $value={profile$.first\_name} />            <$React.input $value={profile$.last\_name} />            <div\>                Saved: {saved}            </div\>        </Box\>    )
}

Live Editing

Saved: Never

## Guides

This page will show how you use the core [synced](#synced). The plugins are built on top of `synced` so everything on this page applies to the plugins as well.

#### Which Platform?

Select React or React Native to customize this guide for your platform.

astro-island,astro-slot,astro-static-slot{display:contents}(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event("astro:only"));})();;(()=>{var v=Object.defineProperty;var A=(c,s,a)=>s in c?v(c,s,{enumerable:!0,configurable:!0,writable:!0,value:a}):c\[s\]=a;var d=(c,s,a)=>(A(c,typeof s!="symbol"?s+"":s,a),a);var u;{let c={0:t=>m(t),1:t=>a(t),2:t=>new RegExp(t),3:t=>new Date(t),4:t=>new Map(a(t)),5:t=>new Set(a(t)),6:t=>BigInt(t),7:t=>new URL(t),8:t=>new Uint8Array(t),9:t=>new Uint16Array(t),10:t=>new Uint32Array(t)},s=t=>{let\[e,n\]=t;return e in c?c\[e\](n):void 0},a=t=>t.map(s),m=t=>typeof t!="object"||t===null?t:Object.fromEntries(Object.entries(t).map((\[e,n\])=>\[e,s(n)\]));customElements.get("astro-island")||customElements.define("astro-island",(u=class extends HTMLElement{constructor(){super(...arguments);d(this,"Component");d(this,"hydrator");d(this,"hydrate",async()=>{var f;if(!this.hydrator||!this.isConnected)return;let e=(f=this.parentElement)==null?void 0:f.closest("astro-island\[ssr\]");if(e){e.addEventListener("astro:hydrate",this.hydrate,{once:!0});return}let n=this.querySelectorAll("astro-slot"),r={},l=this.querySelectorAll("template\[data-astro-template\]");for(let o of l){let i=o.closest(this.tagName);i!=null&&i.isSameNode(this)&&(r\[o.getAttribute("data-astro-template")||"default"\]=o.innerHTML,o.remove())}for(let o of n){let i=o.closest(this.tagName);i!=null&&i.isSameNode(this)&&(r\[o.getAttribute("name")||"default"\]=o.innerHTML)}let h;try{h=this.hasAttribute("props")?m(JSON.parse(this.getAttribute("props"))):{}}catch(o){let i=this.getAttribute("component-url")||"<unknown>",b=this.getAttribute("component-export");throw b&&(i+=\` (export ${b})\`),console.error(\`\[hydrate\] Error parsing props for component ${i}\`,this.getAttribute("props"),o),o}let p;await this.hydrator(this)(this.Component,h,r,{client:this.getAttribute("client")}),this.removeAttribute("ssr"),this.dispatchEvent(new CustomEvent("astro:hydrate"))});d(this,"unmount",()=>{this.isConnected||this.dispatchEvent(new CustomEvent("astro:unmount"))})}disconnectedCallback(){document.removeEventListener("astro:after-swap",this.unmount),document.addEventListener("astro:after-swap",this.unmount,{once:!0})}connectedCallback(){if(!this.hasAttribute("await-children")||document.readyState==="interactive"||document.readyState==="complete")this.childrenConnectedCallback();else{let e=()=>{document.removeEventListener("DOMContentLoaded",e),n.disconnect(),this.childrenConnectedCallback()},n=new MutationObserver(()=>{var r;((r=this.lastChild)==null?void 0:r.nodeType)===Node.COMMENT\_NODE&&this.lastChild.nodeValue==="astro:end"&&(this.lastChild.remove(),e())});n.observe(this,{childList:!0}),document.addEventListener("DOMContentLoaded",e)}}async childrenConnectedCallback(){let e=this.getAttribute("before-hydration-url");e&&await import(e),this.start()}async start(){let e=JSON.parse(this.getAttribute("opts")),n=this.getAttribute("client");if(Astro\[n\]===void 0){window.addEventListener(\`astro:${n}\`,()=>this.start(),{once:!0});return}try{await Astro\[n\](async()=>{let r=this.getAttribute("renderer-url"),\[l,{default:h}\]=await Promise.all(\[import(this.getAttribute("component-url")),r?import(r):()=>()=>{}\]),p=this.getAttribute("component-export")||"default";if(!p.includes("."))this.Component=l\[p\];else{this.Component=l;for(let y of p.split("."))this.Component=this.Component\[y\]}return this.hydrator=h,this.hydrate},e,this)}catch(r){console.error(\`\[astro-island\] Error hydrating ${this.getAttribute("component-url")}\`,r)}}attributeChangedCallback(){this.hydrate()}},d(u,"observedAttributes",\["props"\]),u))}})();

React

React Native

### Persist data locally

Legend-State has a persistence system built in, with plugins for web and React Native. When you initialize the persistence it immediately loads and merges the changes on top of the initial value. Then any changes you make after initialization will be saved to persistence.

You can sync/persist a whole observable or any child, and there are two ways to persist observables: `synced` in the observable constructor or `syncObservable` later.

In this first example we create an observable with initial data and then use `syncObservable` to persist it.

```
import { observable } from "@legendapp/state"import { syncObservable } from "@legendapp/state/sync"import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage"
// Create an observableconst store$ = observable({  todos: [],})
// Persist the observable to the named key of the global persist pluginsyncObservable(store$, {    persist: {        name: 'persistKey',        plugin: ObservablePersistLocalStorage    }})
// Any changes made after syncObservable will be persistedstore$.todos.push({ id: 0 })
```

Alternatively we can setup the persistence in the constructor with `synced`. This does exactly the same thing as above.

```
import { observable } from "@legendapp/state"import { synced } from "@legendapp/state/sync"
// Create an observable with "todos" persistedconst store$ = observable(    synced({        initial: [],        persist: {            name: 'persistKey',        }    }))
// Any changes will be persistedstore$.todos.push({ id: 0 })
```

Note

The key difference between syncObservable and synced is that syncObservable starts syncing when you call it, while synced creates a lazy computed function that activates when you `get()` it.

#### Async persistence

Some persistences like IndexedDB and AsyncStorage are asynchronous, so you’ll need to wait for it to load before you start reading from it. `syncState` returns an observable with load statuses that you can wait for.

```
import { syncState } from "@legendapp/state"import { syncObservable } from '@legendapp/state/sync'
syncObservable(state$, {    persist: {        name: 'store'    }})const status$ = syncState(state$)await when(status$.isPersistLoaded)// Proceed with load
```

### Sync with a server

Legend-State makes syncing remote data very easy, while being very powerful under the hood. You can setup your sync engine directly in the observable itself, so that your application code only interacts with observables, and the observables handle the sync for you.

This is a great way to isolate your syncing code in one place away from your UI, and then your UI code justs gets/sets observables.

Like with [persistence](#persist-data-locally) you can use either `syncObservable` or `synced` but we’ll just focus on `synced` for this example.

```
import { observable, observe } from "@legendapp/state"import { syncedFetch } from "@legendapp/state/sync-plugins/fetch"
// Create an observable with "users" syncedconst store$ = observable({    users: syncedFetch({        initial: [],        // When the fetch resolves it will update the observable        get: 'https://reqres.in/api/users',        // When the observable is changed it will send the changes back to the server.        set: 'https://reqres.in/api/users'    })})
observe(() => {    // The first get() activates the synced get function to fetch the data    // observe is re-run when the data comes in    const users = store$.users.get()    if (users) {        processUsers(users)    }})
// Any changes will be savedstore$.users.push({ id: 0, name: 'name' })
```

### Sync with paging

`get()` is an observing context, so if you get an observable’s value it will re-run if it changes. We can use that to created a paging query by setting the query mode to “append” (or “assign” if it’s an object) to append new pages into the observable array.

```
import { observable, observe } from "@legendapp/state"import { syncedFetch } from "@legendapp/state/sync-plugins/fetch"
// Create an observable with "users" syncedconst store$ = observable({    usersPage: 1,    users: syncedFetch({        get: () => `https://reqres.in/api/users?page=${store$.usersPage.get()}`,        mode: 'append'    }),})
// Activate the synced to get the first pagestore$.users.get()// gets from https://reqres.in/api/users?page=1
// Get the next pagestore$.usersPage.set(page => page + 1)// gets from https://reqres.in/api/users?page=2
```

### Local first robust real-time sync

The crud based plugins can be used to enable a robust offline-first sync engine by setting a few options. These options will:

*   Persist all data locally so the app can work offline
*   Continually retry saves so that failure is not an option
*   Persist saves locally so that they retry even after refresh
*   Sync in realtime

```
import { observable } from '@legendapp/state'import { syncedCrud } from '@legendapp/state/sync-plugins/crud'import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
const profile$ = observable(syncedCrud({    list: () => {/*...*/},    create: () => {/*...*/},    update: () => {/*...*/},    // Enable realtime. Some plugins have this built in so it's not required.    subscribe: ({ refresh, update }) => {        return realtime.subscribe({ /*...*/ }, () => {            // Trigger a refresh of the list function            refresh()        })    },    // Local first configuration    persist: {        plugin: ObservablePersistLocalStorage, // Set the persistence plugin        name: 'profile', // Set the name of this object in persistence        retrySync: true, // Persist pending changes to retry    },    retry: {        infinite: true, // Keep retrying until it saves    },    changesSince: 'last-sync', // Sync only diffs    fieldUpdatedAt: 'updatedAt' // Required for syncing only diffs}))
```

## API

### configureSynced

Sync plugins have a lot of options so you’ll likely want to set some defaults. You can do that with the `configureSynced` function to create a customized version of a plugin with your defaults, to reduce duplication and enforce consistency. You will most likely want to at least set a default persistence plugin.

```
import { configureSynced, syncedCrud } from "@legendapp/state/sync"import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage"
// Configure the base `synced`const syncPlugin = configureSynced({    persist: {        plugin: ObservablePersistMMKV    }})
// Or configure options derived from another pluginconst syncPlugin = configureSynced(syncedCrud, {    persist: {        plugin: ObservablePersistMMKV    }})
// Then using them will merge the options on top of the defaults.const state$ = observable(syncPlugin({    persist: {        name: 'test',    }}))
```

### synced

The easiest way to create a synced observable is to use `synced` when creating an observable to bind it to remote data and/or persist it locally. To simply set up persistence, just create `get` and `set` functions along with a `persist` option.

`synced` creates a lazy computed function which will not activate until you `get()` it. So you can set up your observables’ sync/persist options and they will only activate on demand.

Note

get() is an observing context, so if you get an observable’s value it will re-run if it changes. You can use that for paging or updating your queries.

```
import { observable } from '@legendapp/state'import { synced } from '@legendapp/state/sync'
const state$ = observable(synced({    get: () =>        fetch('https://url.to.get').then((res) => res.json()),    set: ({ value }) =>        fetch('https://url.to.set', { method: 'POST', data: JSON.stringify(value) }),    persist: {        name: 'test',    },}))
```

Or a more advanced example with many of the possible options:

```
import { observable } from '@legendapp/state'import { synced } from '@legendapp/state/sync'import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
const state$ = observable(synced({    get: () => {        // get is an observing function which will re-run whenever any accessed observables        // change. You can use that for paging getting data for a specific user.        return fetch('https://url.to.get/page=' + page.get())                .then((res) => res.json())    },    set: ({ value }) => {        // set is run when the observable changes, debounced by the debounceSet option        fetch('https://url.to.set', { method: 'POST', data: JSON.stringify(value) })    }    persist: {        // The name to be saved in the local persistence        name: 'test',        // Set the plugin to override the global setting        plugin: ObservablePersistMMKV,        // persist pending changes to be retried after the app restarts        retrySync: true,        options: {            // Customize the persist plugin options        }    },    // The initial value before the remote data loads or if it doesn't exist.    initial: {        numUsers: 0,        messages: []    },    // How to update the initial value when the remote data comes in.    // defaults to "set"    mode: 'set' | 'assign' | 'merge' | 'append' | 'prepend',    // The subscribe function is called once to give you an opportunity to    // subscribe to another service to trigger refresh    subscribe: ({ refresh, update }) => {        const unsubscribe = pusher.subscribe({ /*...*/ }, (data) => {            // Either update with the received data            update(data)            // Or trigger a refresh of the get function            refresh()        })        // return unsubscribe function        return unsubscribe    },    // Options for retrying in case of error. Applies to both get and set.    retry: {        infinite: true,        backoff: 'exponential',        maxDelay: 30    },    // A time to debounce changes before sending them to the server. Use this to    // batch multiple changes together or preventing saving every keystroke.    debounceSet: 500,}))
```

### syncObservable

If you prefer to set up sync/persistence after the observable is already created, you can use `syncObservable` with the same options as `synced`. It’s effectively the same as using `synced` with an initial value. You can also pass any of the plugins as the second option.

```
import { observable } from '@legendapp/state'import { syncObservable } from '@legendapp/state/sync'
const state$ = observable({ initialKey: 'initialValue' })
syncObservable(state$, {    get: () =>        fetch('https://url.to.get').then((res) => res.json()),    set: ({ value }) =>        fetch('https://url.to.set', { method: 'POST', data: JSON.stringify(value) }),    persist: {        name: 'test'    }})
```

You can also use any sync plugin with syncObservable.

```
import { observable } from '@legendapp/state'import { syncObservable } from '@legendapp/state/sync'import { syncedFetch } from "@legendapp/state/sync-plugins/fetch"
const users$ = observable([])
syncObservable(users$, syncedFetch({    // When the fetch resolves it will update the observable    get: 'https://reqres.in/api/users',    // When the observable is changed it will send the changes back to the server.    set: 'https://reqres.in/api/users'}))
```

### syncState

Each synced observable has a `syncState` observable that you can get to check its status or do some actions.

```
import { observable, syncState } from '@legendapp/state'import { synced } from '@legendapp/state/sync'
const obs$ = observable(synced({ /*...*/ }))const state$ = syncState(obs$)const error = state$.error.get()const isLoaded = state$.isLoaded.get()
if (error) {    // Handle error} else if (!isLoaded) {    // Do something while loading} else {    // Good to go    const value = obs$.get()}
```

The `isLoaded` and `error` properties are accessible when using `syncState` on any asynchronous Observable, but the others are created when using `synced`.

*   `isPersistLoaded: boolean`: Whether it has loaded from the local persistence
*   `isPersistEnabled: boolean`: Enable/disable the local persistence
*   `isLoaded: boolean`: Whether the get function has returned
*   `isSyncEnabled: boolean`: Enable/disable remote sync
*   `lastSync: number`: Timestamp of the latest sync
*   `syncCount: number`: Number of times it’s synced
*   `clearPersist: () => Promise<void>`: Clear the local persistence
*   `sync: () => Promise<void>`: Re-run the get function
*   `getPendingChanges: () => Record<string, object>`: Get all unsaved changed
*   `error: Error`: The latest error

### useObservable + synced

Create a synced observable within a React component using [useObservable](../../react/react-api#useobservable).

```
import { synced } from '@legendapp/state/sync'import { useObservable } from '@legendapp/state/react'
function Component() {    const user$ = useObservable(synced({        get: fetch('https://url.to.get').then((res) => res.json()),        persist: {            name: 'test'        }    }))}
```

### Transform data

It’s very common to need to transform data into and out of your persistence or remote server. There is an option on `synced` to transform the remote data and an option within the `persist` option to transform to/from persistence.

Legend-State includes helpers for easily stringifying data or you can create your own custom transformers.

*   `transformStringifyKeys`: JSON stringify/parse the data at the given keys, for when your backend stores objects as strings
*   `transformStringifyDates`: Transform dates to ISO string, with either the given keys or automatically scanning the object for dates
*   `combineTransforms`: Combine multiple transforms together

This can be used in many ways. Some examples:

1.  **Migrate between versions**: If the local data has legacy values in it, you can can transform it to the latest format. This can be done by either keeping a version number or just checking for specific fields. This example migrates old persisted data by checking the version and old field name.

```
const state$ = observable(synced({    get: () => {/* ... */},    persist: {        name: 'state',        transform: {            load: (value) => {                if (value.version === 2) {                    if (value.currentPeriodStart) {                        value.periodStart = new Date(value.currentPeriodStart * 1000)                        delete value.currentPeriodStart                    }                }                return value            }        }    }}))
```

2.  **Transform to backend format**: If you want to interact with data in a different format than your backend stores it, it can be automatically transformed between the observable and the sync functions. This could be used for stringifying or parsing dates for example. In this example we combine the `transformStringifyDates` and `transformStringifyKeys` helpers with a custom transformer.

```
import { combineTransforms, transformStringifyDates } from '@legendapp/state/sync'const state$ = observable(synced({    get: () => {/* ... */},    transform: combineTransforms(        transformStringifyDates(),        transformStringifyKeys('jsonData', 'messagesArr'),        {            load: async (value) => {                value.localBool = value.serverOption !== 'no'                delete value.serverOption                return value            },            save: async (value) => {                value.serverOption = value.localBool ? 'yes' : 'no'                delete value.localBool                return value            }        }    )}))
```

3.  **Encrypt**: For end-to-end encryption you can encrypt/decrypt in the transformer so that you interact with unencrypted data locally and it’s encrypted before going into your update functions

```
import { combineTransforms, transformStringifyDates } from '@legendapp/state/sync'const state$ = observable(synced({    get: () => {/* ... */},    transform: {        load: async (value) => {            return decrypt(value)        },        save: async (value) => {            return encrypt(value)        }    }}))
```

## Persist plugins

First choose and configure the storage plugin for your platform.

### Local Storage (React)

```
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'
syncObservable(state$, {    persist: {        name: "documents",        plugin: ObservablePersistLocalStorage    }})
```

### IndexedDB (React)

The IndexedDB plugin can be used in two ways:

1.  Persisting a dictionary where each value has an `id` field, and each value will create a row in the table
2.  Persisting multiple observables to their own rows in the table with the `itemID` option

It requires some extra configuration for the database name, the table names, and the version.

IndexedDB requires changing the version whenever the tables change, so you can start with version 1 and increment the version whenever you add/change tables.

```
import { configureSynced, syncObservable } from "@legendapp/state/sync"import { observablePersistIndexedDB } from "@legendapp/state/persist-plugins/indexeddb"
// Create default persist optionsconst persistOptions = configureSynced({    persist: {        plugin: observablePersistIndexedDB({            databaseName: "Legend",            version: 1,            tableNames: ["documents", "store"]        })    }})
// Mode 1: Persist a dictionaryconst state$ = observable({    obj1: { id: "obj1", text: "..." },    obj2: { id: "obj2", text: "..." },})
syncObservable(state$, persistOptions({    persist: {        name: "documents" // IndexedDB table name    }}))
// Mode 2: Persist an object with itemIdconst settings$ = observable({ theme: "light" })
syncObservable(settings$, persistOptions({    persist: {        name: "store", // IndexedDB table name        indexedDB: {            itemID: "settings"        }    }}))
```

Because IndexedDB is an asynchronous API, observables will not load from persistence immediately, so if you’re persisting a large amount of data you may want to show a loading state while persistence is loading.

```
const syncState$ = syncState(state$)await when(syncState$.isPersistLoaded)// Continue with load
```

### MMKV (RN)

First install react-native-mmkv:

bun

npm

yarn

pnpm

```bash
pnpm add react-native-mmkv
```

Then configure it as the persist plugin.

```
import { syncObservable } from '@legendapp/state/sync'import { ObservablePersistMMKV } from '@legendapp/state/persist-plugins/mmkv'
syncObservable(state$, {    persist: {        name: "documents",        plugin: ObservablePersistMMKV    }})
```

### AsyncStorage (RN)

Older versions of React Native have AsyncStorage built in, but newer versions may need it installed separately. Check the React Native docs for the latest guidance on that.

bun

npm

yarn

pnpm

```bash
pnpm add @react-native-async-storage/async-storage
```

The AsyncStorage plugin needs an additional bit of global configuration, giving it the instance of AsyncStorage.

```
import { configureSynced, syncObservable } from '@legendapp/state/sync'import { observablePersistAsyncStorage } from '@legendapp/state/persist-plugins/async-storage'import AsyncStorage from '@react-native-async-storage/async-storage'
// Global configurationconst persistOptions = configureSynced({    persist: {        plugin: observablePersistAsyncStorage({            AsyncStorage        })    }})syncObservable(state$, persistOptions({    persist: {        name: 'store'    }}))
```

Because AsyncStorage is an asynchronous API, observables will not load from persistence immediately, so if you’re persisting a large amount of data you may want to show a loading state while persistence is loading.

```
const syncState$ = syncState(state$)await when(syncState$.isPersistLoaded)// Continue with load
```

### Expo SQLite (RN)

First install Expo SQLite.

bun

npm

yarn

pnpm

```bash
pnpm add expo-sqlite
```

The Expo SQLite Storage plugin needs an additional bit of global configuration, giving it the instance of Storage.

```
import { configureSynced, syncObservable } from '@legendapp/state/sync';import { observablePersistSqlite } from '@legendapp/state/persist-plugins/expo-sqlite';import Storage from 'expo-sqlite/kv-store';
// Global configurationconst persistOptions = configureSynced({    persist: {        plugin: observablePersistSqlite(Storage)    },});syncObservable(    state$,    persistOptions({        persist: {            name: 'store',        },    }),);
```

## Making a sync plugin

Once you’re syncing multiple observables in the same way you’ll likely want to create a plugin that encapsulates the specifics of your backend. The plugin just needs to return a [synced](#synced). If your backend is CRUD based (it has create, read, update, delete functions) then you may want to build on top of [syncedCrud](../crud) which encapsulates a lot of logic for those specifics for you.

It may be easiest to look at [the source of the built-in sync plugins](https://github.com/LegendApp/legend-state/tree/main/src/persist-plugins) to see what they look like.

This is a simple contrived example to show what that could look like.

```
import { observable } from '@legendapp/state'import { synced } from '@legendapp/state/sync'
const isAuthed$ = observable(false);
// Create a custom synced that just needs a name in your APIconst customSynced = ({ name }) => {    const basePath = 'https://url/api/v1/'    const doFetch = (path) => {        return fetch(basePath + path).then((res) => res.json())    }
    return synced({        get: () => doFetch(`list-${name}s`),        set: ({ value }) => {            if (value === null || value === undefined) {                return doFetch('delete-' + name)            } else {                return doFetch('upsert-' + name)            }        },        retry: { infinite: true },        persist: {            name        },        waitFor: isAuthed$,        subscribe: ({ refresh }) => {            // Subscribe to realtime service        },    })}
const store$ = observable({    users: customSynced('user')})
```