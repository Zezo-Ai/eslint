---
title: no-regex-spaces
rule_type: suggestion
related_rules:
- no-div-regex
- no-control-regex
---





Regular expressions can be very complex and difficult to understand, which is why it's important to keep them as simple as possible in order to avoid mistakes. One of the more error-prone things you can do with a regular expression is to use more than one space, such as:

```js
const re = /foo   bar/;
```

In this regular expression, it's very hard to tell how many spaces are intended to be matched. It's better to use only one space and then specify how many spaces are expected, such as:

```js
const re = /foo {3}bar/;
```

Now it is very clear that three spaces are expected to be matched.

## Rule Details

This rule disallows multiple spaces in regular expression literals.

Examples of **incorrect** code for this rule:

::: incorrect

```js
/*eslint no-regex-spaces: "error"*/

const re = /foo   bar/;
const re1 = new RegExp("foo   bar");
```

:::

Examples of **correct** code for this rule:

::: correct

```js
/*eslint no-regex-spaces: "error"*/

const re = /foo {3}bar/;
const re1 = new RegExp("foo {3}bar");
```

:::

## When Not To Use It

If you want to allow multiple spaces in a regular expression, then you can safely turn this rule off.
