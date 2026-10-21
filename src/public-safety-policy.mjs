/*
 * Additional static disclosure checks for the synthetic public repository.
 * This is a defense-in-depth lint gate, not a certification that any file is safe.
 */
const allowedRootFiles = new Set(['README.md', 'package.json', '.gitignore']);
const allowedRootFolders = new Set(['src', 'tests', 'scripts', 'fixtures', 'docs']);
const forbiddenSegments = new Set([
  'clinical', 'patients', 'records', 'exports', 'backups', 'secrets',
  'credentials', 'supabase', 'workers', 'node_modules', 'private', 'prod',
]);
const forbiddenFilenames = [
  /^\.env(?:\.|$)/i, /^\.dev\.vars$/i, /^wrangler(?:\.|$)/i,
  /\.pem$/i, /\.key$/i, /\.p12$/i, /\.sqlite(?:3)?$/i, /\.db$/i,
  /(?:patient|payment)-export/i, /(?:credential|secret|service-account)/i,
];
const riskyPatterns = [
  ['GitHub credential', /(?:gh[pousr]_)[A-Za-z0-9]{16,}|github_pat_[A-Za-z0-9_]{16,}/],
  ['Cloudflare credential', /cfat_[A-Za-z0-9]{16,}/],
  ['API credential', /sk-(?:proj-|svcacct-)?[A-Za-z0-9_-]{20,}|AIza[A-Za-z0-9_-]{30,}|sb_secret_[A-Za-z0-9]{10,}/],
  ['private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/],
  ['phone', /(?:\+?249)[\s-]?[19][\d\s-]{8,11}/],
  ['mailbox', /\b[A-Z0-9._%+-]+@(?!example\.(?:test|invalid)\b)[A-Z0-9.-]+\.[A-Z]{2,}\b/i],
  ['real endpoint', /https?:\/\/(?!example\.(?:test|invalid)\b|github\.com\b|www\.w3\.org\b|nodejs\.org\b)[A-Za-z0-9.-]+\.(?:com|net|org|io|sd)\b/i],
];

export function inspectPath(rel) {
  const problems = [];
  if (typeof rel !== 'string' || !rel || rel.startsWith('/') ||
      rel.includes('\\') || rel.includes('..') || !/^[A-Za-z0-9_.\/-]+$/.test(rel)) {
    return ['invalid relative path'];
  }
  const parts = rel.split('/');
  if (parts.some(x => !x)) return ['invalid path segment'];
  if (parts.some(x => forbiddenSegments.has(x.toLowerCase()))) problems.push('forbidden directory');
  if (parts.some(x => forbiddenFilenames.some(rx => rx.test(x)))) problems.push('forbidden filename');
  if (parts.length === 1) {
    if (!allowedRootFiles.has(rel)) problems.push('unexpected root file');
  } else if (parts[0] === '.github') {
    if (rel !== '.github/workflows/public-qa.yml') problems.push('unapproved workflow or metadata');
  } else if (!allowedRootFolders.has(parts[0])) {
    problems.push('unapproved directory');
  }
  if (!/\.(?:mjs|md|json|yml|yaml|txt)$/.test(rel) && !allowedRootFiles.has(rel)) {
    problems.push('unsupported file extension');
  }
  return problems;
}

export function inspectText(rel, text) {
  const problems = [];
  if (typeof text !== 'string') return ['non-text content'];
  for (const [label, rx] of riskyPatterns) {
    if (label === 'real endpoint' &&
        (rel === 'src/public-site-smoke.mjs' || rel === 'src/public-safety-policy.mjs')) {
      // The single explicitly public clinic hostname is permitted for read-only
      // checks. Other endpoint hosts remain forbidden.
      const allowed = 'https://www.drkhalidmentalhealth.com';
      const all = [...text.matchAll(new RegExp(rx.source, 'gi'))];
      for (const match of all) {
        const next = text.slice(match.index + match[0].length, match.index + match[0].length + 1);
        if (match[0] !== allowed || /[A-Za-z0-9_.-]/.test(next)) problems.push(label);
      }
    } else if (rx.test(text)) {
      problems.push(label);
    }
  }
  if (rel === '.github/workflows/public-qa.yml') {
    if (!text.includes('permissions:\n  contents: read')) problems.push('workflow permissions not read-only');
    const uses = [...text.matchAll(/^\s+- uses:\s*(\S+)/gm)].map(x => x[1]);
    if (uses.length !== 2 || uses[0] !== 'actions/checkout@v4' ||
        uses[1] !== 'actions/setup-node@v4') problems.push('unapproved workflow action');
    const runs = [...text.matchAll(/^\s+run:\s*(.+)$/gm)].map(x => x[1].trim());
    if (runs.length !== 3 || runs[0] !== 'npm test' ||
        runs[1] !== 'npm run audit:public' ||
        runs[2] !== 'npm run check:public-site') problems.push('unapproved workflow command');
    if (/pull_request_target|workflow_call|(?<![A-Za-z])secrets\s*\.|contents:\s*write|npm\s+publish|wrangler|deploy|curl\s|wget\s/i.test(text)) {
      problems.push('unsafe workflow operation');
    }
  }
  return problems;
}
