import { checkFootprint } from '../../src/wall-moderation.ts';

const api = Deno.env.get('SUPABASE_URL')!;
const secret = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const allowed = new Set(['https://yamil1701.github.io', 'http://localhost:5173', 'http://127.0.0.1:5173']);
const auth = { apikey: secret, Authorization: `Bearer ${secret}`, 'Content-Type': 'application/json' };

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin');
  const headers: Record<string,string> = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'Vary': 'Origin' };
  if (origin && allowed.has(origin)) headers['Access-Control-Allow-Origin'] = origin;
  headers['Access-Control-Allow-Headers'] = 'authorization, apikey, content-type';
  headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS';
  const reply = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers });
  if (origin && !allowed.has(origin)) return reply({error:'origin'},403);
  if (request.method === 'OPTIONS') return new Response(null, {status:204,headers});
  try {
    if (request.method === 'GET') {
      const response = await fetch(`${api}/rest/v1/voyageurs_wall_entries?select=id,message,created_at&status=eq.approved&order=created_at.desc&limit=40`, {headers:auth});
      if (!response.ok) throw new Error('read');
      return reply({entries:await response.json()});
    }
    if (request.method !== 'POST') return reply({error:'method'},405);
    if (Number(request.headers.get('content-length') ?? 0)>4096) return reply({error:'length'},413);
    const raw = await request.text();
    if (raw.length>4096) return reply({error:'length'},413);
    const body = JSON.parse(raw);
    if (!body || typeof body !== 'object' || Array.isArray(body)) return reply({error:'invalid'},400);
    if (typeof body.token!=='string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.token)) return reply({error:'invalid'},400);
    const check=checkFootprint(body.message);
    if (!check.ok) return reply({error:check.reason},422);
    const ip=request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? request.headers.get('x-real-ip') ?? 'unknown';
    const key=await crypto.subtle.importKey('raw',new TextEncoder().encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);
    const hash=await crypto.subtle.sign('HMAC',key,new TextEncoder().encode(ip));
    const ipHash=[...new Uint8Array(hash)].map(x=>x.toString(16).padStart(2,'0')).join('');
    const response=await fetch(`${api}/rest/v1/rpc/voyageurs_post_footprint`,{method:'POST',headers:auth,body:JSON.stringify({p_token:body.token,p_ip:ipHash,p_message:check.message,p_language:body.language==='fr'?'fr':'ar',p_status:check.status})});
    const result=await response.json();
    if (!response.ok) return reply({error:String(result.message).includes('rate_limit')?'rate':'unavailable'},String(result.message).includes('rate_limit')?429:503);
    return reply({entry:result});
  } catch { return reply({error:'unavailable'},503); }
});
