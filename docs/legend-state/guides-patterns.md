---
title: Patterns
---

# Patterns

## Many atoms vs. one large store

Legend-State can be used however you want. If your team prefers one large state object containing all app state, that's great! Or you may prefer to have multiple different individual atoms in their own files, which works too. Here's some examples of ways to organize your state.

### One large global state

```typescript
const store$ = observable({
    UI: {
        windowSize: undefined as { width: number, height: number },
        activeTab: 'home' as 'home' | 'user' | 'profile',
        ...
    },
    settings: {
        theme: 'light' as 'light' | 'dark',
        fontSize: 14,
        ...
    },
    todos: [] as TodoItem[]
})
```

### Multiple individual atoms

```typescript
// Settings
export const theme$ = observable('light')
export const fontSize$ = observable(14)

// UIState
export const uiState$ = observable({
    windowSize: undefined as { width: number, height: number },
    activeTab: 'home' as 'home' | 'user' | 'profile',
})
```

### Within React components

You can use `useObservable` to create state objects within React components, then pass them down to children through either props or Context.

```typescript
function App() {
  const store$ = useObservable({
    profile: { name: "hi" },
  });

  return (
    <div>
      <Profile profile={store$.profile} />
    </div>
  );
}

function Profile({ profile }) {
  return <div>{profile.name}</div>;
}