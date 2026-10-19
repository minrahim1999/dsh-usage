import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync,readdirSync,mkdtempSync,mkdirSync,symlinkSync,rmSync,existsSync,writeFileSync,realpathSync} from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {fileURLToPath} from 'node:url';
import vm from 'node:vm';

// Execute the installed frontend's unmodified SlotCore block: it is bundled,
// not exported as a standalone Node package in this Desktop installation.
function installedSlotCore() {
 const dir=new URL('./dist/assets/', 'file://'+require.resolve('@deepseek-ai/dsh-web-frontend/package.json'));
 for(const file of readdirSync(dir).filter(file=>file.endsWith('.js'))) {
  const source=readFileSync(new URL(file,dir),'utf8');
  const exported=source.match(/SlotCore:([\w$]+),SlotOwnershipError:/);
  if(!exported)continue;
  const start=source.lastIndexOf('function ',source.indexOf('var '+exported[1]+'=class'));
  const end=source.lastIndexOf(';const ',exported.index);
  assert.ok(start>=0&&end>start,'native SlotCore block located');
  return vm.runInNewContext(source.slice(start,end+1)+';'+exported[1],{queueMicrotask,console});
 }
 throw new Error('Installed frontend SlotCore export missing');
}

test('browser plugin registers and disposes through installed native SlotCore',()=>{
 const SlotCore=installedSlotCore();const core=new SlotCore();
 const releaseOwner=core.registerFactory({name:'fixture.settings',scope:'root',children:{'settings.section':{kind:'list',scope:'root'}}},()=>null);
 const releaseNeighbor=core.register({name:'settings.section',id:'models',order:10},()=>null);
 const releasePlugins=core.register({name:'settings.section',id:'plugins',order:15},()=>null);
 assert.throws(()=>core.register({name:'settings.section'},()=>null),/requires options.id/,'native validation is active');
 let plugin;const releases=[];
 vm.runInNewContext(readFileSync(new URL('../client.js',import.meta.url),'utf8'),{window:{__ModuleLoader__:{load(spec){plugin=spec.factory(()=>({createElement(){}}));}}}});
 try {
  plugin.apply({connection:{},slots:{inject(name,setup){assert.equal(name,'settings.section');releases.push(setup());},register:core.register.bind(core)}});
  const rows=core.entriesOfSlot('settings.section');
  assert.equal(rows.length,3);
  assert.deepEqual(Array.from(rows,row=>row.options.id),['models','usage','plugins']);
  assert.equal(rows[1].options.order,11);
  assert.equal(rows[1].options.label,'Usage');
  assert.equal(typeof rows[1].component,'function');
  for(const release of releases)release();
  assert.deepEqual(Array.from(core.entriesOfSlot('settings.section'),row=>row.options.id),['models','plugins']);
 } finally {releasePlugins();releaseNeighbor();releaseOwner();}
});
const require = createRequire('/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/package.json');
const {Context,Service} = require('@deepseek-ai/cordis');
const {default:Gateway} = require('@deepseek-ai/dsh-api-gateway');
const {default:Typert} = require('@deepseek-ai/dsh-typert-registry');
const {default:RemoteAccess} = require('@deepseek-ai/dsh-api-remote-access');
const {Peer} = require('@deepseek-ai/dsh-client-connection');
const {UsageOverview} = await import('../src/host.mjs');
const {default:Loader}=require('@deepseek-ai/cordis-plugin-loader');
test('installed Settings declares additive root sections and Models precedes Usage',()=>{
 const source=readFileSync(require.resolve('@deepseek-ai/dsh-client-ui-settings-general/client'),'utf8');
 assert.match(source,/"settings\.section":\s*\{\s*kind: "list",\s*scope: "root"/);
 const models=readFileSync(require.resolve('@deepseek-ai/dsh-client-ui-settings-models/client'),'utf8');
 assert.match(models,/id: "models",\s*order: 10/);
 const manifest=JSON.parse(readFileSync(new URL('../package.json',import.meta.url),'utf8'));
 assert.deepEqual(manifest.dsh.client.inject,['@deepseek-ai/dsh-client-connection','@deepseek-ai/dsh-client-ui-settings-general']);
});
test('installed welcome outlet remains additive, session-scoped and hero-only',()=>{
 const source=readFileSync(require.resolve('@deepseek-ai/dsh-client-ui-conversation/client'),'utf8');
 assert.match(source,/"conversation\.hero\.options":\s*\{\s*kind: "list",\s*scope: "session"/);
 assert.match(source,/hero && heroWorkspaceRow/);
 assert.match(source,/sessionId === void 0 \? null :[\s\S]{0,250}renderSlot\("conversation\.hero\.options"/);
 const hero=source.slice(source.indexOf('function HeroShell('),source.indexOf('function ConversationSessionView('));
 assert.match(hero,/jsx\)\("div", \{ className: HeroShell_module_css_default\.body \}\)/,'headline body is an empty native div, not an additive outlet');
 assert.deepEqual(Array.from(hero.matchAll(/renderSlot\("([^"]+)"/g),match=>match[1]),['conversation.hero.brand.mark']);
 for(const name of ['conversation.hero.brand.mark','conversation.hero.workspace','conversation.hero.agentPreset','conversation.composer.bar']) {
  const escaped=name.replaceAll('.','\\.');
  assert.match(source,new RegExp('"'+escaped+'":\\s*\\{\\s*kind: "single"'));
 }
 const layout=readFileSync(require.resolve('@deepseek-ai/dsh-client-ui-layout/client'),'utf8');
 assert.match(layout,/"main":\s*\{\s*kind: "keyed",\s*scope: "root"/);
 assert.match(layout,/"shell\.overlay":\s*\{\s*kind: "list",\s*scope: "root"/);
});
test('installed Gateway invokes source-only owner RPC and denies non-owner',async(t)=>{
 const ctx=new Context(); const fibers=[];
 const mount=(plugin,config)=>{const fiber=ctx.plugin(plugin,config);fibers.push(fiber);return fiber;};
 mount(class extends Service{constructor(c){super(c,'sessions');}list(){return []}});
 mount(class extends Service{constructor(c){super(c,'sessionPersistence');}async list(){return []}});
 await mount(Typert).await();await mount(RemoteAccess).await();await mount(Gateway).await();
 const root=mkdtempSync(path.join(os.tmpdir(),'dsh-usage-release-'));
 const packageRoot=process.env.DSH_USAGE_FIXTURE_PACKAGE??fileURLToPath(new URL('../',import.meta.url));
 t.after(async()=>{await ctx.fiber.dispose();rmSync(root,{recursive:true,force:true});assert.equal(existsSync(root),false);});
 mkdirSync(path.join(root,'node_modules'));
 symlinkSync(packageRoot,path.join(root,'node_modules/dsh-usage'),'dir');
 writeFileSync(path.join(root,'package.json'),JSON.stringify({private:true,dependencies:{'dsh-usage':'link:'+packageRoot},dsh:{profile:{bundles:['dsh-usage']}}}));
 const boot=require('@deepseek-ai/dsh-app-boot');
 const anchor='/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/package.json';
 const profile=boot.loadProfileDirectory('usage-fixture',root,anchor);
 assert.equal(profile.skippedBundles.length,0);
 const warnings=[];
 const entries=boot.composeEntries([...profile.layers.map(l=>l.patches),profile.patches??[]],w=>warnings.push(w));
 assert.equal(warnings.length,0);
 assert.ok(entries.some(e=>e.id==='welcome-usage'&&e.name==='dsh-usage'),'native bundle composition selects release');
 await mount(Loader,{baseUrl:new URL('file://'+root+'/cordis.yml').href}).await();
 await ctx.loader.create({id:'fixture-welcome-usage',name:'dsh-usage'});
 await ctx.loader.await();
 assert.ok(ctx.loader.entries().some(entry=>entry.options.id==='fixture-welcome-usage'&&entry.fiber));
 assert.ok(ctx.typertGateway);assert.ok(ctx.welcomeUsage);
 await mount(require('@deepseek-ai/dsh-client-modules').default).await();
 assert.equal(ctx.clientModules.clientPath('dsh-usage'),realpathSync(path.join(packageRoot,'client.js')));
 const client=ctx.clientModules.graph().entries.find(row=>row.id==='dsh-usage');
 assert.ok(client,'installed client registry discovers linked browser module');
 const served=await ctx.clientModules.fetchBundle({method:'GET',url:client.url});
 assert.equal(served.status,200);
 const body=await served.text();
 assert.match(body,/settings\.section/);
 assert.doesNotMatch(body,/conversation\.hero\.options/);
 assert.deepEqual(Array.from(client.inject??client.dependencies??[]).sort(),['@deepseek-ai/dsh-client-connection','@deepseek-ai/dsh-client-ui-settings-general'].sort());
 console.log('Installed client entry:',JSON.stringify(client));
 const owner=new Peer(ctx,{principal:{kind:'owner'}});
 const result=await ctx.typertGateway.invokeRpc('welcomeUsage/summary',{args:{}},undefined,owner);
 assert.equal(result.ok,true,JSON.stringify(result));
 assert.equal(result.value.ranges.all.sessions,0);
 const guest=new Peer(ctx,{principal:{kind:'usage-fixture-guest'}});
 const denied=await ctx.typertGateway.invokeRpc('welcomeUsage/summary',{args:{}},undefined,guest);
 assert.equal(denied.ok,false);
 await guest.dispose();await owner.dispose();
 ctx.loader.remove('fixture-welcome-usage');await ctx.loader.await();
 assert.equal(ctx.loader.entries().some(entry=>entry.options.id==='fixture-welcome-usage'),false);
 assert.equal(ctx.welcomeUsage,undefined,'native removal releases the service');
 rmSync(path.join(root,'node_modules/dsh-usage'));
 assert.equal(existsSync(path.join(root,'node_modules/dsh-usage')),false);
 writeFileSync(path.join(root,'package.json'),JSON.stringify({private:true,dependencies:{},dsh:{profile:{bundles:[]}}}));
 console.log('Disposable install, activation, owner RPC, denial, deactivation and dependency removal verified');
 for(const fiber of fibers.reverse())await fiber.dispose();
});
