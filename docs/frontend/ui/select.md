Components

# Select

Displays a list of options for the user to pick from—triggered by a button.

Tailwind CSS

```jsx
import * as React from "react";
import { Select } from "radix-ui";
import classnames from "classnames";
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
} from "@radix-ui/react-icons";

const SelectDemo = () => (
	<Select.Root>
		<Select.Trigger
			className="inline-flex h-[35px] items-center justify-center gap-[5px] rounded bg-white px-[15px] text-[13px] leading-none text-violet11 shadow-[0_2px_10px] shadow-black/10 outline-none hover:bg-mauve3 focus:shadow-[0_0_0_2px] focus:shadow-black data-[placeholder]:text-violet9"
			aria-label="Food"
		>
			<Select.Value placeholder="Select a fruit…" />
			<Select.Icon className="text-violet11">
				<ChevronDownIcon />
			</Select.Icon>
		</Select.Trigger>
		<Select.Portal>
			<Select.Content className="overflow-hidden rounded-md bg-white shadow-[0px_10px_38px_-10px_rgba(22,_23,_24,_0.35),0px_10px_20px_-15px_rgba(22,_23,_24,_0.2)]">
				<Select.ScrollUpButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-violet11">
					<ChevronUpIcon />
				</Select.ScrollUpButton>
				<Select.Viewport className="p-[5px]">
					<Select.Group>
						<Select.Label className="px-[25px] text-xs leading-[25px] text-mauve11">
							Fruits
						</Select.Label>
						<SelectItem value="apple">Apple</SelectItem>
						<SelectItem value="banana">Banana</SelectItem>
						<SelectItem value="blueberry">Blueberry</SelectItem>
						<SelectItem value="grapes">Grapes</SelectItem>
						<SelectItem value="pineapple">Pineapple</SelectItem>
					</Select.Group>

					<Select.Separator className="m-[5px] h-px bg-violet6" />

					<Select.Group>
						<Select.Label className="px-[25px] text-xs leading-[25px] text-mauve11">
							Vegetables
						</Select.Label>
						<SelectItem value="aubergine">Aubergine</SelectItem>
						<SelectItem value="broccoli">Broccoli</SelectItem>
						<SelectItem value="carrot" disabled>
							Carrot
						</SelectItem>
						<SelectItem value="courgette">Courgette</SelectItem>
						<SelectItem value="leek">Leek</SelectItem>
					</Select.Group>

					<Select.Separator className="m-[5px] h-px bg-violet6" />

					<Select.Group>
						<Select.Label className="px-[25px] text-xs leading-[25px] text-mauve11">
							Meat
						</Select.Label>
						<SelectItem value="beef">Beef</SelectItem>
						<SelectItem value="chicken">Chicken</SelectItem>
						<SelectItem value="lamb">Lamb</SelectItem>
						<SelectItem value="pork">Pork</SelectItem>
					</Select.Group>
				</Select.Viewport>
				<Select.ScrollDownButton className="flex h-[25px] cursor-default items-center justify-center bg-white text-violet11">
					<ChevronDownIcon />
				</Select.ScrollDownButton>
			</Select.Content>
		</Select.Portal>
	</Select.Root>
);

const SelectItem = React.forwardRef(
	({ children, className, ...props }, forwardedRef) => {
		return (
			<Select.Item
				className={classnames(
					"relative flex h-[25px] select-none items-center rounded-[3px] pl-[25px] pr-[35px] text-[13px] leading-none text-violet11 data-[disabled]:pointer-events-none data-[highlighted]:bg-violet9 data-[disabled]:text-mauve8 data-[highlighted]:text-violet1 data-[highlighted]:outline-none",
					className,
				)}
				{...props}
				ref={forwardedRef}
			>
				<Select.ItemText>{children}</Select.ItemText>
				<Select.ItemIndicator className="absolute left-0 inline-flex w-[25px] items-center justify-center">
					<CheckIcon />
				</Select.ItemIndicator>
			</Select.Item>
		);
	},
);

export default SelectDemo;
```

## Features

Can be controlled or uncontrolled.

Offers 2 positioning modes.

Supports items, labels, groups of items.

Focus is fully managed.

Full keyboard navigation.

Supports custom placeholder.

Typeahead support.

Supports Right to Left direction.

## Component Reference Links

Version: 2.1.6

Size: [31.43 kB](https://bundlephobia.com/package/@radix-ui/react-select@2.1.6)

[View source](https://github.com/radix-ui/primitives/tree/main/packages/react/select/src)

[Report an issue](https://github.com/radix-ui/primitives/issues/new/choose)

[ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox)

## [Installation](#installation)

Install the component from your command line.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```bash
npm install @radix-ui/react-select
```

## [Anatomy](#anatomy)

Import all parts and piece them together.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
import { Select } from "radix-ui";

export default () => (
	<Select.Root>
		<Select.Trigger>
			<Select.Value />
			<Select.Icon />
		</Select.Trigger>

		<Select.Portal>
			<Select.Content>
				<Select.ScrollUpButton />
				<Select.Viewport>
					<Select.Item>
						<Select.ItemText />
						<Select.ItemIndicator />
					</Select.Item>

					<Select.Group>
						<Select.Label />
						<Select.Item>
							<Select.ItemText />
							<Select.ItemIndicator />
						</Select.Item>
					</Select.Group>

					<Select.Separator />
				</Select.Viewport>
				<Select.ScrollDownButton />
				<Select.Arrow />
			</Select.Content>
		</Select.Portal>
	</Select.Root>
);
```

## [API Reference](#api-reference)

### [Root](#root)

Contains all the parts of a select.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `defaultValue`<br><br>Prop description | `string` | No default value |
| `value`<br><br>Prop description | `string` | No default value |
| `onValueChange`<br><br>Prop description | `function`<br><br>See full type | No default value |
| `defaultOpen`<br><br>Prop description | `boolean` | No default value |
| `open`<br><br>Prop description | `boolean` | No default value |
| `onOpenChange`<br><br>Prop description | `function`<br><br>See full type | No default value |
| `dir`<br><br>Prop description | `enum`<br><br>See full type | No default value |
| `name`<br><br>Prop description | `string` | No default value |
| `disabled`<br><br>Prop description | `boolean` | No default value |
| `required`<br><br>Prop description | `boolean` | No default value |

### [Trigger](#trigger)

The button that toggles the select. The `Select.Content` will position itself by aligning over the trigger.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Data attribute | Values |
| --- | --- |
| `[data-state]` | `"open" \| "closed"` |
| `[data-disabled]` | Present when disabled |
| `[data-placeholder]` | Present when has placeholder |

### [Value](#value)

The part that reflects the selected value. By default the selected item's text will be rendered. if you require more control, you can instead control the select and pass your own `children`. It should not be styled to ensure correct positioning. An optional `placeholder` prop is also available for when the select has no value.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |
| `placeholder`<br><br>Prop description | `ReactNode` | No default value |

### [Icon](#icon)

A small icon often displayed next to the value as a visual affordance for the fact it can be open. By default renders ▼ but you can use your own icon via `asChild` or use `children`.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |

### [Portal](#portal)

When used, portals the content part into the `body`.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `container`<br><br>Prop description | `HTMLElement` | `document.body` |

### [Content](#content)

The component that pops out when the select is open.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |
| `onCloseAutoFocus`<br><br>Prop description | `function`<br><br>See full type | No default value |
| `onEscapeKeyDown`<br><br>Prop description | `function`<br><br>See full type | No default value |
| `onPointerDownOutside`<br><br>Prop description | `function`<br><br>See full type | No default value |
| `position`<br><br>Prop description | `enum`<br><br>See full type | `"item-aligned"` |
| `side`<br><br>Prop description | `enum`<br><br>See full type | `"bottom"` |
| `sideOffset`<br><br>Prop description | `number` | `0` |
| `align`<br><br>Prop description | `enum`<br><br>See full type | `"start"` |
| `alignOffset`<br><br>Prop description | `number` | `0` |
| `avoidCollisions`<br><br>Prop description | `boolean` | `true` |
| `collisionBoundary`<br><br>Prop description | `Boundary`<br><br>See full type | `[]` |
| `collisionPadding`<br><br>Prop description | `number \| Padding`<br><br>See full type | `10` |
| `arrowPadding`<br><br>Prop description | `number` | `0` |
| `sticky`<br><br>Prop description | `enum`<br><br>See full type | `"partial"` |
| `hideWhenDetached`<br><br>Prop description | `boolean` | `false` |

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Data attribute | Values |
| --- | --- |
| `[data-state]` | `"open" \| "closed"` |
| `[data-side]` | `"left" \| "right" \| "bottom" \| "top"` |
| `[data-align]` | `"start" \| "end" \| "center"` |

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| CSS Variable | Description |
| --- | --- |
| `--radix-select-content-transform-origin` | The `transform-origin` computed from the content and arrow positions/offsets. Only present when `position="popper"`. |
| `--radix-select-content-available-width` | The remaining width between the trigger and the boundary edge. Only present when `position="popper"`. |
| `--radix-select-content-available-height` | The remaining height between the trigger and the boundary edge. Only present when `position="popper"`. |
| `--radix-select-trigger-width` | The width of the trigger. Only present when `position="popper"`. |
| `--radix-select-trigger-height` | The height of the trigger. Only present when `position="popper"`. |

### [Viewport](#viewport)

The scrolling viewport that contains all of the items.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |

### [Item](#item)

The component that contains the select items.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |
| `value*`<br><br>Prop description | `string` | No default value |
| `disabled`<br><br>Prop description | `boolean` | No default value |
| `textValue`<br><br>Prop description | `string` | No default value |

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Data attribute | Values |
| --- | --- |
| `[data-state]` | `"checked" \| "unchecked"` |
| `[data-highlighted]` | Present when highlighted |
| `[data-disabled]` | Present when disabled |

### [ItemText](#itemtext)

The textual part of the item. It should only contain the text you want to see in the trigger when that item is selected. It should not be styled to ensure correct positioning.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |

### [ItemIndicator](#itemindicator)

Renders when the item is selected. You can style this element directly, or you can use it as a wrapper to put an icon into, or both.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |

### [ScrollUpButton](#scrollupbutton)

An optional button used as an affordance to show the viewport overflow as well as functionaly enable scrolling upwards.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |

### [ScrollDownButton](#scrolldownbutton)

An optional button used as an affordance to show the viewport overflow as well as functionaly enable scrolling downwards.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |

### [Group](#group)

Used to group multiple items. use in conjunction with `Select.Label` to ensure good accessibility via automatic labelling.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |

### [Label](#label)

Used to render the label of a group. It won't be focusable using arrow keys.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |

### [Separator](#separator)

Used to visually separate items in the select.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |

### [Arrow](#arrow)

An optional arrow element to render alongside the content. This can be used to help visually link the trigger with the `Select.Content`. Must be rendered inside `Select.Content`. Only available when `position` is set to `popper`.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Prop | Type | Default |
| --- | --- | --- |
| `asChild`<br><br>Prop description | `boolean` | `false` |
| `width`<br><br>Prop description | `number` | `10` |
| `height`<br><br>Prop description | `number` | `5` |

## [Examples](#examples)

### [Change the positioning mode](#change-the-positioning-mode)

By default, `Select` will behave similarly to a native MacOS menu by positioning `Select.Content` relative to the active item. If you would prefer an alternative positioning approach similar to `Popover` or `DropdownMenu` then you can set `position` to `popper` and make use of additional alignment options such as `side`, `sideOffset` and more.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
// index.jsx
import { Select } from "radix-ui";

export default () => (
	<Select.Root>
		<Select.Trigger>…</Select.Trigger>
		<Select.Portal>
			<Select.Content position="popper" sideOffset={5}>
				…
			</Select.Content>
		</Select.Portal>
	</Select.Root>
);
```

### [Constrain the content size](#constrain-the-content-size)

When using `position="popper"` on `Select.Content`, you may want to constrain the width of the content so that it matches the trigger width. You may also want to constrain its height to not exceed the viewport.

We expose several CSS custom properties such as `--radix-select-trigger-width` and `--radix-select-content-available-height` to support this. Use them to constrain the content dimensions.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
// index.jsx
import { Select } from "radix-ui";
import "./styles.css";

export default () => (
	<Select.Root>
		<Select.Trigger>…</Select.Trigger>
		<Select.Portal>
			<Select.Content
				className="SelectContent"
				position="popper"
				sideOffset={5}
			>
				…
			</Select.Content>
		</Select.Portal>
	</Select.Root>
);
```

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```css
/* styles.css */
.SelectContent {
	width: var(--radix-select-trigger-width);
	max-height: var(--radix-select-content-available-height);
}
```

### [With disabled items](#with-disabled-items)

You can add special styles to disabled items via the `data-disabled` attribute.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
// index.jsx
import { Select } from "radix-ui";
import "./styles.css";

export default () => (
	<Select.Root>
		<Select.Trigger>…</Select.Trigger>
		<Select.Portal>
			<Select.Content>
				<Select.Viewport>
					<Select.Item className="SelectItem" disabled>
						…
					</Select.Item>
					<Select.Item>…</Select.Item>
					<Select.Item>…</Select.Item>
				</Select.Viewport>
			</Select.Content>
		</Select.Portal>
	</Select.Root>
);
```

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```css
/* styles.css */
.SelectItem[data-disabled] {
	color: "gainsboro";
}
```

### [With a placeholder](#with-a-placeholder)

You can use the `placeholder` prop on `Value` for when the select has no value. There's also a `data-placeholder` attribute on `Trigger` to help with styling.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
// index.jsx
import { Select } from "radix-ui";
import "./styles.css";

export default () => (
	<Select.Root>
		<Select.Trigger className="SelectTrigger">
			<Select.Value placeholder="Pick an option" />
			<Select.Icon />
		</Select.Trigger>
		<Select.Portal>
			<Select.Content>…</Select.Content>
		</Select.Portal>
	</Select.Root>
);
```

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```css
/* styles.css */
.SelectTrigger[data-placeholder] {
	color: "gainsboro";
}
```

### [With separators](#with-separators)

Use the `Separator` part to add a separator between items.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
<Select.Root>
	<Select.Trigger>…</Select.Trigger>
	<Select.Portal>
		<Select.Content>
			<Select.Viewport>
				<Select.Item>…</Select.Item>
				<Select.Item>…</Select.Item>
				<Select.Item>…</Select.Item>
				<Select.Separator />
				<Select.Item>…</Select.Item>
				<Select.Item>…</Select.Item>
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>
```

### [With grouped items](#with-grouped-items)

Use the `Group` and `Label` parts to group items in a section.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
<Select.Root>
	<Select.Trigger>…</Select.Trigger>
	<Select.Portal>
		<Select.Content>
			<Select.Viewport>
				<Select.Group>
					<Select.Label>Label</Select.Label>
					<Select.Item>…</Select.Item>
					<Select.Item>…</Select.Item>
					<Select.Item>…</Select.Item>
				</Select.Group>
			</Select.Viewport>
		</Select.Content>
	</Select.Portal>
</Select.Root>
```

### [With complex items](#with-complex-items)

You can use custom content in your items.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
import { Select } from "radix-ui";

export default () => (
	<Select.Root>
		<Select.Trigger>…</Select.Trigger>
		<Select.Portal>
			<Select.Content>
				<Select.Viewport>
					<Select.Item>
						<Select.ItemText>
							<img src="…" />
							Adolfo Hess
						</Select.ItemText>
						<Select.ItemIndicator>…</Select.ItemIndicator>
					</Select.Item>
					<Select.Item>…</Select.Item>
					<Select.Item>…</Select.Item>
				</Select.Viewport>
			</Select.Content>
		</Select.Portal>
	</Select.Root>
);
```

### [Controlling the value displayed in the trigger](#controlling-the-value-displayed-in-the-trigger)

By default the trigger will automatically display the selected item `ItemText`'s content. You can control what appears by chosing to put things inside/outside the `ItemText` part.

If you need more flexibility, you can control the component using `value`/`onValueChange` props and passing `children` to `SelectValue`. Remember to make sure what you put in there is accessible.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
const countries = { france: "🇫🇷", "united-kingdom": "🇬🇧", spain: "🇪🇸" };

export default () => {
	const [value, setValue] = React.useState("france");
	return (
		<Select.Root value={value} onValueChange={setValue}>
			<Select.Trigger>
				<Select.Value aria-label={value}>
					{countries[value]}
				</Select.Value>
				<Select.Icon />
			</Select.Trigger>
			<Select.Portal>
			<Select.Content>
				<Select.Viewport>
					<Select.Item value="france">
						<Select.ItemText>France</Select.ItemText>
						<Select.ItemIndicator>…</Select.ItemIndicator>
					</Select.Item>
					<Select.Item value="united-kingdom">
						<Select.ItemText>United Kingdom</Select.ItemText>
						<Select.ItemIndicator>…</Select.ItemIndicator>
					</Select.Item>
					<Select.Item value="spain">
						<Select.ItemText>Spain</Select.ItemText>
						<Select.ItemIndicator>…</Select.ItemIndicator>
					</Select.Item>
				</Select.Viewport>
			</Select.Content>
			</Select.Portal>
		</Select.Root>
	);
};
```

### [With custom scrollbar](#with-custom-scrollbar)

The native scrollbar is hidden by default as we recommend using the `ScrollUpButton` and `ScrollDownButton` parts for the best UX. If you do not want to use these parts, compose your select with our [Scroll Area](/primitives/docs/components/scroll-area) primitive.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
// index.jsx
import { Select, ScrollArea } from "radix-ui";
import "./styles.css";

export default () => (
	<Select.Root>
		<Select.Trigger>…</Select.Trigger>
		<Select.Portal>
			<Select.Content>
				<ScrollArea.Root className="ScrollAreaRoot" type="auto">
					<Select.Viewport asChild>
						<ScrollArea.Viewport className="ScrollAreaViewport">
							<StyledItem>…</StyledItem>
							<StyledItem>…</StyledItem>
							<StyledItem>…</StyledItem>
						</ScrollArea.Viewport>
					</Select.Viewport>
					<ScrollArea.Scrollbar
						className="ScrollAreaScrollbar"
						orientation="vertical"
					>
						<ScrollArea.Thumb className="ScrollAreaThumb" />
					</ScrollArea.Scrollbar>
				</ScrollArea.Root>
			</Select.Content>
		</Select.Portal>
	</Select.Root>
);
```

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```css
/* styles.css */
.ScrollAreaRoot {
	width: 100%;
	height: 100%;
}

.ScrollAreaViewport {
	width: 100%;
	height: 100%;
}

.ScrollAreaScrollbar {
	width: 4px;
	padding: 5px 2px;
}

.ScrollAreaThumb {
	background: rgba(0, 0, 0, 0.3);
	border-radius: 3px;
}
```

## [Accessibility](#accessibility)

Adheres to the [ListBox WAI-ARIA design pattern](https://www.w3.org/WAI/ARIA/apg/patterns/listbox).

See the W3C [Select-Only Combobox](https://www.w3.org/TR/wai-aria-practices/examples/combobox/combobox-select-only.html) example for more information.

### [Keyboard Interactions](#keyboard-interactions)

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

| Key | Description |
| --- | --- |
| Space | When focus is on `Select.Trigger`, opens the select and focuses the selected item.  <br>When focus is on an item, selects the focused item. |
| Enter | When focus is on `Select.Trigger`, opens the select and focuses the first item.  <br>When focus is on an item, selects the focused item. |
| ArrowDown | When focus is on `Select.Trigger`, opens the select.  <br>When focus is on an item, moves focus to the next item. |
| ArrowUp | When focus is on `Select.Trigger`, opens the select.  <br>When focus is on an item, moves focus to the previous item. |
| Esc | Closes the select and moves focus to `Select.Trigger`. |

### [Labelling](#labelling)

Use our [Label](/primitives/docs/components/label) component in order to offer a visual and accessible label for the select.

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
import { Select, Label } from "radix-ui";

export default () => (
	<>
		<Label>
			Country
			<Select.Root>…</Select.Root>
		</Label>

		{/* or */}

		<Label htmlFor="country">Country</Label>
		<Select.Root>
			<Select.Trigger id="country">…</Select.Trigger>
			<Select.Portal>
				<Select.Content>…</Select.Content>
			</Select.Portal>
		</Select.Root>
	</>
);
```

## [Custom APIs](#custom-apis)

Create your own API by abstracting the primitive parts into your own component.

### [Abstract down to `Select` and `SelectItem`](#abstract-down-to-select-and-selectitem)

This example abstracts most of the parts.

#### Usage

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
import { Select, SelectItem } from "./your-select";

export default () => (
	<Select defaultValue="2">
		<SelectItem value="1">Item 1</SelectItem>
		<SelectItem value="2">Item 2</SelectItem>
		<SelectItem value="3">Item 3</SelectItem>
	</Select>
);
```

#### Implementation

\[data-radix-scroll-area-viewport\]{scrollbar-width:none;-ms-overflow-style:none;-webkit-overflow-scrolling:touch;}\[data-radix-scroll-area-viewport\]::-webkit-scrollbar{display:none}

```jsx
// your-select.jsx
import * as React from "react";
import { Select as SelectPrimitive } from "radix-ui";
import {
	CheckIcon,
	ChevronDownIcon,
	ChevronUpIcon,
} from "@radix-ui/react-icons";

export const Select = React.forwardRef(
	({ children, ...props }, forwardedRef) => {
		return (
			<SelectPrimitive.Root {...props}>
				<SelectPrimitive.Trigger ref={forwardedRef}>
					<SelectPrimitive.Value />
					<SelectPrimitive.Icon>
						<ChevronDownIcon />
					</SelectPrimitive.Icon>
				</SelectPrimitive.Trigger>
				<SelectPrimitive.Portal>
					<SelectPrimitive.Content>
						<SelectPrimitive.ScrollUpButton>
							<ChevronUpIcon />
						</SelectPrimitive.ScrollUpButton>
						<SelectPrimitive.Viewport>{children}</SelectPrimitive.Viewport>
						<SelectPrimitive.ScrollDownButton>
							<ChevronDownIcon />
						</SelectPrimitive.ScrollDownButton>
					</SelectPrimitive.Content>
				</SelectPrimitive.Portal>
			</SelectPrimitive.Root>
		);
	},
);

export const SelectItem = React.forwardRef(
	({ children, ...props }, forwardedRef) => {
		return (
			<SelectPrimitive.Item {...props} ref={forwardedRef}>
				<SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
				<SelectPrimitive.ItemIndicator>
					<CheckIcon />
				</SelectPrimitive.ItemIndicator>
			</SelectPrimitive.Item>
		);
	},
);
```

