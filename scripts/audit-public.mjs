import { readdir, readFile } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const forbiddenSegments = new Set(['clinical', 'patients', 'records', 'exports', 'backups', 'secrets', 'credentials', 'supabase', 'workers', '.git', 'node_modules']);
const forbiddenFiles = [/^\.env(?:\.|$)/i, /^\.dev\.vars$/i, /^wrangler(?:\.|$)/i, /\.pem$/i, /\.p12$/i, /\.sqlite(?:3)?$/i, /\.db$/i, /(?:patient|payment)-export/i];

const patterns = [
  ['GitHub token shape', /(?:gh[pousr]_)[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{16,}/],
  ['Cloudflare token shape', /cfat_[A-Za-z0-9]{16,}/],
  ['API key shape', /sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}|sb_secret_[A-Za-z0-9]{10,}/],
  ['private key block', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['Sudanese phone number', /(?:\+?249)[\s-]?[19][\d\s-]{8,11}/],
  ['non-demo mailbox', /\b[A-Z0-9._%+-]+@(?!example\.(?:test|invalid)\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ['real-world production endpoint', /https?:\/\/(?!example\.(?:test|invalid)\b|github\.com\b|www\.w3\.org\b|nodejs\.org\b)[A-Za-z0-9.-]+\.(?:com|net|org|io|sd)\b/i],
];

async function walk(dir) {
  const out=[];
  for (const entry of await readdir(dir,{withFileTypes:true})) {
    const path = join(dir,entry.name);
    const rel = relative(root,path).split('\\').join('/');
    const seg=rel.split('/');
    if (entry.isSymbolicLink()) throw Error('Symbolic link forbidden: ' + rel);
    if (seg.some(s=>forbiddenSegments.has(s))) {
      if (entry.name === '.git' && rel === '.git') continue;
      throw Error('Forbidden directory or file: ' + rel);
    }
    if (forbiddenFiles.some(rx=>rx.test(entry.name))) throw Error('Forbidden filename: ' + rel);
    if (entry.isDirectory()) out.push(...await walk(path));
    else if (entry.isFile()) out.push({path,rel});
    else throw Error('Unsupported file type: ' + rel);
  }
  return out;
}

const errors=[];
const files=await walk(root);
for (const {path,rel} of files) {
  const bytes=await readFile(path);
  if (bytes.includes(0)) {errors.push(rel + ': binary content forbidden');continue;}
  const contents=bytes.toString('utf8');
  for (const [label,rx] of patterns) if(rx.test(contents))errors.push(rel + ': ' + label);
}
if (errors.length) {
  console.error('Public content audit FAILED');
  for (const err of errors)console.error('- ' + err);
  process.exitCode=1;
} else {
  console.log('Public content audit passed: ' + files.length + ' text files scanned, no detected secrets or identifiers.');
}
