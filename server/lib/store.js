import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const base = path.join(__dirname, '..', '..', 'data');

export function readJSON(file) {
  const p = path.join(base, file);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

export function writeJSON(file, data) {
  const p = path.join(base, file);
  fs.writeFileSync(p, JSON.stringify(data, null, 2), 'utf8');
}
