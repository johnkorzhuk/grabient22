Title: TanStack Start Quickstart | Convex Developer Hub

URL Source: https://docs.convex.dev/quickstart/tanstack-start

TanStack Start is in Alpha

[TanStack Start](https://tanstack.com/start/latest) is a new React framework currently in alpha. You can try it today but there are likely to be breaking changes before a stable release.

To get setup quickly with Convex and TanStack Start run

**`npm create convex@latest -- -t tanstack-start`**

or follow the guide below.

* * *

Learn how to query data from Convex in a TanStack Start site.

1.  Create a TanStack Start site
    
    The TanStack team intends to release a CLI template starter soon, but until the official way to create a new TanStack Start site is to follow the TanStack Start [getting started](https://tanstack.com/router/latest/docs/framework/react/start/getting-started) guide.
    
    Once you've finished you'll have a directory called myApp with a minimal TanStack Start app in it.
    
    ```
    .├── app/│   
    ├── routes/│   
    │   ├── `index.tsx`│   
    │   └── `__root.tsx`│   
    ├── `client.tsx`│   
    ├── `router.tsx`│   
    ├── `routeTree.gen.ts`│   
    └── `ssr.tsx`
    ├── `.gitignore`
    ├── `app.config.ts`
    ├── `package.json`
    └── `tsconfig.json`
    ```
    
2.  Install the Convex client and server library
    
    To get started with Convex install the `convex` package and a few React Query-related packages.
    
    ```bash
    npm install convex @convex-dev/react-query @tanstack/react-router-with-query @tanstack/react-query
    ```
    
3.  Update app/routes/\_\_root.tsx
    
    Add a `QueryClient` to the router context to make React Query usable anywhere in the TanStack Start site.
    
    app/routes/\_\_root.tsx
    
    ```typescript
    import { QueryClient } from "@tanstack/react-query";
    import { createRootRouteWithContext } from "@tanstack/react-router";
    import { Outlet, ScrollRestoration } from "@tanstack/react-router";
    import { Body, Head, Html, Meta, Scripts } from "@tanstack/start";
    import * as React from "react";

    export const Route = createRootRouteWithContext<{
    queryClient: QueryClient;
    }>()({
    meta: () => [
        {
        charSet: "utf-8",
        },
        {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
        },
        {
        title: "TanStack Start Starter",
        },
    ],
    component: RootComponent,
    });

    function RootComponent() {
    return (
        <RootDocument>
        <Outlet />
        </RootDocument>
    );
    }

    function RootDocument({ children }: { children: React.ReactNode }) {
    return (
        <Html>
        <Head>
            <Meta />
        </Head>
        <Body>
            {children}
            <ScrollRestoration />
            <Scripts />
        </Body>
        </Html>
    );
    }
    ```
    
4.  Update app/router.tsx
    
    Replace the file `app/router.tsx` with these contents.
    
    This creates a `ConvexClient` and a `ConvexQueryClient` and wires in a `ConvexProvider`.
    
    app/router.tsx
    
    ```typescript
    import { createRouter as createTanStackRouter } from "@tanstack/react-router";
    import { QueryClient } from "@tanstack/react-query";
    import { routerWithQueryClient } from "@tanstack/react-router-with-query";
    import { ConvexQueryClient } from "@convex-dev/react-query";
    import { ConvexProvider } from "convex/react";
    import { routeTree } from "./routeTree.gen";

    export function createRouter() {
    const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;
    if (!CONVEX_URL) {
        console.error("missing envar VITE_CONVEX_URL");
    }

    const convexQueryClient = new ConvexQueryClient(CONVEX_URL);
    const queryClient: QueryClient = new QueryClient({
        defaultOptions: {
        queries: {
            queryKeyHashFn: convexQueryClient.hashFn(),
            queryFn: convexQueryClient.queryFn(),
        },
        },
    });

    convexQueryClient.connect(queryClient);

    const router = routerWithQueryClient(
        createTanStackRouter({
        routeTree,
        defaultPreload: "intent",
        context: { queryClient },
        Wrap: ({ children }) => (
            <ConvexProvider client={convexQueryClient.convexClient}>
            {children}
            </ConvexProvider>
        ),
        }),
        queryClient,
    );

    return router;
    }

    declare module "@tanstack/react-router" {
    interface Register {
        router: ReturnType<typeof createRouter>;
    }
    }
    ```
    
5.  Set up a Convex dev deployment
    
    Next, run `npx convex dev`. This will prompt you to log in with GitHub, create a project, and save your production and deployment URLs.
    
    It will also create a `convex/` folder for you to write your backend API functions in. The `dev` command will then continue running to sync your functions with your dev deployment in the cloud.
    
    ```bash
    npx convex dev
    ```
    
6.  Create sample data for your database
    
    In a new terminal window, create a `sampleData.jsonl` file with some sample data.
    
    sampleData.jsonl
    
    ```jsonl
    {"text": "Buy groceries", "isCompleted": true}
    {"text": "Go for a swim", "isCompleted": true}
    {"text": "Integrate Convex", "isCompleted": false}
    ```
    
7.  Add the sample data to your database
    
    Now that your project is ready, add a `tasks` table with the sample data into your Convex database with the `import` command.
    
    ```bash
    npx convex import --table tasks sampleData.jsonl
    ```
    
8.  Expose a database query
    
    Add a new file `tasks.ts` in the `convex/` folder with a query function that loads the data.
    
    Exporting a query function from this file declares an API function named after the file and the export name, `api.tasks.get`.
    
    convex/tasks.ts
    
    ```typescript
    import { query } from "./_generated/server";

    export const get = query({
    args: {},
    handler: async (ctx) => {
        return await ctx.db.query("tasks").collect();
    },
    });
    ```
    
9.  Display the data in your app
    
    Replace the file `app/routes/index.tsx` with these contents.
    
    The `useSuspenseQuery` hook renders the API function `api.tasks.get` query result on the server initially, then it updates live in the browser.
    
    app/routes/index.tsx
    
    ```typescript
    import { convexQuery } from "@convex-dev/react-query";
    import { useSuspenseQuery } from "@tanstack/react-query";
    import { createFileRoute } from "@tanstack/react-router";
    import { api } from "../../convex/_generated/api";

    export const Route = createFileRoute("/")({
    component: Home,
    });

    function Home() {
    const { data } = useSuspenseQuery(convexQuery(api.tasks.get, {}));
    return (
        <div>
        {data.map(({ _id, text }) => (
            <div key={_id}>{text}</div>
        ))}
        </div>
    );
    }
    ```
    
10.  Start the app
    
    Start the app, open [http://localhost:3000](http://localhost:3000/) in a browser, and see the list of tasks.
    
    ```bash
    npm run dev
    ```
    

