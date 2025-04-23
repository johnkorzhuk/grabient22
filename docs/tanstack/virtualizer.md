# Virtualizer

The Virtualizer class is the core of TanStack Virtual. Virtualizer instances are usually created for you by your framework adapter, but you do receive the virtualizer directly.

tsx

```
export class Virtualizer<TScrollElement = unknown, TItemElement = unknown> {
  constructor(options: VirtualizerOptions<TScrollElement, TItemElement>)
}
```

```
export class Virtualizer<TScrollElement = unknown, TItemElement = unknown> {
  constructor(options: VirtualizerOptions<TScrollElement, TItemElement>)
}
```

[

## Required Options

][1][

### count

][2]

tsx

```
count: number
```

```
count: number
```

The total number of items to virtualize.

[

### getScrollElement

][3]

tsx

```
getScrollElement: () => TScrollElement
```

```
getScrollElement: () => TScrollElement
```

A function that returns the scrollable element for the virtualizer. It may return null if the element is not available yet.

[

### estimateSize

][4]

tsx

```
estimateSize: (index: number) => number
```

```
estimateSize: (index: number) => number
```

> 🧠 If you are dynamically measuring your elements, it's recommended to estimate the largest possible size (width/height, within comfort) of your items. This will ensure features like smooth-scrolling will have a better chance at working correctly.

This function is passed the index of each item and should return the actual size (or estimated size if you will be dynamically measuring items with virtualItem.measureElement) for each item. This measurement should return either the width or height depending on the orientation of your virtualizer.

[

## Optional Options

][5][

### enabled

][6]

tsx

```
enabled?: boolean
```

```
enabled?: boolean
```

Set to false to disable scrollElement observers and reset the virtualizer's state

[

### debug

][7]

tsx

```
debug?: boolean
```

```
debug?: boolean
```

Set to true to enable debug logs

[

### initialRect

][8]

tsx

```
initialRect?: Rect
```

```
initialRect?: Rect
```

The initial Rect of the scrollElement. This is mostly useful if you need to run the virtualizer in an SSR environment, otherwise the initialRect will be calculated on mount by the observeElementRect implementation.

[

### onChange

][9]

tsx

```
onChange?: (instance: Virtualizer<TScrollElement, TItemElement>) => void
```

```
onChange?: (instance: Virtualizer<TScrollElement, TItemElement>) => void
```

A callback function that fires when the virtualizer's internal state changes. It's passed the virtualizer instance.

[

### overscan

][10]

tsx

```
overscan?: number
```

```
overscan?: number
```

The number of items to render above and below the visible area. Increasing this number will increase the amount of time it takes to render the virtualizer, but might decrease the likelihood of seeing slow-rendering blank items at the top and bottom of the virtualizer when scrolling.

[

### horizontal

][11]

tsx

```
horizontal?: boolean
```

```
horizontal?: boolean
```

Set this to true if your virtualizer is oriented horizontally.

[

### paddingStart

][12]

tsx

```
paddingStart?: number
```

```
paddingStart?: number
```

The padding to apply to the start of the virtualizer in pixels.

[

### paddingEnd

][13]

tsx

```
paddingEnd?: number
```

```
paddingEnd?: number
```

The padding to apply to the end of the virtualizer in pixels.

[

### scrollPaddingStart

][14]

tsx

```
scrollPaddingStart?: number
```

```
scrollPaddingStart?: number
```

The padding to apply to the start of the virtualizer in pixels when scrolling to an element.

[

### scrollPaddingEnd

][15]

tsx

```
scrollPaddingEnd?: number
```

```
scrollPaddingEnd?: number
```

The padding to apply to the end of the virtualizer in pixels when scrolling to an element.

[

### initialOffset

][16]

tsx

```
initialOffset?: number | (() => number)
```

```
initialOffset?: number | (() => number)
```

The initial offset to apply to the virtualizer. This is usually only useful if you are rendering the virtualizer in a SSR environment.

[

### getItemKey

][17]

tsx

```
getItemKey?: (index: number) => Key
```

```
getItemKey?: (index: number) => Key
```

This function is passed the index of each item and should return a unique key for that item. The default functionality of this function is to return the index of the item, but you should override this when possible to return a unique identifier for each item across the entire set. This function should be memoized to prevent unnecessary re-renders.

[

### rangeExtractor

][18]

tsx

```
rangeExtractor?: (range: Range) => number[]
```

```
rangeExtractor?: (range: Range) => number[]
```

This function receives visible range indexes and should return array of indexes to render. This is useful if you need to add or remove items from the virtualizer manually regardless of the visible range, eg. rendering sticky items, headers, footers, etc. The default range extractor implementation will return the visible range indexes and is exported as defaultRangeExtractor.

[

### scrollToFn

][19]

tsx

```
scrollToFn?: (
  offset: number,
  options: { adjustments?: number; behavior?: 'auto' | 'smooth' },
  instance: Virtualizer<TScrollElement, TItemElement>,
) => void
```

```
scrollToFn?: (
  offset: number,
  options: { adjustments?: number; behavior?: 'auto' | 'smooth' },
  instance: Virtualizer<TScrollElement, TItemElement>,
) => void
```

An optional function that (if provided) should implement the scrolling behavior for your scrollElement. It will be called with the following arguments:

*   An offset (in pixels) to scroll towards.
*   An object indicating whether there was a difference between the estimated size and actual size (adjustments) and/or whether scrolling was called with a smooth animation (behaviour).
*   The virtualizer instance itself.

Note that built-in scroll implementations are exported as elementScroll and windowScroll, which are automatically configured by the framework adapter functions like useVirtualizer or useWindowVirtualizer.

> ⚠️ Attempting to use smoothScroll with dynamically measured elements will not work.

[

### observeElementRect

][20]

tsx

```
observeElementRect: (
  instance: Virtualizer<TScrollElement, TItemElement>,
  cb: (rect: Rect) => void,
) => void | (() => void)
```

```
observeElementRect: (
  instance: Virtualizer<TScrollElement, TItemElement>,
  cb: (rect: Rect) => void,
) => void | (() => void)
```

An optional function that if provided is called when the scrollElement changes and should implement the initial measurement and continuous monitoring of the scrollElement's Rect (an object with width and height). It's called with the instance (which also gives you access to the scrollElement via instance.scrollElement. Built-in implementations are exported as observeElementRect and observeWindowRect which are automatically configured for you by your framework adapter's exported functions like useVirtualizer or useWindowVirtualizer.

[

### observeElementOffset

][21]

tsx

```
observeElementOffset: (
    instance: Virtualizer<TScrollElement, TItemElement>,
    cb: (offset: number) => void,
  ) => void | (() => void)
```

```
observeElementOffset: (
    instance: Virtualizer<TScrollElement, TItemElement>,
    cb: (offset: number) => void,
  ) => void | (() => void)
```

An optional function that if provided is called when the scrollElement changes and should implement the initial measurement and continuous monitoring of the scrollElement's scroll offset (a number). It's called with the instance (which also gives you access to the scrollElement via instance.scrollElement. Built-in implementations are exported as observeElementOffset and observeWindowOffset which are automatically configured for you by your framework adapter's exported functions like useVirtualizer or useWindowVirtualizer.

[

### measureElement

][22]

tsx

```
measureElement?: (
  element: TItemElement,
  entry: ResizeObserverEntry | undefined,
  instance: Virtualizer<TScrollElement, TItemElement>,
) => number
```

```
measureElement?: (
  element: TItemElement,
  entry: ResizeObserverEntry | undefined,
  instance: Virtualizer<TScrollElement, TItemElement>,
) => number
```

This optional function is called when the virtualizer needs to dynamically measure the size (width or height) of an item.

> 🧠 You can use instance.options.horizontal to determine if the width or height of the item should be measured.

[

### scrollMargin

][23]

tsx

```
scrollMargin?: number
```

```
scrollMargin?: number
```

With this option, you can specify where the scroll offset should originate. Typically, this value represents the space between the beginning of the scrolling element and the start of the list. This is especially useful in common scenarios such as when you have a header preceding a window virtualizer or when multiple virtualizers are utilized within a single scrolling element. If you are using absolute positioning of elements, you should take into account the scrollMargin in your CSS transform:

tsx

```
transform: `translateY(${
   virtualRow.start - rowVirtualizer.options.scrollMargin
}px)` 
```

```
transform: `translateY(${
   virtualRow.start - rowVirtualizer.options.scrollMargin
}px)` 
```

To dynamically measure value for scrollMargin you can use getBoundingClientRect() or ResizeObserver. This is helpful in scenarios when items above your virtual list might change their height.

[

### gap

][24]

tsx

```
gap?: number
```

```
gap?: number
```

This option allows you to set the spacing between items in the virtualized list. It's particularly useful for maintaining a consistent visual separation between items without having to manually adjust each item's margin or padding. The value is specified in pixels.

[

### lanes

][25]

tsx

```
lanes: number
```

```
lanes: number
```

The number of lanes the list is divided into (aka columns for vertical lists and rows for horizontal lists).

[

### isScrollingResetDelay

][26]

tsx

```
isScrollingResetDelay: number
```

```
isScrollingResetDelay: number
```

This option allows you to specify the duration to wait after the last scroll event before resetting the isScrolling instance property. The default value is 150 milliseconds.

The implementation of this option is driven by the need for a reliable mechanism to handle scrolling behavior across different browsers. Until all browsers uniformly support the scrollEnd event.

[

### useScrollendEvent

][27]

tsx

```
useScrollendEvent: boolean
```

```
useScrollendEvent: boolean
```

This option allows you to switch to use debounced fallback to reset the isScrolling instance property after isScrollingResetDelay milliseconds. The default value is true.

The implementation of this option is driven by the need for a reliable mechanism to handle scrolling behavior across different browsers. Until all browsers uniformly support the scrollEnd event.

[

### isRtl

][28]

tsx

```
isRtl: boolean
```

```
isRtl: boolean
```

Whether to invert horizontal scrolling to support right-to-left language locales.

[

## Virtualizer Instance

][29]

The following properties and methods are available on the virtualizer instance:

[

### options

][30]

tsx

```
options: readonly Required<VirtualizerOptions<TScrollElement, TItemElement>>
```

```
options: readonly Required<VirtualizerOptions<TScrollElement, TItemElement>>
```

The current options for the virtualizer. This property is updated via your framework adapter and is read-only.

[

### scrollElement

][31]

tsx

```
scrollElement: readonly TScrollElement | null
```

```
scrollElement: readonly TScrollElement | null
```

The current scrollElement for the virtualizer. This property is updated via your framework adapter and is read-only.

[

### getVirtualItems

][32]

tsx

```
type getVirtualItems = () => VirtualItem[]
```

```
type getVirtualItems = () => VirtualItem[]
```

Returns the virtual items for the current state of the virtualizer.

[

### scrollToOffset

][33]

tsx

```
scrollToOffset: (
  toOffset: number,
  options?: {
    align?: 'start' | 'center' | 'end' | 'auto',
    behavior?: 'auto' | 'smooth'
  }
) => void
```

```
scrollToOffset: (
  toOffset: number,
  options?: {
    align?: 'start' | 'center' | 'end' | 'auto',
    behavior?: 'auto' | 'smooth'
  }
) => void
```

Scrolls the virtualizer to the pixel offset provided. You can optionally pass an alignment mode to anchor the scroll to a specific part of the scrollElement.

[

### scrollToIndex

][34]

tsx

```
scrollToIndex: (
  index: number,
  options?: {
    align?: 'start' | 'center' | 'end' | 'auto',
    behavior?: 'auto' | 'smooth'
  }
) => void
```

```
scrollToIndex: (
  index: number,
  options?: {
    align?: 'start' | 'center' | 'end' | 'auto',
    behavior?: 'auto' | 'smooth'
  }
) => void
```

Scrolls the virtualizer to the items of the index provided. You can optionally pass an alignment mode to anchor the scroll to a specific part of the scrollElement.

[

### getTotalSize

][35]

tsx

```
getTotalSize: () => number
```

```
getTotalSize: () => number
```

Returns the total size in pixels for the virtualized items. This measurement will incrementally change if you choose to dynamically measure your elements as they are rendered.

[

### measure

][36]

tsx

```
measure: () => void
```

```
measure: () => void
```

Resets any prev item measurements.

[

### measureElement

][37]

tsx

```
measureElement: (el: TItemElement | null) => void
```

```
measureElement: (el: TItemElement | null) => void
```

Measures the element using your configured measureElement virtualizer option. You are responsible for calling this in your virtualizer markup when the component is rendered (eg. using something like React's ref callback prop) also adding data-index

tsx

```
 <div
  key={virtualRow.key}
  data-index={virtualRow.index}
  ref={virtualizer.measureElement}
  style={...}
>...</div>
```

```
 <div
  key={virtualRow.key}
  data-index={virtualRow.index}
  ref={virtualizer.measureElement}
  style={...}
>...</div>
```

By default the measureElement virtualizer option is configured to measure elements with getBoundingClientRect().

[

### resizeItem

][38]

tsx

```
resizeItem: (index: number, size: number) => void
```

```
resizeItem: (index: number, size: number) => void
```

Change the virtualized item's size manually. Use this function to manually set the size calculated for this index. Useful in occations when using some custom morphing transition and you know the morphed item's size beforehand.

You can also use this method with a throttled ResizeObserver instead of Virtualizer.measureElement to reduce re-rendering.

> ⚠️ Please be aware that manually changing the size of an item when using Virtualizer.measureElement to monitor that item, will result in unpredictable behaviour as the Virtualizer.measureElement is also changing the size. However you can use one of resizeItem or measureElement in the same virtualizer instance but on different item indexes.

[

### scrollRect

][39]

tsx

```
scrollRect: Rect
```

```
scrollRect: Rect
```

Current Rect of the scroll element.

[

### shouldAdjustScrollPositionOnItemSizeChange

][40]

tsx

```
shouldAdjustScrollPositionOnItemSizeChange: undefined | ((item: VirtualItem, delta: number, instance: Virtualizer<TScrollElement, TItemElement>) => boolean)
```

```
shouldAdjustScrollPositionOnItemSizeChange: undefined | ((item: VirtualItem, delta: number, instance: Virtualizer<TScrollElement, TItemElement>) => boolean)
```

The shouldAdjustScrollPositionOnItemSizeChange method enables fine-grained control over the adjustment of scroll position when the size of dynamically rendered items differs from the estimated size. When jumping in the middle of the list and scrolling backward new elements may have a different size than the initially estimated size. This discrepancy can cause subsequent items to shift, potentially disrupting the user's scrolling experience, particularly when navigating backward through the list.

[

### isScrolling

][41]

tsx

```
isScrolling: boolean
```

```
isScrolling: boolean
```

Boolean flag indicating if list is currently being scrolled.

[

### scrollDirection

][42]

tsx

```
scrollDirection: 'forward' | 'backward' | null
```

```
scrollDirection: 'forward' | 'backward' | null
```

This option indicates the direction of scrolling, with possible values being 'forward' for scrolling downwards and 'backward' for scrolling upwards. The value is set to null when there is no active scrolling.

[

### scrollOffset

][43]

tsx

```
scrollOffset: number
```

```
scrollOffset: number
```

This option represents the current scroll position along the scrolling axis. It is measured in pixels from the starting point of the scrollable area.

