import { readdir, readFile } from 'node:fs/promises';
import { join, relative, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { TextDecoder } from 'node:util';
import { inspectPath, inspectText } from '../src/public-safety-policy.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const decoder = new TextDecoder('utf-8', { fatal: true });
const problems = [];
let fileCount = 0;

async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const file = join(dir, entry.name);
    const rel = relative(root, file).replaceAll('\\', '/');
    if (rel === '.git' && entry.isDirectory()) continue;
    if (entry.isSymbolicLink()) {
      problems.push(rel + ': symlinks are not permitted');
      continue;
    }
    if (entry.isDirectory()) {
      const pathProblems = inspectPath(rel + '/placeholder.txt');
      if (pathProblems.length) {
        problems.push(...pathProblems.map(msg => rel + ': ' + msg));
        continue;
      }
      await walk(file);
    } else if (entry.isFile()) {
      fileCount++;
      problems.push(...inspectPath(rel).map(msg => rel + ': ' + msg));
      const buf = await readFile(file);
      if (buf.length > 131072) {
        problems.push(rel + ': file too large for public isolated QA');
        continue;
      }
      if (buf.includes(0)) {
        problems.push(rel + ': binary bytes not permitted');
        continue;
      }
      try {
        const contents = decoder.decode(buf);
        problems.push(...inspectText(rel, contents).map(msg => rel + ': ' + msg));
      } catch {
        problems.push(rel + ': invalid UTF-8');
      }
    } else {
      problems.push(rel + ': unsupported filesystem entry');
    }
  }
}

await walk(root);
if (problems.length) {
  console.error('Public content audit FAILED (' + problems.length + ' findings)');
  for (const p of problems) console.error('- ' + p);
  process.exitCode = 1;
} else {
  console.log('Public content audit passed for ' + fileCount + ' independent text files.');
}
