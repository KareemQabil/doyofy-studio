/** Serial, coalescing saves: a slow earlier write must never overwrite a later edit. */
export class DraftQueue<T, R> {
  private revision: number;
  private savedRevision = 0;
  private running: Promise<R | null> | null = null;
  private result: R | null = null;
  constructor(private value: T, private write: (value: T) => Promise<R>, dirty = false) { this.revision = dirty ? 1 : 0; }
  get dirty() { return this.revision !== this.savedRevision; }
  update(value: T) { this.value = value; this.revision++; }
  flush(): Promise<R | null> {
    if (this.running) return this.running;
    this.running = this.drain().finally(() => { this.running = null; });
    return this.running;
  }
  private async drain(): Promise<R | null> {
    while (this.dirty) {
      const revision = this.revision;
      const snapshot = structuredClone(this.value);
      const result = await this.write(snapshot);
      this.savedRevision = revision;
      this.result = result;
    }
    return this.result;
  }
}
