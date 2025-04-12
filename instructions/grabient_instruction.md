# Grabient Project Instructions

Note: The project structure and routing information can be found in the project knowledge file `routeTree.gen.ts`.

## Cosine Gradient Algorithm

The core of this application is based on Inigo Quilez's cosine palette formula:

```
color(t) = a + b * cos(2π * (c*t + d))
```

Where:

- `t` ranges from 0 to 1 (normalized position)
- `a` (offset/bias) controls base color and brightness
- `b` (amplitude) controls contrast and color range
- `c` (frequency) controls number of color cycles
- `d` (phase) shifts colors along the gradient

The implementation in `cosineGradient.ts`:

- Generates color arrays based on coefficient vectors
- Applies global modifiers to adjust the overall gradient
- Supports various gradient styles (linear, angular, swatches)
- Provides functions for rendering CSS gradients from calculated colors

This algorithm enables efficient, procedural generation of smooth, customizable color gradients with minimal code.

## Data Management

The application uses a dual schema approach for data handling:

### Database Schema (schema.ts)

- Uses Zod with Convex to define database collection structure
- Contains the `Collections` table with gradient properties:
  - `coeffs`: Coefficient vectors for gradient formula
  - `globals`: Global modifier parameters
  - `style`: Gradient rendering style
  - `steps`: Number of color stops
  - `angle`: Gradient angle in degrees
- This schema determines the structure of data returned by `fetchCollections()`
- The exported type `AppCollection` is derived from this schema

### Data Loading with TanStack Router

- The `loader` function fetches data using `fetchCollections()`
- Data is accessed via `useLoaderData()` hook with typecasting:
  ```tsx
  const collections = useLoaderData({ from: '/' }) as AppCollection[];
  ```
- This pattern works consistently in both SSR and client environments
- Always treat data accessed via `useLoaderData()` as immutable
- When modifications are needed, create derived state from this data

## CSS Styling with Tailwind v4

The project uses Tailwind CSS v4 for styling components. When writing Tailwind classes, organize them in semantic groups using the `cn` utility function:

```tsx
className={cn(
  // 1. Layout & Positioning
  'flex items-center relative',

  // 2. Sizing & Dimensions
  'w-[90px] h-9',

  // 3. Borders & Background
  'border border-input rounded-md bg-background',

  // 4. Interactive States
  'hover:bg-accent hover:text-accent-foreground',

  // 5. Transitions & Animations
  'transition-colors disable-animation-on-theme-change',

  // 6. Typography
  'text-sm font-medium',

  // 7. Spacing & Padding
  'px-3 py-2',

  // 8. Colors
  value === 'auto' ? 'text-muted-foreground' : '',

  // 9. Utilities & Overrides
  'shadow-sm'
)}
```

Do not include the comments in the output code.

Additional styling guidelines:

- Use viewport-relative units for responsive layouts
- Extend the Tailwind config rather than using inline styles
- Row heights should use percentage calculations (e.g., `calc(100vh - ${APP_HEADER_HEIGHT}px)`)
- Follow the component patterns in the codebase for consistent styling

The project includes global styles and Tailwind variable declarations in `~/style.css`, which defines:

- Custom dark mode theme variables
- Global CSS custom properties using the OKLCH color space
- Custom scrollbar styles
- Base layout styles with consistent border and outline properties

When implementing new components, refer to the theme variables in `style.css` for color consistency between light and dark modes.

For complete documentation on Tailwind v4, refer to: [https://tailwindcss.com/blog/tailwindcss-v4](https://tailwindcss.com/blog/tailwindcss-v4)

## Application State Management

The app uses a hybrid state management approach with three primary sources:

1. **URL Parameters (TanStack Router)**: Persistent, shareable state

   - **Source of truth** for all other types of state
   - Accessed via `useSearch({ from: '/' })`
   - Contains: `rowHeight`, `style`, `steps`, `angle`
   - Validated using Valibot schemas in `Route` definition
   - Defaults defined in `SEARCH_DEFAULTS`
   - Updates should be throttled/debounced to prevent excessive renders

2. **Legend State (Global state)**: Temporary UI state

   - Derives from and eventually updates URL parameters
   - Accessed via `use$(uiStore$.propertyName)`
   - Contains: `previewStyle`, `previewSteps`, `previewAngle`
   - Used for real-time previews while interacting with UI
   - Resets to `null` when interactions end

3. **Local Component State**: Immediate UI feedback
   - Used for managing component-specific interactions
   - Examples: input focus, popover open state, hover effects
   - Syncs with URL parameters with throttling when appropriate

When implementing new features:

- Use URL parameters for persistent settings
- Use UI store (Legend State) for temporary preview states and high velocity global state
- Use local component state for high velocity local state and immediate UI responsiveness
- Follow the pattern in `AngleInput`, `StepsInput`, and `StyleSelect` components

Special value `'auto'` indicates using collection's native settings rather than override.

For Legend State documentation: [https://legendapp.com/open-source/state/v3/intro/introduction/](https://legendapp.com/open-source/state/v3/intro/introduction/)

## Schema Validation with Valibot

Valibot provides runtime data validation with TypeScript type inference. In this project:

1. **URL Parameters Validation**

   - Route search parameters are validated via `searchValidatorSchema`
   - Default values are applied when validation fails
   - Type safety is maintained between runtime and compile time

2. **Project Integration**
   - Validators are defined in `~/routes.ts` and `~/stores/ui.ts`
   - TanStack Router uses these schemas in route definitions
   - UI components read and write validated values

**Note:** Do not confuse with `schema.ts`, which defines database schemas using Zod for the Convex database. `schema.ts` determines the structure of data returned by `fetchCollections()`.

For syntax and usage patterns, refer to the official documentation:
[https://valibot.dev/api/](https://valibot.dev/api/)

## Documentation and Resources

Official documentation:

- **TanStack Start**: [https://tanstack.com/start/latest/docs/framework/react/overview](https://tanstack.com/start/latest/docs/framework/react/overview)
- **TanStack Router**: [https://tanstack.com/router/latest](https://tanstack.com/router/latest)

The project contains specialized configurations that extend these libraries. Refer to both official docs and project code when implementing features.
