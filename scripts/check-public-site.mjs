import { probePublicPages } from '../src/public-site-smoke.mjs';

try {
  const results = await probePublicPages();
  for (const r of results) console.log(r.path + ': HTTP ' + r.status + ' ' + (r.healthy ? 'OK' : 'FAIL'));
  if (results.some(x => !x.healthy)) process.exitCode = 1;
} catch (e) {
  // No response bodies, URLs or request details are logged.
  console.error('Anonymous public page availability check failed: ' + e.name);
  process.exitCode = 1;
}
