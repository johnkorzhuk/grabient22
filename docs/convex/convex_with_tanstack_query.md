Title: Using Convex with TanStack Query

URL Source: https://docs.convex.dev/client/react/tanstack-query

Markdown Content:
Learn how to use Convex with TanStack Query in your React application. TanStack Query is a powerful data synchronization library that works seamlessly with Convex to provide real-time updates and efficient data fetching.

[Installation](https://docs.convex.dev/client/react/tanstack-query#installation)
-----------------------------------------------------------------------------

First, install the required packages:

```bash
npm install convex @convex-dev/react-query @tanstack/react-query
```

[Setting up the QueryClient](https://docs.convex.dev/client/react/tanstack-query#setting-up-the-queryclient)
---------------------------------------------------------------------------------------------------------

Create a `ConvexQueryClient` and configure it with your TanStack Query client:

```typescript
import { ConvexQueryClient } from "@convex-dev/react-query";
import { QueryClient } from "@tanstack/react-query";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL!;

const convexQueryClient = new ConvexQueryClient(CONVEX_URL);
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryKeyHashFn: convexQueryClient.hashFn(),
      queryFn: convexQueryClient.queryFn(),
    },
  },
});

convexQueryClient.connect(queryClient);
```

[Provider Setup](https://docs.convex.dev/client/react/tanstack-query#provider-setup)
---------------------------------------------------------------------------------

Wrap your application with both the `QueryClientProvider` and `ConvexProvider`:

```typescript
import { QueryClientProvider } from "@tanstack/react-query";
import { ConvexProvider } from "convex/react";

function App({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <ConvexProvider client={convexQueryClient.convexClient}>
        {children}
      </ConvexProvider>
    </QueryClientProvider>
  );
}
```

[Using Queries](https://docs.convex.dev/client/react/tanstack-query#using-queries)
-------------------------------------------------------------------------------

Use TanStack Query's hooks to fetch and subscribe to Convex data:

```typescript
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../convex/_generated/api";

function TaskList() {
  const { data: tasks, isLoading } = useQuery(
    convexQuery(api.tasks.list, { completed: false })
  );

  if (isLoading) return <div>Loading...</div>;

  return (
    <ul>
      {tasks?.map((task) => (
        <li key={task._id}>{task.text}</li>
      ))}
    </ul>
  );
}
```

[Mutations](https://docs.convex.dev/client/react/tanstack-query#mutations)
-----------------------------------------------------------------------

Use TanStack Query's mutation hooks to modify Convex data:

```typescript
import { convexMutation } from "@convex-dev/react-query";
import { useMutation } from "@tanstack/react-query";
import { api } from "../convex/_generated/api";

function AddTask() {
  const { mutate: addTask, isPending } = useMutation(
    convexMutation(api.tasks.create)
  );

  return (
    <button
      disabled={isPending}
      onClick={() => addTask({ text: "New Task", completed: false })}
    >
      Add Task
    </button>
  );
}
```

[Optimistic Updates](https://docs.convex.dev/client/react/tanstack-query#optimistic-updates)
-----------------------------------------------------------------------------------------

Implement optimistic updates using TanStack Query's mutation options:

```typescript
import { convexMutation, convexQuery } from "@convex-dev/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "../convex/_generated/api";

function CompleteTask({ taskId }: { taskId: string }) {
  const queryClient = useQueryClient();
  
  const { mutate: completeTask } = useMutation({
    mutationFn: convexMutation(api.tasks.complete),
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: convexQuery(api.tasks.list, { completed: false }),
      });

      // Snapshot the previous value
      const previousTasks = queryClient.getQueryData(
        convexQuery(api.tasks.list, { completed: false })
      );

      // Optimistically update to the new value
      queryClient.setQueryData(
        convexQuery(api.tasks.list, { completed: false }),
        (old: any[]) => old.filter(task => task._id !== taskId)
      );

      // Return context with the snapshotted value
      return { previousTasks };
    },
    onError: (err, variables, context) => {
      // If the mutation fails, use the context we returned above
      queryClient.setQueryData(
        convexQuery(api.tasks.list, { completed: false }),
        context?.previousTasks
      );
    },
  });

  return (
    <button onClick={() => completeTask({ id: taskId })}>
      Complete
    </button>
  );
}
```

[Suspense Mode](https://docs.convex.dev/client/react/tanstack-query#suspense-mode)
-------------------------------------------------------------------------------

Use Suspense mode for a more declarative data loading approach:

```typescript
import { convexQuery } from "@convex-dev/react-query";
import { useSuspenseQuery } from "@tanstack/react-query";
import { api } from "../convex/_generated/api";
import { Suspense } from "react";

function TaskListContent() {
  const { data: tasks } = useSuspenseQuery(
    convexQuery(api.tasks.list, { completed: false })
  );

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task._id}>{task.text}</li>
      ))}
    </ul>
  );
}

function TaskListWithSuspense() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TaskListContent />
    </Suspense>
  );
}
```

[Best Practices](https://docs.convex.dev/client/react/tanstack-query#best-practices)
---------------------------------------------------------------------------------

1. **Query Keys**: Convex query keys are automatically handled by the `convexQuery` and `convexMutation` functions. You don't need to manually specify query keys.

2. **Real-time Updates**: Convex automatically handles real-time updates. When data changes on the server, your queries will automatically update.

3. **Error Handling**: Use TanStack Query's error handling features to gracefully handle Convex errors:

```typescript
import { convexQuery } from "@convex-dev/react-query";
import { useQuery } from "@tanstack/react-query";
import { api } from "../convex/_generated/api";

function TaskList() {
  const { data: tasks, isLoading, isError, error } = useQuery(
    convexQuery(api.tasks.list, { completed: false })
  );

  if (isLoading) return <div>Loading...</div>;
  if (isError) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {tasks.map((task) => (
        <li key={task._id}>{task.text}</li>
      ))}
    </ul>
  );
}
```

4. **Prefetching**: Use TanStack Query's prefetching capabilities with Convex queries:

```typescript
import { convexQuery } from "@convex-dev/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "../convex/_generated/api";

function TaskManager() {
  const queryClient = useQueryClient();

  // Prefetch completed tasks when hovering over the button
  const prefetchCompletedTasks = () => {
    queryClient.prefetchQuery(
      convexQuery(api.tasks.list, { completed: true })
    );
  };

  return (
    <button onMouseEnter={prefetchCompletedTasks}>
      View Completed Tasks
    </button>
  );
}
```

For more information, see the [TanStack Query documentation](https://tanstack.com/query/latest) and [Convex documentation](https://docs.convex.dev/).