/**
 * Circular Ring Buffer for high-frequency (10–50 Hz) telemetry data.
 * Avoids constant memory reallocation and garbage collection overhead.
 */
export class RingBuffer<T> {
  private buffer: (T | undefined)[];
  private capacity: number;
  private pointer: number = 0;
  private size: number = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    this.buffer = new Array(capacity);
  }

  push(item: T): void {
    this.buffer[this.pointer] = item;
    this.pointer = (this.pointer + 1) % this.capacity;
    if (this.size < this.capacity) {
      this.size++;
    }
  }

  getLatest(): T | undefined {
    if (this.size === 0) return undefined;
    const lastIndex = (this.pointer - 1 + this.capacity) % this.capacity;
    return this.buffer[lastIndex];
  }

  toArray(): T[] {
    const result: T[] = [];
    if (this.size === 0) return result;

    const start = this.size < this.capacity ? 0 : this.pointer;
    for (let i = 0; i < this.size; i++) {
      const idx = (start + i) % this.capacity;
      const val = this.buffer[idx];
      if (val !== undefined) {
        result.push(val);
      }
    }
    return result;
  }

  clear(): void {
    this.buffer = new Array(this.capacity);
    this.pointer = 0;
    this.size = 0;
  }

  getSize(): number {
    return this.size;
  }
}

