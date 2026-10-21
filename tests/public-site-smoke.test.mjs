import test from 'node:test';
import assert from 'node:assert/strict';
import { probePublicPages, PUBLIC_PAGES } from '../src/public-site-smoke.mjs';

test('only three public informational pages are requested via GET', async () => {
  const hits = [];
  const fakeFetch = async (url, options) => {
    hits.push({url,options});
    return {status:200, body:{cancel:async()=>{}}};
  };
  const results = await probePublicPages(fakeFetch);
  assert.equal(results.length, 3);
  assert.deepEqual(results.map(x=>x.path), PUBLIC_PAGES);
  for(const h of hits) {
    assert.equal(new URL(h.url).host, 'www.drkhalidmentalhealth.com');
    assert.equal(h.options.method, 'GET');
    assert.equal(h.options.redirect, 'manual');
    assert.equal(h.options.credentials, 'omit');
    assert.equal(h.options.body, undefined);
    assert.equal(h.options.headers.Authorization, undefined);
  }
});
test('public booking redirect is observed but never followed', async () => {
  let count=0;
  const results=await probePublicPages(async()=>{count++;return{status:302,body:null}});
  assert.equal(count,3);
  assert.ok(results.every(x=>x.healthy===true));
});
test('a not-found page fails health without recording any response content', async () => {
  const results=await probePublicPages(async()=>({status:404,body:null}));
  assert.ok(results.every(x=>x.healthy===false));
  assert.ok(results.every(x=>Object.keys(x).join(',')==='path,status,healthy'));
});
test('internal server errors fail health', async () => {
  const results=await probePublicPages(async()=>({status:503,body:null}));
  assert.ok(results.every(x=>!x.healthy));
});
