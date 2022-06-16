# p-limit

> Run multiple promise-returning & async functions with limited concurrency

> Do it for both CommonJS (electron, older Node) and ES Modules systems!

## Install

```
$ npm install @freik/p-limit
```

## Usage

Note: pLimit is now a named export, not a default export. (Default exports are annoying to deal with for dual-mode modules...)

```js
import { pLimit } from 'p-limit';

const limit = pLimit(1);

const input = [
  limit(() => fetchSomething('foo')),
  limit(() => fetchSomething('bar')),
  limit(() => doSomething()),
];

// Only one promise is run at once
const result = await Promise.all(input);
console.log(result);
```

## API

### pLimit(concurrency)

Returns a `limit` function.

#### concurrency

Type: `number`\
Minimum: `1`\
Default: `Infinity`

Concurrency limit.

### limit(fn, ...args)

Returns the promise returned by calling `fn(...args)`.

#### fn

Type: `Function`

Promise-returning/async function.

#### args

Any arguments to pass through to `fn`.

Support for passing arguments on to the `fn` is provided in order to be able to avoid creating unnecessary closures. You probably don't need this optimization unless you're pushing a _lot_ of functions.

### limit.activeCount

The number of promises that are currently running.

### limit.pendingCount

The number of promises that are waiting to run (i.e. their internal `fn` was not called yet).

### limit.clearQueue()

Discard pending promises that are waiting to run.

This might be useful if you want to teardown the queue at the end of your program's lifecycle or discard any function calls referencing an intermediary state of your app.

Note: This does not cancel promises that are already running.

## FAQ

### How is this different from the [`p-limit`](https://github.com/sindresorhus/p-limit) package?

This package is deployed as both a CommonJS and an ES Module. I work in Electron, so I need it both ways. I also live in Typescript, so I added types to the original code, and got rid of the separate type definition file.

If you like this, go to the original project author. They did most of the work.

I might fork their other suff, if I ever wind up needing any of it from the Electron main process...
