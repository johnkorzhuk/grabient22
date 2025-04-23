

## File: app\client.tsx

- Size: 266 bytes
- Language: tsx

```tsx
/// <reference types="vinxi/types/client" />
import { hydrateRoot } from 'react-dom/client'
import { StartClient } from '@tanstack/start'
import { createRouter } from './router'

const router = createRouter()

hydrateRoot(document!, <StartClient router={router} />)

```


## File: app\components\Board.tsx

- Size: 3964 bytes
- Language: tsx

```tsx
import { useCallback, useMemo, useRef } from 'react'
import invariant from 'tiny-invariant'
import { useSuspenseQuery } from '@tanstack/react-query'
import { convexQuery } from '@convex-dev/react-query'
import { api } from '../../convex/_generated/api.js'
import { useUpdateBoardMutation } from '../queries.js'
import { NewColumn } from './NewColumn.js'
import { Column as ColumnComponent } from './Column.js'
import type { Column } from 'convex/schema.js'
import { EditableText } from '~/components/EditableText.js'

export function Board({ boardId }: { boardId: string }) {
  const newColumnAddedRef = useRef(false)
  const updateBoardMutation = useUpdateBoardMutation()
  const { data: board } = useSuspenseQuery(
    convexQuery(api.board.getBoard, { id: boardId }),
  )

  // scroll right when new columns are added
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const columnRef = useCallback((_node: HTMLElement | null) => {
    if (scrollContainerRef.current && newColumnAddedRef.current) {
      newColumnAddedRef.current = false
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth
    }
  }, [])

  const itemsById = useMemo(
    () => new Map(board.items.map((item) => [item.id, item])),
    [board.items],
  )

  type ColumnWithItems = Column & { items: typeof board.items }

  const columns = useMemo(() => {
    const columnsMap = new Map<string, ColumnWithItems>()

    for (const column of [...board.columns]) {
      columnsMap.set(column.id, { ...column, items: [] })
    }

    // add items to their columns
    for (const item of itemsById.values()) {
      const columnId = item.columnId
      const column = columnsMap.get(columnId)
      invariant(
        column,
        `missing column: ${columnId} from ${[...columnsMap.keys()]}`,
      )
      column.items.push(item)
    }

    return [...columnsMap.values()].sort((a, b) => a.order - b.order)
  }, [board.columns, itemsById])

  return (
    <div
      className="flex-grow min-h-0 flex flex-col overflow-x-scroll"
      ref={scrollContainerRef}
      style={{ backgroundColor: board.color }}
    >
      <h1>
        <EditableText
          value={
            // optimistic update
            updateBoardMutation.isPending && updateBoardMutation.variables.name
              ? updateBoardMutation.variables.name
              : board.name
          }
          fieldName="name"
          inputClassName="mx-8 my-4 text-2xl font-medium border border-slate-400 rounded-lg py-1 px-2 text-black"
          buttonClassName="mx-8 my-4 text-2xl font-medium block rounded-lg text-left border border-transparent py-1 px-2 text-slate-800"
          buttonLabel={`Edit board "${board.name}" name`}
          inputLabel="Edit board name"
          onChange={(value) => {
            updateBoardMutation.mutate({
              id: board.id,
              name: value,
            })
          }}
        />
      </h1>

      <div className="flex flex-grow min-h-0 h-full items-start px-8 pb-4 w-fit">
        {columns.map((col, index) => {
          return (
            <ColumnComponent
              ref={columnRef}
              key={col.id}
              name={col.name}
              columnId={col.id}
              boardId={board.id}
              items={col.items}
              order={col.order}
              previousOrder={columns[index - 1] ? columns[index - 1].order : 0}
              nextOrder={
                columns[index + 1] ? columns[index + 1].order : col.order + 1
              }
            />
          )
        })}
        <NewColumn
          boardId={board.id}
          editInitially={board.columns.length === 0}
          onNewColumnAdded={() => {
            newColumnAddedRef.current = true
          }}
        />
      </div>

      {/* trolling you to add some extra margin to the right of the container with a whole dang div */}
      <div data-lol className="w-8 h-1 flex-shrink-0" />
    </div>
  )
}

```


## File: app\components\CancelButton.tsx

- Size: 375 bytes
- Language: tsx

```tsx
import { forwardRef } from 'react'

export const CancelButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  return (
    <button
      ref={ref}
      type="button"
      tabIndex={0}
      {...props}
      className="text-sm rounded-lg text-left p-2 font-medium hover:bg-slate-200 focus:bg-slate-200"
    />
  )
})

```


## File: app\components\Card.tsx

- Size: 3583 bytes
- Language: tsx

```tsx
import invariant from 'tiny-invariant'
import { forwardRef, useState } from 'react'

import { CONTENT_TYPES } from '../types'
import { Icon } from '../icons/icons'
import { useDeleteCardMutation, useUpdateCardMutation } from '../queries'
import { deleteItemSchema } from '../db/schema'

interface CardProps {
  title: string
  content: string | null
  id: string
  columnId: string
  boardId: string
  order: number
  nextOrder: number
  previousOrder: number
}

export const Card = forwardRef<HTMLLIElement, CardProps>(
  (
    { title, content, id, columnId, boardId, order, nextOrder, previousOrder },
    ref,
  ) => {
    const [acceptDrop, setAcceptDrop] = useState<'none' | 'top' | 'bottom'>(
      'none',
    )

    const deleteCard = useDeleteCardMutation()
    const moveCard = useUpdateCardMutation()

    return (
      <li
        ref={ref}
        onDragOver={(event) => {
          if (event.dataTransfer.types.includes(CONTENT_TYPES.card)) {
            event.preventDefault()
            event.stopPropagation()
            const rect = event.currentTarget.getBoundingClientRect()
            const midpoint = (rect.top + rect.bottom) / 2
            setAcceptDrop(event.clientY <= midpoint ? 'top' : 'bottom')
          }
        }}
        onDragLeave={() => {
          setAcceptDrop('none')
        }}
        onDrop={(event) => {
          event.stopPropagation()

          const transfer = JSON.parse(
            event.dataTransfer.getData(CONTENT_TYPES.card) || 'null',
          )

          if (!transfer) {
            return
          }

          invariant(transfer.id, 'missing cardId')
          invariant(transfer.title, 'missing title')

          const droppedOrder = acceptDrop === 'top' ? previousOrder : nextOrder
          const moveOrder = (droppedOrder + order) / 2

          moveCard.mutate({
            order: moveOrder,
            columnId,
            boardId,
            id: transfer.id,
            title: transfer.title,
          })

          setAcceptDrop('none')
        }}
        className={
          'border-t-2 border-b-2 -mb-[2px] last:mb-0 cursor-grab active:cursor-grabbing px-2 py-1 ' +
          (acceptDrop === 'top'
            ? 'border-t-red-500 border-b-transparent'
            : acceptDrop === 'bottom'
              ? 'border-b-red-500 border-t-transparent'
              : 'border-t-transparent border-b-transparent')
        }
      >
        <div
          draggable
          className="bg-white shadow shadow-slate-300 border-slate-300 text-sm rounded-lg w-full py-1 px-2 relative"
          onDragStart={(event) => {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData(
              CONTENT_TYPES.card,
              JSON.stringify({ id, title }),
            )
            event.stopPropagation()
          }}
        >
          <h3>{title}</h3>
          <div className="mt-2">{content || <>&nbsp;</>}</div>
          <form
            onSubmit={(event) => {
              event.preventDefault()

              deleteCard.mutate(
                deleteItemSchema.parse({
                  id,
                  boardId,
                }),
              )
            }}
          >
            <button
              aria-label="Delete card"
              className="absolute top-4 right-4 hover:text-red-500 flex gap-2 items-center"
              type="submit"
            >
              <div className="opacity-50 text-xs">{order}</div>
              <Icon name="trash" />
            </button>
          </form>
        </div>
      </li>
    )
  },
)

```


## File: app\components\Column.tsx

- Size: 7914 bytes
- Language: tsx

```tsx
import { forwardRef, useCallback, useMemo, useRef, useState } from 'react'
import invariant from 'tiny-invariant'
import { twMerge } from 'tailwind-merge'

import { flushSync } from 'react-dom'
import { CONTENT_TYPES, type RenderedItem } from '../types'
import { Icon } from '../icons/icons'
import {
  useDeleteColumnMutation,
  useUpdateCardMutation,
  useUpdateColumnMutation,
} from '../queries'
import { EditableText } from './EditableText'
import { NewCard } from './NewCard'
import { Card } from './Card'

interface ColumnProps {
  name: string
  boardId: string
  columnId: string
  items: Array<RenderedItem>
  nextOrder: number
  previousOrder: number
  order: number
}

export const Column = forwardRef<HTMLDivElement, ColumnProps>(
  (
    { name, columnId, boardId, items, nextOrder, previousOrder, order },
    ref,
  ) => {
    const [acceptCardDrop, setAcceptCardDrop] = useState(false)
    const editState = useState(false)

    const [acceptColumnDrop, setAcceptColumnDrop] = useState<
      'none' | 'left' | 'right'
    >('none')

    const [edit, setEdit] = useState(false)

    const itemRef = useCallback((node: HTMLElement | null) => {
      node?.scrollIntoView({
        block: 'nearest',
      })
    }, [])

    const listRef = useRef<HTMLUListElement>(null!)

    function scrollList() {
      invariant(listRef.current)
      listRef.current.scrollTop = listRef.current.scrollHeight
    }

    const updateColumnMutation = useUpdateColumnMutation()
    const deleteColumnMutation = useDeleteColumnMutation()
    const updateCardMutation = useUpdateCardMutation()

    const sortedItems = useMemo(
      () => [...items].sort((a, b) => a.order - b.order),
      [items],
    )

    const cardDndProps = {
      onDragOver: (event: React.DragEvent) => {
        if (event.dataTransfer.types.includes(CONTENT_TYPES.card)) {
          event.preventDefault()
          setAcceptCardDrop(true)
        }
      },
      onDragLeave: () => {
        setAcceptCardDrop(false)
      },
      onDrop: (event: React.DragEvent) => {
        const transfer = JSON.parse(
          event.dataTransfer.getData(CONTENT_TYPES.card) || 'null',
        )

        if (!transfer) {
          return
        }

        invariant(transfer.id, 'missing transfer.id')
        invariant(transfer.title, 'missing transfer.title')

        updateCardMutation.mutate({
          order: (sortedItems[sortedItems.length - 1]?.order ?? 0) + 1,
          columnId: columnId,
          boardId,
          id: transfer.id,
          title: transfer.title,
        })

        setAcceptCardDrop(false)
      },
    }

    return (
      <div
        ref={ref}
        onDragOver={(event: React.DragEvent) => {
          if (event.dataTransfer.types.includes(CONTENT_TYPES.column)) {
            event.preventDefault()
            event.stopPropagation()
            const rect = event.currentTarget.getBoundingClientRect()
            const midpoint = (rect.left + rect.right) / 2
            setAcceptColumnDrop(event.clientX <= midpoint ? 'left' : 'right')
          }
        }}
        onDragLeave={() => {
          setAcceptColumnDrop('none')
        }}
        onDrop={(event: React.DragEvent) => {
          const transfer = JSON.parse(
            event.dataTransfer.getData(CONTENT_TYPES.column) || 'null',
          )

          if (!transfer) {
            return
          }

          invariant(transfer.id, 'missing transfer.id')

          const droppedOrder =
            acceptColumnDrop === 'left' ? previousOrder : nextOrder
          const moveOrder = (droppedOrder + order) / 2

          updateColumnMutation.mutate({
            boardId,
            id: transfer.id,
            order: moveOrder,
          })

          setAcceptColumnDrop('none')
        }}
        className={twMerge(
          'border-l-transparent border-r-transparent border-l-2 border-r-2 -mr-[2px] last:mr-0 cursor-grab active:cursor-grabbing px-2 flex-shrink-0 flex flex-col  max-h-full',
          acceptColumnDrop === 'left'
            ? 'border-l-red-500 border-r-transparent'
            : acceptColumnDrop === 'right'
              ? 'border-r-red-500 border-l-transparent'
              : '',
        )}
      >
        <div
          draggable={!editState[0]}
          onDragStart={(event: React.DragEvent) => {
            event.dataTransfer.effectAllowed = 'move'
            event.dataTransfer.setData(
              CONTENT_TYPES.column,
              JSON.stringify({ id: columnId, name }),
            )
          }}
          {...(!items.length ? cardDndProps : {})}
          className={twMerge(
            'flex-shrink-0 flex flex-col max-h-full w-80 border-slate-400 rounded-xl shadow-sm shadow-slate-400 bg-slate-100 relative',
            acceptCardDrop && `outline outline-2 outline-red-500`,
          )}
        >
          <div className="p-2" {...(items.length ? cardDndProps : {})}>
            <EditableText
              fieldName="name"
              editState={editState}
              value={
                // optimistic update
                updateColumnMutation.isPending &&
                updateColumnMutation.variables.name
                  ? updateColumnMutation.variables.name
                  : name
              }
              inputLabel="Edit column name"
              buttonLabel={`Edit column "${name}" name`}
              inputClassName="border border-slate-400 w-full rounded-lg py-1 px-2 font-medium text-black"
              buttonClassName="block rounded-lg text-left w-full border border-transparent py-1 px-2 font-medium text-slate-600"
              onChange={(value) => {
                updateColumnMutation.mutate({
                  boardId,
                  id: columnId,
                  name: value,
                })
              }}
            />
          </div>

          <ul ref={listRef} className="flex-grow overflow-auto">
            {sortedItems.map((item, index, items) => (
              <Card
                ref={itemRef}
                key={item.id}
                title={item.title}
                content={item.content ?? ''}
                id={item.id}
                boardId={boardId}
                order={item.order}
                columnId={columnId}
                previousOrder={items[index - 1] ? items[index - 1].order : 0}
                nextOrder={
                  items[index + 1] ? items[index + 1].order : item.order + 1
                }
              />
            ))}
          </ul>
          {edit ? (
            <NewCard
              columnId={columnId}
              boardId={boardId}
              nextOrder={
                items.length === 0 ? 1 : items[items.length - 1].order + 1
              }
              onComplete={() => setEdit(false)}
            />
          ) : (
            <div className="p-2" {...(items.length ? cardDndProps : {})}>
              <button
                type="button"
                onClick={() => {
                  flushSync(() => {
                    setEdit(true)
                  })
                  scrollList()
                }}
                className="flex items-center gap-2 rounded-lg text-left w-full p-2 font-medium text-slate-500 hover:bg-slate-200 focus:bg-slate-200"
              >
                <Icon name="plus" /> Add a card
              </button>
            </div>
          )}
          <form
            onSubmit={(event) => {
              event.preventDefault()

              deleteColumnMutation.mutate({
                id: columnId,
                boardId,
              })
            }}
          >
            <button
              aria-label="Delete column"
              className="absolute top-4 right-4 hover:text-red-500 flex gap-2 items-center"
              type="submit"
            >
              <Icon name="trash" />
            </button>
          </form>
        </div>
      </div>
    )
  },
)

```


## File: app\components\DefaultCatchBoundary.tsx

- Size: 1414 bytes
- Language: tsx

```tsx
import {
  ErrorComponent,
  Link,
  rootRouteId,
  useMatch,
  useRouter,
} from '@tanstack/react-router'
import type { ErrorComponentProps } from '@tanstack/react-router'

export function DefaultCatchBoundary({ error }: ErrorComponentProps) {
  const router = useRouter()
  const isRoot = useMatch({
    strict: false,
    select: (state) => state.id === rootRouteId,
  })

  console.error(error)

  return (
    <div className="min-w-0 flex-1 p-4 flex flex-col items-center justify-center gap-6">
      <ErrorComponent error={error} />
      <div className="flex gap-2 items-center flex-wrap">
        <button
          onClick={() => {
            router.invalidate()
          }}
          className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
        >
          Try Again
        </button>
        {isRoot ? (
          <Link
            to="/"
            className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
          >
            Home
          </Link>
        ) : (
          <Link
            to="/"
            className={`px-2 py-1 bg-gray-600 dark:bg-gray-700 rounded text-white uppercase font-extrabold`}
            onClick={(e) => {
              e.preventDefault()
              window.history.back()
            }}
          >
            Go Back
          </Link>
        )}
      </div>
    </div>
  )
}

```


## File: app\components\EditableText.tsx

- Size: 1917 bytes
- Language: tsx

```tsx
import { useRef, useState } from 'react'
import { flushSync } from 'react-dom'

export function EditableText({
  fieldName,
  value,
  inputClassName,
  inputLabel,
  buttonClassName,
  buttonLabel,
  onChange,
  editState,
}: {
  fieldName: string
  value: string
  inputClassName: string
  inputLabel: string
  buttonClassName: string
  buttonLabel: string
  onChange: (value: string) => void
  editState?: [boolean, (value: boolean) => void]
}) {
  const localEditState = useState(false)
  const [edit, setEdit] = editState || localEditState
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)

  return edit ? (
    <form
      onSubmit={(event) => {
        event.preventDefault()

        onChange(inputRef.current!.value)

        flushSync(() => {
          setEdit(false)
        })

        buttonRef.current?.focus()
      }}
    >
      <input
        required
        ref={inputRef}
        type="text"
        aria-label={inputLabel}
        name={fieldName}
        defaultValue={value}
        className={inputClassName}
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            flushSync(() => {
              setEdit(false)
            })
            buttonRef.current?.focus()
          }
        }}
        onBlur={(event) => {
          if (
            inputRef.current?.value !== value &&
            inputRef.current?.value.trim() !== ''
          ) {
            onChange(inputRef.current!.value)
          }
          setEdit(false)
        }}
      />
    </form>
  ) : (
    <button
      aria-label={buttonLabel}
      type="button"
      ref={buttonRef}
      onClick={() => {
        flushSync(() => {
          setEdit(true)
        })
        inputRef.current?.select()
      }}
      className={buttonClassName}
    >
      {value || <span className="text-slate-400 italic">Edit</span>}
    </button>
  )
}

```


## File: app\components\IconLink.tsx

- Size: 367 bytes
- Language: tsx

```tsx
export function IconLink({
  icon,
  href,
  label,
}: {
  icon: string
  href: string
  label: string
}) {
  return (
    <a
      href={href}
      className="text-slate-500 text-xs uppercase font-bold text-center"
    >
      <img src={icon} aria-hidden className="inline-block h-8 rounded-full" />
      <span className="block mt-2">{label}</span>
    </a>
  )
}

```


## File: app\components\Loader.tsx

- Size: 222 bytes
- Language: tsx

```tsx
export function Loader() {
  return (
    <div className="flex h-full">
      <div className="m-auto border-gray-300 h-20 max-h-full aspect-square animate-spin rounded-full border-8 border-t-slate-900" />
    </div>
  )
}

```


## File: app\components\NewCard.tsx

- Size: 2525 bytes
- Language: tsx

```tsx
import { useRef } from 'react'
import invariant from 'tiny-invariant'

import { ItemMutationFields } from '../types'
import { useCreateItemMutation } from '../queries'
import { itemSchema } from '../db/schema'
import { SaveButton } from '~/components/SaveButton'
import { CancelButton } from '~/components/CancelButton'

export function NewCard({
  columnId,
  boardId,
  nextOrder,
  onComplete,
}: {
  columnId: string
  boardId: string
  nextOrder: number
  onComplete: () => void
}) {
  const textAreaRef = useRef<HTMLTextAreaElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const { mutate } = useCreateItemMutation()

  return (
    <form
      method="post"
      className="px-2 py-1 border-t-2 border-b-2 border-transparent"
      onSubmit={(event) => {
        event.preventDefault()

        const formData = new FormData(event.currentTarget)
        const id = crypto.randomUUID()
        formData.set(ItemMutationFields.id.name, id)

        invariant(textAreaRef.current)
        textAreaRef.current.value = ''

        mutate(itemSchema.parse(Object.fromEntries(formData.entries())))
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          onComplete()
        }
      }}
    >
      <input type="hidden" name="boardId" value={boardId} />
      <input
        type="hidden"
        name={ItemMutationFields.columnId.name}
        value={columnId}
      />
      <input
        type="hidden"
        name={ItemMutationFields.order.name}
        value={nextOrder}
      />

      <textarea
        autoFocus
        required
        ref={textAreaRef}
        name={ItemMutationFields.title.name}
        placeholder="Enter a title for this card"
        className="outline-none shadow text-sm rounded-lg w-full py-1 px-2 resize-none placeholder:text-sm placeholder:text-slate-500 h-14"
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            invariant(buttonRef.current, 'expected button ref')
            buttonRef.current.click()
          }
          if (event.key === 'Escape') {
            onComplete()
          }
        }}
        onChange={(event) => {
          const el = event.currentTarget
          el.style.height = el.scrollHeight + 'px'
        }}
      />
      <div className="flex justify-between">
        <SaveButton ref={buttonRef}>Save Card</SaveButton>
        <CancelButton onClick={onComplete}>Cancel</CancelButton>
      </div>
    </form>
  )
}

```


## File: app\components\NewColumn.tsx

- Size: 1960 bytes
- Language: tsx

```tsx
import { useRef, useState } from 'react'
import invariant from 'tiny-invariant'

import { Icon } from '../icons/icons'
import { useCreateColumnMutation } from '../queries'
import { CancelButton } from '~/components/CancelButton'
import { SaveButton } from '~/components/SaveButton'

export function NewColumn({
  boardId,
  editInitially,
  onNewColumnAdded,
}: {
  boardId: string
  editInitially: boolean
  onNewColumnAdded: () => void
}) {
  const [editing, setEditing] = useState(editInitially)
  const inputRef = useRef<HTMLInputElement>(null)

  const newColumnMutation = useCreateColumnMutation()

  return editing ? (
    <form
      className="ml-2 p-2 flex-shrink-0 flex flex-col gap-5 overflow-hidden max-h-full w-80 border rounded-xl shadow bg-slate-100"
      onSubmit={(event) => {
        event.preventDefault()
        invariant(inputRef.current, 'missing input ref')

        newColumnMutation.mutate({
          boardId,
          name: inputRef.current.value,
        })

        inputRef.current.value = ''

        onNewColumnAdded()
      }}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setEditing(false)
        }
      }}
    >
      <input
        autoFocus
        required
        ref={inputRef}
        type="text"
        name="columnName"
        autoComplete="off"
        className="border border-slate-400 w-full rounded-lg py-1 px-2 font-medium text-black"
      />
      <div className="flex justify-between">
        <SaveButton>Save Column</SaveButton>
        <CancelButton onClick={() => setEditing(false)}>Cancel</CancelButton>
      </div>
    </form>
  ) : (
    <button
      onClick={() => {
        setEditing(true)
      }}
      aria-label="Add new column"
      className="ml-2 flex-shrink-0 flex justify-center h-16 w-16 bg-black hover:bg-white bg-opacity-10 hover:bg-opacity-5 rounded-xl"
    >
      <Icon name="plus" size="xl" />
    </button>
  )
}

```


## File: app\components\NotFound.tsx

- Size: 758 bytes
- Language: tsx

```tsx
import { Link } from '@tanstack/react-router'

export function NotFound({ children }: { children?: any }) {
  return (
    <div className="space-y-2 p-2">
      <div className="text-gray-600 dark:text-gray-400">
        {children || <p>The page you are looking for does not exist.</p>}
      </div>
      <p className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => window.history.back()}
          className="bg-emerald-500 text-white px-2 py-1 rounded uppercase font-black text-sm"
        >
          Go back
        </button>
        <Link
          to="/"
          className="bg-cyan-600 text-white px-2 py-1 rounded uppercase font-black text-sm"
        >
          Start Over
        </Link>
      </p>
    </div>
  )
}

```


## File: app\components\SaveButton.tsx

- Size: 641 bytes
- Language: tsx

```tsx
import { forwardRef } from 'react'

export const SaveButton = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>((props, ref) => {
  return (
    <button
      ref={ref}
      // this makes it so the button takes focus on clicks in safari I can't
      // remember if this is the proper workaround or not, it's been a while!
      // https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button#clicking_and_focus
      // https://bugs.webkit.org/show_bug.cgi?id=22261
      tabIndex={0}
      {...props}
      className="text-sm rounded-lg text-left p-2 font-medium text-white bg-blue-500"
    />
  )
})

```


## File: app\db\schema.ts

- Size: 351 bytes
- Language: ts

```ts
import { z } from 'zod'

// Zod is necessary for client side parsing.

export const itemSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string().optional(),
  order: z.coerce.number(),
  columnId: z.string().uuid(),
  boardId: z.coerce.string(),
})

export const deleteItemSchema = itemSchema.pick({ id: true, boardId: true })

```


## File: app\hooks\useOfflineIndicator.tsx

- Size: 508 bytes
- Language: tsx

```tsx
import { onlineManager } from '@tanstack/react-query'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export function useOfflineIndicator() {
  useEffect(() => {
    return onlineManager.subscribe(() => {
      if (onlineManager.isOnline()) {
        toast.success('online', {
          id: 'ReactQuery',
          duration: 2000,
        })
      } else {
        toast.error('offline', {
          id: 'ReactQuery',
          duration: Infinity,
        })
      }
    })
  }, [])
}

```


## File: app\icons\icons.tsx

- Size: 770 bytes
- Language: tsx

```tsx
import iconsHref from './icons.svg?url'

export function Icon({
  name,
  size = 'md',
  spin = false,
}: {
  name: string
  size?: 'md' | 'xl'
  spin?: boolean
}) {
  const classNames = {
    md: 'w-4 h-4',
    xl: 'w-8 h-8',
  }
  return (
    <svg
      className={`${classNames[size]} inline self-center ${
        spin ? 'animate-spin' : ''
      }`}
    >
      <use href={`${iconsHref}#${name}`} />
    </svg>
  )
}

export function LoginIcon() {
  return (
    <svg className="inline self-center w-8 h-8 text-white transform scale-x-[-1]">
      <use href={`${iconsHref}#login`} />
    </svg>
  )
}

export function LogoutIcon() {
  return (
    <svg className="inline self-center w-8 h-8 text-white">
      <use href={`${iconsHref}#logout`} />
    </svg>
  )
}

```


## File: app\queries.ts

- Size: 3650 bytes
- Language: ts

```ts
import { useMutation } from '@tanstack/react-query'
import { convexQuery, useConvexMutation } from '@convex-dev/react-query'
import { api } from '../convex/_generated/api'

export const boardQueries = {
  list: () => convexQuery(api.board.getBoards, {}),
  detail: (id: string) => convexQuery(api.board.getBoard, { id }),
}

export function useCreateColumnMutation() {
  const mutationFn = useConvexMutation(
    api.board.createColumn,
  ).withOptimisticUpdate((localStore, args) => {
    const board = localStore.getQuery(api.board.getBoard, { id: args.boardId })
    if (!board) return

    const randomId = Math.random() + ''

    const newBoard = {
      ...board,
      columns: [
        ...board.columns,
        {
          ...args,
          order: board.columns.length + 1,
          id: randomId,
          items: [],
        },
      ],
    }

    localStore.setQuery(api.board.getBoard, { id: board.id }, newBoard)
  })

  return useMutation({ mutationFn })
}

export function useCreateItemMutation() {
  const mutationFn = useConvexMutation(
    api.board.createItem,
  ).withOptimisticUpdate((localStore, args) => {
    const board = localStore.getQuery(api.board.getBoard, { id: args.boardId })
    if (!board) return

    const items = [...board.items, args]
    localStore.setQuery(
      api.board.getBoard,
      { id: board.id },
      { ...board, items },
    )
  })

  return useMutation({ mutationFn })
}

export function useUpdateCardMutation() {
  const mutationFn = useConvexMutation(
    api.board.updateItem,
  ).withOptimisticUpdate((localStore, args) => {
    const board = localStore.getQuery(api.board.getBoard, { id: args.boardId })
    if (!board) return
    const items = board.items.map((item) => (item.id === args.id ? args : item))
    localStore.setQuery(
      api.board.getBoard,
      { id: board.id },
      { ...board, items },
    )
  })

  return useMutation({ mutationFn })
}

export function useDeleteCardMutation() {
  const mutationFn = useConvexMutation(
    api.board.deleteItem,
  ).withOptimisticUpdate((localStore, args) => {
    const board = localStore.getQuery(api.board.getBoard, { id: args.boardId })
    if (!board) return
    const items = board.items.filter((item) => item.id !== args.id)
    localStore.setQuery(
      api.board.getBoard,
      { id: board.id },
      { ...board, items },
    )
  })

  return useMutation({ mutationFn })
}

export function useDeleteColumnMutation() {
  const mutationFn = useConvexMutation(
    api.board.deleteColumn,
  ).withOptimisticUpdate((localStore, args) => {
    const board = localStore.getQuery(api.board.getBoard, { id: args.boardId })
    if (!board) return
    const columns = board.columns.filter((col) => col.id !== args.id)
    const items = board.items.filter((item) => item.columnId !== args.id)
    localStore.setQuery(
      api.board.getBoard,
      { id: board.id },
      { ...board, items, columns },
    )
  })

  return useMutation({ mutationFn })
}

export function useUpdateBoardMutation() {
  const mutationFn = useConvexMutation(api.board.updateBoard)
  return useMutation({ mutationFn })
}

export function useUpdateColumnMutation() {
  const mutationFn = useConvexMutation(
    api.board.updateColumn,
  ).withOptimisticUpdate((localStore, args) => {
    const board = localStore.getQuery(api.board.getBoard, { id: args.boardId })
    if (!board) return
    const columns = board.columns.map((col) =>
      col.id === args.id ? { ...col, ...args } : col,
    )
    localStore.setQuery(
      api.board.getBoard,
      { id: board.id },
      { ...board, columns },
    )
  })

  return useMutation({ mutationFn })
}

```


## File: app\ssr.tsx

- Size: 340 bytes
- Language: tsx

```tsx
/// <reference types="vinxi/types/server" />
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


## File: app\types.ts

- Size: 559 bytes
- Language: ts

```ts
export interface RenderedItem {
  id: string
  title: string
  order: number
  content?: string
  columnId: string
}

export const CONTENT_TYPES = {
  card: 'application/app-card',
  column: 'application/app-column',
}

export const INTENTS = {
  updateColumnName: 'updateColumnName' as const,
  updateBoardName: 'updateBoardName' as const,
}

export const ItemMutationFields = {
  id: { type: String, name: 'id' },
  columnId: { type: String, name: 'columnId' },
  order: { type: Number, name: 'order' },
  title: { type: String, name: 'title' },
} as const

```


## File: app\utils\posts.tsx

- Size: 924 bytes
- Language: tsx

```tsx
import { notFound } from '@tanstack/react-router'
import { createServerFn } from '@tanstack/start'
import axios from 'redaxios'

export type PostType = {
  id: string
  title: string
  body: string
}

export const fetchPost = createServerFn({ method: 'GET' })
  .validator((postId: string) => postId)
  .handler(async ({ data }) => {
    console.info(`Fetching post with id ${data}...`)
    const post = await axios
      .get<PostType>(`https://jsonplaceholder.typicode.com/posts/${data}`)
      .then((r) => r.data)
      .catch((err) => {
        if (err.status === 404) {
          throw notFound()
        }
        throw err
      })

    return post
  })

export const fetchPosts = createServerFn({ method: 'GET' }).handler(
  async () => {
    console.info('Fetching posts...')
    return axios
      .get<Array<PostType>>('https://jsonplaceholder.typicode.com/posts')
      .then((r) => r.data.slice(0, 10))
  },
)

```


## File: app\utils\seo.ts

- Size: 885 bytes
- Language: ts

```ts
export const seo = ({
  title,
  description,
  keywords,
  image,
}: {
  title: string
  description?: string
  image?: string
  keywords?: string
}) => {
  const tags = [
    { title },
    { name: 'description', content: description },
    { name: 'keywords', content: keywords },
    { name: 'twitter:title', content: title },
    { name: 'twitter:description', content: description },
    { name: 'twitter:creator', content: '@tannerlinsley' },
    { name: 'twitter:site', content: '@tannerlinsley' },
    { name: 'og:type', content: 'website' },
    { name: 'og:title', content: title },
    { name: 'og:description', content: description },
    ...(image
      ? [
          { name: 'twitter:image', content: image },
          { name: 'twitter:card', content: 'summary_large_image' },
          { name: 'og:image', content: image },
        ]
      : []),
  ]

  return tags
}

```


## File: convex\board.ts

- Size: 4955 bytes
- Language: ts

```ts
import invariant from 'tiny-invariant'
import { v } from 'convex/values'
import {
  type QueryCtx,
  internalMutation,
  mutation,
  query,
} from './_generated/server'
import schema, {
  deleteColumnSchema,
  deleteItemSchema,
  newColumnsSchema,
  updateBoardSchema,
  updateColumnSchema,
} from './schema'
import type { Doc, Id } from './_generated/dataModel'

export const seed = internalMutation(async (ctx) => {
  const allBoards = await ctx.db.query('boards').collect()
  if (allBoards.length > 0) {
    return
  }
  await ctx.db.insert('boards', {
    id: '1',
    name: 'First board',
    color: '#e0e0e0',
  })
})

// Clear all boards (do this on a regular cadence for public examples)
export const clear = internalMutation(async (ctx) => {
  const allBoards = await ctx.db.query('boards').collect()
  for (const board of allBoards) {
    await ctx.db.delete(board._id)
  }
  await ctx.db.insert('boards', {
    id: '1',
    name: 'First board',
    color: '#e0e0e0',
  })
})

function withoutSystemFields<T extends { _creationTime: number; _id: Id<any> }>(
  doc: T,
) {
  const { _id, _creationTime, ...rest } = doc
  return rest
}

async function getFullBoard(ctx: QueryCtx, id: string) {
  const board = withoutSystemFields(await ensureBoardExists(ctx, id))

  const [columns, items] = await Promise.all([
    ctx.db
      .query('columns')
      .withIndex('board', (q) => q.eq('boardId', board.id))
      .collect(),
    ctx.db
      .query('items')
      .withIndex('board', (q) => q.eq('boardId', board.id))
      .collect(),
  ])

  return {
    ...board,
    columns: columns.map(withoutSystemFields),
    items: items.map(withoutSystemFields),
  }
}

export const getBoards = query(async (ctx) => {
  const boards = await ctx.db.query('boards').collect()
  return await Promise.all(boards.map((b) => getFullBoard(ctx, b.id)))
})

export const getBoard = query({
  args: { id: v.string() },
  handler: async (ctx, { id }) => {
    return await getFullBoard(ctx, id)
  },
})

async function ensureBoardExists(
  ctx: QueryCtx,
  boardId: string,
): Promise<Doc<'boards'>> {
  const board = await ctx.db
    .query('boards')
    .withIndex('id', (q) => q.eq('id', boardId))
    .unique()

  invariant(board, `missing board ${boardId}`)
  return board
}
async function ensureColumnExists(
  ctx: QueryCtx,
  columnId: string,
): Promise<Doc<'columns'>> {
  const column = await ctx.db
    .query('columns')
    .withIndex('id', (q) => q.eq('id', columnId))
    .unique()

  invariant(column, `missing column: ${columnId}`)
  return column
}
async function ensureItemExists(
  ctx: QueryCtx,
  itemId: string,
): Promise<Doc<'items'>> {
  const item = await ctx.db
    .query('items')
    .withIndex('id', (q) => q.eq('id', itemId))
    .unique()

  invariant(item, `missing item: ${itemId}`)
  return item
}

export const createColumn = mutation({
  args: newColumnsSchema,
  handler: async (ctx, { boardId, name }) => {
    ensureBoardExists(ctx, boardId)

    const existingColumns = await ctx.db
      .query('columns')
      .withIndex('board', (q) => q.eq('boardId', boardId))
      .collect()

    ctx.db.insert('columns', {
      boardId,
      name,
      order: existingColumns.length + 1,
      id: crypto.randomUUID(),
    })
  },
})

export const createItem = mutation({
  args: schema.tables.items.validator,
  handler: async (ctx, item) => {
    await ensureBoardExists(ctx, item.boardId)
    await ctx.db.insert('items', item)
  },
})

export const deleteItem = mutation({
  args: deleteItemSchema,
  handler: async (ctx, { id, boardId }) => {
    await ensureBoardExists(ctx, boardId)
    const item = await ensureItemExists(ctx, id)
    await ctx.db.delete(item._id)
  },
})

export const updateItem = mutation({
  args: schema.tables.items.validator,
  handler: async (ctx, newItem) => {
    const { id, boardId } = newItem
    await ensureBoardExists(ctx, boardId)
    const item = await ensureItemExists(ctx, id)
    await ctx.db.patch(item._id, newItem)
  },
})

export const updateColumn = mutation({
  args: updateColumnSchema,
  handler: async (ctx, newColumn) => {
    const { id, boardId } = newColumn
    await ensureBoardExists(ctx, boardId)
    const item = await ensureColumnExists(ctx, id)
    await ctx.db.patch(item._id, newColumn)
  },
})

export const updateBoard = mutation({
  args: updateBoardSchema,
  handler: async (ctx, boardUpdate) => {
    const board = await ensureBoardExists(ctx, boardUpdate.id)
    await ctx.db.patch(board._id, board)
  },
})

export const deleteColumn = mutation({
  args: deleteColumnSchema,
  handler: async (ctx, { boardId, id }) => {
    await ensureBoardExists(ctx, boardId)
    const column = await ensureColumnExists(ctx, id)
    const items = await ctx.db
      .query('items')
      .withIndex('column', (q) => q.eq('columnId', id))
      .collect()
    await Promise.all(items.map((item) => ctx.db.delete(item._id)))
    await ctx.db.delete(column._id)
  },
})

```


## File: convex\crons.ts

- Size: 210 bytes
- Language: ts

```ts
import { cronJobs } from 'convex/server'
import { internal } from './_generated/api'

const crons = cronJobs()

crons.cron('clear messages table', '0,20,40 * * * *', internal.board.clear)

export default crons

```


## File: convex\README.md

- Size: 2486 bytes
- Language: md

```md
# Welcome to your Convex functions directory!

Write your Convex functions here.
See https://docs.convex.dev/functions for more.

A query function that takes two arguments looks like:

```ts
// functions.js
import { query } from './_generated/server'
import { v } from 'convex/values'

export const myQueryFunction = query({
  // Validators for arguments.
  args: {
    first: v.number(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Read the database as many times as you need here.
    // See https://docs.convex.dev/database/reading-data.
    const documents = await ctx.db.query('tablename').collect()

    // Arguments passed from the client are properties of the args object.
    console.log(args.first, args.second)

    // Write arbitrary JavaScript here: filter, aggregate, build derived data,
    // remove non-public properties, or create new objects.
    return documents
  },
})
```

Using this query function in a React component looks like:

```ts
const data = useQuery(api.functions.myQueryFunction, {
  first: 10,
  second: 'hello',
})
```

A mutation function looks like:

```ts
// functions.js
import { mutation } from './_generated/server'
import { v } from 'convex/values'

export const myMutationFunction = mutation({
  // Validators for arguments.
  args: {
    first: v.string(),
    second: v.string(),
  },

  // Function implementation.
  handler: async (ctx, args) => {
    // Insert or modify documents in the database here.
    // Mutations can also read from the database like queries.
    // See https://docs.convex.dev/database/writing-data.
    const message = { body: args.first, author: args.second }
    const id = await ctx.db.insert('messages', message)

    // Optionally, return a value from your mutation.
    return await ctx.db.get(id)
  },
})
```

Using this mutation function in a React component looks like:

```ts
const mutation = useMutation(api.functions.myMutationFunction)
function handleButtonPress() {
  // fire and forget, the most common way to use mutations
  mutation({ first: 'Hello!', second: 'me' })
  // OR
  // use the result once the mutation has completed
  mutation({ first: 'Hello!', second: 'me' }).then((result) =>
    console.log(result),
  )
}
```

Use the Convex CLI to push your functions to a deployment. See everything
the Convex CLI can do by running `npx convex -h` in your project root
directory. To learn more, launch the docs with `npx convex docs`.

```


## File: convex\schema.ts

- Size: 1620 bytes
- Language: ts

```ts
import { defineSchema, defineTable } from 'convex/server'
import { type Infer, v } from 'convex/values'

const schema = defineSchema({
  boards: defineTable({
    id: v.string(),
    name: v.string(),
    color: v.string(),
  }).index('id', ['id']),

  columns: defineTable({
    id: v.string(),
    boardId: v.string(),
    name: v.string(),
    order: v.number(),
  })
    .index('id', ['id'])
    .index('board', ['boardId']),

  items: defineTable({
    id: v.string(),
    title: v.string(),
    content: v.optional(v.string()),
    order: v.number(),
    columnId: v.string(),
    boardId: v.string(),
  })
    .index('id', ['id'])
    .index('column', ['columnId'])
    .index('board', ['boardId']),
})
export default schema

const board = schema.tables.boards.validator
const column = schema.tables.columns.validator
const item = schema.tables.items.validator

export const updateBoardSchema = v.object({
  id: board.fields.id,
  name: v.optional(board.fields.name),
  color: v.optional(v.string()),
})

export const updateColumnSchema = v.object({
  id: column.fields.id,
  boardId: column.fields.boardId,
  name: v.optional(column.fields.name),
  order: v.optional(column.fields.order),
})

export const deleteItemSchema = v.object({
  id: item.fields.id,
  boardId: item.fields.boardId,
})
const { order, id, ...rest } = column.fields
export const newColumnsSchema = v.object(rest)
export const deleteColumnSchema = v.object({
  boardId: column.fields.boardId,
  id: column.fields.id,
})

export type Board = Infer<typeof board>
export type Column = Infer<typeof column>
export type Item = Infer<typeof item>

```


## File: convex\_generated\api.d.ts

- Size: 766 bytes
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
} from 'convex/server'
import type * as board from '../board.js'
import type * as crons from '../crons.js'

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  board: typeof board
  crons: typeof crons
}>
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'public'>
>
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, 'internal'>
>

```


## File: convex\_generated\api.js

- Size: 411 bytes
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

import { anyApi } from 'convex/server'

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api = anyApi
export const internal = anyApi

```


## File: convex\_generated\dataModel.d.ts

- Size: 1718 bytes
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
} from 'convex/server'
import type { GenericId } from 'convex/values'
import schema from '../schema.js'

/**
 * The names of all of your Convex tables.
 */
export type TableNames = TableNamesInDataModel<DataModel>

/**
 * The type of a document stored in Convex.
 *
 * @typeParam TableName - A string literal type of the table name (like "users").
 */
export type Doc<TableName extends TableNames> = DocumentByName<
  DataModel,
  TableName
>

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
  GenericId<TableName>

/**
 * A type describing your Convex data model.
 *
 * This type includes information about what tables you have, the type of
 * documents stored in those tables, and the indexes defined on them.
 *
 * This type is used to parameterize methods like `queryGeneric` and
 * `mutationGeneric` to make them type-safe.
 */
export type DataModel = DataModelFromSchemaDefinition<typeof schema>

```


## File: convex\_generated\server.d.ts

- Size: 5525 bytes
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
} from 'convex/server'
import type { DataModel } from './dataModel.js'

/**
 * Define a query in this Convex app's public API.
 *
 * This function will be allowed to read your Convex database and will be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export declare const query: QueryBuilder<DataModel, 'public'>

/**
 * Define a query that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to read from your Convex database. It will not be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export declare const internalQuery: QueryBuilder<DataModel, 'internal'>

/**
 * Define a mutation in this Convex app's public API.
 *
 * This function will be allowed to modify your Convex database and will be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export declare const mutation: MutationBuilder<DataModel, 'public'>

/**
 * Define a mutation that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to modify your Convex database. It will not be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export declare const internalMutation: MutationBuilder<DataModel, 'internal'>

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
export declare const action: ActionBuilder<DataModel, 'public'>

/**
 * Define an action that is only accessible from other Convex functions (but not from the client).
 *
 * @param func - The function. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped function. Include this as an `export` to name it and make it accessible.
 */
export declare const internalAction: ActionBuilder<DataModel, 'internal'>

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
export declare const httpAction: HttpActionBuilder

/**
 * A set of services for use within Convex query functions.
 *
 * The query context is passed as the first argument to any Convex query
 * function run on the server.
 *
 * This differs from the {@link MutationCtx} because all of the services are
 * read-only.
 */
export type QueryCtx = GenericQueryCtx<DataModel>

/**
 * A set of services for use within Convex mutation functions.
 *
 * The mutation context is passed as the first argument to any Convex mutation
 * function run on the server.
 */
export type MutationCtx = GenericMutationCtx<DataModel>

/**
 * A set of services for use within Convex action functions.
 *
 * The action context is passed as the first argument to any Convex action
 * function run on the server.
 */
export type ActionCtx = GenericActionCtx<DataModel>

/**
 * An interface to read from the database within Convex query functions.
 *
 * The two entry points are {@link DatabaseReader.get}, which fetches a single
 * document by its {@link Id}, or {@link DatabaseReader.query}, which starts
 * building a query.
 */
export type DatabaseReader = GenericDatabaseReader<DataModel>

/**
 * An interface to read from and write to the database within Convex mutation
 * functions.
 *
 * Convex guarantees that all writes within a single mutation are
 * executed atomically, so you never have to worry about partial writes leaving
 * your data in an inconsistent state. See [the Convex Guide](https://docs.convex.dev/understanding/convex-fundamentals/functions#atomicity-and-optimistic-concurrency-control)
 * for the guarantees Convex provides your functions.
 */
export type DatabaseWriter = GenericDatabaseWriter<DataModel>

```


## File: convex\_generated\server.js

- Size: 3445 bytes
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
} from 'convex/server'

/**
 * Define a query in this Convex app's public API.
 *
 * This function will be allowed to read your Convex database and will be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export const query = queryGeneric

/**
 * Define a query that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to read from your Convex database. It will not be accessible from the client.
 *
 * @param func - The query function. It receives a {@link QueryCtx} as its first argument.
 * @returns The wrapped query. Include this as an `export` to name it and make it accessible.
 */
export const internalQuery = internalQueryGeneric

/**
 * Define a mutation in this Convex app's public API.
 *
 * This function will be allowed to modify your Convex database and will be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export const mutation = mutationGeneric

/**
 * Define a mutation that is only accessible from other Convex functions (but not from the client).
 *
 * This function will be allowed to modify your Convex database. It will not be accessible from the client.
 *
 * @param func - The mutation function. It receives a {@link MutationCtx} as its first argument.
 * @returns The wrapped mutation. Include this as an `export` to name it and make it accessible.
 */
export const internalMutation = internalMutationGeneric

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
export const action = actionGeneric

/**
 * Define an action that is only accessible from other Convex functions (but not from the client).
 *
 * @param func - The function. It receives an {@link ActionCtx} as its first argument.
 * @returns The wrapped function. Include this as an `export` to name it and make it accessible.
 */
export const internalAction = internalActionGeneric

/**
 * Define a Convex HTTP action.
 *
 * @param func - The function. It receives an {@link ActionCtx} as its first argument, and a `Request` object
 * as its second.
 * @returns The wrapped endpoint function. Route a URL path to this function in `convex/http.js`.
 */
export const httpAction = httpActionGeneric

```


## File: README.md

- Size: 1150 bytes
- Language: md

```md
# Trello-like example using Convex DB

This is a TanStack Start demo using Convex as the database.
It is similar to the [start-trellaux](https://github.com/TanStack/router/tree/main/examples/react/start-trellaux) example but uses a cloud Convex deploymnet instead of an in-memory database.

To run this example:

```sh
pnpm install
pnpm dev
```

# Convex

Convex is an open source Reactive backend made by [convex.dev](https://convex.dev/?utm_source=tanstack), a sponsor of TanStack Start.

This example uses Convex with TanStack Query and TanStack Start to provide

- Typesafe TanStack Query options factories like `convexQuery` for use with `useQuery`, `useSuspenseQuery` etc.
- Live-updating queries: updates come in over a WebSocket instead of requiring polling
- Automatic query invalidation: when a mutation succeeds all queries it affects update automatically
- Selective optimistic update rollback: when a mutation succeeds only its update will be rolled back, with other optimistic updates reapplied
- Consistent snapshot reads of database state: /messages will never return a foreign key for a /user that doesn't exist until the next fetch

```
