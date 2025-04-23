---
title: Helper Functions
---

# Helper Functions

## ObservableHint

These hints tweak the default behavior of observables to improve their performance.

### ObservableHint.opaque

`ObservableHint.opaque` marks an object in an observable as opaque so that it will be treated as a primitive, so that properties inside the opaque object will not be observable.

This is useful for storing DOM or React elements or other large objects in an observable when you don't care about tracking its properties changing.

```typescript
import { observable, ObservableHint } from '@legendapp/state'

const state$ = observable({ 
    text: 'hi', 
    body: ObservableHint.opaque(document.body) 
})
```

### ObservableHint.plain

`ObservableHint.plain` marks an object as not having any child functions or observables. By default observables recurse through their children to find these and setup computed observables and observable links. This is a performance optimization to prevent needing to do that. Note that `ObservableHint.opaque` also prevents that recursion.

This will break any descendant functions or computeds, so make sure to only use this when it is for sure a plain object/array.

```typescript
import { observable, ObservableHint } from '@legendapp/state'

const bigObject = {}
const state$ = observable({ 
    text: 'hi', 
    child: ObservableHint.plain(bigObject) 
})
```

## mergeIntoObservable

If you want to merge a deep object into an observable, `mergeIntoObservable` can do that and retain all of the existing observables and listeners on the way, and fire listeners as values change. This is used by `syncObservable` under the hood.

```typescript
import { observable } from "@legendapp/state";
import { mergeIntoObservable } from "@legendapp/state";

const state$ = observable({ 
    store: { 
        text: "hello", 
        other: "hello there" 
    } 
});

state$.store.text.onChange(({ value }) => 
    console.log(`text changed to "${value}"`)
);

const newValue = { 
    store: { 
        text: "hi", 
        other: "hi there" 
    } 
};

mergeIntoObservable(state$, newValue);
// text changed to "hi"
state$.store === newValue.store; // true
```

## trackHistory

`trackHistory` creates an observable that tracks all changes in the target observable, with the previous value at the time it was changed.

Since the history is an observable you can observe it or persist it like any other observable. This can be useful for saving a version history for a text editor. If you'd like to create an undo stack, check out the `undoRedo` helper.

An optional second parameter lets you use an existing observable for storing the history, which can be useful to save history into an existing state object.

```typescript
import { observable } from '@legendapp/state'
import { trackHistory } from '@legendapp/state/helpers/trackHistory'

const state$ = observable({ profile: { name: 'Hello' }})

// Track all changes to state
const history = trackHistory(state$)

// Change something in state
state$.profile.name.set('Annyong')

// History shows the previous value when it changed:
{
    1666593133018: {
        profile: {
            name: 'Hello'
        }
    }
}
```

## undoRedo

`undoRedo` is similar to `trackHistory` in that it tracks changes to an observable. However, `undoRedo` also provides helpers for undo / redo (as the name suggests) and does the tracking for you.

An optional second parameter lets you specify how deep you're willing to save an undo stack. By default, it will track changes forever, which means your memory will grow unbounded, so it's recommended to set that.

When you undo, you can redo — unless you make new changes to the observable, in which case the redo stack will be removed and the new state will take its place. This is similar to how other undo/redo systems commonly work.

```typescript
import { observable } from "@legendapp/state";
import { undoRedo } from "@legendapp/state/helpers/undoRedo";

const state$ = observable({ todos: ["Get milk"] });
const { undo, redo, getHistory } = undoRedo(state$.todos, { limit: 100 });

state$.todos.push("Pick up bread");
// todos is now ["Get milk", "Pick up bread"]

undo();
// todos is now back to ["Get milk"]

redo();
// todos is restored to ["Get milk", "Pick up bread"]

getHistory(); // returns an array of all the different states it contains
state$.todos.set(getHistory()[0]); // reset to the original state in history
undo(); // now back to where it was just prior to resetting
```

For convenience, we also export `undos$` and `redos$` which are observables that let you track how many undos/redos you have available on the undo stack. This is especially useful when rendering UI elements.

> Hint: use batching to group sets of changes into one history state.

```typescript
import { observable } from "@legendapp/state";
import { observer } from "@legendapp/state/react";
import { undoRedo } from "@legendapp/state/helpers/undoRedo";

const state$ = observable({ todos: ["Get milk"] });
const { undo, redo, undos$, redos$ } = undoRedo(state$.todos, { limit: 100 });

export function UndoUI() {
    const undos = use$(undos$);
    const redos = use$(redos$);

    return (
        <div>
            {undos > 0 ? (
                <button onClick={undo}>Undo</button>
            ) : (
                <button disabled={true}>Undo</button>
            )}
            {redos > 0 ? (
                <button onClick={redo}>Redo</button>
            ) : (
                <button disabled={true}>Redo</button>
            )}
        </div>
    );
}
```