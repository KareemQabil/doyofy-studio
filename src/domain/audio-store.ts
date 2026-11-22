/**
 * Where uploaded/recorded audio BYTES live. Metadata (name, start point, kind) stays in the account library
 * (audio-library.ts); only this interface touches the bytes, so the prototype's IndexedDB store can be swapped for
 * an HTTP/blob store (server upload → id, signed GET → blob) without changing the library, the editor or the engine.
 */
export interface AudioStore {
  /** Saves the bytes and resolves with their id once durable. `id` keeps an existing reference (migration). */
  put(blob: Blob, opts?: { id?: string }): Promise<string>;
  /** The bytes, or null when this store has none for the id (deleted, or another device). */
  get(id: string): Promise<Blob | null>;
  /** Idempotent: deleting a missing id succeeds. */
  delete(id: string): Promise<void>;
  /** `device`: bytes stay in this browser (the honesty line in the editor/account depends on it). */
  readonly scope: 'device' | 'server';
}

export class AudioStoreError extends Error {
  constructor(readonly code: 'quota' | 'unavailable', cause?: unknown) { super(code); this.cause = cause; }
}

const newId = () => `audio_${globalThis.crypto?.randomUUID?.() ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`}`;

/** Bytes are stored as ArrayBuffer + type (not Blob): older Safari could not persist Blobs in IndexedDB. */
interface Row { id: string; type: string; data: ArrayBuffer }

export function indexedDbAudioStore(factory: IDBFactory | undefined = globalThis.indexedDB, name = 'doyofy-audio', table = 'blobs'): AudioStore {
  let opened: Promise<IDBDatabase> | null = null;
  const db = () => opened ??= new Promise<IDBDatabase>((resolve, reject) => {
    if (!factory) { reject(new AudioStoreError('unavailable')); return; }
    const req = factory.open(name, 1);
    req.onupgradeneeded = () => { if (!req.result.objectStoreNames.contains(table)) req.result.createObjectStore(table, { keyPath: 'id' }); };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => { opened = null; reject(new AudioStoreError('unavailable', req.error)); };
    req.onblocked = () => { opened = null; reject(new AudioStoreError('unavailable')); };
  });
  const run = async <T>(mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest | void): Promise<T> => {
    const tx = (await db()).transaction(table, mode);
    const req = work(tx.objectStore(table));
    return new Promise<T>((resolve, reject) => {
      tx.oncomplete = () => resolve((req ? req.result : undefined) as T);
      const fail = () => { const e = tx.error ?? (req ? req.error : null); reject(new AudioStoreError(e?.name === 'QuotaExceededError' ? 'quota' : 'unavailable', e)); };
      tx.onerror = fail; tx.onabort = fail;
    });
  };
  return {
    scope: 'device',
    async put(blob, opts) {
      const id = opts?.id || newId();
      const row: Row = { id, type: blob.type, data: await blob.arrayBuffer() };
      await run('readwrite', s => s.put(row));
      return id;
    },
    async get(id) {
      const row = await run<Row | undefined>('readonly', s => s.get(id));
      return row ? new Blob([row.data], { type: row.type }) : null;
    },
    async delete(id) { await run('readwrite', s => s.delete(id)); },
  };
}

/** For tests and for browsers without IndexedDB: bytes last until the page closes. */
export function memoryAudioStore(): AudioStore {
  const rows = new Map<string, Blob>();
  return {
    scope: 'device',
    async put(blob, opts) { const id = opts?.id || newId(); rows.set(id, blob); return id; },
    async get(id) { return rows.get(id) ?? null; },
    async delete(id) { rows.delete(id); },
  };
}

let current: AudioStore | null = null;
/** The active store: IndexedDB in browsers that have it, otherwise in-memory. */
export function audioStore(): AudioStore { return current ??= globalThis.indexedDB ? indexedDbAudioStore() : memoryAudioStore(); }
/** Swap the store (tests now; the server-backed store later). */
export function setAudioStore(store: AudioStore | null): void { current = store; }
