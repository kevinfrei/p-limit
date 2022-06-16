import { pLimit } from '../index.js';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Math.max(0, ms)));
}

function randomInt(min?: number, max?: number): number {
  const mx = max === undefined ? (min === undefined ? 1 : min) : max;
  const mn = max === undefined || min === undefined ? 0 : min;
  const rnd = Math.random();
  return Math.floor(rnd * (mx - mn + 1)) + mn;
}

test('concurrency: 1', async () => {
  const input = [
    [10, 300],
    [20, 200],
    [30, 100],
  ];

  const start = Date.now();
  const limit = pLimit(1);

  const mapper = ([value, ms]: [number, number]) =>
    limit(async () => {
      await delay(ms);
      return value;
    });

  expect(
    await Promise.all(
      input.map((x: number[]) => mapper(x as [number, number])),
    ),
  ).toEqual([10, 20, 30]);
  expect(() => {
    const v = Date.now() - start;
    return v >= 590 && v <= 650;
  }).toBeTruthy();
});

test('concurrency: 4', async () => {
  const concurrency = 5;
  let running = 0;

  const limit = pLimit(concurrency);

  const input = Array.from({ length: 100 }, () =>
    limit(async () => {
      running++;
      expect(running <= concurrency).toBeTruthy();
      await delay(randomInt(30, 200));
      running--;
    }),
  );

  await Promise.all(input);
});

test('non-promise returning function', async () => {
  await expect(async () => {
    const limit = pLimit(1);
    await limit(() => null);
  }).toBeTruthy();
});

test('continues after sync throw', async () => {
  const limit = pLimit(1);
  let ran = false;

  const promises = [
    limit(() => {
      throw new Error('err');
    }),
    limit(() => {
      ran = true;
    }),
  ];

  await Promise.all(promises).catch(() => {});

  expect(ran).toEqual(true);
});

test('accepts additional arguments', async () => {
  const limit = pLimit(1);
  const symbol = Symbol('test');

  await limit((a) => expect(a).toEqual(symbol), symbol);
});

test('does not ignore errors', async () => {
  const limit = pLimit(1);
  const error = new Error('🦄');

  const promises = [
    limit(async () => {
      await delay(30);
    }),
    limit(async () => {
      await delay(80);
      throw error;
    }),
    limit(async () => {
      await delay(50);
    }),
  ];
  let reason: unknown = 'nothing';
  try {
    await Promise.all(promises);
  } catch (rsn) {
    reason = rsn;
  }
  await new Promise(process.nextTick);
  expect(reason).toEqual(error);
});

test('activeCount and pendingCount properties', async () => {
  const limit = pLimit(5);
  expect(limit.activeCount).toEqual(0);
  expect(limit.pendingCount).toEqual(0);

  const runningPromise1 = limit(() => delay(1000));
  expect(limit.activeCount).toEqual(0);
  expect(limit.pendingCount).toEqual(1);

  await Promise.resolve();
  expect(limit.activeCount).toEqual(1);
  expect(limit.pendingCount).toEqual(0);

  await runningPromise1;
  expect(limit.activeCount).toEqual(0);
  expect(limit.pendingCount).toEqual(0);

  const immediatePromises = Array.from({ length: 5 }, () =>
    limit(() => delay(1000)),
  );
  const delayedPromises = Array.from({ length: 3 }, () =>
    limit(() => delay(1000)),
  );

  await Promise.resolve();
  expect(limit.activeCount).toEqual(5);
  expect(limit.pendingCount).toEqual(3);

  await Promise.all(immediatePromises);
  expect(limit.activeCount).toEqual(3);
  expect(limit.pendingCount).toEqual(0);

  await Promise.all(delayedPromises);

  expect(limit.activeCount).toEqual(0);
  expect(limit.pendingCount).toEqual(0);
});

test('clearQueue', async () => {
  const limit = pLimit(1);

  Array.from({ length: 1 }, () => limit(() => delay(1000)));
  Array.from({ length: 3 }, () => limit(() => delay(1000)));

  await Promise.resolve();
  expect(limit.pendingCount).toEqual(3);
  limit.clearQueue();
  expect(limit.pendingCount).toEqual(0);
});

test('throws on invalid concurrency argument', () => {
  expect(() => {
    pLimit(0);
  }).toThrow();

  expect(() => {
    pLimit(-1);
  }).toThrow();

  expect(() => {
    pLimit(1.2);
  }).toThrow();

  expect(() => {
    pLimit(undefined as any);
  }).toThrow();

  expect(() => {
    pLimit(true as any);
  }).toThrow();
});

test('types', () => {
  const limit = pLimit(1);

  const input = [
    limit(async () => 'foo'),
    limit(async () => 'bar'),
    limit(async () => undefined),
  ];

  const res1 = Promise.all(input);
  expect(typeof res1.then).toEqual('function');
  expect(typeof res1.catch).toEqual('function');
  const res2 = limit((a: string) => '', 'test');
  expect(typeof res2.then).toEqual('function');
  expect(typeof res2.catch).toEqual('function');
  const res3 = limit(async (_a: string, _b: number) => '', 'test', 1);
  expect(typeof res3.then).toEqual('function');
  expect(typeof res3.catch).toEqual('function');
  expect(typeof limit.activeCount).toEqual('number');
  expect(typeof limit.pendingCount).toEqual('number');
  expect(typeof limit.clearQueue()).toEqual('undefined');
});
