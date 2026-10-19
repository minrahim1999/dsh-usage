/** Pure metadata-only fold. No content, paths or session IDs leave this module. */
export function aggregate(sources, {now = Date.now(), timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone} = {}) {
  const fmt = new Intl.DateTimeFormat('en-CA', {timeZone, year:'numeric',month:'2-digit',day:'2-digit'});
  const day = t => fmt.format(new Date(t));
  const today = day(now);
  const days = new Map();
  sources.forEach((source, index) => {
    let model = null;
    source.events.forEach((event, offset) => {
      const data = event.data ?? {};
      if (event.type === 'request/header') {
        const config = data.header?.config;
        model = typeof config?.model === 'string' ? `${config.provider ?? 'unknown'} / ${config.model}` : null;
      }
      if (offset < (source.inheritedEventCount ?? 0)) return;
      if (!['user/message', 'assistant/message', 'command/run'].includes(event.type)) return;
      if (!Number.isFinite(event.time) || event.time < 0 || event.time > now) return;
      const date = day(event.time);
      const bin = days.get(date) ?? {sessions:new Set(),messages:0,tokens:0,unreported:0,models:new Map()};
      bin.sessions.add(index);
      if (event.type !== 'command/run') bin.messages++;
      if (event.type === 'assistant/message') {
        const u = data.usage;
        const valid = n => typeof n === 'number' && Number.isFinite(n) && n >= 0;
        const tokens = valid(u?.totalTokens) ? u.totalTokens : valid(u?.inputTokens) && valid(u?.outputTokens) ? u.inputTokens + u.outputTokens : null;
        bin.tokens += tokens ?? 0;
        if (tokens === null) bin.unreported++;
        const key = model ?? 'Unknown model';
        const row = bin.models.get(key) ?? {model:key, tokens:0, responses:0, unreported:0};
        if (tokens === null) row.unreported++;
        row.tokens += tokens ?? 0; row.responses++;
        bin.models.set(key,row);
      }
      days.set(date,bin);
    });
  });
  const ranges = {};
  for (const [key, count] of [['all',null],['30d',30],['7d',7]]) {
    // Calendar arithmetic is deliberately UTC on YYYY-MM-DD keys, not 24h local milliseconds (DST safe).
    const start = count === null ? null : new Date(Date.parse(today+'T00:00:00Z')-(count-1)*86400000).toISOString().slice(0,10);
    const selected = [...days].filter(([date]) => start === null || date >= start).sort(([a],[b])=>a.localeCompare(b));
    const sessions = new Set(); const models = new Map();
    let messages=0,tokens=0,unreported=0;
    for (const [,bin] of selected) {
      bin.sessions.forEach(id=>sessions.add(id)); messages+=bin.messages;tokens+=bin.tokens;unreported+=bin.unreported;
      for (const [name,row] of bin.models) {
        const total=models.get(name) ?? {model:name,tokens:0,responses:0,unreported:0};
        total.tokens+=row.tokens;total.responses+=row.responses;total.unreported+=row.unreported;models.set(name,total);
      }
    }
    const breakdown=[...models.values()].sort((a,b)=>b.tokens-a.tokens||b.responses-a.responses||a.model.localeCompare(b.model));
    ranges[key]={sessions:sessions.size,messages,tokens,unreported,activeDays:selected.length,topModel:breakdown[0]?.model??null,models:breakdown,activity:selected.map(([date,bin])=>({date,messages:bin.messages,activity:bin.messages||1,models:[...bin.models.values()]}))};
  }
  return {generatedAt:now,timeZone,ranges};
}
