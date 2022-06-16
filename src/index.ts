import { MakeSimpleQueue } from './queue.js';

type PromiseFunc<ArgTypes extends unknown[], ReturnType> = (
  ...args: ArgTypes
) => PromiseLike<ReturnType> | ReturnType;

type GenericPromiseFunc = PromiseFunc<unknown[], unknown>;
type GenericFunc = (...args: unknown[]) => unknown;
export interface LimitFunction {
  /**
	The number of promises that are currently running.
	*/
  readonly activeCount: number;

  /**
	The number of promises that are waiting to run (i.e. their internal `fn` was not called yet).
	*/
  readonly pendingCount: number;

  /**
	Discard pending promises that are waiting to run.

	This might be useful if you want to teardown the queue at the end of your program's lifecycle or discard any function calls referencing an intermediary state of your app.

	Note: This does not cancel promises that are already running.
	*/
  clearQueue: () => void;

  /**
	@param fn - Promise-returning/async function.
	@param args - Any arguments to pass through to `fn`. Support for passing arguments on to the `fn` is provided in order to be able to avoid creating unnecessary closures. You probably don't need this optimization unless you're pushing a lot of functions.
	@returns The promise returned by calling `fn(...arguments)`.
	*/
  <Arguments extends unknown[], ReturnType>(
    fn: PromiseFunc<Arguments, ReturnType>,
    ...args: Arguments
  ): Promise<ReturnType>;
}

/**
Run multiple promise-returning & async functions with limited concurrency.

@param concurrency - Concurrency limit. Minimum: `1`.
@returns A `limit` function.
*/
export function pLimit(concurrency: number): LimitFunction {
  if (
    !(
      (Number.isInteger(concurrency) ||
        concurrency === Number.POSITIVE_INFINITY) &&
      concurrency > 0
    )
  ) {
    throw new TypeError('Expected `concurrency` to be a number from 1 and up');
  }

  const queue = MakeSimpleQueue<GenericPromiseFunc>();
  let activeCount = 0;

  const next = () => {
    activeCount--;

    if (queue.size() > 0) {
      queue.dequeue()!();
    }
  };

  const run = async (
    fn: GenericPromiseFunc,
    resolve: GenericFunc,
    args: unknown[],
  ) => {
    activeCount++;

    // eslint-disable-next-line @typescript-eslint/require-await
    const result = (async () => fn(...args))();

    resolve(result);

    try {
      await result;
    } catch {}

    next();
  };

  const enqueue = (
    fn: GenericPromiseFunc,
    resolve: GenericFunc,
    args: unknown[],
  ) => {
    queue.enqueue(run.bind(undefined, fn, resolve, args));

    void (async () => {
      // This function needs to wait until the next microtask before comparing
      // `activeCount` to `concurrency`, because `activeCount` is updated asynchronously
      // when the run function is dequeued and called. The comparison in the if-statement
      // needs to happen asynchronously as well to get an up-to-date value for `activeCount`.
      await Promise.resolve();

      if (activeCount < concurrency && queue.size() > 0) {
        queue.dequeue()!();
      }
    })();
  };

  const generator = (fn: GenericPromiseFunc, ...args: unknown[]) =>
    new Promise((resolve) => {
      enqueue(fn, resolve, args);
    });
  Object.defineProperties(generator, {
    activeCount: {
      get: () => activeCount,
    },
    pendingCount: {
      get: () => queue.size(),
    },
    clearQueue: {
      value: () => {
        queue.clear();
      },
    },
  });

  /* Does this work any better? Nope.
  generator.activeCount = { get: () => activeCount };
  generator.pendingCount = { get: () => queue.size() };
  generator.clearQueue = () => queue.clear();
  */
  // Typescript doesn't understand Object.defineProperties :/
  return generator as unknown as LimitFunction;
}
