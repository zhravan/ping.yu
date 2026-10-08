import { createGlobalMeasurement, getGlobalMeasurement } from "./globalping";

type Monitor={id:string;url:string;name:string|null;interval_seconds:number;active:number;created_at:string};
type RegionalResult={region:string|null;country:string|null;city:string|null;asn:number|null;network:string|null;status:string;http_status:number|null;resolved_address:string|null;dns_ms:number|null;tcp_ms:number|null;tls_ms:number|null;first_byte_ms:number|null;download_ms:number|null;total_ms:number|null;tls_authorized:number|null;tls_protocol:string|null;tls_cipher:string|null;tls_expires_at:string|null;tls_subject:string|null;tls_issuer:string|null;baseline_ms:number|null;anomaly:number;checked_at:string};
interface Env{DB:D1Database;PROBE_QUEUE:Queue<{monitorId:string}>;ASSETS:Fetcher}

function json(data:unknown,status=200){return new Response(JSON.stringify(data),{status,headers:{"content-type":"application/json; charset=utf-8","cache-control":"no-store"}})}
async function getMonitor(env:Env,id:string){return env.DB.prepare("SELECT id,url,name,interval_seconds,active,created_at FROM monitors WHERE id=?1").bind(id).first<Monitor>()}

async function startMeasurement(env:Env,monitor:Monitor){
  const existing=await env.DB.prepare("SELECT id,status,created_at,external_id FROM global_measurements WHERE monitor_id=?1 ORDER BY created_at DESC LIMIT 1").bind(monitor.id).first<{id:string;status:string;created_at:string;external_id:string|null}>();
  if(existing?.status==="in-progress"&&Date.now()-Date.parse(existing.created_at)<120000)return existing;
  const id=crypto.randomUUID(),now=new Date().toISOString(),created=await createGlobalMeasurement(monitor.url);
  await env.DB.prepare("INSERT INTO global_measurements (id,monitor_id,provider,external_id,status,created_at) VALUES (?,?,?,?,?,?)").bind(id,monitor.id,"globalping",created.id,"in-progress",now).run();
  return {id,status:"in-progress",created_at:now,external_id:created.id};
}

async function syncMeasurement(env:Env,gm:{id:string;monitor_id:string;external_id:string}){
  const measurement=await getGlobalMeasurement(gm.external_id);if(measurement.status==="in-progress")return;
  const checkedAt=measurement.updatedAt||new Date().toISOString();
  const history=await env.DB.prepare("SELECT region,total_ms FROM regional_results WHERE monitor_id=?1 AND total_ms IS NOT NULL ORDER BY checked_at DESC LIMIT 500").bind(gm.monitor_id).all<{region:string|null;total_ms:number|null}>();
  const sums=new Map<string,number>(),counts=new Map<string,number>();
  for(const x of history.results)if(x.region&&x.total_ms!=null){sums.set(x.region,(sums.get(x.region)||0)+x.total_ms);counts.set(x.region,(counts.get(x.region)||0)+1)}
  const stmts:D1PreparedStatement[]=[];
  for(const item of measurement.results){
    const p=item.probe,r=item.result,total=r.timings?.total??null,baseline=p.region&&counts.get(p.region)?sums.get(p.region)!/counts.get(p.region)!:null;
    const status=r.status!=="finished"?"down":(r.statusCode!=null&&r.statusCode<400?"up":"degraded");
    const anomaly=baseline!=null&&total!=null&&total>=Math.max(baseline*2.5,baseline+200)?1:0;
    stmts.push(env.DB.prepare("INSERT INTO regional_results (measurement_id,monitor_id,continent,region,country,city,asn,network,status,http_status,resolved_address,dns_ms,tcp_ms,tls_ms,first_byte_ms,download_ms,total_ms,tls_authorized,tls_protocol,tls_cipher,tls_expires_at,tls_subject,tls_issuer,baseline_ms,anomaly,checked_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)").bind(gm.id,gm.monitor_id,p.continent,p.region,p.country,p.city,p.asn,p.network,status,r.statusCode??null,r.resolvedAddress??null,r.timings?.dns??null,r.timings?.tcp??null,r.timings?.tls??null,r.timings?.firstByte??null,r.timings?.download??null,total,r.tls?.authorized==null?null:(r.tls.authorized?1:0),r.tls?.protocol??null,r.tls?.cipherName??null,r.tls?.expiresAt??null,r.tls?.subject?.CN??null,r.tls?.issuer?.CN??null,baseline,anomaly,checkedAt))
  }
  if(stmts.length)await env.DB.batch(stmts);
  await env.DB.prepare("UPDATE global_measurements SET status='finished',completed_at=?,error=NULL WHERE id=?").bind(checkedAt,gm.id).run();
}

async function syncLatest(env:Env,monitorId:string){
  const latest=await env.DB.prepare("SELECT id,monitor_id,status,created_at,completed_at,external_id,error FROM global_measurements WHERE monitor_id=?1 ORDER BY created_at DESC LIMIT 1").bind(monitorId).first<{id:string;monitor_id:string;status:string;created_at:string;completed_at:string|null;external_id:string|null;error:string|null}>();
  if(latest?.status==="in-progress"&&latest.external_id){try{await syncMeasurement(env,latest as {id:string;monitor_id:string;external_id:string})}catch(error){console.error(error)}}
  return env.DB.prepare("SELECT id,monitor_id,status,created_at,completed_at,external_id,error FROM global_measurements WHERE monitor_id=?1 ORDER BY created_at DESC LIMIT 1").bind(monitorId).first();
}

async function detail(env:Env,monitorId:string){
  const monitor=await getMonitor(env,monitorId);if(!monitor)return null;
  const measurement=await syncLatest(env,monitorId);
  const regions=await env.DB.prepare("SELECT region,country,city,asn,network,status,http_status,resolved_address,dns_ms,tcp_ms,tls_ms,first_byte_ms,download_ms,total_ms,tls_authorized,tls_protocol,tls_cipher,tls_expires_at,tls_subject,tls_issuer,baseline_ms,anomaly,checked_at FROM regional_results WHERE measurement_id=?1 ORDER BY total_ms DESC").bind(measurement?.id??"").all<RegionalResult>();
  const history=await env.DB.prepare("SELECT gm.created_at,AVG(rr.total_ms) AS avg_ms,COUNT(rr.id) AS region_count FROM global_measurements gm LEFT JOIN regional_results rr ON rr.measurement_id=gm.id WHERE gm.monitor_id=?1 GROUP BY gm.id ORDER BY gm.created_at DESC LIMIT 40").bind(monitorId).all<{created_at:string;avg_ms:number|null;region_count:number}>();
  return {monitor,measurement,regions:regions.results,history:history.results};
}

export default{
  async fetch(request:Request,env:Env):Promise<Response>{
    const url=new URL(request.url);
    if(url.pathname==="/api/health")return json({ok:true,service:"ping.yu"});
    if(url.pathname==="/api/monitors"&&request.method==="GET"){
      const r=await env.DB.prepare("SELECT m.id,m.url,m.name,m.interval_seconds,m.active,m.created_at,COALESCE((SELECT status FROM regional_results x WHERE x.monitor_id=m.id ORDER BY x.checked_at DESC LIMIT 1),'pending') status FROM monitors m ORDER BY m.created_at DESC").all<Monitor&{status:string}>();return json(r.results)
    }
    if(url.pathname==="/api/monitors"&&request.method==="POST"){
      const input=await request.json<{url?:string;name?:string}>();if(!input.url)return json({error:"url is required"},400);let parsed:URL;try{parsed=new URL(input.url)}catch{return json({error:"invalid url"},400)}
      if(!["http:","https:"].includes(parsed.protocol))return json({error:"only http and https are supported"},400);if(parsed.username||parsed.password)return json({error:"credentials in URLs are not supported"},400);
      const monitor:Monitor={id:crypto.randomUUID(),url:parsed.toString(),name:input.name?.trim()||null,interval_seconds:300,active:1,created_at:new Date().toISOString()};
      await env.DB.prepare("INSERT INTO monitors (id,url,name,interval_seconds,active,created_at) VALUES (?,?,?,?,?,?)").bind(monitor.id,monitor.url,monitor.name,monitor.interval_seconds,monitor.active,monitor.created_at).run();
      try {
        await env.PROBE_QUEUE.send({monitorId:monitor.id},{contentType:"json"});
      } catch (error) {
        await env.DB.prepare("DELETE FROM monitors WHERE id=?1").bind(monitor.id).run();
        return json({error:"monitor could not be queued",detail:String(error)},502);
      }
      return json({monitor,status:"pending"},201);
    }
    const recent=url.pathname.match(/^\/api\/monitors\/([^/]+)\/recent$/);if(recent&&request.method==="GET"){const d=await detail(env,recent[1]);return d?json(d):json({error:"monitor not found"},404)}
    const remove=url.pathname.match(/^\/api\/monitors\/([^/]+)$/);if(remove&&request.method==="DELETE"){await env.DB.prepare("DELETE FROM monitors WHERE id=?1").bind(remove[1]).run();return new Response(null,{status:204})}
    return env.ASSETS.fetch(request);
  },
  async scheduled(_controller:ScheduledController,env:Env){
    const pending=await env.DB.prepare("SELECT id,monitor_id,external_id FROM global_measurements WHERE status='in-progress' AND external_id IS NOT NULL ORDER BY created_at DESC LIMIT 100").all<{id:string;monitor_id:string;external_id:string}>();
    for(const item of pending.results){try{await syncMeasurement(env,item)}catch(error){console.error(error)}}
    const monitors=await env.DB.prepare("SELECT id FROM monitors WHERE active=1").all<{id:string}>();
    for(const m of monitors.results)await env.PROBE_QUEUE.send({monitorId:m.id},{contentType:"json"});
  },
  async queue(batch:MessageBatch<{monitorId:string}>,env:Env){
    for(const message of batch.messages){const monitor=await getMonitor(env,message.body.monitorId);if(!monitor||!monitor.active){message.ack();continue}try{await startMeasurement(env,monitor);message.ack()}catch(error){console.error(error);message.retry()}}
  }
};