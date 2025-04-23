# Scheduled Functions

Convex allows you to schedule functions to run in the future. This allows you to build powerful durable workflows without the need to set up and maintain queues or other infrastructure.

Scheduled functions are stored in the database. This means you can schedule functions minutes, days, and even months in the future. Scheduling is resilient against unexpected downtime or system restarts.

## Scheduling functions

You can schedule public functions and internal functions from mutations and actions via the scheduler provided in the respective function context.

*   runAfter schedules a function to run after a delay (measured in milliseconds).
*   runAt schedules a function run at a date or timestamp (measured in milliseconds elapsed since the epoch).

The rest of the arguments are the path to the function and its arguments, similar to invoking a function from the client. For example, here is how to send a message that self-destructs in five seconds.

```typescript
import { mutation, internalMutation } from "./_generated/server";
import { internal } from "./_generated/api";
import { v } from "convex/values";

export const sendExpiringMessage = mutation({
  args: { body: v.string(), author: v.string() },
  handler: async (ctx, args) => {
    const { body, author } = args;
    const id = await ctx.db.insert("messages", { body, author });
    await ctx.scheduler.runAfter(5000, internal.messages.destruct, {
      messageId: id,
    });
  },
});

export const destruct = internalMutation({
  args: {
    messageId: v.id("messages"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.messageId);
  },
});
```

A single function can schedule up to 1000 functions with total argument size of 8MB.

### Scheduling from mutations

Scheduling functions from mutations is atomic with the rest of the mutation. This means that if the mutation succeeds, the scheduled function is guaranteed to be scheduled. On the other hand, if the mutations fails, no function will be scheduled, even if the function fails after the scheduling call.

### Scheduling from actions

Unlike mutations, actions don't execute as a single database transaction and can have side effects. Thus, scheduling from actions does not depend on the outcome of the function. This means that an action might succeed to schedule some functions and later fail due to transient error or a timeout. The scheduled functions will still be executed.

### Scheduling immediately

Using `runAfter()` with delay set to 0 is used to immediately add a function to the event queue. This usage may be familiar to you if you're used to calling `setTimeout(fn, 0)`.

As noted above, actions are not atomic and are meant to cause side effects. Scheduling immediately becomes useful when you specifically want to trigger an action from a mutation that is conditional on the mutation succeeding.

## Retrieving scheduled function status

Every scheduled function is reflected as a document in the `"_scheduled_functions"` system table. `runAfter()` and `runAt()` return the id of scheduled function. You can read data from system tables using the `db.system.get` and `db.system.query` methods, which work the same as the standard `db.get` and `db.query` methods.

```typescript
export const listScheduledMessages = query({
  args: {},
  handler: async (ctx, args) => {
    return await ctx.db.system.query("_scheduled_functions").collect();
  },
});

export const getScheduledMessage = query({
  args: {
    id: v.id("_scheduled_functions"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.system.get(args.id);
  },
});
```

The returned document has the following fields:

*   `name`: the path of the scheduled function
*   `args`: the arguments passed to the scheduled function
*   `scheduledTime`: the timestamp of when the function is scheduled to run (measured in milliseconds elapsed since the epoch)
*   `completedTime`: the timestamp of when the function finished running, if it has completed (measured in milliseconds elapsed since the epoch)
*   `state`: the status of the scheduled function. Here are the possible states a scheduled function can be in:
    *   `Pending`: the function has not been started yet
    *   `InProgress`: the function has started running is not completed yet (only applies to actions)
    *   `Success`: the function finished running successfully with no errors
    *   `Failed`: the function hit an error while running, which can either be a user error or an internal server error
    *   `Canceled`: the function was canceled via the dashboard, `ctx.scheduler.cancel`, or recursively by a parent scheduled function that was canceled while in progress

Scheduled function results are available for 7 days after they have completed.

## Canceling scheduled functions

You can cancel a previously scheduled function with `cancel` via the scheduler provided in the respective function context.

```typescript
export const cancelMessage = mutation({
  args: {
    id: v.id("_scheduled_functions"),
  },
  handler: async (ctx, args) => {
    await ctx.scheduler.cancel(args.id);
  },
});
```

What `cancel` does depends on the state of the scheduled function:

*   If it hasn't started running, it won't run.
*   If it already started, it will continue to run, but any functions it schedules will not run.

## Error handling

Once scheduled, mutations are guaranteed to be executed exactly once. Convex will automatically retry any internal Convex errors, and only fail on developer errors.

Since actions may have side effects, they are not automatically retried by Convex. Thus, actions will be executed at most once, and permanently fail if there are transient errors while executing them. Developers can retry those manually by scheduling a mutation that checks if the desired outcome has been achieved and if not schedule the action again.

## Auth

The auth is not propagated from the scheduling to the scheduled function. If you want to authenticate or check authorization, you'll have to pass the requisite user information in as a parameter.