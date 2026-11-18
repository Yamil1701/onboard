import './results.css';
import config from './wall-config.json';
import {copy} from './copy';
import {finalSurveyCopy} from './final-survey-copy';
type Results={started:number;completed:number;ratingCount:number;ratingAverage:number|null;expectations:Record<string,number>;questions:number[][];ratings:number[];recent:{created_at:string;completed_at:string|null;language:string;rating:number|null}[]};
const find=<T extends HTMLElement=HTMLElement>(id:string)=>document.getElementById(id) as T;
const access=find('access'),dashboard=find('dashboard'),form=find<HTMLFormElement>('pin-form'),pin=find<HTMLInputElement>('pin'),status=find('access-status'),refresh=find<HTMLButtonElement>('refresh');
const endpoint=config.url.replace(/voyageurs-wall$/,'voyageurs-surveys');
const auth={apikey:config.key,Authorization:`Bearer ${config.key}`,'Content-Type':'application/json'};
let session='',busy=false;
try{session=sessionStorage.getItem('voyageurs-results-session')??'';}catch{/* Memory-only login. */}
function lock(){session='';try{sessionStorage.removeItem('voyageurs-results-session');}catch{/* Memory only. */}dashboard.hidden=true;access.hidden=false;find('metrics').replaceChildren();find('questions').replaceChildren();find('recent').replaceChildren();pin.value='';pin.focus();}
function bars(target:HTMLElement,labels:string[],counts:number[],total:number){
  target.replaceChildren(...labels.map((label,index)=>{
    const row=document.createElement('div');row.className='result-row';
    const line=document.createElement('div');line.className='bar-label';
    const title=document.createElement('span');title.textContent=label;
    const number=document.createElement('strong'),count=counts[index]??0,percent=total?Math.round(100*count/total):0;number.textContent=`${count} · ${percent}%`;
    const track=document.createElement('div');track.className='bar-track';const fill=document.createElement('span');fill.className='bar-fill';fill.style.width=`${percent}%`;track.append(fill);line.append(title,number);row.append(line,track);return row;
  }));
}
function render(data:Results){
  const metrics=[['Expectativas recibidas',String(data.started)],['Encuestas completas',String(data.completed)],['Valoración media',data.ratingAverage===null?'—':`${Number(data.ratingAverage).toLocaleString('es-AR',{maximumFractionDigits:1})}/5`]];
  find('metrics').replaceChildren(...metrics.map(([label,value])=>{const card=document.createElement('div');card.className='metric';const n=document.createElement('strong'),t=document.createElement('span');n.textContent=value;t.textContent=label;card.append(n,t);return card;}));
  const keys=['adapt','play','ideas'] as const;bars(find('expectations'),keys.map(k=>copy.ar[k]),keys.map(k=>data.expectations[k]??0),data.started);
  bars(find('ratings'),[1,2,3,4,5].map(n=>`${n} ${n===1?'estrella':'estrellas'}`),data.ratings,data.ratingCount);
  find('unrated').textContent=`${data.ratingCount} valoraciones · ${data.completed-data.ratingCount} encuestas sin valoración.`;
  find('questions').replaceChildren(...finalSurveyCopy.ar.questions.map((item,index)=>{const section=document.createElement('section');section.className='result-section';const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent=`ANTES DE ATERRIZAR · ${index+1} / 5`;const title=document.createElement('h2');title.textContent=item.question;const chart=document.createElement('div');bars(chart,[...item.options],data.questions[index]??[0,0,0],data.completed);section.append(eyebrow,title,chart);return section;}));
  find('recent').replaceChildren(...data.recent.map(item=>{const row=document.createElement('div');row.className='recent-row';const date=document.createElement('span'),value=document.createElement('strong');date.textContent=new Date(item.created_at).toLocaleString('es-AR',{dateStyle:'short',timeStyle:'short'});value.textContent=`${item.language==='fr'?'FR':'AR'} · ${item.completed_at?'Completa':'Expectativa'}${item.rating?` · ${item.rating} ★`:''}`;row.append(date,value);return row;}));
  if(!data.started){const empty=document.createElement('p');empty.className='empty';empty.textContent='Todavía no hay respuestas. Aparecerán aquí cuando los visitantes participen.';find('recent').append(empty);}
}
async function load(){
  if(busy)return;busy=true;refresh.disabled=true;find('updated').textContent='Actualizando…';
  try{const r=await fetch(endpoint,{headers:{...auth,'x-voyageurs-session':session},signal:AbortSignal.timeout(12000)});if(r.status===401){lock();status.textContent='Ingresá el PIN para continuar.';return;}if(!r.ok)throw new Error('read');const data=await r.json() as Results;render(data);access.hidden=true;dashboard.hidden=false;find('updated').textContent=`Actualizado a las ${new Date().toLocaleTimeString('es-AR',{hour:'2-digit',minute:'2-digit'})}`;}
  catch{if(dashboard.hidden)status.textContent='No pudimos cargar los resultados. Probá de nuevo.';else find('updated').textContent='No se pudo actualizar. Los datos anteriores siguen visibles.';}
  finally{busy=false;refresh.disabled=false;}
}
form.addEventListener('submit',async event=>{event.preventDefault();if(busy)return;busy=true;const button=form.querySelector('button')!;button.disabled=true;status.textContent='Comprobando acceso…';try{const r=await fetch(endpoint,{method:'POST',headers:auth,body:JSON.stringify({action:'login',pin:pin.value}),signal:AbortSignal.timeout(12000)});if(!r.ok){status.textContent=r.status===429?'Demasiados intentos. Volvé a probar en unos minutos.':r.status===401?'El PIN no es correcto.':'No pudimos conectar. Probá de nuevo.';return;}const data=await r.json();session=data.session;try{sessionStorage.setItem('voyageurs-results-session',session);}catch{/* Keep session in memory. */}pin.value='';status.textContent='';busy=false;await load();}catch{status.textContent='No pudimos conectar. Probá de nuevo.';}finally{busy=false;button.disabled=false;}});
find('logout').addEventListener('click',lock);refresh.addEventListener('click',()=>void load());
if(session)void load();
