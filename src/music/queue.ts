export class MusicQueue<T> {
  private items: T[] = [];
  public current?: T;

  add(item: T | T[]): void {
    if (Array.isArray(item)) {
      this.items.push(...item);
      return;
    }
    this.items.push(item);
  }

  next(): T | undefined {
    this.current = this.items.shift();
    return this.current;
  }

  getAll(): T[] {
    return [...this.items];
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
    this.current = undefined;
  }
}
