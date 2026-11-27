import {arrivalTestimonials} from './arrival-config';
import type {Language} from './copy';

export function createTestimonials(root:HTMLElement){
  const video=root.querySelector<HTMLVideoElement>('video')!;
  const choices=root.querySelector<HTMLElement>('[data-testimonial-choices]')!;
  const position=root.querySelector<HTMLElement>('[data-testimonial-position]')!;
  const frame=root.querySelector<HTMLElement>('[data-testimonial-frame]')!;
  const feedback=root.querySelector<HTMLElement>('[data-testimonial-feedback]')!;
  const retry=root.querySelector<HTMLButtonElement>('[data-testimonial-retry]')!;
  const base=`${import.meta.env.BASE_URL}materiales/testimonios/`;
  let selected=0,language:Language='ar',state:'idle'|'loading'|'ready'|'error'='idle',renderedChoices='';
  const watched=new Set<number>();
  const text=(ar:string,fr:string)=>language==='ar'?ar:fr;
  const label=(i:number)=>`${text('Testimonio','Témoignage')} ${i+1}`;
  function render(){
    const current=arrivalTestimonials[selected];
    position.textContent=`${label(selected)} · ${selected+1} / ${arrivalTestimonials.length}`;
    video.setAttribute('aria-label',`${label(selected)} · ${text('video original','vidéo originale')} · ${current.duration}`);
    choices.setAttribute('aria-label',text('Elegí un testimonio','Choisis un témoignage'));
    const choicesKey=JSON.stringify([selected,language,[...watched]]);
    if(choicesKey!==renderedChoices){renderedChoices=choicesKey;choices.replaceChildren(...arrivalTestimonials.map((item,i)=>{
      const button=document.createElement('button');button.type='button';button.dataset.testimonial=String(i);button.setAttribute('aria-pressed',String(i===selected));
      const image=document.createElement('img');image.src=base+item.poster;image.alt='';image.width=40;image.height=70;image.loading='lazy';image.decoding='async';
      const copy=document.createElement('span'),name=document.createElement('strong'),detail=document.createElement('small');name.textContent=label(i);detail.textContent=item.duration+(watched.has(i)?text(' · Visto',' · Vu'):'');copy.append(name,detail);button.append(image,copy);return button;
    }));}
    frame.dataset.mediaState=state;frame.setAttribute('aria-busy',String(state==='loading'));
    feedback.hidden=state!=='loading'&&state!=='error';
    feedback.querySelector('span')!.textContent=state==='error'?text('No se pudo cargar este testimonio.','Impossible de charger ce témoignage.'):text('Cargando testimonio…','Chargement du témoignage…');
    retry.hidden=state!=='error';retry.textContent=text('Reintentar','Réessayer');
  }
  function select(index:number){
    if(index<0||index>=arrivalTestimonials.length)return;
    video.pause();selected=index;state='idle';const item=arrivalTestimonials[selected];
    video.poster=base+item.poster;video.src=base+item.file;render();
  }
  choices.addEventListener('click',event=>{
    const button=event.target instanceof Element?event.target.closest<HTMLButtonElement>('[data-testimonial]'):null;if(!button)return;
    const index=Number(button.dataset.testimonial);if(index===selected)return;select(index);
    choices.querySelector<HTMLButtonElement>(`[data-testimonial="${index}"]`)?.focus({preventScroll:true});
  });
  const loading=()=>{if(video.paused&&video.readyState===0)return;state='loading';render();};
  video.addEventListener('loadstart',loading);video.addEventListener('waiting',loading);
  for(const event of ['loadeddata','canplay','playing'])video.addEventListener(event,()=>{state='ready';render();});
  video.addEventListener('play',()=>{for(const other of document.querySelectorAll<HTMLMediaElement>('audio,video'))if(other!==video)other.pause();});
  video.addEventListener('error',()=>{state='error';render();});
  video.addEventListener('ended',()=>{watched.add(selected);render();});
  retry.addEventListener('click',()=>{state='loading';render();video.load();});
  select(0);
  return {translate(lang:Language){language=lang;render();},pause(){video.pause();},reset(){watched.clear();select(0);}};
}
