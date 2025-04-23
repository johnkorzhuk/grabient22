

## File: app\client.tsx

- Size: 251 bytes
- Language: tsx

```tsx
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/start'
import { createRouter } from './router'

const router = createRouter()

hydrateRoot(document.getElementById('root')!, <StartClient router={router} />)

```


## File: app\components\Chat.tsx

- Size: 4987 bytes
- Language: tsx

```tsx
import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Input } from '../components/ui/input'
import { PaperPlaneIcon } from '@radix-ui/react-icons'
import { useQuery, useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from 'convex/_generated/api'
import { Skeleton } from './ui/skeleton'
import CodeSample from '~/components/CodeSample'

function serverTimeFormat(ms: number): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(ms))
}
function clientTimeFormat(ms: number): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/New_York',
  })
  return formatter.format(new Date(ms))
}
const Message = ({
  user,
  body,
  _creationTime,
}: {
  user: string
  body: string
  _creationTime: number
}) => {
  const [timestamp, setTimestamp] = useState<string | undefined>()
  useEffect(() => {
    setTimestamp(clientTimeFormat(_creationTime))
  }, [_creationTime])
  return (
    <div className="flex items-start space-x-2 group">
      <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
        {user.toLowerCase().startsWith('user ')
          ? user[5]
          : user[0].toUpperCase()}
      </div>
      <div className="flex-1">
        <div className="flex items-baseline">
          <span className="font-semibold mr-2">{user}</span>
          <span
            className={`text-xs text-muted-foreground opacity-0 transition-opacity duration-100 ${timestamp ? 'group-hover:opacity-100' : ''}`}
          >
            {timestamp || serverTimeFormat(_creationTime)}
          </span>
        </div>
        <p className="text-sm mt-1">{body}</p>
      </div>
    </div>
  )
}

const MessageSkeleton = () => (
  <div className="flex items-start space-x-2">
    <Skeleton className="w-8 h-8 rounded-full" />
    <div className="flex-1">
      <div className="flex items-baseline">
        <Skeleton className="h-4 w-20 mr-2" />
        <Skeleton className="h-3 w-12" />
      </div>
      <Skeleton className="h-4 w-full mt-1" />
    </div>
  </div>
)

export default function Component({
  useSuspense,
  codeToShow,
  channel = 'chatty',
  gcTime = 10000,
  cacheBust,
}: {
  useSuspense: boolean
  codeToShow?: string
  channel?: string
  gcTime?: number
  cacheBust?: any
}) {
  const useWhicheverQuery: typeof useQuery = useSuspense
    ? (useSuspenseQuery as typeof useQuery)
    : useQuery

  const { data, isPending, error } = useWhicheverQuery({
    ...convexQuery(api.messages.listMessages, {
      channel,
      ...(cacheBust ? { cacheBust } : {}),
    }),
    gcTime,
  })

  const [name] = useState(() => 'User ' + Math.floor(Math.random() * 10000))
  const [newMessage, setNewMessage] = useState('')
  const sendMessage = useConvexMutation(api.messages.sendMessage)

  const handleSendMessage = async () => {
    if (newMessage.trim()) {
      await sendMessage({ user: name, body: newMessage, channel })
      setNewMessage('')
    }
  }

  const code = codeToShow && <CodeSample code={codeToShow} />

  const input = (
    <div className="flex w-full flex-col pt-6 gap-y-2">
      <div className="flex space-x-2 w-full">
        <Input
          type="text"
          placeholder="Type a message..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
        />
        <Button size="icon" onClick={handleSendMessage}>
          <PaperPlaneIcon className="h-4 w-4" />
        </Button>
      </div>
      {newMessage !== '' && (
        <span className="text-xs text-slate-400">
          As this is a public demo, your message will be replaced with
          system-generated text.
        </span>
      )}
    </div>
  )

  return (
    <>
      <Card className="w-full">
        <CardHeader className="h-[250px] overflow-y-auto">
          {isPending || error ? (
            <>
              <MessageSkeleton />
              <MessageSkeleton />
              <MessageSkeleton />
            </>
          ) : (
            data.map((msg) => (
              <Message
                key={msg._id}
                user={msg.user}
                body={msg.body}
                _creationTime={msg._creationTime}
              />
            ))
          )}
        </CardHeader>
        {code ? <CardContent>{input}</CardContent> : null}
        <CardFooter>{code ? code : input}</CardFooter>
      </Card>
    </>
  )
}

```


## File: app\components\CodeSample.tsx

- Size: 1048 bytes
- Language: tsx

```tsx
import { Highlight } from 'prism-react-renderer'

interface CodeBlockProps {
  code: string
}

export default function CodeBlock({ code }: CodeBlockProps) {
  return (
    <div className="w-full rounded-xl overflow-hidden text-lg not-prose">
      <Highlight code={code.trim()} language="typescript">
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className={`${className} overflow-auto p-4`} style={style}>
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })} className="table-row">
                <span className="table-cell text-right pr-4 select-none opacity-50 text-sm">
                  {i + 1}
                </span>
                <span className="table-cell">
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </span>
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </div>
  )
}

```


## File: app\components\DefaultCatchBoundary.tsx

- Size: 270 bytes
- Language: tsx

```tsx
import { ErrorComponent } from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  console.error(error)

  return <ErrorComponent error={error} />
}

```


## File: app\components\NotFound.tsx

- Size: 139 bytes
- Language: tsx

```tsx
export function NotFound({ children }: { children?: any }) {
  return children || <p>The page you are looking for does not exist.</p>
}

```


## File: app\components\ui\button.tsx

- Size: 1836 bytes
- Language: tsx

```tsx
import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '~/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-slate-300 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-slate-700 text-white shadow hover:bg-slate-800',
        destructive: 'bg-red-600 text-white shadow-sm hover:bg-red-500',
        outline:
          'border border-slate-200 bg-white shadow-sm hover:bg-slate-100 hover:text-slate-900',
        secondary: 'bg-slate-100 text-slate-900 shadow-sm hover:bg-slate-200',
        ghost: 'hover:bg-slate-100 hover:text-slate-900',
        link: 'hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-8 rounded-md px-3 text-xs',
        lg: 'h-10 rounded-md px-8',
        icon: 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  },
)
Button.displayName = 'Button'

export { Button, buttonVariants }

```


## File: app\components\ui\card.tsx

- Size: 1994 bytes
- Language: tsx

```tsx
import * as React from 'react'
import { cn } from '~/lib/utils'

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('rounded-xl border bg-slate-900 border-slate-800', className)}
    {...props}
  />
))
Card.displayName = 'Card'

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 p-4 pb-2', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => {
  if (!children) return null
  return (
    <h3
      ref={ref}
      className={cn('font-semibold leading-none tracking-tight', className)}
      {...props}
    >
      {children}
    </h3>
  )
})
CardTitle.displayName = 'CardTitle'

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-foreground', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('p-4 pt-0', className)} {...props} />
))
CardContent.displayName = 'CardContent'

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center p-4 pt-0', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }

```


## File: app\components\ui\input.tsx

- Size: 853 bytes
- Language: tsx

```tsx
import * as React from 'react'

import { cn } from '~/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-9 w-full rounded-md border border-slate-500 bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
          className,
        )}
        ref={ref}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'

export { Input }

```


## File: app\components\ui\skeleton.tsx

- Size: 281 bytes
- Language: tsx

```tsx
import { cn } from "~/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-primary/10", className)}
      {...props}
    />
  )
}

export { Skeleton }

```


## File: app\lib\utils.ts

- Size: 172 bytes
- Language: ts

```ts
import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

```


## File: app\ssr.tsx

- Size: 307 bytes
- Language: tsx

```tsx
import {
  createStartHandler,
  defaultStreamHandler,
} from '@tanstack/start/server'
import { getRouterManifest } from '@tanstack/start/router-manifest'

import { createRouter } from './router'

export default createStartHandler({
  createRouter,
  getRouterManifest,
})(defaultStreamHandler)

```


## File: convex\messages.ts

- Size: 6731 bytes
- Language: ts

```ts
import {
  MutationCtx,
  QueryCtx,
  action,
  internalMutation,
  mutation,
} from './_generated/server'
import { query } from './_generated/server'
import { api, internal } from './_generated/api.js'
import { v } from 'convex/values'

export const list = query(async (ctx, { cacheBust }) => {
  const _unused = cacheBust
  return await ctx.db.query('messages').collect()
})

export const listMessages = query({
  args: {
    cacheBust: v.optional(v.any()),
    channel: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const _unused = args.cacheBust
    const channelName = args.channel || 'chatty'
    return await latestMessagesFromChannel(ctx, channelName)
  },
})

async function channelByName(ctx: QueryCtx, channelName: string) {
  const channel = await ctx.db
    .query('channels')
    .withIndex('by_name', (q) => q.eq('name', channelName))
    .unique()
  if (!channel) throw new Error(`No such channel '${channelName}'`)
  return channel
}

async function latestMessagesFromChannel(
  ctx: QueryCtx,
  channelName: string,
  max = 20,
) {
  const channel = await channelByName(ctx, channelName)

  const messages = await ctx.db
    .query('messages')
    .withIndex('by_channel', (q) => q.eq('channel', channel._id))
    .order('desc')
    .take(max)
  const messagesWithAuthor = await Promise.all(
    messages.map(async (message) => {
      const user = await ctx.db.get(message.user)
      // Join the count of likes with the message data
      return { ...message, user: user?.name || 'anonymous' }
    }),
  )
  return messagesWithAuthor
}

export const count = query(
  async (
    ctx,
    { cacheBust, channel }: { cacheBust: unknown; channel: string },
  ) => {
    const _unused = cacheBust
    const channelName = channel || 'chatty'
    return (await latestMessagesFromChannel(ctx, channelName, 1000)).length
  },
)

export const listUsers = query(async (ctx, { cacheBust }) => {
  const _unused = cacheBust
  return await ctx.db.query('users').collect()
})

export const countUsers = query(async (ctx, { cacheBust }) => {
  const _unused = cacheBust
  return (await ctx.db.query('users').collect()).length
})

function choose(choices: string[]): string {
  return choices[Math.floor(Math.random() * choices.length)]
}

function madlib(strings: TemplateStringsArray, ...choices: any[]): string {
  return strings.reduce((result, str, i) => {
    return result + str + (choices[i] ? choose(choices[i]) : '')
  }, '')
}

const greetings = ['hi', 'Hi', 'hello', 'hey']
const names = ['James', 'Jamie', 'Emma', 'Nipunn']
const punc = ['...', '-', ',', '!', ';']
const text = [
  'how was your weekend?',
  "how's the weather in SF?",
  "what's your favorite ice cream place?",
  "I'll be late to make the meeting tomorrow morning",
  "Could you let the customer know we've fixed their issue?",
]

export const sendGeneratedMessage = internalMutation(async (ctx) => {
  const body = madlib`${greetings} ${names}${punc} ${text}`
  const user = await ctx.db.insert('users', {
    name: 'User ' + Math.floor(Math.random() * 1000),
  })
  const channel = (await channelByName(ctx, 'chatty'))._id
  await ctx.db.insert('messages', { body, user, channel })
})

// TODO concurrency here
export const sendGeneratedMessages = action({
  args: { num: v.number() },
  handler: async (ctx, { num }: { num: number }) => {
    await ctx.runMutation(api.messages.clear)
    for (let i = 0; i < num; i++) {
      await ctx.runMutation(internal.messages.sendGeneratedMessage)
    }
  },
})

export const clear = mutation(async (ctx) => {
  await Promise.all([
    ...(await ctx.db.query('messages').collect()).map((message) =>
      ctx.db.delete(message._id),
    ),
    ...(await ctx.db.query('users').collect()).map((user) =>
      ctx.db.delete(user._id),
    ),
    ...(await ctx.db.query('channels').collect()).map((channel) =>
      ctx.db.delete(channel._id),
    ),
    ...(await ctx.db.query('channelMembers').collect()).map((membership) =>
      ctx.db.delete(membership._id),
    ),
  ])
})

async function ensureChannel(ctx: MutationCtx, name: string) {
  const existing = await ctx.db
    .query('channels')
    .withIndex('by_name', (q) => q.eq('name', name))
    .unique()
  if (!existing) {
    await ctx.db.insert('channels', { name })
  }
}

export const seed = internalMutation(async (ctx) => {
  await ensureChannel(ctx, 'chatty')
  await ensureChannel(ctx, 'sf')
  await ensureChannel(ctx, 'nyc')
  await ensureChannel(ctx, 'seattle')
})

export const sendMessage = mutation(
  async (
    ctx,
    {
      user,
      body,
      channel = 'chatty',
    }: { user: string; body: string; channel: string },
  ) => {
    // userId ought to match User /d+
    // until every user gets their own channel, use simulated messages
    const cleanBody = madlib`${greetings} ${names}${punc} ${text}`
    const existingUser = await ctx.db
      .query('users')
      .withIndex('by_name')
      .filter((q) => q.eq(q.field('name'), user))
      .unique()
    let userId =
      existingUser?._id || (await ctx.db.insert('users', { name: user }))
    const channelId = (await channelByName(ctx, channel))._id
    await ctx.db.insert('messages', {
      user: userId,
      body: cleanBody,
      channel: channelId,
    })
  },
)

export const simulateTraffic = mutation(async (ctx) => {
  const simulation = await ctx.db.query('simulating').unique()
  const now = Date.now()
  const duration = 5000
  if (!simulation) {
    await ctx.db.insert('simulating', {
      finishingAt: now + duration,
    })
    await ctx.scheduler.runAfter(0, internal.messages.runSimulation)
  } else {
    await ctx.db.replace(simulation._id, {
      finishingAt: Math.max(simulation.finishingAt, now + duration),
    })
  }
})

export const runSimulation = internalMutation(async (ctx) => {
  const now = Date.now()
  const simulation = await ctx.db.query('simulating').unique()
  if (!simulation) {
    return
  }
  if (simulation.finishingAt < now) {
    await ctx.db.delete(simulation._id)
    return
  }
  const body = madlib`${greetings} ${names}${punc} ${text}`
  const user = await ctx.db.insert('users', {
    name: 'User ' + Math.floor(Math.random() * 1000),
  })
  const channel = (await channelByName(ctx, 'chatty'))._id
  await ctx.db.insert('messages', { body, user: user, channel })
  await ctx.scheduler.runAfter(500, internal.messages.runSimulation)
})

export const isSimulatingTraffic = query(async (ctx) => {
  return !!(await ctx.db.query('simulating').collect()).length
})

```


## File: convex\schema.ts

- Size: 612 bytes
- Language: ts

```ts
import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  messages: defineTable({
    body: v.string(),
    user: v.id('users'),
    channel: v.id('channels'),
  }).index('by_channel', ['channel']),
  users: defineTable({
    name: v.string(),
  }).index('by_name', ['name']),
  channels: defineTable({
    name: v.string(),
  }).index('by_name', ['name']),
  simulating: defineTable({
    finishingAt: v.number(),
  }),
  channelMembers: defineTable({
    userId: v.id('users'),
    channelId: v.id('channels'),
  }),
})

```


## File: convex\_generated\api.d.ts

- Size: 756 bytes
- Language: ts

```ts
/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as messages from "../messages.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  messages: typeof messages;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

```


## File: convex\_generated\api.js

- Size: 436 bytes
- Language: js

```js
/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import { anyApi } from "convex/server";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api = anyApi;
export const internal = anyApi;

```


## File: convex\_generated\dataModel.d.ts

- Size: 1785 bytes
- Language: ts

```ts
/* eslint-disable */
/**
 * Generated data model types.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  DataModelFromSchemaDefinition,
  DocumentByName,
  TableNamesInDataModel,
  SystemTableNames,
} from "convex/server";
import type { GenericId } from "convex/values";
import schema from "../schema.js";

/**
 * The names of all of your Convex tables.
 */
export type TableNames = TableNamesInDataModel<DataModel>;

/**
 * The type of a document stored in Convex.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Doc<TableName extends TableNames> = DocumentByName<
  DataModel,
  TableName
>;

/**
 * An identifier for a document in Convex.
 *
 * Convex documents are uniquely identified by their `Id`, which is accessible
 * on the `_id` field. To learn more, see [Document IDs](https://docs.convex.dev/using/document-ids).
 *
 * Documents can be loaded using `db.get(id)` in query and mutation functions.
 *
 * IDs are just strings at runtime, but this type can be used to distinguish them from other
 * strings when type checking.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Id<TableName extends TableNames | SystemTableNames> =
  GenericId<TableName>;

/**
 * A type describing your Convex data model.
 *
 * This type includes information about what tables you have, the type of
 * documents stored in those tables, and the indexes defined on them.
 *
 * This type is used to parameterize methods like `queryGeneric` and
 * `mutationGeneric` to make them type-safe.
 */
export type DataModel = DataModelFromSchemaDefinition<typeof schema>;

```


## File: convex\_generated\server.d.ts

- Size: 5681 bytes
- Language: ts

```ts
/* eslint-disable */
/**
 * Generated utilities for implementing server-side Convex query and mutation functions.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import {
  ActionBuilder,
  HttpActionBuilder,
  MutationBuilder,
  QueryBuilder,
  GenericActionCtx,
  GenericMutationCtx,
  GenericQueryCtx,
  GenericDatabaseReader,
  GenericDatabaseWriter,
} from "convex/server";
import type { DataModel } from "./dataModel.js";

/**
 * Define a query in this Convex app's public API.
 *
 * This function will be allowed to read your Convex database and will be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export declare const query: QueryBuilder<DataModel, "public">;

/**
 * Define a query that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to read from your Convex database. It will not be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export declare const internalQuery: QueryBuilder<DataModel, "internal">;

/**
 * Define a mutation in this Convex app's public API.
 *
 * This function will be allowed to modify your Convex database and will be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export declare const mutation: MutationBuilder<DataModel, "public">;

/**
 * Define a mutation that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to modify your Convex database. It will not be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export declare const internalMutation: MutationBuilder<DataModel, "internal">;

/**
 * Define an action in this Convex app's public API.
 *
 * An action is a function which can execute any JavaScript code, including non-deterministic
 * code and code with side-effects, like calling third-party services.
 * They can be run in Convex's JavaScript environment or in Node.js using the "use node" directive.
 * They can interact with the database indirectly by calling queries and mutations using the {@link ActionCtx}.
 *
 * @param func - The action. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped action. Include this as an `export` to name it and make it accessible.
 */
export declare const action: ActionBuilder<DataModel, "public">;

/**
 * Define an action that is only accessible from other Convex functions (but not from the client).
 *
 * @param func - The function. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped function. Include this as an `export` to name it and make it accessible.
 */
export declare const internalAction: ActionBuilder<DataModel, "internal">;

/**
 * Define an HTTP action.
 *
 * This function will be used to respond to HTTP requests received by a Convex
 * deployment if the requests matches the path and method where this action
 * is routed. Be sure to route your action in `convex/http.js`.
 *
 * @param func - The function. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped function. Import this function from `convex/http.js` and route it to hook it up.
 */
export declare const httpAction: HttpActionBuilder;

/**
 * A set of services for use within Convex query functions.
 *
 * The query context is passed as the first argument to any Convex query
 * function run on the server.
 *
 * This differs from the {@link MutationCtx} because all of the services are
 * read-only.
 */
export type QueryCtx = GenericQueryCtx<DataModel>;

/**
 * A set of services for use within Convex mutation functions.
 *
 * The mutation context is passed as the first argument to any Convex mutation
 * function run on the server.
 */
export type MutationCtx = GenericMutationCtx<DataModel>;

/**
 * A set of services for use within Convex action functions.
 *
 * The action context is passed as the first argument to any Convex action
 * function run on the server.
 */
export type ActionCtx = GenericActionCtx<DataModel>;

/**
 * An interface to read from the database within Convex query functions.
 *
 * The two entry points are {@link DatabaseReader.get}, which fetches a single
 * document by its {@link Id}, or {@link DatabaseReader.query}, which starts
 * building a query.
 */
export type DatabaseReader = GenericDatabaseReader<DataModel>;

/**
 * An interface to read from and write to the database within Convex mutation
 * functions.
 *
 * Convex guarantees that all writes within a single mutation are
 * executed atomically, so you never have to worry about partial writes leaving
 * your data in an inconsistent state. See [the Convex Guide](https://docs.convex.dev/understanding/convex-fundamentals/functions#atomicity-and-optimistic-concurrency-control)
 * for the guarantees Convex provides your functions.
 */
export type DatabaseWriter = GenericDatabaseWriter<DataModel>;

```


## File: convex\_generated\server.js

- Size: 3542 bytes
- Language: js

```js
/* eslint-disable */
/**
 * Generated utilities for implementing server-side Convex query and mutation functions.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import {
  actionGeneric,
  httpActionGeneric,
  queryGeneric,
  mutationGeneric,
  internalActionGeneric,
  internalMutationGeneric,
  internalQueryGeneric,
} from "convex/server";

/**
 * Define a query in this Convex app's public API.
 *
 * This function will be allowed to read your Convex database and will be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export const query = queryGeneric;

/**
 * Define a query that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to read from your Convex database. It will not be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export const internalQuery = internalQueryGeneric;

/**
 * Define a mutation in this Convex app's public API.
 *
 * This function will be allowed to modify your Convex database and will be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export const mutation = mutationGeneric;

/**
 * Define a mutation that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to modify your Convex database. It will not be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export const internalMutation = internalMutationGeneric;

/**
 * Define an action in this Convex app's public API.
 *
 * An action is a function which can execute any JavaScript code, including non-deterministic
 * code and code with side-effects, like calling third-party services.
 * They can be run in Convex's JavaScript environment or in Node.js using the "use node" directive.
 * They can interact with the database indirectly by calling queries and mutations using the {@link ActionCtx}.
 *
 * @param func - The action. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped action. Include this as an `export` to name it and make it accessible.
 */
export const action = actionGeneric;

/**
 * Define an action that is only accessible from other Convex functions (but not from the client).
 *
 * @param func - The function. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped function. Include this as an `export` to name it and make it accessible.
 */
export const internalAction = internalActionGeneric;

/**
 * Define a Convex HTTP action.
 *
 * @param func - The function. It receives an {@link ActionCtx} as its first argument, and a `Request` object
 * as its second.
 * @returns The wrapped endpoint function. Route a URL path to this function in `convex/http.js`.
 */
export const httpAction = httpActionGeneric;

```
