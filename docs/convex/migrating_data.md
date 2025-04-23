# Stateful Online Migrations using Mutations

Migrations are inevitable. Initial schemas aren't perfect on the first try. As your understanding of the problem evolves, you will inevitably change your mind about the ideal way to store information. So how do you do it at scale, where you might not be able to change everything in a single transaction?

## Schema Migrations[](#schema-migrations)

One thing to call out explicitly is that with Convex, you **don’t** have to write migration code like “add column” or “add index” explicitly. All you need to do is update your `schema.ts` file and Convex handles it. Convex isn’t rigidly structured like most SQL databases are. If you change your field from `v.string()` to `v.union(v.string(), v.number())`, Convex doesn’t have to reformat the data or table. However, it **will** enforce the schema you define, and will not let you deploy a schema that doesn't match the data at rest. Or you can turn off schema validation and throw unstructured data into Convex and it will also work[1](#user-content-fn-1).

## Data Migrations using Mutations[](#data-migrations-using-mutations)

To migrate data in Convex, you can use a [mutation](https://docs.convex.dev/functions/mutation-functions) to transform your data. In particular, you'd likely use an [`internalMutation`](https://docs.convex.dev/functions/internal-functions) so it isn't exposed on your public API.

### Common use cases[](#common-use-cases)

Here's how to achieve common migration patterns:

#### Adding a new field with a default value[](#adding-a-new-field-with-a-default-value)

```ts
export const setDefaultPlan = migrations.define({
  table: "teams",
  migrateOne: async (ctx, team) => {
    if (!team.plan) {
      await db.patch(team._id, { plan: "basic" });
    }
  },
});
```

#### Deleting a field[](#deleting-a-field)

If you’re sure you want to get rid of data, you would modify the schema in reverse: making the field optional before you can delete the data.

`isPro: v.boolean()` -> `isPro: v.optional(v.boolean())`

Then you can run the following:

```ts
export const removeBoolean = migrations.define({
  table: "teams",
  migrateOne: async (ctx, team) => {
    if (team.isPro !== undefined) {
      await db.patch(team._id, { isPro: undefined });
    }
  },
});
```

#### Changing the type of a field[](#changing-the-type-of-a-field)

You can both add and delete fields in the same migration - we could have done both the setting a default plan and deleting the deprecated `isPro` plan:

```ts
export const updatePlanToEnum = migrations.define({
  table: "teams",
  migrateOne: async (ctx, team) => {
    if (!team.plan) {
      await db.patch(team._id, {
        plan: team.isPro ? "pro" : "basic",
        isPro: undefined,
      });
    }
  },
});
```

I'd recommend new fields when types change, but if you want to use the same field, you can do it with a union: `zipCode: v.number()` -> `field: v.union(v.string(), v.number())`

```ts
export const zipCodeShouldBeAString = migrations.define({
  table: "addresses",
  migrateOne: async (ctx, address) => {
    if (typeof address.zipCode === "number") {
      // Note: as a convenience, it will apply a patch you return.
      return { zipCode: address.zipCode.toString() };
    }
  },
});
```

#### Inserting documents based on some state[](#inserting-documents-based-on-some-state)

Let's say you're changing user preferences from being an object in the users schema to its own document - you might consider doing this as preferences grows to be a lot of options, or to avoid accidentally returning preference data to clients for queries that return users. You can walk the users table and insert into another table:

```ts
export const changePreferencesToDocument = migrations.define({
  table: "users",
  migrateOne: async (ctx, user) => {
    const prefs = await ctx.db
      .query("preferences")
      .withIndex("userId", (q) => q.eq("userId", user._id))
      .first();
    if (!prefs) {
      await ctx.db.insert("preferences", user.preferences);
      await ctx.db.patch(user._id, { preferences: undefined });
    }
  },
});
```

You'd want to also have code that is adding perferences documents by default for new users, so the migration is only responsible for older users. You'd also update your code to first check the user for preferences, and if it's unset, fetch it from the table. Later, once you're confident there are preferences for all users, remove the preferences object from the users schema, and the code can just read preferences from the table.

#### Deleting documents based on some state[](#deleting-documents-based-on-some-state)

If you had a bug where you didn't delete related documents correctely, you might want to clean up documents based on the existence of another document. For example, one gotcha with vector databases is forgetting to delete embedding documents linked to chunks of documents that have been deleted. When you do a vector search, you'd get results that no longer exist. To delete the related documents you could do:

```ts
export const deleteOrphanedEmbeddings = migrations.define({
  table: "embeddings",
  migrateOne: async (ctx, doc) => {
    const chunk = await ctx.db
      .query("chunks")
      .withIndex("embeddingId", (q) => q.eq("embeddingId", doc._id))
      .first();
    if (!chunk) {
      await ctx.db.delete(doc._id);
    }
  },
});
```

### Defining your own migrations[](#defining-your-own-migrations)

How would you do this without the `migration` component? The rest of this post is here if you want to know how to build some of this yourself. If you're happy with the component, you can stop reading here.

If your table is small enough (let’s say a few thousand rows, as a guideline), you could just do it all in one mutation. For example:

```jsx
export const doMigration = internalMutation(async ({ db }) => {
  const teams = await db.query("teams").collect();
  for (const team of teams) {
    // modify the team and write it back to the db here
  }
});
```

#### Big tables[](#big-tables)

For larger tables, reading the whole table becomes impossible. Even with smaller tables, if there are a lot of active writes happening to the table, you might want to break the work into smaller chunks to avoid conflicts. Convex will automatically retry failed mutations up to a limit, and mutations don’t block queries, but it’s still best to avoid scenarios that make them likely.

There are a few ways you could break up the work. For the component, I use [pagination](https://docs.convex.dev/database/pagination). Each mutation will only operate on a batch of documents and keep track of how far it got, so the next worker can efficiently pick up the next batch. One nice benefit of this is you can keep track of your progress, and if it fails on some batch of data, you can keep track of the cursor it started with and restart the migration at that batch. Thanks to Convex’s [transactional guarantees](https://docs.convex.dev/database/advanced/occ), either all of the batch or none of the batch’s writes will have committed. A mutation that works with a page of data might look like this:

```jsx
export const myMigrationBatch = internalMutation(
  async ({ db }, { cursor, numItems }) => {
    const data = await db.query("mytable").paginate({ cursor, numItems });
    const { page, isDone, continueCursor } = data;
    for (const doc of page) {
      // modify doc
    }
    return { cursor: continueCursor, isDone };
  },
);
```

#### Running a batch[](#running-a-batch)

To try out your migration, you might try running it on one chunk of data via the CLI or by going to the functions panel on [the dashboard](https://docs.convex.dev/dashboard/deployments/functions#running-functions) and clicking “Run function.” To run from the beginning of the table, you’d pass as an argument:

`{ cursor: null, numItems: 1 }`

On the CLI it would be:

```sh
npx convex run mutations:myMigrationBatch '{ "cursor": null, "numItems": 1 }'
```

It would then run and return the next cursor (and print it to the console so you can look back if you lose track of it). To run the next batch, just update the parameter to the cursor string instead of `null`.

You could keep running it from here, but it might start to feel tedious. Once you have confidence in the code and batch size, you can start running the rest. You can even pass in the cursor you got from testing on the dashboard to skip the documents you’ve already processed .

#### Looping batches from an action[](#looping-batches-from-an-action)

To iterate through chunks, you can call it from an action in a loop:

```jsx
export const runMigration = internalAction(
  async ({ runMutation }, { name, cursor, batchSize }) => {
    let isDone = false;
    while (!isDone) {
      const args = { cursor, numItems: batchSize };
      ({ isDone, cursor } = await runMutation(name, args));
    }
  },
);
```

You can then go to the dashboard page for the `runMigration` function and test run the mutation with the arguments `{ name: "myMigrationBatch", cursor: null, batchSize: 1 }`

Here `"myMigrationBatch"` is whatever your mutation’s path is, e.g. if it’s in the file `convex/migrations/someMigration.js`, it would be `"migrations/someMigration:myMigrationBatch"`.

To use the CLI, you could run:

```sh
npx convex run migrations:runMigration '{ "name": "myMigrationBatch", "cursor": null, "batchSize": 1 }'
```

It is also possible to loop from a client, such as [the `ConvexHttpClient`](https://docs.convex.dev/api/classes/browser.ConvexHttpClient), if you make it a public mutation. You could also recursively schedule a mutation to run, as an exercise left to the reader.

#### Batching via recursive scheduling[](#batching-via-recursive-scheduling)

In the component, we use recursive scheduling for batches. A mutation keeps scheduling itself until the pagination is done.

```ts
export const myMigrationBatch = internalMutation({
  args: { cursor: v.union(v.string(), v.null()), numItems: v.number() },
  handler: async (ctx, args) => {
    const data = await ctx.db.query("mytable").paginate(args);
    const { page, isDone, continueCursor } = data;
    for (const doc of page) {
      // modify doc
    }
    if (!isDone) await ctx.scheduler.runAfter(0, internal.example.myMigrationBatch, {
      cursor: continueCursor,
      numItems: args.numItems,
    });
  }
});
```

#### An aside on serial vs. parallelizing[](#an-aside-on-serial-vs-parallelizing)

You might be wondering whether we should be doing all of this in parallel. I’d urge you to start doing it serially, and only add parallelization gradually if it’s actually too slow. As a general principle with backend systems, avoid sending big bursts of traffic when possible. Even without causing explicit failures, it could affect latencies for user requests if you flood the database with too much traffic at once. This is a different mindset from an analytics database where you’d optimize for throughput. I think you’ll be surprised how fast a serial approach works in most cases.

## Summary[](#summary)

In this post, we looked at a strategy for migrating data in Convex using mutation functions. As with other posts, the magic is in composing functions and leveraging the fact that you get to write javascript or typescript rather than divining the right SQL incantation. [Docs for the component are here](https://www.convex.dev/components/migrations), and code for the component is available [on GitHub](https://github.com/get-convex/migrations). If you have any questions don’t hesitate to reach out in [Discord](https://convex.dev/community).

### Footnotes[](#footnote-label)

1.  Technically, there are some restrictions on Convex values, such as array lengths and object key names that you can read about [here](https://docs.convex.dev/production/state/limits). [↩](#user-content-fnref-1)