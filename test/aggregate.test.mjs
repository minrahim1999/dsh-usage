import test from 'node:test';
import assert from 'node:assert/strict';
import { aggregate } from '../src/aggregate.mjs';
const time = Date.parse('2026-10-18T04:00:00Z');
const event = (type, data = {}, when = time) => ({type, data, time: when});
test('daily model aggregates preserve unknown provenance and missing token coverage',()=>{
 const r=aggregate([{events:[event('assistant/message',{}),event('request/header',{header:{config:{provider:'p',model:'m'}}}),event('assistant/message',{usage:{totalTokens:7}})]}],{now:time,timeZone:'UTC'});
 assert.deepEqual(r.ranges.all.activity[0].models,[{model:'Unknown model',tokens:0,responses:1,unreported:1},{model:'p / m',tokens:7,responses:1,unreported:0}]);
 assert.equal(r.ranges.all.models.find(m=>m.model==='Unknown model').unreported,1);
});
test('calendar filters use the Host timezone across DST and exclude the day before each window',()=>{
 const now=Date.parse('2026-11-02T04:30:00Z'); // Still Nov 1 in New York after DST ends.
 const r=aggregate([{events:[
  event('user/message',{},Date.parse('2026-10-26T04:00:00Z')),
  event('user/message',{},Date.parse('2026-10-25T04:00:00Z')),
  event('user/message',{},Date.parse('2026-10-03T04:00:00Z')),
  event('user/message',{},Date.parse('2026-10-02T04:00:00Z')),
  event('command/run',{},now)
 ]}],{now,timeZone:'America/New_York'});
 assert.equal(r.ranges['7d'].messages,1);assert.equal(r.ranges['7d'].activeDays,2);
 assert.equal(r.ranges['30d'].messages,3);assert.equal(r.ranges.all.messages,4);
 assert.equal(r.ranges['7d'].activity.at(-1).date,'2026-11-01');
});
test('folds recorded activity, tokens and actual request model without exposing content', () => {
  const result = aggregate([{events: [
    event('request/header', {header:{config:{provider:'fixture', model:'actual-model'}}}),
    event('user/message', {content:'PRIVATE'}),
    event('assistant/message', {usage:{inputTokens:100,outputTokens:20,totalTokens:120}, message:{content:'PRIVATE'}}),
  ]}], {now:time, timeZone:'Asia/Kuala_Lumpur'});
  assert.equal(result.ranges.all.sessions,1);
  assert.equal(result.ranges.all.messages,2);
  assert.equal(result.ranges.all.tokens,120);
  assert.equal(result.ranges.all.activeDays,1);
  assert.equal(result.ranges.all.topModel,'fixture / actual-model');
  assert.equal(JSON.stringify(result).includes('PRIVATE'),false);
});
test('excludes inherited and future activity; calendar windows deduplicate sessions and preserve unknown usage',()=>{
 const old=Date.parse('2026-09-01T04:00:00Z');
 const result=aggregate([{inheritedEventCount:1,events:[
  event('assistant/message',{usage:{totalTokens:999}}),
  event('assistant/message',{usage:{inputTokens:9,outputTokens:1}},old),
  event('assistant/message',{}),
  event('command/run',{}),
  event('assistant/message',{usage:{totalTokens:500}},time+1),
 ]},{events:[event('model/selection',{provider:'not-used',model:'not-used'})]}],{now:time,timeZone:'Asia/Kuala_Lumpur'});
 assert.equal(result.ranges.all.sessions,1);assert.equal(result.ranges.all.messages,2);
 assert.equal(result.ranges.all.tokens,10);assert.equal(result.ranges.all.activeDays,2);
 assert.equal(result.ranges['7d'].messages,1);assert.equal(result.ranges['30d'].messages,1);
 assert.equal(result.ranges['7d'].unreported,1);assert.equal(result.ranges.all.topModel,'Unknown model');
});
