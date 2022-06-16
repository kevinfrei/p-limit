import { MakeSimpleQueue } from '../queue';

test('Basic Simple Queue tests', () => {
  const q = MakeSimpleQueue<string>();
  expect(q.size()).toEqual(0);
  expect(q.dequeue()).toBeUndefined();
  q.enqueue('a');
  expect(q.size()).toEqual(1);
  expect(q.dequeue()).toEqual('a');
  expect(q.size()).toEqual(0);
  q.enqueue('b');
  expect(q.size()).toEqual(1);
  q.clear();
  expect(q.size()).toEqual(0);
  q.enqueue('c');
  q.enqueue('d');
  q.enqueue('e');
  expect(q.size()).toEqual(3);
  expect(q.dequeue()).toEqual('c');
  expect(q.size()).toEqual(2);
  expect(q.dequeue()).toEqual('d');
  expect(q.size()).toEqual(1);
  q.enqueue('f');
  expect(q.dequeue()).toEqual('e');
  expect(q.dequeue()).toEqual('f');
  expect(q.size()).toEqual(0);
  q.enqueue('a');
  q.enqueue('b');
  q.enqueue('c');
  let str = '';
  for (let c of q) {
    str += c;
  }
  expect(str).toEqual('abc');
  expect(q.size()).toEqual(3);
  q.clear();
  expect(q.size()).toEqual(0);
});
