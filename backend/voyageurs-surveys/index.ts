import {parseSurvey} from '../../src/survey-data.ts';
import {issueSession,validSession,pinDigest} from './session.ts';
const api=Deno.env.get('SUPABASE_URL')!,secret=Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const auth={apikey:secret,Authorization:`Bearer ${secret}`,'Content-Type':'application/json'};
const allowed=new Set(['https://yamil1701.github.io','http://localhost:5173','http://127.0.0.1:5173']);
async function rpc(name:string,body:unknown){const r=await fetch(`${api}/rest/v1/rpc/${name}`,{method:'POST',headers:auth,body:JSON.stringify(body)});if(!r.ok)throw new Error('db');return r.json();}
Deno.serve(async(request:Request)=>{
  const origin=request.headers.get('origin');
  const headers:Record<string,string>={'Content-Type':'application/json','Cache-Control':'no-store','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-voyageurs-session','Access-Control-Allow-Methods':'GET,POST,OPTIONS'};
  if(origin&&allowed.has(origin))headers['Access-Control-Allow-Origin']=origin;
  const reply=(body:unknown,status=200)=>new Response(JSON.stringify(body),{status,headers});
  if(origin&&!allowed.has(origin))return reply({error:'origin'},403);
  if(request.method==='OPTIONS')return new Response(null,{status:204,headers});
  try{
    if(request.method==='GET'){
      if(!await validSession(request.headers.get('x-voyageurs-session')??'',secret))return reply({error:'unauthorized'},401);
      return reply(await rpc('voyageurs_survey_results',{}));
    }
    if(request.method!=='POST')return reply({error:'method'},405);
    if(Number(request.headers.get('content-length')??0)>2048)return reply({error:'length'},413);
    const raw=await request.text();if(raw.length>2048)return reply({error:'length'},413);
    let body;try{body=JSON.parse(raw);}catch{return reply({error:'invalid'},400);}
    const ip=request.headers.get('x-forwarded-for')?.split(',')[0].trim()??request.headers.get('x-real-ip')??'unknown';
    const ipHash=await pinDigest(ip,secret);
    if(body?.action==='login'){
      if(!await rpc('voyageurs_survey_gate',{p_bucket:`pin:${ipHash}`,p_login:true}))return reply({error:'rate'},429);
      if(typeof body.pin!=='string'||!/^\d{4}$/.test(body.pin))return reply({error:'pin'},401);
      const r=await fetch(`${api}/rest/v1/voyageurs_results_access?select=salt,pin_hash&id=eq.true`,{headers:auth});if(!r.ok)throw new Error('config');
      const [config]=await r.json();if(!config||await pinDigest(body.pin,config.salt)!==config.pin_hash)return reply({error:'pin'},401);
      return reply({session:await issueSession(secret)});
    }
    const survey=parseSurvey(body);if(!survey)return reply({error:'invalid'},422);
    if(!await rpc('voyageurs_survey_gate',{p_bucket:`post:${ipHash}`,p_login:false}))return reply({error:'rate'},429);
    await rpc('voyageurs_save_survey',{p_token:survey.token,p_language:survey.language,p_expectation:survey.expectation,p_answers:survey.answers,p_rating:survey.rating});
    return reply({saved:true});
  }catch{return reply({error:'unavailable'},503);}
});
