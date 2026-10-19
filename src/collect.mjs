/** Only calls supported session snapshot/list/read faces; never restores/attaches/writes. */
export async function collect(ctx) {
  const live = new Map(ctx.sessions.list().map(session=>[session.id,session]));
  const ids = new Set((await ctx.sessionPersistence.list()).map(row=>row.header.id));
  for (const id of live.keys()) ids.add(id);
  const sources=[];let skipped=0;
  for (const id of ids) {
    try {
      const session=live.get(id);
      if (session) sources.push(metadata(session.snapshotEvents(),session.inheritedEventCount));
      else {
        const handle=await ctx.sessionPersistence.open(id,'read');
        try { const {events}=await handle.read(0); sources.push(metadata(events,handle.inheritedEventCount)); }
        finally {await handle.close();}
      }
    } catch {skipped++;} // Unreadable logs are explicitly reported; never leak errors/content.
  }
  return {sources,skipped,listed:ids.size};
}
function metadata(events,inheritedEventCount=0) {
  // Preserve positions so the inherited-prefix exclusion stays exact.
  return {inheritedEventCount,events:events.map(event=>{
    const data=event.data??{};
    if(event.type==='request/header') return {type:event.type,time:event.time,data:{header:{config:{provider:data.header?.config?.provider,model:data.header?.config?.model}}}};
    return {type:event.type,time:event.time,data:event.type==='assistant/message'?{usage:data.usage}: {}};
  })};
}
