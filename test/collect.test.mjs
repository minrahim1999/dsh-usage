import test from 'node:test';
import assert from 'node:assert/strict';
import { collect } from '../src/collect.mjs';
test('uses live precedence, read-only cold handles, closes errors and strips private fields',async()=>{
 let closed=0,opened=0;
 const ctx={sessions:{list:()=>[{id:'same',inheritedEventCount:0,snapshotEvents:()=>[{type:'user/message',time:1,data:{content:'PRIVATE'}}]}]},sessionPersistence:{list:async()=>[{header:{id:'same'}},{header:{id:'cold'}},{header:{id:'bad'}}],open:async(id,access)=>{
  assert.equal(access,'read'); opened++;return {inheritedEventCount:0,read:async()=>{if(id==='bad')throw Error('PRIVATE');return {events:[{type:'assistant/message',time:2,data:{usage:{totalTokens:5},message:{content:'PRIVATE'}}}]};},close:async()=>closed++};
 }}};
 const result=await collect(ctx);
 assert.equal(opened,2);assert.equal(closed,2);assert.equal(result.sources.length,2);assert.equal(result.skipped,1);
 assert.equal(JSON.stringify(result).includes('PRIVATE'),false);
});
