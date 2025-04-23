Title: TanStack Start | Convex Developer Hub

URL Source: https://docs.convex.dev/client/react/tanstack-start

Markdown Content:
[TanStack Start](https://tanstack.com/start/latest) is a new React web framework with best-in-class typesafe routing.

When used with Convex, TanStack Start provides

*   Live-updating queries with React Query (the React client for TanStack Query)
*   Subscription session resumption, from SSR to live on the client
*   Loader-based preloading and prefetching
*   Consistent logical query timestamp during SSR
*   Opt-in component-local SSR

and more!

This page describes the recommended way to use Convex with TanStack Start, via React Query. The standard Convex React hooks work also with TanStack Start without React Query, as do the [React Query hooks](https://docs.convex.dev/client/tanstack-query) without TanStack Start! But using all three is a sweet spot.

TanStack Start is in Alpha

TanStack Start is a new React framework currently in alpha. You can try it today but there will probably be breaking changes made to it before a stable release.

Follow the [TanStack Start Quickstart](https://docs.convex.dev/quickstart/tanstack-start) to add Convex to a new TanStack Start project.

You can read more about [React Query hooks](https://docs.convex.dev/client/tanstack-query), but a few highlights relevant to TanStack Start.

### Staying subscribed to queries[​](https://docs.convex.dev/client/react/tanstack-start#staying-subscribed-to-queries "Direct link to Staying subscribed to queries")

Convex queries in React Query continue to receive updates after the last component subscribed to the query unmounts. The default for this behavior is 5 minutes and this value is configured with [`gcTime`](https://tanstack.com/query/latest/docs/framework/react/guides/caching).

This is useful to know when debugging why a query result is already loaded: for client side navigations, whether a subscription is already active can depend on what pages were previously visited in a session.

### Using Convex React hooks[​](https://docs.convex.dev/client/react/tanstack-start#using-convex-react-hooks "Direct link to Using Convex React hooks")

[Convex React](https://docs.convex.dev/client/react) hooks like [`usePaginatedQuery`](https://docs.convex.dev/api/modules/react#usepaginatedquery) can be used alongside TanStack hooks. These hooks reference the same Convex Client so there's still just one set of consistent query results in your app when these are combined.

Using TanStack Start and Query with Convex makes it particularly easy to live-update Convex queries on the client while also [server-rendering](https://tanstack.com/query/v5/docs/framework/react/guides/ssr) them. [`useSuspenseQuery()`](https://tanstack.com/query/latest/docs/framework/react/reference/useSuspenseQuery) is the simplest way to do this:

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../convex/_generated/api";

const { data } = useSuspenseQuery(convexQuery(api.messages.list, {}));
```

### Consistent client views[​](https://docs.convex.dev/client/react/tanstack-start#consistent-client-views "Direct link to Consistent client views")

In the browser all Convex query subscriptions present a consistent, at-the-same-logical-timestamp view of the database: if one query result reflects a given mutation transaction, every other query result will too.

Server-side rendering is usually a special case: instead of a stateful WebSocket session, on the server it's simpler to fetch query results ad-hoc. This can lead to inconsistencies analogous to one REST endpoint returning results before a mutation ran and another endpoint returning results after that change.

In TanStack Start, this issue is avoided by sending in a timestamp along with each query: Convex uses the same timestamp for all queries.

### Loaders[​](https://docs.convex.dev/client/react/tanstack-start#loaders "Direct link to Loaders")

To make client-side navigations faster you can add a [loader](https://tanstack.com/router/latest/docs/framework/react/guide/external-data-loading#using-loaders-to-ensure-data-is-loaded) to a route. By default, loaders will run when mousing over a link to that page.

```typescript
import { createFileRoute } from "@tanstack/react-router";
import { convexQuery } from "@convex-dev/react-query";
import { api } from "../convex/_generated/api";

export const Route = createFileRoute('/posts')({
  loader: async (opts) => {
    await opts.context.queryClient.ensureQueryData(
      convexQuery(api.messages.list, {})
    );
  },
  component: () => {
    const { data } = useSuspenseQuery(convexQuery(api.messages.list, {}));
    return (
      <div>
        {data.map((message) => (
          <Message key={message.id} post={message} />
        ))}
      </div>
    );
  },
});
```