import { gsap } from 'gsap';
import { arrivalCopy } from './arrival-copy';
import { createTestimonials } from './testimonials';
import { createSouvenir } from './souvenirs';
import { checkFootprint } from './wall-moderation';
import { readWall, postFootprint, type Footprint, type WallCursor } from './wall-service';
import { sound,startFlightSound,stopFlightSound } from './sound';
import {welcomeNotes} from './wall-welcome';
import type { Language } from './copy';

type Chapter='story'|'souvenirs'|'wall';
type ArrivalState={landed:boolean;chapter:Chapter;finished:boolean;draft:string};
type Words=keyof typeof arrivalCopy.ar;
type Kind='passport'|'postcard';
const fresh=():ArrivalState=>({landed:false,chapter:'story',finished:false,draft:''});
const ownKey='voyageurs-own-footprint-v1';
const uuid=/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function createArrival(onChange:()=>void,onFinish:()=>void) {
  const root=document.querySelector<HTMLElement>('#arrival')!;
  const find=<T extends HTMLElement=HTMLElement>(id:string)=>root.querySelector<T>(`#${id}`)!;
  const intro=find('arrival-cinematic'),scene=find('arrival-scene'),sky=find('arrival-sky'),runway=find('arrival-runway');
  const content=find('arrival-content'),caption=find('arrival-flight-caption'),closing=find('arrival-closing');
  const testimonials=createTestimonials(find('arrival-testimonials'));
  const form=find<HTMLFormElement>('wall-form'),input=find<HTMLTextAreaElement>('wall-message');
  const submit=find<HTMLButtonElement>('wall-submit'),feedback=find('wall-feedback'),list=find('wall-list');
  const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
  let state=fresh(),language:Language='ar',name='',phrase='';
  let timeline:gsap.core.Timeline|undefined,closingTimeline:gsap.core.Timeline|undefined;
  let generation=0,loading=false,sending=false,exporting=false;
  let wallMode:'idle'|'loading'|'ready'|'error'='idle',errorKey:Words|undefined;
  let souvenirMode:'downloading'|'saved'|'exportError'|undefined,landingBeat:'landing'|'runway'|'landed'='landing';
  let entries:Footprint[]=[],cursor:WallCursor|null=null;
  let replaying=false,replayEntry:Footprint|undefined,bookOpened=false;
  let bookOpening:gsap.core.Timeline|undefined;
  const currentEntry=()=>replaying?replayEntry:own.entry;
  let own:{token:string;entry?:Footprint}={token:crypto.randomUUID()};
  try {
    const stored=JSON.parse(localStorage.getItem(ownKey)??'null');
    if(stored && typeof stored.token==='string' && uuid.test(stored.token)) {
      own={token:stored.token};
      if(stored.entry && typeof stored.entry.id==='string' && typeof stored.entry.message==='string')own.entry=stored.entry;
    }
  } catch {/* A private browser can still use this visit's request identifier. */}
  function persistOwn(){try{localStorage.setItem(ownKey,JSON.stringify(own));}catch{/* Keep the current request id in memory. */}}
  persistOwn();

  const observer=new IntersectionObserver(records=>{
    for(const record of records)if(record.isIntersecting){
      const target=record.target as HTMLElement;
      if(!target.classList.contains('is-visible')){
        target.classList.add('is-visible');
        if(target.classList.contains('arrival-goodbye'))sound('stamp');
        else if(!target.classList.contains('arrival-opening'))sound('paper');
        if(target.querySelector('#souvenir-passport'))openSouvenirPassport();
      }
    }
  },{threshold:.12});
  for(const target of root.querySelectorAll('[data-reveal]'))observer.observe(target);
  root.dataset.revealReady='';

  let previewKey='',previewTicket=0;
  let previews:Partial<Record<Kind,{blob:Blob;url:string}>>={};
  function openSouvenirPassport(){
    if(bookOpened||!previews.passport)return;bookOpened=true;bookOpening?.kill();
    const cover=find('souvenir-cover');
    if(reducedMotion.matches){gsap.set(cover,{opacity:0});return;}
    bookOpening=gsap.timeline().call(()=>sound('paper'),[],.4).fromTo(cover,{rotationY:0,opacity:1},{rotationY:-165,duration:1.65,ease:'sine.inOut'},.4).to(cover,{opacity:0,duration:.25},1.7);
  }
  function clearPreviews(){bookOpening?.kill();bookOpened=false;gsap.set(find('souvenir-cover'),{rotationY:0,opacity:1});for(const item of Object.values(previews))if(item)URL.revokeObjectURL(item.url);previews={};previewKey='';previewTicket++;}
  async function ensurePreviews(){
    const key=JSON.stringify([name,phrase,language]);if(key===previewKey)return;
    clearPreviews();previewKey=key;const ticket=previewTicket;
    for(const kind of ['passport','postcard'] as const){const image=find<HTMLImageElement>(`preview-${kind}`);image.hidden=true;image.removeAttribute('src');}
    find('arrival-souvenirs').classList.add('is-preparing');
    try{
      const data={name,phrase:phrase||arrivalCopy[language].quote,language};
      const blobs=await Promise.all((['passport','postcard'] as const).map(kind=>createSouvenir(kind,data)));
      if(ticket!==previewTicket)return;
      for(const [index,kind] of (['passport','postcard'] as const).entries()){
        const url=URL.createObjectURL(blobs[index]);previews[kind]={url,blob:blobs[index]};
        const image=find<HTMLImageElement>(`preview-${kind}`);image.src=url;image.hidden=false;
      }
      souvenirMode=undefined;
      if(find('souvenir-passport').closest('[data-reveal]')?.classList.contains('is-visible'))openSouvenirPassport();
    }catch{if(ticket===previewTicket){previewKey='';souvenirMode='exportError';}}
    finally{if(ticket===previewTicket){find('arrival-souvenirs').classList.remove('is-preparing');renderStatus();}}
  }
  function renderStatus(){find('souvenir-status').textContent=souvenirMode?arrivalCopy[language][souvenirMode]:'';}
  function renderWall(){
    const w=arrivalCopy[language],entry=currentEntry();form.hidden=!!entry;
    if(input.value!==state.draft)input.value=state.draft;
    input.disabled=sending;submit.disabled=sending;submit.textContent=sending?w.wallSending:replaying?w.wallReplaySend:w.wallSend;
    find('wall-public').textContent=replaying?w.wallReplay:w.wallPublic;
    find('wall-count').textContent=`${Array.from(state.draft).length}/160`;
    feedback.textContent=errorKey?w[errorKey]:entry?(replaying?w.wallDemoDone:entry.status==='pending'?w.wallPending:w.wallSaved):replaying?w.wallReplay:'';
    feedback.hidden=!feedback.textContent;
    input.setAttribute('aria-invalid',String(!!errorKey&&['wallLength','wallLanguage','wallLinks','wallSpam'].includes(errorKey)));
    const notice=find('wall-notice');notice.textContent=wallMode==='loading'&&!entries.length?w.wallLoading:wallMode==='error'?w.wallLoadError:'';
    notice.hidden=!notice.textContent;find('wall-retry').hidden=wallMode!=='error';
    find('wall-scroll').hidden=false;find('wall-browse').hidden=false;
    const more=find<HTMLButtonElement>('wall-more');more.hidden=!cursor;more.disabled=loading;more.textContent=loading?w.wallLoading:w.wallMore;
    const notes=[...entries.map(entry=>({...entry,welcome:false})),...welcomeNotes[language].map((message,index)=>({id:`welcome-${index}`,message,created_at:'',welcome:true}))];
    list.replaceChildren(...notes.map(entry=>{
      const card=document.createElement('li'),quote=document.createElement('blockquote'),author=document.createElement('span');
      quote.textContent=entry.message;author.textContent=entry.welcome?w.wallWelcome:w.wallGuest;card.append(quote,author);return card;
    }));
  }
  function render(){
    const w=arrivalCopy[language];
    for(const el of document.querySelectorAll<HTMLElement>('[data-arrival-copy]')){
      const text=w[el.dataset.arrivalCopy as Words];if(typeof text==='string')el.textContent=text;
    }
    for(const chapter of ['story','souvenirs','wall'] as const)find(`arrival-${chapter}`).hidden=state.chapter!==chapter;
    caption.textContent=w[landingBeat];find('arrival-personal-phrase').textContent=`“${phrase||w.quote}”`;
    input.placeholder=w.wallPlaceholder;testimonials.translate(language);
    find('arrival-to-wall').textContent=state.finished?w.menuBack:w.wallNext;
    find('arrival-materials').textContent=state.finished?w.menuBack:w.back;
    for(const kind of ['passport','postcard'] as const)find<HTMLImageElement>(`preview-${kind}`).alt=kind==='passport'?w.passportTitle:w.postcardLabel;
    renderWall();renderStatus();
    if(state.chapter==='souvenirs'&&!root.hidden)void ensurePreviews();
  }
  async function refreshWall(append=false){
    if(loading)return;loading=true;wallMode='loading';renderWall();const ticket=generation;
    try{
      const page=await readWall(append?cursor:null);if(ticket!==generation)return;
      const combined=append?[...entries,...page.entries]:page.entries;
      entries=[...new Map(combined.map(entry=>[entry.id,entry])).values()];cursor=page.nextCursor;wallMode='ready';
      if(own.entry&&entries.some(entry=>entry.id===own.entry!.id)){own.entry.status='approved';persistOwn();}
    }catch{if(ticket===generation)wallMode='error';}
    finally{if(ticket===generation){loading=false;renderWall();}}
  }
  function unlock(){document.documentElement.classList.remove('is-landing');intro.hidden=true;closing.hidden=true;content.inert=false;}
  function focusChapter(){
    const id=state.chapter==='story'?'arrival-title':state.chapter==='souvenirs'?'souvenir-title':'wall-title';
    find(id).focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});
  }
  function setChapter(chapter:Chapter){
    state.chapter=chapter;testimonials.pause();render();onChange();focusChapter();sound('paper');
    if(chapter==='wall')void refreshWall();
  }
  function finishLanding(){stopFlightSound();timeline?.kill();timeline=undefined;state.landed=true;unlock();render();onChange();focusChapter();}
  find('skip-arrival').addEventListener('click',finishLanding);
  find('arrival-reveal').addEventListener('click',()=>setChapter('souvenirs'));
  find('arrival-to-wall').addEventListener('click',()=>state.finished?onFinish():setChapter('wall'));
  find('wall-retry').addEventListener('click',()=>void refreshWall());
  find('wall-more').addEventListener('click',()=>void refreshWall(true));
  input.addEventListener('input',()=>{state.draft=input.value;errorKey=undefined;find('wall-count').textContent=`${Array.from(state.draft).length}/160`;input.setAttribute('aria-invalid','false');feedback.hidden=true;onChange();});
  const errors:Record<string,Words>={length:'wallLength',links:'wallLinks',language:'wallLanguage',spam:'wallSpam',rate:'wallRate'};
  form.addEventListener('submit',async event=>{
    event.preventDefault();if(sending||currentEntry())return;
    const check=checkFootprint(state.draft);
    if(!check.ok){errorKey=errors[check.reason];renderWall();feedback.focus({preventScroll:true});sound('error');return;}
    if(replaying){replayEntry={id:crypto.randomUUID(),message:check.message,created_at:new Date().toISOString(),status:'demo'};state.draft='';renderWall();feedback.focus({preventScroll:true});sound('success');return;}
    sending=true;errorKey=undefined;renderWall();persistOwn();const ticket=generation;
    try{
      const entry=await postFootprint(check.message,language,own.token);own.entry=entry;persistOwn();if(ticket!==generation)return;
      state.draft='';onChange();sound('success');void refreshWall();
    }catch(error){if(ticket===generation){errorKey=errors[error instanceof Error?error.message:'']??'wallError';sound('error');}}
    finally{if(ticket===generation){sending=false;renderWall();feedback.focus({preventScroll:true});}}
  });
  for(const kind of ['passport','postcard'] as const)find<HTMLButtonElement>(`save-${kind}`).addEventListener('click',async()=>{
    if(exporting)return;exporting=true;souvenirMode='downloading';renderStatus();
    const buttons=root.querySelectorAll<HTMLButtonElement>('[data-souvenir]');buttons.forEach(b=>b.disabled=true);
    try{
      const blob=previews[kind]?.blob??await createSouvenir(kind,{name,phrase:phrase||arrivalCopy[language].quote,language});
      const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=`voyageurs-${kind}.png`;link.click();
      window.setTimeout(()=>URL.revokeObjectURL(url),60000);souvenirMode='saved';sound('success');
    }catch{souvenirMode='exportError';}
    finally{exporting=false;buttons.forEach(b=>b.disabled=false);renderStatus();}
  });
  function finishTrip(){
    if(closingTimeline)return;testimonials.pause();
    // Switch the underlying screen while the opaque closing layer still covers it.
    const done=()=>{closingTimeline=undefined;state.finished=true;onChange();onFinish();unlock();};
    if(reducedMotion.matches){done();return;}
    const book=find('closing-book'),cover=find('closing-cover'),paper=book.querySelector('.closing-paper')!;
    gsap.set(closing,{opacity:1});gsap.set(paper,{opacity:1});
    closing.hidden=false;content.inert=true;document.documentElement.classList.add('is-landing');closing.focus({preventScroll:true});sound('paper');
    closingTimeline=gsap.timeline({onComplete:done})
      .fromTo(book,{opacity:0,y:18,rotation:0,scale:1},{opacity:1,y:0,duration:.4},0)
      .fromTo(cover,{rotationY:-155},{rotationY:0,duration:1.15,ease:'sine.inOut'},.3)
      .set(paper,{opacity:0},1.45)
      .call(()=>sound('finish'),[],1.45)
      .to(book,{y:-65,rotation:-9,scale:1.04,duration:.42,ease:'power2.out'},1.7)
      .call(()=>sound('whoosh'),[],2.1)
      .to(book,{y:()=>window.innerHeight+400,rotation:145,scale:.72,duration:.82,ease:'power2.in'},2.12);

  }
  find('finish-journey').addEventListener('click',finishTrip);
  render();
  return {
    translate(lang:Language,passenger:string,takeaway:string){language=lang;name=passenger;phrase=takeaway;render();},
    play(){
      if(state.finished&&state.chapter==='wall')state.chapter='story';
      render();
      if(state.landed){unlock();focusChapter();if(state.chapter==='wall')void refreshWall();return;}
      intro.hidden=false;content.inert=true;document.documentElement.classList.add('is-landing');find('skip-arrival').focus({preventScroll:true});
      if(reducedMotion.matches){finishLanding();return;}
      landingBeat='landing';caption.textContent=arrivalCopy[language].landing;startFlightSound('landing');
      gsap.set([intro,scene,sky,runway],{clearProps:'opacity,transform'});
      timeline=gsap.timeline({onComplete:finishLanding})
        .fromTo(scene,{opacity:0},{opacity:1,duration:.65},0)
        .fromTo(sky,{opacity:1,y:-12},{opacity:0,y:24,duration:3.1,ease:'sine.inOut'},.8)
        .fromTo(runway,{opacity:0,y:22},{opacity:1,y:0,duration:3.1,ease:'sine.inOut'},.8)
        .call(()=>{landingBeat='runway';caption.textContent=arrivalCopy[language].runway;},[],1.7)
        .to(scene,{y:2,duration:.08},3.9).to(scene,{y:0,duration:.3,ease:'sine.out'},3.98)
        .call(()=>{landingBeat='landed';caption.textContent=arrivalCopy[language].landed;},[],4.1)
        .to(intro,{opacity:0,duration:.7,clearProps:'opacity'},5.1);
    },
    revisit(){state.chapter='story';render();focusChapter();},
    setReplay(value:boolean){replaying=value;replayEntry=undefined;render();},
    snapshot:()=>({...state}),
    restore(value:unknown){
      if(!value||typeof value!=='object')return;const saved=value as Record<string,unknown>;
      const chapter:Chapter=saved.chapter==='wall'||saved.wallOpen===true?'wall':saved.chapter==='souvenirs'||saved.revealed===true?'souvenirs':'story';
      state={landed:saved.landed===true,chapter,finished:saved.finished===true,draft:typeof saved.draft==='string'?saved.draft.slice(0,320):''};render();
    },
    reset(){stopFlightSound();replayEntry=undefined;generation++;timeline?.kill();closingTimeline?.kill();timeline=undefined;closingTimeline=undefined;testimonials.reset();unlock();clearPreviews();state=fresh();loading=false;sending=false;errorKey=undefined;souvenirMode=undefined;entries=[];cursor=null;wallMode='idle';for(const el of root.querySelectorAll('[data-reveal]'))el.classList.remove('is-visible');render();},
    pauseAudio(){testimonials.pause();stopFlightSound();},
  };
}
