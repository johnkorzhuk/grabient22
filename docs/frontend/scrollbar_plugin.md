- [](/tailwind-scrollbar/)
- Introduction

On this page

# Introduction

`tailwind-scrollbar` is a plugin for [Tailwind CSS](https://tailwindcss.com) that adds styling utilities for scrollbars with cross-browser support.

## Motivation[​](#motivation "Direct link to Motivation")

There are currently two competing standards for styling scrollbars amongst browsers: the [scrollbar-width](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-width) and [scrollbar-color](https://developer.mozilla.org/en-US/docs/Web/CSS/scrollbar-color) properties used by Firefox and newer Chromium-based browsers, and the [::-webkit-scrollbar](https://developer.mozilla.org/en-US/docs/Web/CSS/::-webkit-scrollbar) family of pseudoelements used by everything else. This plugin defines a single API for configuring both standards at once from within Tailwind.

### What this plugin isn't[​](#what-this-plugin-isnt "Direct link to What this plugin isn't")

#### A scrollbar triggering tool[​](#a-scrollbar-triggering-tool "Direct link to A scrollbar triggering tool")

This plugin _styles_ scrollbars; it does not force them to appear. Use typical CSS techniques to get the scrollbar in place (e.g. the `overflow-*` family of utilities), and then use the utilities in this plugin to style it from there.

#### A fully custom scrollbar[​](#a-fully-custom-scrollbar "Direct link to A fully custom scrollbar")

This plugin is intented to unify existing browser APIs; it's not meant to create fully custom scrollbar elements. As such, it is limited to some extent in terms of what kinds of scrollbars it can create.

#### Perfect cross-browser replication[​](#perfect-cross-browser-replication "Direct link to Perfect cross-browser replication")

Scrollbars in different browsers and operating systems look different and have different degrees of customizability. This plugin won't make them look exactly the same; it will just help you ensure that they don't clash with your site's theme.

## License[​](#license "Direct link to License")

This project is licensed under the [MIT License](https://github.com/adoxography/tailwind-scrollbar/blob/main/LICENSE).

[

Next

Migrating to v4

](/tailwind-scrollbar/migrating)

# Examples

## Minimal example[​](#minimal-example "Direct link to Minimal example")

It's a good idea to start with an element that already has a scrollbar. Begin custom styling by adding either the `scrollbar` or `scrollbar-thin` utilities, then add a `scrollbar-thumb-*` and (optionally) a `scrollbar-track-*` utility to define your scrollbar colours.

```
<div class="scrollbar scrollbar-thumb-sky-700 scrollbar-track-sky-300 h-32 overflow-y-scroll">    <div class="h-64 bg-slate-400"></div></div>
```

## Global scrollbar colours[​](#global-scrollbar-colours "Direct link to Global scrollbar colours")

The scollbar colour utilities are inherited, so if you want to use the same colours on every custom scrollbar, you can define them at a high-level element (e.g. `html`) and then simply add `scrollbar` or `scrollbar-thin` to each scrollbar you'd like to apply custom styling to.

```
<html className="scrollbar-thumb-sky-700 scrollbar-track-sky-300">    <!-- ... -->    <div className="scrollbar-thin h-32 overflow-y-scroll">        <div className="h-64 bg-slate-400"></div>    </div>    <!-- ... --></html>
```

## Variants[​](#variants "Direct link to Variants")

Use the `scrollbar-hover:` and `scrollbar-thumb:` variants to apply utilties when the scrollbar's thumb is hovered or active, respectively. Note that only scrollbars that are being [styled using pseudoelements](/tailwind-scrollbar/getting-started#preferred-strategy) will pay attention to these variants; standards-track scrollbars (like those used in FireFox exclusively and in Chrome/Edge by default) deal with hover and active states on their own.

warning

If you're using `tailwind-scrollbar`@v3, use the built-in `hover:` and `active:` variants instead of `scrollbar-hover:` and `scrollbar-thumb:`.

```
<div class="scrollbar-hover:scrollbar-thumb-sky-500 scrollbar-active:scrollbar-thumb-sky-400 h-32 scrollbar scrollbar-thumb-slate-700 scrollbar-track-slate-300 overflow-y-scroll">    <div class="h-64 bg-slate-400"></div></div>
```

## Custom colours[​](#custom-colours "Direct link to Custom colours")

The colour utilities can accept colours in any format Tailwind's native colour utilities like `bg-*` can, including [custom colours](https://tailwindcss.com/docs/colors#customizing-your-colors) and [arbitrary values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values).

```
<div class="scrollbar-thumb-custom scrollbar-track-custom-light scrollbar-hover:scrollbar-thumb-[#059669] scrollbar-active:scrollbar-thumb-emerald-500/50 scrollbar h-32 overflow-y-scroll">    <div class="h-64 bg-slate-400"></div></div>
```

- New CSS Config
- Legacy JavaScript Config

```
@import 'tailwindcss';/* ... */@theme {    --color-custom: #d1fae5;    --color-custom-light: #10b981;}
```

```
module.exports = {    // ...    theme: {        extend: {            colors: {                custom: {                    DEFAULT: '#10b981',                    light: '#d1fae5',                },            },        },    },};
```

## Corners[​](#corners "Direct link to Corners")

When you have both a vertical and horizontal scrollbar, you'll end up with an empty box in the bottom right corner. You can use the `scrollbar-corner-*` utilities to colour this region as you would `scrollbar-thumb-*`.

```
<div class="scrollbar-corner-sky-500 scrollbar scrollbar-thumb-slate-700 scrollbar-track-slate-300 h-32 overflow-scroll">    <div class="h-64 w-[100vw] bg-slate-400"></div></div>
```

## Rounded bars[​](#rounded-bars "Direct link to Rounded bars")

_These utilities only work in `nocompatible` mode, and have no effect on standards-track scrollbars. See [configuration](/tailwind-scrollbar/getting-started#configuration)._

The `scrollbar-*-rounded-*` family of utilities can be applied to the `thumb`, `track`, or `corner` components, and work in the same was as Tailwind's native `rounded-*` utilities. Custom values and arbitrary values are permitted.

```
<div class="scrollbar-thumb-rounded-full scrollbar-track-rounded-full scrollbar scrollbar-thumb-slate-700 scrollbar-track-slate-300 h-32 overflow-y-scroll">    <div class="h-64 bg-slate-400"></div></div>
```

## Custom sizes[​](#custom-sizes "Direct link to Custom sizes")

_These utilities only work in `nocompatible` mode, and have no effect on standards-track scrollbars. See [configuration](/tailwind-scrollbar/getting-started#configuration)._

The `scrollbar-w-*` and `scrollbar-h-*` utilities can be used to fine-tine the width and height of scrollbars. Note that these only have effects on vertical and horizontal scrollbars, respectively, and can only be used with the `scrollbar` utility (not `scrollbar-thin`).

```
<div class="scrollbar-w-8 scrollbar scrollbar-thumb-slate-700 scrollbar-track-slate-300 h-32 overflow-y-scroll">    <div class="h-64 bg-slate-400"></div></div>
```

# Complete list of utilities/variants

## Base utilities[​](#base-utilities "Direct link to Base utilities")

These utilities initialize scrollbar styling. You always need one of them, even if you're using custom widths.

| Utility          | Effect                                                    | Notes                                                                                                                                      |
| ---------------- | --------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `scrollbar`      | Enables custom scrollbar styling, using the default width | On Firefox, this is `scrollbar-width: auto`. Chrome is hard coded to `16px` for consistency.                                               |
| `scrollbar-thin` | Enables custom scrollbar styling, using the thin width    | On Firefox, this is `scrollbar-width: thin`. Chrome is hard coded to `8px` for consistency.                                                |
| `scrollbar-none` | Hides the scrollbar completely                            | Because of browser quirks, this cannot be used to hide an existing styled scrollbar - i.e. `scrollbar hover:scrollbar-none` will not work. |

## Colour utilities[​](#colour-utilities "Direct link to Colour utilities")

All of the asterisks can be replaced [with any tailwind colour](https://tailwindcss.com/docs/customizing-colors#using-custom-colors), including [arbitrary values](https://tailwindcss.com/docs/adding-custom-styles#using-arbitrary-values) and [opacity modifiers](https://tailwindcss.com/docs/background-color#changing-the-opacity). With the exception of the width utilities, all utilities are inherited by child elements.

| Utility              | Effect                                  | Notes                                                                            |
| -------------------- | --------------------------------------- | -------------------------------------------------------------------------------- |
| `scrollbar-thumb-*`  | Sets the colour of the scrollbar thumb  |                                                                                  |
| `scrollbar-track-*`  | Sets the colour of the scrollbar track  |                                                                                  |
| `scrollbar-corner-*` | Sets the colour of the scrollbar corner | The corner will only appear if you have both vertical and horizontal scrollbars. |

## Nocompatible utilities[​](#nocompatible-utilities "Direct link to Nocompatible utilities")

These styles are only available in [`nocompatible` mode](/tailwind-scrollbar/getting-started#configuration). They won't have any effect on standards-track scrollbars, such as those used by Firefox or by Chrome/Edge by default.

| Utility                      | Effect                                   | Notes                                                                                                                                                                                                        |
| ---------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `scrollbar-w-*`              | Sets the width of vertical scrollbars    | The asterisk can be replaced with any Tailwind [width setting](https://tailwindcss.com/docs/width), including arbitrary values. Only applies to scrollbars styled with `scrollbar` (not `scrollbar-thin`).   |
| `scrollbar-h-*`              | Sets the height of horizontal scrollbars | The asterisk can be replaced with any Tailwind [height setting](https://tailwindcss.com/docs/height), including arbitrary values. Only applies to scrollbars styled with `scrollbar` (not `scrollbar-thin`). |
| `scrollbar-thumb-rounded-*`  | Rounds a scrollbar thumb's corners       | The asterisk can be replaced with any Tailwind [rounded setting](https://tailwindcss.com/docs/border-radius#using-custom-values), including arbitrary values.                                                |
| `scrollbar-track-rounded-*`  | Rounds a scrollbar track's corners       | See above, but for the track                                                                                                                                                                                 |
| `scrollbar-corner-rounded-*` | Rounds a scrollbar corner's corners      | See above, but for the corner pseudoelement created when both horizontal and vertial scrollbars are present                                                                                                  |

## Variants[​](#variants "Direct link to Variants")

warning

These variants are not available in `tailwind-scrollbar`@v3. Use the built-in `hover:` and `active:` instead.

These variants don't have any effect on standards-track scrollbars, such as those used by Firefox or by Chrome/Edge by default. The responsibility of styling hover and active states is assumed by the browser in that scenario.

| Variant                   | Effect                                                   |
| ------------------------- | -------------------------------------------------------- |
| `scrollbar-hover:`        | Applies a utility when the scrollbar's thumb is hovered  |
| `scrollbar-active:`       | Applies a utility when the scrollbar's thumb is active   |
| `scrollbar-track-hover:`  | Applies a utility when the scrollbar's track is hovered  |
| `scrollbar-track-active:` | Applies a utility when the scrollbar's track is active   |
| `scrollbar-corner-hover:` | Applies a utility when the scrollbar's corner is hovered |
