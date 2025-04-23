## Manual Pagination

Note Convex provides built-in pagination through `.paginate()` and
`usePaginatedQuery()`.

The `getPage` helper gives you more control of the pagination. You can specify
the index ranges or do multiple paginations in the same query.
An index range is all of the documents between two index keys: (start, end].
An index key is an array of values for the fields in the specified index.
For example, for an index defined like `defineTable({ a: v.number(), b: v.string() }).index("my_index", ["a", "b"])`
an index key might be `[ 3 ]` or `[ 3, "abc" ]`. By default the index is the built-in "by_creation_time" index.
The returned index keys are unique, including the two fields at the end of every index: `_creationTime` and `_id`.

However, you have to handle edge cases yourself, as described in
https://stack.convex.dev/fully-reactive-pagination.

More details and patterns will appear in upcoming articles.

### Examples

Fetch the first page, by creation time:

```js
const { page, indexKeys, hasMore } = await getPage(ctx, {
  table: "messages",
});
```

Fetch the next page:

```js
const {
  page: page2,
  indexKeys: indexKeys2,
  hasMore: hasMore2,
} = await getPage(ctx, {
  table: "messages",
  startIndexKey: indexKeys[indexKeys.length - 1],
});
```

You can change the page size and order by any index:

```js
import schema from "./schema";
const { page, indexKeys, hasMore } = await getPage(ctx, {
  table: "users",
  index: "by_name",
  schema,
  targetMaxRows: 1000,
});
```

Fetch of a page between two fixed places in the index, allowing you to display
continuous pages even as documents change.

```js
const { page } = await getPage(ctx, {
  table: "messages",
  startIndexKey,
  endIndexKey,
});
```

Fetch starting at a given index key.
For example, here are yesterday's messages, with recent at the top:

```js
const { page, indexKeys, hasMore } = await getPage(ctx, {
  table: "messages",
  startIndexKey: [Date.now() - 24 * 60 * 60 * 1000],
  startInclusive: true,
  order: "desc",
});
```

### `paginator`: manual pagination with familiar syntax

In addition to `getPage`, convex-helpers provides a function
`paginator` as an alternative to the built-in `db.query.paginate`.

- The built-in `.paginate` is currently limited to one call per query, which allows
  it to track the page's "end cursor" for contiguous reactive pagination client-side.
- `paginator` can be called multiple times from a query,
  but does not subscribe the query to the end cursor automatically.

The syntax and interface for `paginator` is so similar to `.paginate` that it is
nearly a drop-in replacement and can even be used with `usePaginatedQuery`.
This makes it more suitable for non-reactive pagination usecases,
such as iterating data in a mutation. Note: it supports `withIndex` but not `filter`.

For more information on reactive pagination and end cursors, see
https://stack.convex.dev/fully-reactive-pagination
and
https://stack.convex.dev/pagination

As a basic example, consider replacing this query with `paginator`.
It has the same behavior, except that the pages might not stay contiguous as
items are added and removed from the list and the query updates reactively.

```ts
import { paginator } from "convex-helpers/server/pagination";
import schema from "./schema";

export const list = query({
  args: { opts: paginationOptsValidator },
  handler: async (ctx, { opts }) => {
    // BEFORE:
    return await ctx.db.query("messages").paginate(opts);
    // AFTER:
    return await paginator(ctx.db, schema).query("messages").paginate(opts);
  },
});
```

You can order by an index, restrict the pagination to a range of the index,
and change the order to "desc", same as you would with a regular query.

```ts
import { paginator } from "convex-helpers/server/pagination";
import schema from "./schema";

export const list = query({
  args: { opts: paginationOptsValidator, author: v.id("users") },
  handler: async (ctx, { opts, author }) => {
    return await paginator(ctx.db, schema)
      .query("messages")
      .withIndex("by_author", (q) => q.eq("author", author))
      .order("desc")
      .paginate(opts);
  },
});
```