import { gsap } from 'gsap';
import { arrivalCopy } from './arrival-copy';
import { arrivalAudio } from './arrival-config';
import { createSouvenir } from './souvenirs';
import { checkFootprint } from './wall-moderation';
import { readWall, postFootprint, type Footprint } from './wall-service';
import type { Language } from './copy';

type ArrivalState = { landed: boolean; revealed: boolean; wallOpen: boolean; draft: string };
const fresh = (): ArrivalState => ({ landed:false, revealed:false, wallOpen:false, draft:'' });
const ownKey='voyageurs-own-footprint-v1';

export function createArrival(onChange:()=>void) {
  const root=document.querySelector<HTMLElement>('#arrival')!;
  const find=<T extends HTMLElement=HTMLElement>(id:string)=>root.querySelector<T>(`#${id}`)!;
  const intro=find('arrival-cinematic'), scene=find('arrival-scene'), sky=find('arrival-sky'), runway=find('arrival-runway');
  const content=find('arrival-content'), title=find('arrival-title'), caption=find('arrival-flight-caption');
  const seal=find('arrival-seal'), afterword=find('arrival-afterword');
  const audio=find<HTMLAudioElement>('arrival-audio'), audioGroup=find('arrival-audio-group');
  const wallButton=find<HTMLButtonElement>('open-wall'), wall=find('arrival-wall');
  const form=find<HTMLFormElement>('wall-form'), input=find<HTMLTextAreaElement>('wall-message');
  const submit=find<HTMLButtonElement>('wall-submit'), feedback=find('wall-feedback'), list=find('wall-list'), notice=find('wall-notice');
  const retry=find<HTMLButtonElement>('wall-retry');
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let state=fresh(), language:Language='ar', name='', phrase='';
  let timeline:gsap.core.Timeline|undefined;
  let finishCallback:(()=>void)|undefined;
  let generation=0, loading=false, sending=false, exporting=false;
  let wallMode:'idle'|'loading'|'ready'|'error'='idle';
  let errorKey:keyof typeof arrivalCopy.ar|undefined;
  let souvenirMode:'downloading'|'saved'|'exportError'|undefined;
  let landingBeat:'landing'|'runway'|'landed'='landing';
  let entries:Footprint[]=[];
  let own:{token:string;entry?:Footprint};
  try { own=JSON.parse(localStorage.getItem(ownKey)??'null'); } catch { own=null as never; }
  if (!own || typeof own.token!=='string' || !/^[0-9a-f-]{36}$/i.test(own.token)) own={token:crypto.randomUUID()};
  if(own.entry && (typeof own.entry.id!=='string'||typeof own.entry.message!=='string')) delete own.entry;
  function persistOwn() { try {localStorage.setItem(ownKey,JSON.stringify(own));} catch {/* Session still keeps the current request token. */} }
  persistOwn();

  function renderWall() {
    const w=arrivalCopy[language];
    wall.hidden=!state.wallOpen;
    wallButton.setAttribute('aria-expanded',String(state.wallOpen));
    input.value=state.draft;
    input.disabled=!!own.entry || sending;
    submit.disabled=sending || !!own.entry;
    submit.textContent=sending?w.wallSending:w.wallSend;
    find('wall-count').textContent=`${Array.from(state.draft).length}/160`;
    feedback.textContent=errorKey?w[errorKey]:own.entry?(own.entry.status==='pending'?w.wallPending:w.wallSaved):'';
    feedback.hidden=!feedback.textContent;
    input.setAttribute('aria-invalid',String(!!errorKey && ['wallLength','wallLanguage','wallLinks','wallSpam'].includes(errorKey)));
    notice.textContent=wallMode==='loading'?w.wallLoading:wallMode==='error'?w.wallLoadError:entries.length===0?w.wallEmpty:'';
    notice.hidden=!notice.textContent;
    retry.hidden=wallMode!=='error';
    list.replaceChildren(...entries.map(entry=>{
      const card=document.createElement('li'), quote=document.createElement('blockquote'), author=document.createElement('span');
      quote.textContent=entry.message; author.textContent=w.wallGuest;
      card.append(quote,author);return card;
    }));
  }
  function render() {
    const w=arrivalCopy[language];
    for(const el of root.querySelectorAll<HTMLElement>('[data-arrival-copy]')) {
      const value=w[el.dataset.arrivalCopy as keyof typeof w]; if(typeof value==='string')el.textContent=value;
    }
    caption.textContent=w[landingBeat];
    find('souvenir-status').textContent=souvenirMode?w[souvenirMode]:'';
    find('arrival-personal-phrase').textContent=phrase || w.quote;
    input.placeholder=w.wallPlaceholder;
    audio.setAttribute('aria-label',w.audio);
    audioGroup.hidden=!arrivalAudio.src;
    if(arrivalAudio.src && !audio.hasAttribute('src')) audio.src=arrivalAudio.src;
    find('arrival-transcript').textContent=arrivalAudio.transcript[language];
    find('arrival-transcript-details').hidden=!arrivalAudio.transcript[language];
    afterword.hidden=!state.revealed;
    find('arrival-reveal').hidden=state.revealed;
    renderWall();
  }
  async function refreshWall() {
    if(loading)return;
    loading=true;wallMode='loading';renderWall(); const ticket=generation;
    try { const rows=await readWall();if(ticket!==generation)return;entries=rows;wallMode='ready'; }
    catch {if(ticket===generation)wallMode='error';}
    finally {if(ticket===generation){loading=false;renderWall();}}
  }
  function unlock() {
    document.documentElement.classList.remove('is-landing');
    intro.hidden=true;content.inert=false;
  }
  function finishLanding() {
    timeline?.kill();timeline=undefined;
    state.landed=true;unlock();render();onChange();
    title.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
    if(!reducedMotion.matches)gsap.fromTo(seal,{scale:1.2,rotation:-12,opacity:0},{scale:1,rotation:-7,opacity:1,duration:.65,ease:'back.out(1.4)',clearProps:'opacity,transform'});
    finishCallback?.();finishCallback=undefined;
  }
  find('skip-arrival').addEventListener('click',finishLanding);
  find('arrival-reveal').addEventListener('click',()=>{
    state.revealed=true;render();onChange();afterword.focus({preventScroll:true});
    afterword.scrollIntoView({block:'start',behavior:reducedMotion.matches?'instant':'smooth'});
  });
  wallButton.addEventListener('click',()=>{
    state.wallOpen=!state.wallOpen;render();onChange();
    if(state.wallOpen){find('wall-title').focus({preventScroll:true});void refreshWall();}
  });
  retry.addEventListener('click',()=>void refreshWall());
  input.addEventListener('input',()=>{state.draft=input.value;errorKey=undefined;find('wall-count').textContent=`${Array.from(state.draft).length}/160`;input.setAttribute('aria-invalid','false');feedback.hidden=true;onChange();});
  const errorMap:Record<string,keyof typeof arrivalCopy.ar>={length:'wallLength',links:'wallLinks',language:'wallLanguage',spam:'wallSpam',rate:'wallRate'};
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||own.entry)return;
    const check=checkFootprint(state.draft);
    if(!check.ok){errorKey=errorMap[check.reason];renderWall();feedback.focus({preventScroll:true});return;}
    sending=true;errorKey=undefined;renderWall();persistOwn();const ticket=generation;
    try {const entry=await postFootprint(check.message,language,own.token);own.entry=entry;persistOwn();if(ticket!==generation)return;
      state.draft=entry.message;onChange();void refreshWall();
    } catch(error) {if(ticket===generation)errorKey=errorMap[error instanceof Error?error.message:'']??'wallError';}
    finally {if(ticket===generation){sending=false;renderWall();feedback.focus({preventScroll:true});}}
  });
  for(const kind of ['passport','postcard'] as const) {
    find<HTMLButtonElement>(`save-${kind}`).addEventListener('click',async()=>{
      if(exporting)return;exporting=true;
      const buttons=root.querySelectorAll<HTMLButtonElement>('[data-souvenir]');buttons.forEach(b=>b.disabled=true);
      const status=find('souvenir-status');souvenirMode='downloading';status.textContent=arrivalCopy[language][souvenirMode];
      try {
        const blob=await createSouvenir(kind,{name,phrase:phrase||arrivalCopy[language].quote,language});
        const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`voyageurs-${kind}.png`;link.click();
        window.setTimeout(()=>URL.revokeObjectURL(url),60000);souvenirMode='saved';status.textContent=arrivalCopy[language][souvenirMode];
      } catch {souvenirMode='exportError';status.textContent=arrivalCopy[language][souvenirMode];}
      finally {exporting=false;buttons.forEach(b=>b.disabled=false);}
    });
  }
  render();
  return {
    translate(lang:Language,passenger:string,takeaway:string){language=lang;name=passenger;phrase=takeaway;render();},
    play(complete:()=>void){
      finishCallback=complete;
      if(state.landed){unlock();render();title.focus({preventScroll:true});if(state.wallOpen)void refreshWall();complete();finishCallback=undefined;return;}
      intro.hidden=false;content.inert=true;document.documentElement.classList.add('is-landing');
      gsap.set(intro,{clearProps:'opacity'});
      find('skip-arrival').focus({preventScroll:true});
      if(reducedMotion.matches){finishLanding();return;}
      landingBeat='landing';caption.textContent=arrivalCopy[language].landing;
      gsap.set([scene,sky,runway],{clearProps:'opacity,transform'});
      timeline=gsap.timeline({onComplete:finishLanding})
        .fromTo(scene,{opacity:0},{opacity:1,duration:.65},0)
        .fromTo(sky,{opacity:1,y:-12},{opacity:0,y:24,duration:3.1,ease:'sine.inOut'},.8)
        .fromTo(runway,{opacity:0,y:22},{opacity:1,y:0,duration:3.1,ease:'sine.inOut'},.8)
        .call(()=>{landingBeat='runway';caption.textContent=arrivalCopy[language].runway;},[],1.7)
        .to(scene,{y:2,duration:.08},3.9).to(scene,{y:0,duration:.3,ease:'sine.out'},3.98)
        .call(()=>{landingBeat='landed';caption.textContent=arrivalCopy[language].landed;},[],4.1)
        .to(intro,{opacity:0,duration:.7,clearProps:'opacity'},5.1);
    },
    snapshot:()=>({...state}),
    restore(value:unknown){
      if(!value||typeof value!=='object')return;const stored=value as Record<string,unknown>;
      state={landed:stored.landed===true,revealed:stored.revealed===true,wallOpen:stored.wallOpen===true,draft:typeof stored.draft==='string'?stored.draft.slice(0,320):''};render();
    },
    reset(){generation++;timeline?.kill();timeline=undefined;gsap.killTweensOf(seal);audio.pause();unlock();state=fresh();souvenirMode=undefined;loading=false;sending=false;errorKey=undefined;entries=[];wallMode='idle';finishCallback=undefined;render();},
    pauseAudio(){audio.pause();},
  };
}
