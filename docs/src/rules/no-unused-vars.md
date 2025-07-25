---
title: no-unused-vars
rule_type: problem
related_rules:
- no-unassigned-vars
- no-useless-assignment
---



Variables that are declared and not used anywhere in the code are most likely an error due to incomplete refactoring. Such variables take up space in the code and can lead to confusion by readers.

## Rule Details

This rule is aimed at eliminating unused variables, functions, and function parameters.

A variable `foo` is considered to be used if any of the following are true:

* It is called (`foo()`) or constructed (`new foo()`)
* It is read (`let bar = foo`)
* It is passed into a function as an argument (`doSomething(foo)`)
* It is read inside of a function that is passed to another function (`doSomething(function() { foo(); })`)

A variable is *not* considered to be used if it is only ever declared (`let foo = 5`) or assigned to (`foo = 7`).

Examples of **incorrect** code for this rule:

::: incorrect

```js
/*eslint no-unused-vars: "error"*/
/*global some_unused_var*/

// It checks variables you have defined as global
some_unused_var = 42;

let x;

// Write-only variables are not considered as used.
let y = 10;
y = 5;

// A read for a modification of itself is not considered as used.
let z = 0;
z = z + 1;

// By default, unused arguments cause warnings.
(function(foo) {
    return 5;
})();

// Unused recursive functions also cause warnings.
function fact(n) {
    if (n < 2) return 1;
    return n * fact(n - 1);
}

// When a function definition destructures an array, unused entries from the array also cause warnings.
function getY([x, y]) {
    return y;
}
getY(["a", "b"]);
```

:::

Examples of **correct** code for this rule:

::: correct

```js
/*eslint no-unused-vars: "error"*/

const x = 10;
alert(x);

// foo is considered used here
myFunc(function foo() {
    // ...
}.bind(this));

(function(foo) {
    return foo;
})();

var myFunc;
myFunc = setTimeout(function() {
    // myFunc is considered used
    myFunc();
}, 50);

// Only the second argument from the destructured array is used.
function getY([, y]) {
    return y;
}
getY(["a", "b"]);
```

:::

### exported

In environments outside of CommonJS or ECMAScript modules, you may use `var` to create a global variable that may be used by other scripts. You can use the `/* exported variableName */` comment block to indicate that this variable is being exported and therefore should not be considered unused.

Note that `/* exported */` has no effect for any of the following:

* when `languageOptions.sourceType` is `module` (default) or `commonjs`
* when `languageOptions.parserOptions.ecmaFeatures.globalReturn` is `true`

The line comment `// exported variableName` will not work as `exported` is not line-specific.

```js
/* exported global_var */

var global_var = 42;
```

Examples of **correct** code for `/* exported variableName */` operation with `no-unused-vars`:

::: correct { "sourceType": "script" }

```js
/*eslint no-unused-vars: "error"*/
/* exported global_var */

var global_var = 42;
```

:::

## Options

This rule takes one argument which can be a string or an object. The string settings are the same as those of the `vars` property (explained below).

By default this rule is enabled with `all` option for caught errors and variables, and `after-used` for arguments.

```json
{
    "rules": {
        "no-unused-vars": ["error", {
            "vars": "all",
            "args": "after-used",
            "caughtErrors": "all",
            "ignoreRestSiblings": false,
            "ignoreUsingDeclarations": false,
            "reportUsedIgnorePattern": false
        }]
    }
}
```

### vars

The `vars` option has two settings:

* `all` checks all variables for usage, including those in the global scope. However, it excludes variables targeted by other options like `args` and `caughtErrors`. This is the default setting.
* `local` checks only that locally-declared variables are used but will allow global variables to be unused.

#### vars: local

Examples of **correct** code for the `{ "vars": "local" }` option:

::: correct

```js
/*eslint no-unused-vars: ["error", { "vars": "local" }]*/
/*global some_unused_var */

some_unused_var = 42;
```

:::

### varsIgnorePattern

The `varsIgnorePattern` option specifies exceptions not to check for usage: variables whose names match a regexp pattern. For example, variables whose names contain `ignored` or `Ignored`. However, it excludes variables targeted by other options like `argsIgnorePattern` and `caughtErrorsIgnorePattern`.

Examples of **correct** code for the `{ "varsIgnorePattern": "[iI]gnored" }` option:

::: correct

```js
/*eslint no-unused-vars: ["error", { "varsIgnorePattern": "[iI]gnored" }]*/

const firstVarIgnored = 1;
const secondVar = 2;
console.log(secondVar);
```

:::

### args

The `args` option has three settings:

* `after-used` - unused positional arguments that occur before the last used argument will not be checked, but all named arguments and all positional arguments after the last used argument will be checked.
* `all` - all named arguments must be used.
* `none` - do not check arguments.

#### args: after-used

Examples of **incorrect** code for the default `{ "args": "after-used" }` option:

::: incorrect

```js
/*eslint no-unused-vars: ["error", { "args": "after-used" }]*/

// 2 errors, for the parameters after the last used parameter (bar)
// "baz" is defined but never used
// "qux" is defined but never used
(function(foo, bar, baz, qux) {
    return bar;
})();
```

:::

Examples of **correct** code for the default `{ "args": "after-used" }` option:

::: correct

```js
/*eslint no-unused-vars: ["error", {"args": "after-used"}]*/

(function(foo, bar, baz, qux) {
    return qux;
})();
```

:::

#### args: all

Examples of **incorrect** code for the `{ "args": "all" }` option:

::: incorrect

```js
/*eslint no-unused-vars: ["error", { "args": "all" }]*/

// 2 errors
// "foo" is defined but never used
// "baz" is defined but never used
(function(foo, bar, baz) {
    return bar;
})();
```

:::

#### args: none

Examples of **correct** code for the `{ "args": "none" }` option:

::: correct

```js
/*eslint no-unused-vars: ["error", { "args": "none" }]*/

(function(foo, bar, baz) {
    return bar;
})();
```

:::

### argsIgnorePattern

The `argsIgnorePattern` option specifies exceptions not to check for usage: arguments whose names match a regexp pattern. For example, variables whose names begin with an underscore.

Examples of **correct** code for the `{ "argsIgnorePattern": "^_" }` option:

::: correct

```js
/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/

function foo(x, _y) {
    return x + 1;
}
foo();
```

:::

### caughtErrors

The `caughtErrors` option is used for `catch` block arguments validation.

It has two settings:

* `all` - all named arguments must be used. This is the default setting.
* `none` - do not check error objects.

#### caughtErrors: all

Not specifying this option is equivalent of assigning it to `all`.

Examples of **incorrect** code for the `{ "caughtErrors": "all" }` option:

::: incorrect

```js
/*eslint no-unused-vars: ["error", { "caughtErrors": "all" }]*/

// 1 error
// "err" is defined but never used
try {
    //...
} catch (err) {
    console.error("errors");
}
```

:::

#### caughtErrors: none

Examples of **correct** code for the `{ "caughtErrors": "none" }` option:

::: correct

```js
/*eslint no-unused-vars: ["error", { "caughtErrors": "none" }]*/

try {
    //...
} catch (err) {
    console.error("errors");
}
```

:::

### caughtErrorsIgnorePattern

The `caughtErrorsIgnorePattern` option specifies exceptions not to check for usage: catch arguments whose names match a regexp pattern. For example, variables whose names begin with a string 'ignore'.

Examples of **correct** code for the `{ "caughtErrorsIgnorePattern": "^ignore" }` option:

::: correct

```js
/*eslint no-unused-vars: ["error", { "caughtErrors": "all", "caughtErrorsIgnorePattern": "^ignore" }]*/

try {
    //...
} catch (ignoreErr) {
    console.error("errors");
}
```

:::

### destructuredArrayIgnorePattern

The `destructuredArrayIgnorePattern` option specifies exceptions not to check for usage: elements of array destructuring patterns whose names match a regexp pattern. For example, variables whose names begin with an underscore.

Examples of **correct** code for the `{ "destructuredArrayIgnorePattern": "^_" }` option:

::: correct

```js
/*eslint no-unused-vars: ["error", { "destructuredArrayIgnorePattern": "^_" }]*/

const [a, _b, c] = ["a", "b", "c"];
console.log(a+c);

const { x: [_a, foo] } = bar;
console.log(foo);

function baz([_c, x]) {
    x;
}
baz();

function test({p: [_q, r]}) {
    r;
}
test();

let _m, n;
foo.forEach(item => {
    [_m, n] = item;
    console.log(n);
});

let _o, p;
_o = 1;
[_o, p] = foo;
p;
```

:::

### ignoreRestSiblings

The `ignoreRestSiblings` option is a boolean (default: `false`). Using a [Rest Property](https://github.com/tc39/proposal-object-rest-spread) it is possible to "omit" properties from an object, but by default the sibling properties are marked as "unused". With this option enabled the rest property's siblings are ignored.

Examples of **correct** code for the `{ "ignoreRestSiblings": true }` option:

::: correct

```js
/*eslint no-unused-vars: ["error", { "ignoreRestSiblings": true }]*/

// 'foo' and 'bar' were ignored because they have a rest property sibling.
const { foo, ...rest } = data;
console.log(rest);

// OR

let bar;
({ bar, ...rest } = data);
```

:::

### ignoreClassWithStaticInitBlock

The `ignoreClassWithStaticInitBlock` option is a boolean (default: `false`). Static initialization blocks allow you to initialize static variables and execute code during the evaluation of a class definition, meaning the static block code is executed without creating a new instance of the class. When set to `true`, this option ignores classes containing static initialization blocks.

Examples of **incorrect** code for the `{ "ignoreClassWithStaticInitBlock": true }` option

::: incorrect

```js
/*eslint no-unused-vars: ["error", { "ignoreClassWithStaticInitBlock": true }]*/

class Foo {
    static myProperty = "some string";
    static mymethod() {
        return "some string";
    }
}

class Bar {
    static {
        let baz; // unused variable
    }
}
```

:::

Examples of **correct** code for the `{ "ignoreClassWithStaticInitBlock": true }` option

::: correct

```js
/*eslint no-unused-vars: ["error", { "ignoreClassWithStaticInitBlock": true }]*/

class Foo {
    static {
        let bar = "some string";

        console.log(bar);
    }
}
```

:::

### ignoreUsingDeclarations

The `ignoreUsingDeclarations` option is a boolean (default: `false`). Explicit resource management allows automatic teardown of disposables by calling `Symbol.dispose` or `Symbol.asyncDispose` method implicitly at the end of the variable's scope. When this option is set to `true`, this rule ignores variables declared with `using` or `await using`.

Examples of **incorrect** code for the `{ "ignoreUsingDeclarations": true }` option:

::: incorrect

```js
/*eslint no-unused-vars: ["error", { "ignoreUsingDeclarations": true }]*/
const resource = getResource();
```

:::

Examples of **correct** code for the `{ "ignoreUsingDeclarations": true }` option:

::: correct

```js
/*eslint no-unused-vars: ["error", { "ignoreUsingDeclarations": true }]*/

using syncResource = getSyncResource();
await using asyncResource = getAsyncResource();
```

:::

### reportUsedIgnorePattern

The `reportUsedIgnorePattern` option is a boolean (default: `false`).
Using this option will report variables that match any of the valid ignore
pattern options (`varsIgnorePattern`, `argsIgnorePattern`, `caughtErrorsIgnorePattern`, or
`destructuredArrayIgnorePattern`) if they have been used.

Examples of **incorrect** code for the `{ "reportUsedIgnorePattern": true }` option:

::: incorrect

```js
/*eslint no-unused-vars: ["error", { "reportUsedIgnorePattern": true, "varsIgnorePattern": "[iI]gnored" }]*/

const firstVarIgnored = 1;
const secondVar = 2;
console.log(firstVarIgnored, secondVar);
```

:::

Examples of **correct** code for the `{ "reportUsedIgnorePattern": true }` option:

::: correct

```js
/*eslint no-unused-vars: ["error", { "reportUsedIgnorePattern": true, "varsIgnorePattern": "[iI]gnored" }]*/

const firstVar = 1;
const secondVar = 2;
console.log(firstVar, secondVar);
```

:::

## When Not To Use It

If you don't want to be notified about unused variables or function arguments, you can safely turn this rule off.
