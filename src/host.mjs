import {createRequire} from 'node:module';
import {aggregate} from './aggregate.mjs';
import {collect} from './collect.mjs';
// Reuse Desktop's exact Cordis singleton. Do not install a second framework copy.
// Override only when testing against a different explicit Desktop installation.
const require = createRequire(process.env.DSH_USAGE_INSTALL_ANCHOR ?? '/Applications/DeepSeek Harness.app/Contents/Resources/app.asar/dsh/package.json');
const {Remote,RemoteError,TypertRemoteService} = require('@deepseek-ai/dsh-typert-protocol');
const initializers=[];
export class UsageOverview extends TypertRemoteService {
  static inject=['sessions','sessionPersistence'];
  constructor(ctx) {
    super(ctx,'welcomeUsage');
    for (const init of initializers) init.call(this);
    this.cache={value:null,pending:null};
  }
  async summary() {
    if (this.ctx.invocation?.peer.principal.kind !== 'owner') throw new RemoteError('usage/denied','Owner access required');
    const cache=this.cache;
    if (cache.value && Date.now()-cache.value.generatedAt < 30000) return cache.value;
    if (!cache.pending) cache.pending=(async()=>{
      const {sources,skipped,listed}=await collect(this.ctx);
      const value={...aggregate(sources),skipped,listed};
      cache.value=value; return value;
    })().finally(()=>{cache.pending=null;});
    return cache.pending;
  }
}
// Standard stage-3 decorator initialization, without a build-time compiler dependency.
Remote(UsageOverview.prototype.summary,{kind:'method',name:'summary',static:false,private:false,addInitializer(fn){initializers.push(fn);}});
export default UsageOverview;
