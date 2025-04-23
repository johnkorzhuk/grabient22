Title: Writing Data | Convex Developer Hub

URL Source: https://docs.convex.dev/database/writing-data

Markdown Content:
[Mutations](https://docs.convex.dev/functions/mutation-functions) can insert, update, and remove data from database tables.

You can create new documents in the database with the [`db.insert`](https://docs.convex.dev/api/interfaces/server.GenericDatabaseWriter#insert) method:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const createTask = mutation({
  args: { text: v.string() },
  handler: async (ctx, args) => {
    const taskId = await ctx.db.insert("tasks", { text: args.text });
    // do something with `taskId`
  },
});
```

The second argument to `db.insert` is a JavaScript object with data for the new document.

The same types of values that can be passed into and returned from [queries](https://docs.convex.dev/functions/query-functions) and [mutations](https://docs.convex.dev/functions/mutation-functions) can be written into the database. See [Data Types](https://docs.convex.dev/database/types) for the full list of supported types.

The `insert` method returns a globally unique ID for the newly inserted document.

Given an existing document ID the document can be updated using the following methods:

1.  The [`db.patch`](https://docs.convex.dev/api/interfaces/server.GenericDatabaseWriter#patch) method will patch an existing document, shallow merging it with the given partial document. New fields are added. Existing fields are overwritten. Fields set to `undefined` are removed.

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const updateTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const { id } = args;
    console.log(await ctx.db.get(id));
    // { text: "foo", status: { done: true }, _id: ... }

    // Add `tag` and overwrite `status`:
    await ctx.db.patch(id, { tag: "bar", status: { archived: true } });
    console.log(await ctx.db.get(id));
    // { text: "foo", tag: "bar", status: { archived: true }, _id: ... }

    // Unset `tag` by setting it to `undefined`
    await ctx.db.patch(id, { tag: undefined });
    console.log(await ctx.db.get(id));
    // { text: "foo", status: { archived: true }, _id: ... }
  },
});
```

2.  The [`db.replace`](https://docs.convex.dev/api/interfaces/server.GenericDatabaseWriter#replace) method will replace the existing document entirely, potentially removing existing fields:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const replaceTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    const { id } = args;
    console.log(await ctx.db.get(id));
    // { text: "foo", _id: ... }

    // Replace the whole document
    await ctx.db.replace(id, { invalid: true });
    console.log(await ctx.db.get(id));
    // { invalid: true, _id: ... }
  },
});
```

Given an existing document ID the document can be removed from the table with the [`db.delete`](https://docs.convex.dev/api/interfaces/server.GenericDatabaseWriter#delete) method.

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const deleteTask = mutation({
  args: { id: v.id("tasks") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});
```

To prevent accidental writes of large amounts of records, queries and mutations enforce limits detailed [here](https://docs.convex.dev/production/state/limits#transactions).