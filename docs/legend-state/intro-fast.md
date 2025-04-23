---
title: Fast 
---

# Fast 

Legend-State is the result of years of iteration and dozens of experiments and rewrites to build the fastest possible state system. The primary reason it's so fast is that it optimizes for the fewest number of renders - components are only re-rendered when the state they truly care about is changed.

It may seem silly to quibble over milliseconds, but state is a hot path of most applications, so it's important that it be as fast as possible to keep your whole application snappy. In our case, some Legend users have hundreds of thousands of items flowing through state, so it became the core bottleneck and is very important to optimize.

We'll show results of the popular krausest benchmark and use that to describe why Legend-State is so fast. This benchmark is a good approximation of real-world performance, but the most important optimization in Legend-State is that it just does less work because it renders less, less often.

## Benchmark

Legend-State's **optimized** mode optimizes for rendering each row when it changes, but not the entire list, which is reflected in the fast **partial update** and **select row** benchmarks. That typically incurs an extra upfront cost to set up the listeners in each row, but Legend-State is so optimized that even so it's actually still among the fastest in the **create many rows** benchmark.

Legend-State really shines in the **replace all rows** and **swap rows** benchmarks. When the number of elements is unchanged, it does not need to re-render the list and can only render the individual rows that changed. That brings a big speed improvement for drag/drop or when items are moved around in a list.

You can opt into the fast array rendering with the `optimized` prop on the For component. Note that this optimization reuses React nodes rather than replacing them as usual, so it may have unexpected behavior with some types of animations or if you are modifying the DOM externally.

### Startup metrics

In these benchmarks you can see that Legend-State has the fastest TTI (time to interactive) because Legend-State doesn't do much processing up front. Creating observables and adding thousands of listeners does very little work. Because observables don't have to modify the underlying data at all, creating an observable just creates a tiny amount of metadata.

### Memory

The memory usage is lower than the others because Legend-State does not modify the underlying data or keep a lot of extra metadata, and it does not create many objects or closures.

## Why it's fast

Legend-State is optimized in a lot of different ways:

### Proxy to path

Legend-State uses Proxy, which is how it exposes the observable functions (get/set/listen etc…) on anything within an observable object. But it differs from other Proxy-based systems by not touching the underlying data all. Each proxy node represents a path within the object tree, and to get the value of any node it traverses the raw data to that path and returns the value.

### Listeners at each node

Each node keeps a `Set` of listeners so that you can listen to changes to any value anywhere within the state. This is great for performance because changes only call the few listeners that are affected by that change.

### Example Code

```typescript
import { useInterval } from "usehooks-ts"
import { observable } from "@legendapp/state"
import { useRef, useState } from "react"
import { Memo, observer, useObservable } from "@legendapp/state/react"

const MemoExample = () => {
  const renderCount = ++useRef(0).current
  const [value, setValue] = useState(1)
  const state$ = useObservable({ count: 1 })

  useInterval(() => {
    state$.count.set((v) => v + 1)
  }, 500)

  const onClick = () => setValue((v) => v + 1)

  return (
    <Box center>
      <h5>Normal</h5>
      <div>Renders: {renderCount}</div>
      <div>Value: {value}</div>
      <Button onClick={onClick}>
        Render
      </Button>
      <Memo>
        {() => <>
          <h5>Memo'd</h5>
          <div>Value: {value}</div>
          <div>Count: {state$.count.get()}</div>
        </>}
      </Memo>
    </Box>
  )
}
```

### Shallow listeners

Shallow listeners are called on objects only when keys are added or removed, but not when children are changed. This lets the child components manage their own rendering and large parent components don't need to render.

### Array optimizations

Optimizing list rendering is a primary goal because Legend-State is built for Legend and its huge documents and lists, so it aims to render parent list components as little as possible.

### Micro-optimizations

*   **For loop vs. forEach**: For loops are still quite a bit faster than `forEach`
*   **Set vs. array**: `Set` has better performance for managing Listeners
*   **Map vs. object**: `Map` operations are generally faster
*   **Closures vs. bind**: Closures are surprisingly much faster than `bind`
*   **isNaN is slow**: `+n - +n < 1` is a much faster way to check if a string is a number
*   **Proxy vs. Object.defineProperty**: Proxy is much faster
*   **Cloning is slow**: Change handlers have a `getPrevious()` function to opt-in to computing the previous state
*   **for of in Set/Map**: `for of` loops are the fastest way to iterate through Set and Map values
