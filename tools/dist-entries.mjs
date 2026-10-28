// The built entry files (content-hashed in production): dist/index.html is the source of truth.
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from './lib.mjs';
export function distEntries() {
  const html = fs.readFileSync(path.join(ROOT, 'dist', 'index.html'), 'utf8');
  const find = (re, plain) => html.match(re)?.[1] ?? plain;
  return { app: find(/src="(app(?:-[A-Z0-9]+)?\.js)"/, 'app.js'), styles: find(/href="(styles(?:-[A-Z0-9]+)?\.css)"/, 'styles.css'), ui: find(/href="(ui(?:-[A-Z0-9]+)?\.css)"/, 'ui.css') };
}
