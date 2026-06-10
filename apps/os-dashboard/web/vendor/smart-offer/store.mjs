// Einfache JSON-Datei-Persistenz — bewusst ohne Datenbank, damit das System
// ohne Installation läuft. Bei Bedarf später gegen SQLite/CRM austauschbar.

import fs from 'node:fs';
import path from 'node:path';

export class JsonStore {
  constructor(dir) {
    this.dir = dir;
    fs.mkdirSync(dir, { recursive: true });
  }

  filePath(name) {
    return path.join(this.dir, `${name}.json`);
  }

  load(name, fallback) {
    const file = this.filePath(name);
    if (!fs.existsSync(file)) return structuredClone(fallback);
    try {
      return JSON.parse(fs.readFileSync(file, 'utf8'));
    } catch {
      return structuredClone(fallback);
    }
  }

  save(name, data) {
    const file = this.filePath(name);
    const tmp = file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(data, null, 2));
    fs.renameSync(tmp, file);
  }
}
