---
title: prefer-arrow-callback
rule_type: suggestion
further_reading:
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions
---



Arrow functions can be an attractive alternative to function expressions for callbacks or function arguments.

For example, arrow functions are automatically bound to their surrounding scope/context. This provides an alternative to the pre-ES6 standard of explicitly binding function expressions to achieve similar behavior.

Additionally, arrow functions are:

* less verbose, and easier to reason about.

* bound lexically regardless of where or when they are invoked.

## Rule Details

This rule locates function expressions used as callbacks or function arguments. An error will be produced for any that could be replaced by an arrow function without changing the result.

The following examples **will** be flagged:

::: incorrect

```js
/* eslint prefer-arrow-callback: "error" */

foo(function(a) { return a; }); // ERROR
// prefer: foo(a => a)

foo(function() { return this.a; }.bind(this)); // ERROR
// prefer: foo(() => this.a)
```

:::

Instances where an arrow function would not produce identical results will be ignored.

The following examples **will not** be flagged:

::: correct

```js
/* eslint prefer-arrow-callback: "error" */

// arrow function callback
foo(a => a); // OK

// generator as callback
foo(function*() { yield; }); // OK

// function expression not used as callback or function argument
const foo = function foo(a) { return a; }; // OK

// unbound function expression callback
foo(function() { return this.a; }); // OK

// recursive named function callback
foo(function bar(n) { return n && n + bar(n - 1); }); // OK
```

:::

This rule additionally supports TypeScript type syntax.

Examples of **incorrect** TypeScript code for this rule:

::: incorrect

```ts
/*eslint prefer-arrow-callback: "error"*/

foo(function bar(a: string) { a; });

test('foo', function (this: any) {});
```

:::

Examples of **correct** TypeScript code for this rule:

::: correct

```ts
/*eslint prefer-arrow-callback: "error"*/

foo((a: string) => a);

const foo = function foo(bar: any) {};
```

:::

## Options

Access further control over this rule's behavior via an options object.

Default: `{ allowNamedFunctions: false, allowUnboundThis: true }`

### allowNamedFunctions

By default `{ "allowNamedFunctions": false }`, this `boolean` option prohibits using named functions as callbacks or function arguments.

Changing this value to `true` will reverse this option's behavior by allowing use of named functions without restriction.

`{ "allowNamedFunctions": true }` **will not** flag the following example:

::: correct

```js
/* eslint prefer-arrow-callback: [ "error", { "allowNamedFunctions": true } ] */

foo(function bar() {});
```

:::

Examples of **incorrect** TypeScript code for this rule with `{ "allowNamedFunctions": true }`:

::: incorrect

```ts
/* eslint prefer-arrow-callback: [ "error", { "allowNamedFunctions": true } ] */

foo(function(a: string) {});
```

:::

Examples of **correct** TypeScript code for this rule with `{ "allowNamedFunctions": true }`:

::: correct

```ts
/* eslint prefer-arrow-callback: [ "error", { "allowNamedFunctions": true } ] */

foo(function bar(a: string) {});
```

:::

### allowUnboundThis

By default `{ "allowUnboundThis": true }`, this `boolean` option allows function expressions containing `this` to be used as callbacks, as long as the function in question has not been explicitly bound.

When set to `false` this option prohibits the use of function expressions as callbacks or function arguments entirely, without exception.

`{ "allowUnboundThis": false }` **will** flag the following examples:

::: incorrect

```js
/* eslint prefer-arrow-callback: [ "error", { "allowUnboundThis": false } ] */

foo(function() { this.a; });

foo(function() { (() => this); });

someArray.map(function(item) { return this.doSomething(item); }, someObject);
```

:::

Examples of **incorrect** TypeScript code for this rule with `{ "allowUnboundThis": false }`:

::: incorrect

```ts
/* eslint prefer-arrow-callback: [ "error", { "allowUnboundThis": false } ] */

foo(function(a: string) { this; });

foo(function(a: string) { (() => this); });
```

:::

## When Not To Use It

* In environments that have not yet adopted ES6 language features (ES3/5).

* In ES6+ environments that allow the use of function expressions when describing callbacks or function arguments.
