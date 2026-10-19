import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import {createRequire} from 'node:module';
import {JSDOM} from 'jsdom';
const require=createRequire('/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/package.json');
test('selected native Settings Usage renders loading, post-RPC metrics and period filters',async()=>{
 const dom=new JSDOM('<!doctype html><div id="root"></div>',{url:'http://localhost',pretendToBeVisual:true});
 const context=vm.createContext({console,window:dom.window,document:dom.window.document,navigator:dom.window.navigator,MutationObserver:dom.window.MutationObserver,HTMLElement:dom.window.HTMLElement,Element:dom.window.Element,Node:dom.window.Node,Text:dom.window.Text,Document:dom.window.Document,DocumentFragment:dom.window.DocumentFragment,setTimeout,clearTimeout,setInterval,clearInterval,queueMicrotask,requestAnimationFrame:dom.window.requestAnimationFrame.bind(dom.window),cancelAnimationFrame:dom.window.cancelAnimationFrame.bind(dom.window),URL,AbortController,TextEncoder,TextDecoder,performance});
 const dir=path.join(path.dirname(require.resolve('@deepseek-ai/dsh-web-frontend/package.json')),'dist/assets');
 const cache=new Map();
 async function load(file){if(cache.has(file))return cache.get(file);let source=fs.readFileSync(file,'utf8');if(source.includes('function SZ()'))source=source.slice(0,source.indexOf('const Ms=globalThis.dshDesktopBoot'))+';export {SZ};';const m=new vm.SourceTextModule(source,{context,identifier:file});cache.set(file,m);await m.link(spec=>load(path.resolve(path.dirname(file),spec)));return m;}
 const file=fs.readdirSync(dir).find(f=>/^index-.*\.js$/.test(f));const main=await load(path.join(dir,file));await main.evaluate();
 const modules=main.namespace.SZ();let renderer,plugin;
 context.window.__ModuleLoader__={load(spec){const result=spec.factory(id=>modules[id]);if(spec.id==='@deepseek-ai/dsh-client-ui-renderer')renderer=result;else plugin=result;}};
 vm.runInContext(fs.readFileSync(require.resolve('@deepseek-ai/dsh-client-ui-renderer/client'),'utf8'),context);
 console.log('renderer exports',Object.keys(renderer));
 vm.runInContext(fs.readFileSync(require.resolve('@deepseek-ai/dsh-client-ui-settings-general/client'),'utf8').replace('return module.exports;','module.exports.SettingsPanel=SettingsPanel;return module.exports;'),context);
 const SettingsPanel=plugin.SettingsPanel;
 vm.runInContext(fs.readFileSync(new URL('../client.js',import.meta.url),'utf8'),context);
 const {Context}=modules['@deepseek-ai/cordis'];const ctx=new Context();await ctx.plugin(renderer).await();
 console.log('slots',!!ctx.slots);
 const sessionSnapshot={ctx,key:undefined};
 ctx.slots.installScope('session',{current:{getSnapshot:()=>sessionSnapshot,subscribe:()=>()=>{}}});
 ctx.slots.register({name:'root',children:Object.fromEntries(['section','header','action','close'].map(name=>['settings.'+name,{kind:'list',scope:'root'}]))},({renderSlot})=>modules.react.createElement(SettingsPanel,{renderSlot,rows:[{id:'usage',label:'Usage'}],activeId:'usage',onSelect:()=>{},onClose:()=>{}}));
 let resolveRpc;const response=new Promise(resolve=>{resolveRpc=resolve;});
 plugin.apply({connection:{rpc:{call:()=>response}},slots:ctx.slots});
 const React=modules.react;const root=modules['react-dom/client'].createRoot(dom.window.document.getElementById('root'));
 root.render(ctx.slots.renderSlot('root',{}));
 await new Promise(r=>setTimeout(r,30));
 assert.equal(dom.window.document.querySelector('section.dsh-usage h1')?.textContent,'Usage');
 assert.match(dom.window.document.querySelector('section.dsh-usage').textContent,/Reading local records/);
 try {
 const {aggregate}=await import('../src/aggregate.mjs');
 const now=Date.parse('2026-10-19T04:00:00Z');
 const snapshot=process.env.DSH_USAGE_SNAPSHOT ? JSON.parse(fs.readFileSync(process.env.DSH_USAGE_SNAPSHOT,'utf8')) : aggregate([{events:[{type:'request/header',data:{header:{config:{provider:'fixture',model:'native'}}}},{type:'assistant/message',time:now,data:{usage:{totalTokens:120}}}]}],{now,timeZone:'Asia/Kuala_Lumpur'});
 // The installed connection carrier returns Gateway's result envelope, not its value.
 resolveRpc({ok:true,value:snapshot});
 await new Promise(r=>setTimeout(r,100));
 assert.equal(dom.window.document.querySelector('[data-slot-error]'),null);
 assert.match(dom.window.document.body.textContent,/Recorded tokens/);
 assert.equal(dom.window.document.querySelectorAll('[data-usage-day]').length,91);
 for(const [period,days] of [['30d',30],['7d',7]]) {
 [...dom.window.document.querySelectorAll('.dsh-usage button')].find(b=>b.textContent===period).click();
 await new Promise(r=>setTimeout(r,30));
 assert.equal(dom.window.document.querySelectorAll('[data-usage-day]').length,days);
 assert.equal(dom.window.document.querySelector('[data-slot-error]'),null);
 }
 assert.equal(dom.window.document.querySelectorAll('[role="meter"]').length,snapshot.ranges['7d'].models.length);
 } finally {root.unmount();await new Promise(r=>setTimeout(r,20));await ctx.fiber.dispose();dom.window.close();}
});
