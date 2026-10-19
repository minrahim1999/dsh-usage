/* Native Settings contribution. Aggregate-only owner RPC; no build or production dependencies. */
window.__ModuleLoader__.load({id:'dsh-usage',factory(require) {
  const React=require('react');const h=React.createElement;
  const inject=['slots','connection'];
  const css=`.dsh-usage{color:var(--dsw-alias-label-primary,inherit);font:inherit;font-size:13px;padding:24px;max-width:960px;margin:auto;box-sizing:border-box;-webkit-app-region:no-drag}.dsh-usage *{box-sizing:border-box}.dsh-usage h1{font-size:22px;font-weight:600;margin:0 0 6px}.dsh-usage h2{font-size:15px;margin:0}.dsh-usage p{line-height:1.6}.dsh-usage-head,.dsh-usage-chart-head{display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}.dsh-usage-controls{display:flex;gap:5px;align-items:center;flex-wrap:wrap}.dsh-usage button,.dsh-usage select{font:inherit;color:inherit;background:var(--dsw-alias-bg-base,transparent);border:1px solid var(--dsw-alias-border-l3,#8885);border-radius:6px;padding:6px 10px;max-width:100%}.dsh-usage button{cursor:pointer}.dsh-usage button[aria-pressed=true]{background:var(--dsw-alias-bg-l2,#8882);font-weight:600}.dsh-usage :focus-visible{outline:2px solid #629fdf;outline-offset:3px}.dsh-usage-note{opacity:.72;font-size:12px;line-height:1.6}.dsh-usage-metrics{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:24px 0}.dsh-usage-metrics>div,.dsh-usage-panel{border:1px solid var(--dsw-alias-border-l3,#8884);border-radius:10px;padding:16px}.dsh-usage-metrics dt{font-size:12px;opacity:.72}.dsh-usage-metrics dd{margin:8px 0 0;font-size:25px;font-weight:550;font-variant-numeric:tabular-nums}.dsh-usage-panel{margin:16px 0}.dsh-usage-bars{list-style:none;padding:0;margin:20px 0 0}.dsh-usage-bar-label{display:flex;gap:12px;justify-content:space-between;margin:14px 0 6px}.dsh-usage-bar-label span:first-child{overflow-wrap:anywhere}.dsh-usage-bar-label span:last-child{white-space:nowrap;font-variant-numeric:tabular-nums}.dsh-usage-track{height:9px;background:#8882;border-radius:4px;overflow:hidden}.dsh-usage-fill{height:100%;background:var(--dsw-alias-text-accent,#6486a8);border-radius:4px}.dsh-usage-calendar{display:flex;gap:9px;margin:20px 0 8px;overflow-x:auto;padding:3px}.dsh-usage-weekdays{display:grid;grid-template-rows:repeat(7,12px);gap:4px;font-size:10px;line-height:12px;flex-shrink:0}.dsh-usage-heatmap{display:grid;grid-auto-flow:column;grid-template-rows:repeat(7,12px);grid-auto-columns:12px;gap:4px}.dsh-usage-day{border-radius:3px}.dsh-usage-legend{display:flex;align-items:center;gap:5px;justify-content:flex-end;font-size:11px}.dsh-usage-legend i{height:12px;width:12px;border-radius:3px}.dsh-usage-status{border-left:3px solid #b59660;padding:8px 12px;margin:12px 0}@media(max-width:560px){.dsh-usage{padding:16px}.dsh-usage-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.dsh-usage-panel{padding:12px}.dsh-usage-chart-head{align-items:flex-start;flex-direction:column}.dsh-usage-bar-label{font-size:12px}}`;
  const number=n=>new Intl.NumberFormat(undefined,{notation:'compact',maximumFractionDigits:1}).format(n);
  const exact=n=>new Intl.NumberFormat().format(n);
  const colors=['#87909b25','#9bbcab','#689d82','#367759','#195139'];
  function heatmap(summary,range,now,timeZone,model,metric) {
    const today=new Intl.DateTimeFormat('en-CA',{timeZone,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date(now));
    const end=Date.parse(today+'T00:00:00Z');const count=range==='7d'?7:range==='30d'?30:91;
    const days=new Map(summary.activity.map(row=>[row.date,row]));
    const values=Array.from({length:count},(_,i)=>{
      const date=new Date(end-(count-i-1)*86400000).toISOString().slice(0,10);const row=days.get(date);
      const selected=(row?.models??[]).filter(r=>model===''||r.model===model);
      return {date,value:selected.reduce((n,r)=>n+r[metric],0),missing:selected.reduce((n,r)=>n+(r.unreported??0),0)};
    });
    const max=Math.max(1,...values.map(r=>r.value));
    return values.map(({date,value,missing},i)=>{
      const label=`${date}: ${exact(value)} ${metric==='tokens'?'reported tokens':'assistant responses'} · ${model||'All models'}${missing?' · partial token coverage':''}`;
      return h('span',{key:date,'data-usage-day':date,className:'dsh-usage-day',role:'img',tabIndex:0,'aria-label':label,title:label,style:{gridRow:new Date(date+'T00:00:00Z').getUTCDay()+1,gridColumn:Math.floor((new Date(values[0].date+'T00:00:00Z').getUTCDay()+i)/7)+1,background:colors[value===0?0:Math.max(1,Math.ceil(value/max*4))]}});
    });
  }
  function validSnapshot(data) {
    const count=n=>typeof n==='number'&&Number.isFinite(n)&&n>=0;
    const model=r=>r&&typeof r.model==='string'&&count(r.tokens)&&count(r.responses)&&(r.unreported===undefined||count(r.unreported));
    if(!data||!Number.isFinite(data.generatedAt)||!Number.isFinite(new Date(data.generatedAt).getTime())||typeof data.timeZone!=='string'||(data.skipped!==undefined&&!count(data.skipped))||(data.listed!==undefined&&!count(data.listed)))return false;
    try{new Intl.DateTimeFormat('en-CA',{timeZone:data.timeZone}).format(new Date(data.generatedAt));}catch{return false;}
    return ['all','30d','7d'].every(key=>{
      const r=data.ranges?.[key];
      return r&&['sessions','messages','tokens','unreported','activeDays'].every(k=>count(r[k]))&&Array.isArray(r.models)&&r.models.every(model)&&Array.isArray(r.activity)&&r.activity.every(day=>day&&typeof day.date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(day.date)&&Number.isFinite(Date.parse(day.date+'T00:00:00Z'))&&Array.isArray(day.models)&&day.models.every(model));
    });
  }
  function createOverview(connection) {
    return function Overview() {
      const [state,setState]=React.useState({data:null,error:false});const [range,setRange]=React.useState('all');const [revision,refresh]=React.useState(0);
      const [metric,setMetric]=React.useState('tokens');const [model,setModel]=React.useState('');
      React.useEffect(()=>{
        let cancelled=false;
        const load=()=>Promise.resolve().then(()=>connection.rpc.call('/api','welcomeUsage/summary',{args:{}})).then(result=>{if(result?.ok!==true)throw new Error('Usage RPC failed');const data=result.value;if(!validSnapshot(data))throw new Error('Invalid usage snapshot');if(!cancelled)setState({data,error:false});}).catch(()=>{if(!cancelled)setState(old=>({...old,error:true}));});
        load();const interval=setInterval(load,60000);return ()=>{cancelled=true;clearInterval(interval);};
      },[revision]);
      const data=state.data;const summary=data?.ranges[range];
      const models=summary?[...summary.models].sort((a,b)=>b[metric]-a[metric]||a.model.localeCompare(b.model)):[];
      const selectedModel=models.some(r=>r.model===model)?model:'';
      const max=Math.max(1,...models.map(row=>row[metric]));
      const units=metric==='tokens'?'reported tokens':'assistant responses';
      return h('section',{className:'dsh-usage','aria-label':'Usage'},
        h('style',null,css),
        h('div',{className:'dsh-usage-head'},h('div',null,h('h1',null,'Usage'),h('div',{className:'dsh-usage-note'},'Your locally recorded model activity')),h('div',{className:'dsh-usage-controls','aria-label':'Usage period'},...['all','30d','7d'].map(key=>h('button',{type:'button',key,'aria-pressed':range===key,onClick:()=>setRange(key)},key==='all'?'All':key)),h('button',{type:'button',onClick:()=>refresh(n=>n+1)},'Refresh'))),
        state.error?h('div',{role:'status',className:'dsh-usage-status'},'Usage unavailable. ',data?'Showing the last successful snapshot. ':null,h('button',{type:'button',onClick:()=>refresh(n=>n+1)},'Retry')):null,
        !summary?h('p',{role:'status'},state.error?'No usage data loaded.':'Reading local records…'):h(React.Fragment,null,
          h('dl',{className:'dsh-usage-metrics'},...['Recorded tokens','Sessions','Messages','Active days'].map((name,i)=>{const value=[summary.tokens,summary.sessions,summary.messages,summary.activeDays][i];return h('div',{key:name},h('dt',null,name),h('dd',{title:exact(value),'aria-label':`${name}: ${exact(value)}`},number(value)));})),
          summary.unreported?h('div',{role:'status',className:'dsh-usage-status'},`${exact(summary.unreported)} assistant records lack complete token usage; token totals are partial.`):null,
          data.skipped?h('div',{role:'status',className:'dsh-usage-status'},`${exact(data.skipped)} of ${exact(data.listed)} sessions unreadable; all totals are partial.`):null,
          !summary.sessions?h('p',{role:'status'},'No recorded activity in this period.'):null,
          h('section',{className:'dsh-usage-panel','aria-label':'Model usage bar chart'},
            h('div',{className:'dsh-usage-chart-head'},h('h2',null,'Model usage'),h('label',null,'Measure ',h('select',{'aria-label':'Chart metric',value:metric,onChange:e=>setMetric(e.target.value)},h('option',{value:'tokens'},'Reported tokens'),h('option',{value:'responses'},'Assistant responses')))),
            h('p',{className:'dsh-usage-note'},`Sorted by ${units}. Bars are relative to the most-used model in this period.`),
            models.length?h('ul',{className:'dsh-usage-bars'},...models.map(row=>h('li',{key:row.model,'data-model-bar':row.model},h('div',{className:'dsh-usage-bar-label'},h('span',null,row.model),h('span',{title:`${exact(row.tokens)} reported tokens · ${exact(row.responses)} assistant responses`},`${number(row[metric])} ${units}${row.unreported?' · partial':''}`)),h('div',{className:'dsh-usage-track',role:'meter','aria-label':`${row.model}: ${units}`,'aria-valuemin':0,'aria-valuemax':max,'aria-valuenow':row[metric],'aria-valuetext':`${exact(row[metric])} ${units}`},h('div',{className:'dsh-usage-fill',style:{width:`${row[metric]/max*100}%`}}))))):h('p',{className:'dsh-usage-note'},'No recorded assistant responses in this period.'),
            models.some(r=>r.model==='Unknown model')?h('p',{className:'dsh-usage-note'},'Unknown model: no recorded request model provenance. No model is guessed.'):null),
          h('section',{className:'dsh-usage-panel','aria-label':'Daily model activity'},
            h('div',{className:'dsh-usage-chart-head'},h('h2',null,'Daily model activity'),h('label',null,'Model ',h('select',{'aria-label':'Heatmap model',value:selectedModel,onChange:e=>setModel(e.target.value)},h('option',{value:''},'All models'),...summary.models.map(row=>h('option',{key:row.model,value:row.model},row.model))))),
            h('p',{className:'dsh-usage-note'},`${range==='all'?'Latest 13 weeks (91 days); totals above are all time':range==='30d'?'Last 30 calendar days':'Last 7 calendar days'} · ${data.timeZone} · ${units}`),
            h('div',{className:'dsh-usage-calendar'},h('div',{className:'dsh-usage-weekdays','aria-hidden':true},...['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=>h('span',{key:d},d))),h('div',{className:'dsh-usage-heatmap','aria-label':'Daily usage heatmap'},...heatmap(summary,range,data.generatedAt,data.timeZone,selectedModel,metric))),
            h('div',{className:'dsh-usage-legend','aria-label':'Color intensity: less to more usage'},'Less',...colors.map(color=>h('i',{key:color,'aria-hidden':true,style:{background:color}})),'More'),
            h('p',{className:'dsh-usage-note'},'Focus or hover a day for exact values. Calendar rows run Sunday–Saturday; blank cells are outside the selected period. Zero reported tokens may mean missing usage.')),
          h('p',{className:'dsh-usage-note'},'Sessions and active days include recorded commands. Messages count user + assistant records, including autonomous rounds; charts count assistant responses, not requests. Inherited fork history is excluded. Tokens use reported total or complete input + output and include repeated context; auxiliary activity may be absent. Not account quota or cost.'),
          h('p',{className:'dsh-usage-note'},`Local snapshot · ${new Date(data.generatedAt).toLocaleString(undefined,{timeZone:data.timeZone})} (${data.timeZone}) · refreshes every minute`)
        )
      );
    };
  }
  function apply(ctx) {
    const Overview=createOverview(ctx.connection);
    ctx.slots.inject('settings.section',()=>ctx.slots.register({name:'settings.section',id:'usage',order:11,label:'Usage'},Overview));
  }
  return {inject,apply};
}});
