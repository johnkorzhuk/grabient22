Title: Reading Data | Convex Developer Hub

URL Source: https://docs.convex.dev/database/reading-data

Markdown Content:
[Queries](https://docs.convex.dev/functions/query-functions) can read data from database tables using a variety of methods.

### Loading a Single Document

You can load a document from the database using the [`db.get`](https://docs.convex.dev/api/interfaces/server.GenericDatabaseReader#get) method:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const getTask = query({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.id);
    return task;
  },
});
```

The `get` method returns `null` if no document exists with the given ID.

### Querying Documents

To find documents matching certain criteria, use the [`db.query`](https://docs.convex.dev/api/interfaces/server.GenericDatabaseReader#query) method:

```typescript
import { query } from "./_generated/server";

export const listTasks = query({
  handler: async (ctx) => {
    const tasks = await ctx.db.query("tasks").collect();
    return tasks;
  },
});
```

The query builder returned by `db.query` has several methods to filter and order results:

1. Filter documents using [`filter`](https://docs.convex.dev/api/interfaces/server.GenericReader#filter):

```typescript
import { query } from "./_generated/server";

export const listCompletedTasks = query({
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .filter((q) => q.eq(q.field("completed"), true))
      .collect();
    return tasks;
  },
});
```

2. Order documents using [`order`](https://docs.convex.dev/api/interfaces/server.GenericReader#order):

```typescript
import { query } from "./_generated/server";

export const listTasksByPriority = query({
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .order("desc")
      .filter((q) => q.eq(q.field("completed"), false))
      .collect();
    return tasks;
  },
});
```

3. Take a specific number of results using [`take`](https://docs.convex.dev/api/interfaces/server.GenericReader#take):

```typescript
import { query } from "./_generated/server";

export const getTopTasks = query({
  handler: async (ctx) => {
    const tasks = await ctx.db
      .query("tasks")
      .order("desc")
      .take(5)
      .collect();
    return tasks;
  },
});
```

### Using Indexes

For better query performance, you can use indexes defined in your schema. Here's an example using [`withIndex`](https://docs.convex.dev/api/interfaces/server.GenericReader#withindex):

```typescript
import { query } from "./_generated/server";

export const getTasksByUser = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();
    return tasks;
  },
});
```

### Pagination

For large result sets, you can use pagination with [`paginate`](https://docs.convex.dev/api/interfaces/server.GenericReader#paginate):

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const paginateTasks = query({
  args: { cursor: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const { cursor } = args;
    const paginationResult = await ctx.db
      .query("tasks")
      .paginate({ cursor, numItems: 10 });
    
    return {
      tasks: paginationResult.page,
      done: paginationResult.isDone,
      nextCursor: paginationResult.continueCursor,
    };
  },
});
```

### Complex Queries

You can combine multiple query methods for more complex queries:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";

export const searchTasks = query({
  args: {
    userId: v.string(),
    status: v.union(v.literal("active"), v.literal("completed")),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .filter((q) => q.eq(q.field("status"), args.status))
      .order("desc")
      .take(20)
      .collect();
    return tasks;
  },
});
```

### Query Limits

To prevent accidental reads of large amounts of records, queries enforce limits detailed [here](https://docs.convex.dev/production/state/limits#transactions).

For more information about querying data efficiently, see [Indexes and Query Performance](https://docs.convex.dev/database/indexes/indexes-and-query-perf).