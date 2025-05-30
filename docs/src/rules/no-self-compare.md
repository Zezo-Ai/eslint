---
title: no-self-compare
rule_type: problem
---


Comparing a variable against itself is usually an error, either a typo or refactoring error. It is confusing to the reader and may potentially introduce a runtime error.

The only time you would compare a variable against itself is when you are testing for `NaN`. However, it is far more appropriate to use `typeof x === 'number' && isNaN(x)` or the [Number.isNaN ES2015 function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isNaN) for that use case rather than leaving the reader of the code to determine the intent of self comparison.

## Rule Details

This error is raised to highlight a potentially confusing and potentially pointless piece of code. There are almost no situations in which you would need to compare something to itself.

Examples of **incorrect** code for this rule:

::: incorrect

```js
/*eslint no-self-compare: "error"*/

let x = 10;
if (x === x) {
    x = 20;
}
```

:::

## Known Limitations

This rule works by directly comparing the tokens on both sides of the operator. It flags them as problematic if they are structurally identical. However, it doesn't consider possible side effects or that functions may return different objects even when called with the same arguments. As a result, it can produce false positives in some cases, such as:

::: incorrect

```js
/*eslint no-self-compare: "error"*/

function parseDate(dateStr) {
  return new Date(dateStr);
}

if (parseDate('December 17, 1995 03:24:00') === parseDate('December 17, 1995 03:24:00')) {
  // do something
}

let counter = 0;
function incrementUnlessReachedMaximum() {
  return Math.min(counter += 1, 10);
}

if (incrementUnlessReachedMaximum() === incrementUnlessReachedMaximum()) {
  // ...
}
```

:::
