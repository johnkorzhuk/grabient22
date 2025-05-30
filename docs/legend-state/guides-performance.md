---
title: Performance
---

# Performance

Legend-State is already quite optimized by default, but there are some things to keep in mind to make sure it's as optimized as possible.

## Batching

Making multiple changes in a row can cause React components and observers to re-run multiple times when they should wait until changes are complete. So if you're setting a lot of observables at once, it's good to batch them together into one operation.

```typescript
const state$ = observable({ items: [] });

function addItems() {
  for (let i = 0; i < 1000; i++) {
    state$.items.push({ text: `Item ${i}` });
  }
}

// ❌ This can render 1000 times while pushing to the array
addItems();

// ✅ Batching delays until complete and renders once
batch(addItems);
```

### When persisting

If you are using `synced` or `syncObservable` to automatically persist your changes, you can prevent excessive writes by delaying persistence until changes are complete. Pushing to an array 1000 times could save to storage 1000 times, which could be very slow!

## Iterating through observables creates Proxies

For most usage this effect is negligible, but may be a concern with huge arrays of objects.

Accessing objects/arrays in observables creates Proxies to give them the observable functions. If you are iterating through large objects that don't need to be tracked for changes, call `get()` first to access the raw data, skipping all the Proxy creation.

```typescript
const state$ = observable({ items: [{ data: { value: 10 }}, ...] })
let sum = 0

// 🔥 This will create proxies for each element's data and value
state$.items.forEach(item => sum += item.data.value.get())

// 💨 This will not do anything special
state$.items.get().forEach(item => sum += item.data.value)
```

## Arrays

Legend-State is especially optimized for arrays since it was built for Legend to handle huge lists of data. Here are a few tips to get the best performance out of arrays.

### Arrays of objects require a unique id

To optimize rendering of arrays of objects, Legend-State requires a unique `id` or `key` field on each object. If your data needs to have a different id field, you can use a `${arrayName}_keyExtractor` function next to the array object:

```typescript
const data$ = observable({
  arr: [],
  arr_keyExtractor: (item) => item.idObject._id,
});
```

Under the hood, Legend-State listens to elements by path within the object. Operations like `splice` can change the index of an element which changes its path, so it uses the unique `id` to handle elements being moved and keep observables as stable references to their underlying element. It also optimizes for repositioning items within arrays and only re-renders the changed elements.

### Use the `For` component

The `For` component is optimized for rendering arrays of observable objects so that they are extracted into a separate tracking context and don't re-render the parent.

You can use it in two ways, providing an `item` component or a function as a child.

An `optimized` prop adds additional optimizations, but in an unusual way by re-using React nodes. See [Optimized rendering](#optimized-rendering) for more details.

```typescript
import { observable } from "@legendapp/state"
import { For } from "@legendapp/state/react"

const state$ = observable({ arr: [{ id: 1, text: 'hi' }]})

function Row({ item }) {
    return <div>{item.text}</div>
}

function List() {
    // 1. Use the For component with an item prop
    return <For each={state$.arr} item={Row} />

    // 2. Use the For component with a render function as the child
    return (
        <For each={list}>
            {item => (
                <div>
                    {item.text}
                </div>
            )}
        </For>
    )
}
```

### For doesn't re-render the parent

In this more complex example you can see that as elements are added to and update the array, the parent component does not re-render.

### Don't get() observables while mapping

The `map` function automatically sets up a shallow listener, so it will only re-render when the array is changed and not when individual elements are changed. For best performance it's best to let the child component track each item observable.

Make sure that you don't access any observable properties while mapping, like accessing the id for the key, so use `peek()` to prevent tracking. If you do `get()` inside an `observer` component would trigger the outer component to observe every list element.

```typescript
import { observable } from "@legendapp/state";
import { For } from "@legendapp/state/react";

const state$ = observable({ arr: [{ id: 1, text: "hi" }] });

function Row({ item }) {
  return <div>{item.text}</div>;
}

function List() {
  // Be sure to use peek() to make sure you don't track any observable fields here
  return state$.arr.map((item) => <Row key={item.peek().id} item={item} />);
}
```

### Optimized rendering

The `For` component has an `optimized` prop which takes the optimizations even further. It prevents re-rendering the parent component when possible, so if the array length doesn't change it updates React elements in place instead of the whole list rendering. This massively reduces the rendering time when swapping elements, sorting an array, or replacing some individual elements. But because it reuses React nodes rather than replacing them as usual, it may have unexpected behavior with some types of animations or if you are modifying the DOM externally.

```typescript
import { For } from "@legendapp/state/react"

function List() {
    // Use the optimized prop
    return <For each={list} item={Row} optimized />
}
```