import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type {copy,CopyKey,Language} from './copy';
import {bindPageSwipes} from './page-swipes';
import {reportSlides,renderReportSlide} from './report-summary';
import secondaryParagraphs from './secondary-document.json';
import {bindMaterialImages,materialImageSize} from './material-images';

type PdfLibrary=typeof import('pdfjs-dist');
type PdfDocument=Awaited<ReturnType<PdfLibrary['getDocument']>['promise']>;
type ReaderCopy=(typeof copy)[Language];
const reportUrl=`${import.meta.env.BASE_URL}materiales/Pasaporte_de_la_practica_docente.pdf`;
const secondaryUrl=`${import.meta.env.BASE_URL}materiales/secundaria/Estrada_Las_practicas_docentes.docx`;
const secondaryPosterPath='secundaria/ensenar-frances-contextos-diversos.jpg';
const unatePosterPath='unate/ensenar-frances-diferentes-escenarios.jpg';
const zoomLevels=[1,1.35,1.8,2.4,3];

export function createReader(onOpen:()=>boolean){
  const element=document.querySelector<HTMLElement>('#reader')!;
  const find=<T extends HTMLElement=HTMLElement>(id:string)=>element.querySelector<T>(`#${id}`)!;
  const view=find('reader-view'),paper=find('reader-paper'),title=find('reader-title'),notice=find('reader-notice'),message=find('reader-message');
  const retry=find<HTMLButtonElement>('retry-reader'),download=find<HTMLAnchorElement>('download-report'),pager=find('reader-page');
  const prev=find<HTMLButtonElement>('previous-page'),next=find<HTMLButtonElement>('next-page');
  const minus=find<HTMLButtonElement>('zoom-out'),plus=find<HTMLButtonElement>('zoom-in'),fit=find<HTMLButtonElement>('zoom-fit');
  const swipeHint=find('pdf-swipe-hint'),closeButton=find<HTMLButtonElement>('close-reader');
  const sections=find('reader-sections'),pageControls=find('report-controls'),summaryButton=find<HTMLButtonElement>('show-report-summary'),fullButton=find<HTMLButtonElement>('show-full-report');
  const stage=document.querySelector<HTMLElement>('.stage')!,progress=document.querySelector<HTMLElement>('#progress')!,journey=document.querySelector<HTMLElement>('#journey')!;
  const openButton=document.querySelector<HTMLButtonElement>('#open-passport')!,secondaryButton=document.querySelector<HTMLButtonElement>('#open-secondary')!,unateButton=document.querySelector<HTMLButtonElement>('#open-unate')!;
  download.href=reportUrl;
  let documentTask:ReturnType<PdfLibrary['getDocument']>|undefined,pdf:PdfDocument|undefined;
  let renderer:ReturnType<Awaited<ReturnType<PdfDocument['getPage']>>['render']>|undefined;
  let number=1,summaryIndex=0,zoom=0,generation=0,originY=0;
  let content:'summary'|'pdf'|'secondary'|'unate'='summary',mode:'loading'|'ready'|'error'='ready';
  let words:ReaderCopy,language:Language='ar';
  let priorOffset={x:0,y:0};
  const text=(ar:string,fr:string)=>language==='ar'?ar:fr;

  function controls(){
    const summary=content==='summary',isPdf=content==='pdf',usable=summary||isPdf&&mode==='ready'&&Boolean(pdf);
    element.dataset.content=content;
    title.textContent=content==='unate'?'UNATE':content==='secondary'?text('Secundaria · Veronica Estrada','Secondaire · Veronica Estrada'):(words?.reportTitle??'Informe de práctica');
    sections.hidden=pageControls.hidden=content==='secondary'||content==='unate';
    sections.setAttribute('aria-label',words?.reportTitle??'Informe de práctica');
    summaryButton.textContent=text('Resumen','Synthèse');fullButton.textContent=text('Informe completo','Rapport complet');
    summaryButton.setAttribute('aria-pressed',String(summary));fullButton.setAttribute('aria-pressed',String(isPdf));
    pager.textContent=summary?`${text('Resumen','Synthèse')} ${summaryIndex+1} / ${reportSlides[language].length}`:pdf?`${text('Página','Page')} ${number} / ${pdf.numPages}`:'—';
    prev.disabled=!usable||summary&&summaryIndex===0;
    next.disabled=!usable||isPdf&&number>=(pdf?.numPages??0);
    next.setAttribute('aria-label',summary&&summaryIndex===reportSlides[language].length-1?text('Leer informe completo','Lire le rapport complet'):words?.nextPage??'Página siguiente');
    minus.disabled=!isPdf||mode!=='ready'||zoom===0;plus.disabled=!isPdf||mode!=='ready'||zoom===zoomLevels.length-1;fit.disabled=minus.disabled;
    find('zoom-out').parentElement!.hidden=!isPdf;
    const loading=isPdf&&mode==='loading';
    notice.hidden=!isPdf||mode==='ready';notice.classList.toggle('is-loading',loading);paper.setAttribute('aria-busy',String(loading));
    retry.hidden=download.hidden=!isPdf||mode!=='error';
    if(isPdf&&mode!=='ready'&&words){const key:CopyKey=mode==='error'?'errorPdf':'loadingPdf';message.textContent=words[key];}
    swipes.refresh();swipeHint.hidden=!usable||isPdf&&zoom!==0||content==='secondary';
  }

  function cancelRender(){++generation;renderer?.cancel();renderer=undefined;}
  function renderSummary(focus=false){
    cancelRender();content='summary';mode='ready';paper.replaceChildren(renderReportSlide(summaryIndex,language));controls();view.scrollTo(0,0);
    if(focus)paper.querySelector<HTMLElement>('h3')?.focus({preventScroll:true});
  }
  function appendPoster(article:HTMLElement,path:string,alt:string){
    const url=`${import.meta.env.BASE_URL}materiales/${path}`;
    const figure=document.createElement('figure');figure.className='practice-image secondary-poster';
    const frame=document.createElement('div');frame.className='practice-photo-surface';frame.dataset.imageState='loading';frame.setAttribute('aria-busy','true');
    const [width,height]=materialImageSize(path);frame.style.setProperty('--image-ratio',`${width}/${height}`);
    const status=document.createElement('div');status.className='practice-image-status';status.setAttribute('role','status');
    const spinner=document.createElement('span');spinner.className='practice-image-spinner';spinner.setAttribute('aria-hidden','true');
    const loading=document.createElement('span');loading.textContent=text('Cargando imagen…','Chargement de l’image…');status.append(spinner,loading);
    const image=document.createElement('img');image.src=url;image.width=width;image.height=height;image.decoding='async';image.draggable=false;image.alt=alt;
    frame.append(status,image);figure.append(frame);
    const caption=document.createElement('figcaption');caption.lang=language==='ar'?'es':'fr';
    const enlarge=document.createElement('a');enlarge.href=url;enlarge.target='_blank';enlarge.rel='noopener noreferrer';enlarge.textContent=text('Abrir la infografía a tamaño completo','Ouvrir l’infographie en taille réelle');caption.append(enlarge);figure.append(caption);article.append(figure);
  }
  function renderUnate(){
    cancelRender();content='unate';mode='ready';
    const article=document.createElement('article');article.className='secondary-document';article.lang=language==='ar'?'es':'fr';
    const byline=document.createElement('p');byline.className='secondary-byline';byline.textContent=text('UNATE · Adultos mayores · Nivel 3','UNATE · Adultes seniors · Niveau 3');
    const heading=document.createElement('h3');heading.textContent=text('Enseñar francés en diferentes escenarios','Enseigner le français dans différents contextes');article.append(byline,heading);
    appendPoster(article,unatePosterPath,text('Infografía en español sobre la práctica en UNATE y el Colegio Secundario Polivalente. En UNATE se trabajaron los Juegos Olímpicos, los deportes y los pasatiempos, y la alternancia entre passé composé e imparfait. La reflexión destaca el equilibrio entre habilidades pedagógicas y dominio lingüístico.','Infographie en espagnol sur le stage à l’UNATE et au Colegio Secundario Polivalente. À l’UNATE : les Jeux Olympiques, les sports et les loisirs, et l’alternance passé composé / imparfait. La réflexion souligne l’équilibre entre compétences pédagogiques et maîtrise de la langue.'));
    paper.replaceChildren(article);bindMaterialImages(paper,language);controls();view.scrollTo(0,0);
  }
  function renderSecondary(){
    cancelRender();content='secondary';mode='ready';
    const article=document.createElement('article');article.className='secondary-document';article.lang='es';
    const byline=document.createElement('p');byline.className='secondary-byline';byline.textContent=text('Veronica Estrada · Relato de práctica · Lectura en español','Veronica Estrada · Récit de stage · Lecture en espagnol');article.append(byline);
    appendPoster(article,secondaryPosterPath,text('Enseñar francés en contextos diversos: un viaje de desafíos, aprendizajes y compromiso. Infografía sobre el punto de partida, los desafíos, primero y tercer año, las decisiones pedagógicas y la reflexión final.','Enseigner le français dans des contextes variés : défis, apprentissages et engagement. Infographie en espagnol sur le contexte, les défis, les cours de première et troisième année, les choix pédagogiques et la réflexion finale.'));
    const headings=new Set([1,8,13,18,29,37,43]);
    secondaryParagraphs.forEach((paragraph,i)=>{const node=document.createElement(i===0?'h3':headings.has(i)?'h4':'p');node.textContent=paragraph;article.append(node);});
    const original=document.createElement('a');original.className='secondary-source';original.href=secondaryUrl;original.download='Estrada.Las prácticas docentes.docx';original.textContent=text('Descargar el documento original (Word)','Télécharger le document original (Word)');article.append(original);
    paper.replaceChildren(article);bindMaterialImages(paper,language);controls();view.scrollTo(0,0);
  }

  async function render(offset={x:0,y:0}){
    cancelRender();const id=generation;
    if(!pdf||element.hidden||content!=='pdf')return;
    mode='loading';controls();
    try{
      const page=await pdf.getPage(number);if(id!==generation||content!=='pdf')return;
      const unit=page.getViewport({scale:1}),width=Math.max(220,view.clientWidth-24);
      const viewport=page.getViewport({scale:width*zoomLevels[zoom]/unit.width}),canvas=document.createElement('canvas');
      const scale=Math.min(window.devicePixelRatio||1,2,1950/viewport.width);
      canvas.width=Math.round(viewport.width*scale);canvas.height=Math.round(viewport.height*scale);canvas.style.width=`${viewport.width}px`;canvas.style.height=`${viewport.height}px`;
      canvas.setAttribute('role','img');canvas.setAttribute('aria-label',`${text('Página','Page')} ${number} / ${pdf.numPages}`);
      renderer=page.render({canvas,viewport,transform:[scale,0,0,scale,0,0]});await renderer.promise;
      if(id!==generation||element.hidden||content!=='pdf')return;
      paper.replaceChildren(canvas);mode='ready';controls();view.scrollTo(offset.x,offset.y);
    }catch{if(id!==generation)return;mode='error';controls();}
  }
  async function load(){
    cancelRender();const id=generation;mode='loading';controls();
    if(pdf){await render(priorOffset);return;}
    try{
      const library=await import('pdfjs-dist/legacy/build/pdf.mjs')as PdfLibrary;
      if(id!==generation||element.hidden||content!=='pdf')return;
      library.GlobalWorkerOptions.workerSrc=workerUrl;documentTask??=library.getDocument({url:reportUrl});pdf=await documentTask.promise;
      if(id===generation&&!element.hidden&&content==='pdf')await render(priorOffset);
    }catch{documentTask=undefined;if(id!==generation)return;mode='error';controls();}
  }
  function showFull(){
    if(element.hidden)return;
    cancelRender();content='pdf';paper.replaceChildren();priorOffset={x:0,y:0};void load();
  }

  function syncRoute(){
    const requested=location.hash==='#informe'?'summary':location.hash==='#secundaria'?'secondary':location.hash==='#unate'?'unate':undefined;
    if(requested){
      if(!element.hidden&&(requested==='summary'?(content==='summary'||content==='pdf'):content===requested))return;
      if(!onOpen()){history.replaceState(history.state,'',location.pathname+location.search);return;}
      if(element.hidden)originY=window.scrollY;
      element.inert=false;element.hidden=false;journey.classList.add('is-reading');stage.inert=progress.inert=true;
      if(requested==='secondary')renderSecondary();else if(requested==='unate')renderUnate();else{summaryIndex=0;renderSummary();}
      title.focus({preventScroll:true});
    }else if(!element.hidden){
      const trigger=content==='unate'?unateButton:content==='secondary'?secondaryButton:openButton;
      swipes.reset();cancelRender();element.inert=true;element.hidden=true;
      if(!location.hash.startsWith('#archivo-')&&!location.hash.startsWith('#practica-')){journey.classList.remove('is-reading');stage.inert=progress.inert=false;window.scrollTo(0,originY);trigger.focus({preventScroll:true});}
    }
  }
  function close(){if(history.state?.passportReader)history.back();else{history.replaceState(history.state,'',location.pathname+location.search);syncRoute();}}
  function changePage(delta:number){
    if((content!=='summary'&&content!=='pdf')||(delta<0?prev.disabled:next.disabled))return;
    if(content==='summary'){
      if(summaryIndex+delta===reportSlides[language].length){number=1;showFull();return;}
      summaryIndex+=delta;renderSummary(true);return;
    }
    if(number===1&&delta<0){summaryIndex=reportSlides[language].length-1;renderSummary(true);return;}
    number+=delta;priorOffset={x:0,y:0};void render();
  }
  function changeZoom(value:number){
    if(content!=='pdf'||mode!=='ready'||value<0||value>=zoomLevels.length)return;
    const factor=zoomLevels[value]/zoomLevels[zoom],x=Math.max(0,(view.scrollLeft+view.clientWidth/2)*factor-view.clientWidth/2),y=view.scrollTop*factor;
    zoom=value;priorOffset={x,y};void render(priorOffset);
  }
  const swipes=bindPageSwipes(view,paper,{canStart:()=>!element.hidden&&(content==='summary'||content==='pdf'&&mode==='ready'&&zoom===0),turnPage(delta){if(delta<0?prev.disabled:next.disabled)return false;changePage(delta);return true;}});
  for(const [button,hash]of [[openButton,'#informe'],[secondaryButton,'#secundaria'],[unateButton,'#unate']]as const)button.addEventListener('click',()=>{history.pushState({...history.state,passportReader:true},'',hash);syncRoute();});
  closeButton.addEventListener('click',close);prev.addEventListener('click',()=>changePage(-1));next.addEventListener('click',()=>changePage(1));
  summaryButton.addEventListener('click',()=>{summaryIndex=0;renderSummary(true);});fullButton.addEventListener('click',showFull);
  paper.addEventListener('click',event=>{if(event.target instanceof Element&&event.target.closest('[data-report-action="full"]')){number=1;showFull();}});
  minus.addEventListener('click',()=>changeZoom(zoom-1));plus.addEventListener('click',()=>changeZoom(zoom+1));fit.addEventListener('click',()=>changeZoom(0));retry.addEventListener('click',()=>void load());
  window.addEventListener('popstate',syncRoute);document.addEventListener('keydown',event=>{if(event.key==='Escape'&&!element.hidden)close();});
  let viewportWidth=0;
  new ResizeObserver(()=>{if(element.hidden||view.clientWidth===viewportWidth)return;viewportWidth=view.clientWidth;if(content==='pdf'&&pdf&&mode==='ready')void render({x:view.scrollLeft,y:view.scrollTop});}).observe(view);
  return{
    translate(translated:ReaderCopy,lang:Language){words=translated;language=lang;if(!element.hidden){const offset={x:view.scrollLeft,y:view.scrollTop};if(content==='summary')renderSummary();else if(content==='secondary')renderSecondary();else if(content==='unate')renderUnate();else if(pdf&&mode==='ready')void render(offset);view.scrollTo(offset.x,offset.y);}controls();},
    syncRoute,
    reset(){swipes.reset();cancelRender();number=1;summaryIndex=zoom=0;content='summary';mode='ready';priorOffset={x:0,y:0};},
  };
}
