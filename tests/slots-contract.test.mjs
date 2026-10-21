import test from 'node:test';
import assert from 'node:assert/strict';
import { overlaps, checkSlot } from '../src/slots-contract.mjs';

test('adjacent appointments do not overlap', () => {
  assert.equal(overlaps({start: 0,end: 45},{start: 45,end: 90}), false);
});
test('a one-minute intersection is a conflict', () => {
  assert.equal(overlaps({start: 0,end: 45},{start: 44,end: 90}), true);
});
test('nested appointment overlaps', () => {
  assert.equal(overlaps({start: 0,end: 100},{start: 20,end: 40}), true);
});
test('non-overlapping slot is eligible but never reserved', () => {
  assert.deepEqual(checkSlot({start: 90,end: 135}, [{start: 0,end: 45}]), {available:true,reserved:false});
});
test('exact duplicate booking conflicts', () => {
  assert.equal(checkSlot({start: 0,end: 45}, [{start: 0,end: 45}]).available, false);
});
test('invalid or zero-length intervals are not valid', () => {
  assert.throws(() => checkSlot({start: 10,end: 10}, []));
  assert.throws(() => checkSlot({start: 15,end: 10}, []));
  assert.throws(() => overlaps({start: NaN,end: 10},{start:0,end:10}));
});
