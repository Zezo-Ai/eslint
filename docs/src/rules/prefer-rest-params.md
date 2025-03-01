---
title: prefer-rest-params
rule_type: suggestion
related_rules:
- prefer-spread
---


There are rest parameters in ES2015.
We can use that feature for variadic functions instead of the `arguments` variable.

`arguments` does not have methods of `Array.prototype`, so it's a bit of an inconvenience.

## Rule Details

This rule is aimed to flag usage of `arguments` variables.

## Examples

Examples of **incorrect** code for this rule:

::: incorrect { "sourceType": "script" }

```js
/*eslint prefer-rest-params: "error"*/

function foo() {
    console.log(arguments);
}

function foo(action) {
    const args = Array.prototype.slice.call(arguments, 1);
    action.apply(null, args);
}

function foo(action) {
    const args = [].slice.call(arguments, 1);
    action.apply(null, args);
}
```

:::

Examples of **correct** code for this rule:

::: correct { "sourceType": "script" }

```js
/*eslint prefer-rest-params: "error"*/

function foo(...args) {
    console.log(args);
}

function foo(action, ...args) {
    action.apply(null, args); // or `action(...args)`, related to the `prefer-spread` rule.
}

// Note: the implicit arguments can be overwritten.
function foo(arguments) {
    console.log(arguments); // This is the first argument.
}
function foo() {
    const arguments = 0;
    console.log(arguments); // This is a local variable.
}
```

:::

## When Not To Use It

This rule should not be used in ES3/5 environments.

In ES2015 (ES6) or later, if you don't want to be notified about `arguments` variables, then it's safe to disable this rule.
