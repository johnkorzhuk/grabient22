# useNavigate Hook

The useNavigate hook returns a navigate function that can be used to navigate to a new location. This includes changes to the pathname, search params, hash, and location state.

## useNavigate Options

The useNavigate hook accepts a single argument, an options object.

### opts.from Option

* Type: string
* Optional
* Description: The location to navigate from. This is useful when you want to navigate to a new location from a specific location, rather than the current location.

## useNavigate Returns

* A navigate function that can be used to navigate to a new location.

## Navigate Function

The navigate function is a function that can be used to navigate to a new location.

### Navigate Function Options

The navigate function accepts a single argument, an options object.

* Type: NavigateOptions

### Navigate Function Returns

* A Promise that resolves when the navigation is complete

## Examples

```tsx
import { useNavigate } from '@tanstack/react-router'

function PostsPage() {
  const navigate = useNavigate({ from: '/posts' })
  const handleClick = () => navigate({ search: { page: 2 } })
  // ...
}

function Component() {
  const navigate = useNavigate()
  return (
    <div>
      <button
        onClick={() =>
          navigate({
            to: '/posts',
          })
        }
      >
        Posts
      </button>
      <button
        onClick={() =>
          navigate({
            to: '/posts',
            search: { page: 2 },
          })
        }
      >
        Posts (Page 2)
      </button>
      <button
        onClick={() =>
          navigate({
            to: '/posts',
            hash: 'my-hash',
          })
        }
      >
        Posts (Hash)
      </button>
      <button
        onClick={() =>
          navigate({
            to: '/posts',
            state: { from: 'home' },
          })
        }
      >
        Posts (State)
      </button>
    </div>
  )
}
```

# NavigateOptions Type

The NavigateOptions type is used to describe the options that can be used when describing a navigation action in TanStack Router.

```tsx
type NavigateOptions = ToOptions & {
  replace?: boolean
  resetScroll?: boolean
  hashScrollIntoView?: boolean | ScrollIntoViewOptions
  ignoreBlocker?: boolean
  reloadDocument?: boolean
  href?: string
}
```

## NavigateOptions Properties

The NavigateOptions object accepts the following properties:

### replace

* Type: boolean
* Optional
* Defaults to false
* If true, the location will be committed to the browser history using history.replace instead of history.push

### resetScroll

* Type: boolean
* Optional
* Defaults to true so that the scroll position will be reset to 0,0 after the location is committed to the browser history
* If false, the scroll position will not be reset to 0,0 after the location is committed to history

### ignoreBlocker

* Type: boolean
* Optional
* Defaults to false
* If true, navigation will ignore any blockers that might prevent it

### reloadDocument

* Type: boolean
* Optional
* Defaults to false
* If true, navigation to a route inside of router will trigger a full page load instead of the traditional SPA navigation

### href

* Type: string
* Optional
* This can be used instead of to to navigate to a fully built href, e.g. pointing to an external target

See also: ToOptions

```tsx
type ToOptions = {
  from?: ValidRoutePath | string
  to?: ValidRoutePath | string
  hash?: true | string | ((prev?: string) => string)
  state?: true | HistoryState | ((prev: HistoryState) => HistoryState)
} & SearchParamOptions &
  PathParamOptions

type SearchParamOptions = {
  search?: true | TToSearch | ((prev: TFromSearch) => TToSearch)
}

type PathParamOptions = {
  path?: true | Record<string, TPathParam> | ((prev: TFromParams) => TToParams)
}
```