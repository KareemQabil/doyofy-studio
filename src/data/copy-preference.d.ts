import type { Dialect } from '../domain/copy';
export function currentDialect(): Dialect;
export function setDialect(dialect: Dialect): void;
export function subscribeDialect(changed: () => void): () => void;
