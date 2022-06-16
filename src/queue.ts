interface SimpleQueue<T> extends Iterable<T> {
  size: () => number;
  enqueue: (value: T) => void;
  dequeue: () => T | undefined;
  clear: () => void;
}

type Node<T> = { value: T; next: Node<T> | undefined };
const MakeNode = <T>(value: T, next?: Node<T>): Node<T> => ({ value, next });

export function MakeSimpleQueue<T>(): SimpleQueue<T> {
  let head: Node<T> | undefined;
  let tail: Node<T> | undefined;
  let sz = 0;
  function enqueue(val: T): void {
    const node = MakeNode<T>(val);
    if (head !== undefined) {
      tail!.next = node;
      tail = node;
    } else {
      head = node;
      tail = node;
    }
    sz++;
  }
  function dequeue(): T | undefined {
    if (head) {
      const res = head;
      head = head.next;
      sz--;
      return res.value;
    }
  }
  function clear(): void {
    head = undefined;
    tail = undefined;
    sz = 0;
  }
  function* iter(): IterableIterator<T> {
    let cur = head;
    while (cur !== undefined) {
      yield cur.value;
      cur = cur.next;
    }
  }
  return { size: () => sz, enqueue, dequeue, clear, [Symbol.iterator]: iter };
}
