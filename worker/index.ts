type Monitor = {
  id: string;
  url: string;
  name: string | null;
  interval_seconds: number;
  active: number;
  created_at: string;
};

type Probe = {
  status: "up" | "degraded" | "down";
  http_status: number | null;
  latency_ms: number;
  checked_at: string;
  colo: string | null;
  error: string | null;
};

interface Env {
  DB: D1Database;
  PROBE_QUEUE: Queue<{ monitorId: string }>;
}

const PAGE = String.raw`<!doctype html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>ping.yu</title>
  <style>
    *{box-sizing:border-box}
    :root{font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#111;background:#fafafa}
    body{margin:0;min-width:320px}
    button,input{font:inherit}
    button{cursor:pointer}
    main{width:min(1040px,calc(100% - 40px));margin:0 auto;min-height:100vh}
    header{height:68px;border-bottom:1px solid #eaeaea;display:flex;align-items:center;gap:10px}
    .brand{font-weight:800;letter-spacing:-.05em}
    .muted{color:#8a8a8a;font-size:12px}
    .spacer{flex:1}
    .live{display:flex;align-items:center;gap:7px;color:#777;font-size:12px}
    .live i,.dot{width:7px;height:7px;border-radius:50%;display:inline-block;background:#21a66a}
    .hero{padding:84px 0 50px;max-width:780px}
    .eyebrow{color:#777;font-size:12px;margin:0 0 13px}
    h1{font-size:clamp(46px,8vw,78px);line-height:.96;letter-spacing:-.07em;margin:0 0 34px}
    form{display:flex;align-items:center;gap:10px;border:1px solid #ddd;background:white;border-radius:9px;padding:6px;box-shadow:0 1px 2px rgba(0,0,0,.03)}
    form span{padding-left:6px;color:#999}
    input{flex:1;min-width:0;border:0;outline:0;background:transparent;padding:12px;font-size:15px}
    form button{border:0;background:#111;color:#fff;border-radius:6px;padding:10px 14px;font-size:12px}
    form button:disabled{opacity:.5}
    .workspace{display:grid;grid-template-columns:280px minmax(0,1fr);border-top:1px solid #eaeaea;min-height:480px}
    .list{border-right:1px solid #eaeaea;padding:18px 0}
    .label{padding:0 14px 10px;color:#888;font-size:11px;letter-spacing:.09em;text-transform:uppercase}
    .monitor{width:100%;border:0;background:transparent;text-align:left;display:grid;grid-template-columns:8px 1fr 16px;gap:9px;align-items:center;padding:13px 14px}
    .monitor:hover{background:#f1f1f1}
    .monitor strong{font-size:13px;font-weight:550;display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .monitor small{font-size:11px;color:#999;display:block;margin-top:3px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .arrow{color:#aaa}
    .detail{padding:28px 32px 60px}
    .detail-head{display:flex;justify-content:space-between;gap:20px;border-bottom:1px solid #eee;padding-bottom:20px}
    .detail-head h2{font-size:26px;letter-spacing:-.04em;margin:0}
    .remove{border:0;background:transparent;color:#999;font-size:12px}
    .remove:hover{color:#d94b4b}
    .summary{display:flex;justify-content:space-between;align-items:end;padding:28px 0}
    .status{display:flex;align-items:center;gap:8px;font-size:13px}
    .metric{font-size:54px;font-weight:650;letter-spacing:-.06em;margin-top:8px}
    .metric span{font-size:15px;color:#888;margin-left:4px}
    .baseline{text-align:right}
    .baseline small{display:block;color:#999;text-transform:uppercase;font-size:10px;letter-spacing:.08em}
    .baseline strong{display:block;font-size:22px;margin-top:8px}
    .chart{height:110px;border-top:1px solid #eee;border-bottom:1px solid #eee;display:flex;align-items:end;gap:4px;padding:16px 0}
    .bar{flex:1;max-width:16px;min-height:4px;background:#111;opacity:.14;border-radius:2px 2px 0 0}
    .section{display:flex;justify-content:space-between;margin:26px 0 8px;color:#888;font-size:11px;text-transform:uppercase;letter-spacing:.08em}
    .check{display:grid;grid-template-columns:8px 1fr auto;gap:9px;align-items:center;padding:11px 0;border-bottom:1px solid #eee;font-size:12px;color:#777}
    .check strong{font-weight:500;color:#333;font-variant-numeric:tabular-nums}
    .empty{border-top:1px solid #eee;padding:28px 0;color:#999}
    .empty strong{display:block;color:#111;font-size:15px;font-weight:550;margin-bottom:5px}
    footer{padding:42px 0 70px;color:#aaa;font-size:12px}
    .up{background:#21a66a}.degraded{background:#d69b2b}.down{background:#d94b4b}.new{background:#bbb}
    @media(max-width:760px){main{width:min(100% - 28px,1040px)}.workspace{grid-template-columns:1fr}.list{border-right:0;border-bottom:1px solid #eaeaea}.detail{padding:24px 0 50px}.hero{padding-top:60px}}
  </style>
</head>
<body>
<main>
  <header>
    <span class="brand">ping.yu</span>
    <span class="muted">edge observability</span>
    <span class="spacer"></span>
    <span class="live"><i></i> live</span>
  </header>

  <section class="hero">
    <p class="eyebrow">Minimal internet monitoring.</p>
    <h1>Know when the internet gets weird.</h1>
    <form id="add">
      <span>+</span>
      <input id="url" aria-label="Monitor URL" placeholder="https://api.example.com/health" autocomplete="off">
      <button id="submit">Add monitor</button>
    </form>
  </section>

  <section class="workspace">
    <aside class="list">
      <div class="label">Monitors</div>
      <div id="monitors"></div>
    </aside>
    <article class="detail" id="detail">
      <div class="empty"><strong>Nothing is watching.</strong>Add an endpoint above.</div>
    </article>
  </section>

  <footer>ping.yu · minimal by design</footer>
</main>

<script>
const $ = (s) => document.querySelector(s);
const monitors = $('#monitors');
const detail = $('#detail');
const form = $('#add');
const input = $('#url');
const submit = $('#submit');
let selected = null;

function dot(status){ return '<span class="dot '+status+'"></span>'; }

async function getMonitors(){
  const r = await fetch('/api/monitors', {cache:'no-store'});
  return r.json();
}

async function getDetail(id){
  const r = await fetch('/api/monitors/'+encodeURIComponent(id)+'/recent?limit=40', {cache:'no-store'});
  return r.json();
}

function renderList(items){
  if(!items.length){
    monitors.innerHTML = '<div class="muted" style="padding:8px 14px">Nothing yet.</div>';
    return;
  }
  monitors.innerHTML = items.map(m => {
    const selectedClass = m.id === selected ? ' style="background:#f1f1f1"' : '';
    const host = (()=>{try{return new URL(m.url).hostname}catch{return m.url}})();
    return '<button class="monitor" data-id="'+m.id+'"'+selectedClass+'>'+dot('new')+
      '<span><strong>'+host+'</strong><small>'+m.url+'</small></span><span class="arrow">›</span></button>';
  }).join('');
  monitors.querySelectorAll('[data-id]').forEach(b => b.onclick = () => openMonitor(b.dataset.id));
}

async function refreshList(preferred){
  const items = await getMonitors();
  if(preferred) selected = preferred;
  renderList(items);
  if(selected && items.some(x => x.id === selected)) await renderDetail(await getDetail(selected));
  else if(items[0]) { selected = items[0].id; renderList(items); await renderDetail(await getDetail(selected)); }
  else detail.innerHTML = '<div class="empty"><strong>Nothing is watching.</strong>Add an endpoint above.</div>';
}

async function renderDetail(data){
  const latest = data.results?.[0];
  const host = (()=>{try{return new URL(data.monitor.url).hostname}catch{return data.monitor.url}})();
  const status = latest?.status || 'new';
  const latestLatency = latest?.latency_ms;
  const baseline = data.baseline?.mean_ms;
  const bars = (data.results || []).slice(0,24).reverse().map(x =>
    '<span class="bar" style="height:'+Math.min(100,Math.max(8,(x.latency_ms||1)/3))+'%"></span>'
  ).join('');
  const checks = (data.results || []).slice(0,8).map(x =>
    '<div class="check">'+dot(x.status)+'<span>'+new Date(x.checked_at).toLocaleTimeString()+'</span><strong>'+x.latency_ms+'ms</strong></div>'
  ).join('');

  detail.innerHTML =
    '<div class="detail-head"><div><p class="eyebrow">'+data.monitor.url+'</p><h2>'+host+'</h2></div>'+
    '<button class="remove" id="remove">Remove</button></div>'+
    '<div class="summary"><div><div class="status">'+dot(status)+' '+status+'</div>'+
    '<div class="metric">'+(latestLatency ?? '—')+'<span>ms</span></div></div>'+
    '<div class="baseline"><small>baseline</small><strong>'+(baseline ? Math.round(baseline) : '—')+'ms</strong></div></div>'+
    '<div class="chart">'+bars+'</div>'+
    '<div class="section"><span>Recent checks</span><span>'+(data.results?.length||0)+' samples</span></div>'+
    '<div>'+checks+'</div>';

  $('#remove').onclick = async () => {
    await fetch('/api/monitors/'+encodeURIComponent(data.monitor.id), {method:'DELETE'});
    selected = null;
    await refreshList();
  };
}

async function openMonitor(id){
  selected = id;
  const data = await getDetail(id);
  renderList(await getMonitors());
  await renderDetail(data);
}

form.onsubmit = async (e) => {
  e.preventDefault();
  const value = input.value.trim();
  if(!value) return;
  submit.disabled = true;
  submit.textContent = 'Checking…';
  try{
    const r = await fetch('/api/monitors', {
      method:'POST',
      headers:{'content-type':'application/json'},
      body:JSON.stringify({url:value})
    });
    if(!r.ok) throw new Error(await r.text());
    const created = await r.json();
    input.value = '';
    await refreshList(created.id);
  }catch(e){
    alert('Could not add monitor.');
  }finally{
    submit.disabled = false;
    submit.textContent = 'Add monitor';
  }
};

refreshList();
</script>
</body>
</html>`;

function json(data, status=200){
  return new Response(JSON.stringify(data), {
    status,
    headers: {"content-type":"application/json; charset=utf-8","cache-control":"no-store"}
  });
}

async function getMonitor(env: Env, id: string){
  return env.DB.prepare(
    "SELECT id,url,name,interval_seconds,active,created_at FROM monitors WHERE id=?1"
  ).bind(id).first<Monitor>();
}

async function probeAndRecord(env: Env, monitor: Monitor){
  const started = Date.now();
  let status: Probe["status"] = "up";
  let httpStatus: number | null = null;
  let error: string | null = null;

  try {
    const response = await fetch(monitor.url, {redirect:"follow"});
    httpStatus = response.status;
    if(!response.ok) status = "degraded";
  } catch {
    status = "down";
    error = "request_failed";
  }

  const latency = Date.now() - started;
  const checkedAt = new Date().toISOString();

  await env.DB.prepare(
    "INSERT INTO probe_results (monitor_id,status,http_status,latency_ms,checked_at,colo,error) VALUES (?1,?2,?3,?4,?5,?6,?7)"
  ).bind(
    monitor.id,
    status,
    httpStatus,
    latency,
    checkedAt,
    null,
    error
  ).run();

  const current = await env.DB.prepare(
    "SELECT mean_ms,samples FROM baselines WHERE monitor_id=?1"
  ).bind(monitor.id).first<{mean_ms:number;samples:number}>();

  const mean = current?.mean_ms ?? latency;
  const samples = (current?.samples ?? 0) + 1;
  const nextMean = mean + (latency - mean) / samples;

  await env.DB.prepare(
    "INSERT INTO baselines (monitor_id,mean_ms,samples,updated_at) VALUES (?1,?2,?3,?4) ON CONFLICT(monitor_id) DO UPDATE SET mean_ms=excluded.mean_ms,samples=excluded.samples,updated_at=excluded.updated_at"
  ).bind(monitor.id,nextMean,samples,checkedAt).run();

  return {status,httpStatus,latencyMs:latency,checkedAt,colo:null,error};
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if(url.pathname === "/api/health"){
      return json({ok:true,service:"ping.yu",colo:(request.cf as {colo?:string}|undefined)?.colo ?? null});
    }

    if(url.pathname === "/api/monitors" && request.method === "GET"){
      const result = await env.DB.prepare(
        "SELECT id,url,name,interval_seconds,active,created_at FROM monitors ORDER BY created_at DESC"
      ).all<Monitor>();
      return json(result.results);
    }

    if(url.pathname === "/api/monitors" && request.method === "POST"){
      const input = await request.json<{url?:string;name?:string}>();
      if(!input.url) return json({error:"url is required"},400);

      let parsed: URL;
      try { parsed = new URL(input.url); }
      catch { return json({error:"invalid url"},400); }

      if(!["http:","https:"].includes(parsed.protocol)){
        return json({error:"only http and https are supported"},400);
      }

      const monitor: Monitor = {
        id: crypto.randomUUID(),
        url: parsed.toString(),
        name: input.name?.trim() || null,
        interval_seconds: 300,
        active: 1,
        created_at: new Date().toISOString(),
      };

      await env.DB.prepare(
        "INSERT INTO monitors (id,url,name,interval_seconds,active,created_at) VALUES (?1,?2,?3,?4,?5,?6)"
      ).bind(
        monitor.id,monitor.url,monitor.name,monitor.interval_seconds,monitor.active,monitor.created_at
      ).run();

      const first = await probeAndRecord(env, monitor);

      // Keep the queue path for subsequent scheduled probes.
      // The first probe is synchronous so the UI has something to show immediately.
      await env.PROBE_QUEUE.send({monitorId:monitor.id},{contentType:"json"});

      return json({monitor,first},{status:201});
    }

    const recent = url.pathname.match(/^\/api\/monitors\/([^/]+)\/recent$/);
    if(recent && request.method === "GET"){
      const monitor = await getMonitor(env,recent[1]);
      if(!monitor) return json({error:"monitor not found"},404);

      const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 40),1),200);
      const results = await env.DB.prepare(
        "SELECT status,http_status,latency_ms,checked_at,colo,error FROM probe_results WHERE monitor_id=?1 ORDER BY checked_at DESC LIMIT ?2"
      ).bind(recent[1],limit).all<Probe>();

      const baseline = await env.DB.prepare(
        "SELECT mean_ms,samples,updated_at FROM baselines WHERE monitor_id=?1"
      ).bind(recent[1]).first();

      return json({monitor,baseline,results:results.results});
    }

    const probe = url.pathname.match(/^\/api\/monitors\/([^/]+)\/probe$/);
    if(probe && request.method === "POST"){
      const monitor = await getMonitor(env,probe[1]);
      if(!monitor) return json({error:"monitor not found"},404);
      return json(await probeAndRecord(env,monitor));
    }

    const remove = url.pathname.match(/^\/api\/monitors\/([^/]+)$/);
    if(remove && request.method === "DELETE"){
      await env.DB.prepare("DELETE FROM monitors WHERE id=?1").bind(remove[1]).run();
      return new Response(null,{status:204});
    }

    return new Response(PAGE,{headers:{"content-type":"text/html; charset=utf-8"}});
  },

  async scheduled(_controller: ScheduledController, env: Env){
    const monitors = await env.DB.prepare(
      "SELECT id FROM monitors WHERE active=1"
    ).all<{id:string}>();

    for(const monitor of monitors.results){
      await env.PROBE_QUEUE.send({monitorId:monitor.id},{contentType:"json"});
    }
  },

  async queue(batch: MessageBatch<{monitorId:string}>, env: Env){
    for(const message of batch.messages){
      const monitor = await getMonitor(env,message.body.monitorId);
      if(!monitor || !monitor.active){
        message.ack();
        continue;
      }
      try{
        await probeAndRecord(env,monitor);
        message.ack();
      }catch(error){
        console.error(error);
        message.retry();
      }
    }
  }
};