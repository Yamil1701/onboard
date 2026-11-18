import { gsap } from 'gsap';
import { copy, type CopyKey, type Language } from './copy';
import { createTakeoff, flightExit } from './takeoff';
import { createReader } from './reader';
import { createArchive } from './archive';
import { createWorkshop } from './workshop';
import { createMemoryTransition } from './memory-transition';
import { createFinalSurvey } from './final-survey';
import { createArrival } from './arrival';
import { createSurveySync } from './survey-sync';
import { initSound, sound, translateSound, startFlightSound, stopFlightSound } from './sound';
import './style.css';
import './workshop.css';
import './memory.css';
import './final-survey.css';
import './arrival.css';

type Phase = 'gate' | 'boarding' | 'takeoff' | 'survey' | 'materials' | 'workshop' | 'finalSurvey' | 'arrival' | 'menu';
type Expectation = 'adapt' | 'play' | 'ideas';

function find<T extends HTMLElement>(id: string): T {
  return document.getElementById(id) as T;
}

const journey = find('journey');
const languageGroup = find('languages');
const languageButtons = Array.from(languageGroup.querySelectorAll<HTMLButtonElement>('button'));
const stageLabel = find('stage-label');
const destination = find('destination');
const gate = find('gate');
const windowPhoto = find<HTMLImageElement>('window-photo');
const boarding = find('boarding');
const ticket = find('ticket');
const passportCover = find<HTMLButtonElement>('open-passport-cover');
const passportTitle = find('passport-page-title');
const ticketForm = find<HTMLFormElement>('ticket-form');
const boardButton = ticketForm.querySelector<HTMLButtonElement>('button')!;
const boardAction = boardButton.querySelector<HTMLElement>('[data-copy]')!;
const nameInput = find<HTMLInputElement>('passenger');
const stamp = find('stamp');
const takeoff = createTakeoff(find('flight-scene'));
const survey = find('survey');
const surveyTitle = find('survey-title');
const surveyForm = find<HTMLFormElement>('survey-form');
const send = find<HTMLButtonElement>('send-answer');
const result = find('survey-result');
const answerTitle = find('response-title');
const chosenAnswer = find('chosen-answer');
const confirmationStamp = result.querySelector('.confirmation-stamp')!;
const continueJourney = find('continue-journey');
const materials = find('materials');
const materialsTitle = find('materials-title');
const wallet = find('wallet');
const walletContents = find('wallet-contents');
const walletCover = find('wallet-cover');
const workshopSection = find('workshop');
const workshopTitle = find('workshop-title');
const enterWorkshop = find<HTMLButtonElement>('enter-workshop');
const finalSection = find('final-survey');
const finalTitle = find('final-title');
const resumeFinal = find<HTMLButtonElement>('resume-final-survey');
const arrivalSection = find('arrival');
const resumeArrival = find<HTMLButtonElement>('resume-arrival');
const menuSection=find('travel-menu'),menuButton=find('explore-menu'),topMenu=find('top-menu');
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const progress = find('progress');
const progressValue = find('progress-value');
const restart = find<HTMLButtonElement>('restart-journey');
const pollOptions = Array.from(surveyForm.querySelectorAll<HTMLInputElement>('input[type=radio]'));
const translated = document.querySelectorAll<HTMLElement>('[data-copy]');

const storageKey = 'voyageurs-preview';
const introReadingTime = 2800;
const stampExtraTime = 1.5;
let phase: Phase = 'gate';
const state: {
  language: Language;
  name: string;
  selected: Expectation | null;
  submitted: Expectation | null;
  furthestStop: number;
  walletPage:1|2;
  reliving:boolean;
} = { language: 'ar', name: '', selected: null, submitted: null, furthestStop: 1, walletPage:1, reliving:false };
let storageBlock = false;
let flight: gsap.core.Timeline | undefined;
let flightBeat: 'runway' | 'climb' | null = null;
let walletOpening: gsap.core.Timeline | undefined;
let passportOpening: gsap.core.Timeline | undefined;
let passportOpened = false;
let closingMemory: Animation | undefined;
const reader = createReader(() => phase === 'materials');
const archive = createArchive(() => phase === 'materials');
const workshop = createWorkshop(save);
const memory = createMemoryTransition();
const finalSurvey = createFinalSurvey(save);
const arrival = createArrival(save,()=>openMenu(true));
const surveySync=createSurveySync(renderSurveySync);
let menuEntrance:gsap.core.Timeline|undefined;
function renderSurveySync(){
  const status=surveySync.status(state.language,state.reliving);
  for(const id of ['survey-sync-status','final-sync-status'])find(id).textContent=status;
}
initSound();

function isExpectation(value: unknown): value is Expectation {
  return value === 'adapt' || value === 'play' || value === 'ideas';
}

function restore() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
    if (!stored) return;
    state.walletPage=stored.walletPage===2?2:1;
    if (stored.language === 'fr') state.language = 'fr';
    if (typeof stored.name === 'string') state.name = stored.name;
    if (isExpectation(stored.selected)) state.selected = stored.selected;
    if (isExpectation(stored.submitted)) state.submitted = stored.submitted;
    workshop.restore(stored.workshop);
    finalSurvey.restore(stored.finalSurvey);
    arrival.restore(stored.arrival);
    if(arrival.snapshot().finished){
      phase=stored.view==='materials'?'materials':stored.view==='workshop'?'workshop':stored.view==='arrival'?'arrival':'menu';
    }
    else if (stored.stop === 6 && state.submitted && finalSurvey.snapshot().submitted) phase = 'arrival';
    else if (stored.stop === 5 && state.submitted) phase = 'finalSurvey';
    else if (stored.stop === 4 && state.submitted) phase = 'workshop';
    else if (stored.stop === 3 && state.submitted) phase = 'materials';
    else if (stored.stop === 2) phase = 'survey';
    const priorProgress = Number.isInteger(stored.furthestStop) && stored.furthestStop >= 1 && stored.furthestStop <= 6
      ? stored.furthestStop : 1;
    const participated = workshop.snapshot().replies.some(reply => reply !== null) ? 4 : 1;
    state.furthestStop = Math.max(currentStop(), priorProgress, participated);
  } catch {
    // A malformed or inaccessible session should still allow boarding.
  }
}

function save() {
  if(state.reliving)return;
  if(state.submitted)surveySync.queue({language:state.language,expectation:state.submitted,answers:finalSurvey.snapshot().submitted?finalSurvey.snapshot().answers:null,rating:finalSurvey.snapshot().submitted?finalSurvey.snapshot().rating:null});
  renderSurveySync();
  if (storageBlock) return;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({
      ...state,
      stop: currentStop(),
      view: phase,
      workshop: workshop.snapshot(),
      finalSurvey: finalSurvey.snapshot(),
      arrival: arrival.snapshot(),
    }));
  } catch {
    storageBlock = true;
  }
}

function renderDestination(animateIntro: boolean) {
  const rows = copy[state.language].boardRows;
  const columns = Math.max(...rows.map(row => row.length));
  destination.setAttribute('aria-label', rows.join(' '));
  destination.style.setProperty('--flap-columns', String(columns));
  destination.replaceChildren(...rows.map((row, rowIndex) => {
    const line = document.createElement('span');
    line.className = 'flap-row';
    line.setAttribute('aria-hidden', 'true');
    for (const char of row) {
      const flap = document.createElement('span');
      flap.className = 'flap';
      if (char !== ' ') flap.textContent = char;
      if (animateIntro) {
        flap.classList.add('is-arriving');
        if(char!==' ')sound('letter',rowIndex*.17+line.children.length*.045+.08);
        flap.style.setProperty('--letter-delay', `${rowIndex * 170 + line.children.length * 45}ms`);
      }
      line.append(flap);
    }
    return line;
  }));
}

function renderPoll() {
  send.disabled = state.selected === null;
  surveyForm.hidden = state.submitted !== null;
  result.hidden = state.submitted === null;
  if (state.submitted) chosenAnswer.textContent = copy[state.language][state.submitted];
}

function renderStageLabel() {
  if(phase==='menu'){stageLabel.dataset.copy='travelMenu';stageLabel.textContent=copy[state.language].travelMenu;return;}
  const key = phase === 'materials' || phase === 'survey' || phase === 'workshop' || phase === 'finalSurvey' || phase === 'arrival' ? phase : flightBeat ?? 'welcome';
  stageLabel.dataset.copy = key;
  stageLabel.textContent = copy[state.language][key];
}

function renderLanguage(animateIntro = false) {
  const language = copy[state.language];
  document.documentElement.lang = state.language === 'fr' ? 'fr' : 'es-AR';
  document.title = `${language.titleLead} ${language.titleEnd}`;
  renderStageLabel();
  boardAction.dataset.copy = boardButton.disabled ? 'boardingAction' : 'board';
  for (const element of translated) {
    element.textContent = language[element.dataset.copy as CopyKey];
  }
  languageGroup.setAttribute('aria-label', language.language);
  languageGroup.dataset.language = state.language;
  for (const button of languageButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === state.language));
  }
  if (phase === 'gate') renderDestination(animateIntro);
  renderPoll();
  reader.translate(language);
  archive.translate(state.language);
  workshop.translate(state.language, state.name);
  memory.translate(state.language);
  finalSurvey.translate(state.language, state.submitted ? copy[state.language][state.submitted] : '',state.reliving);
  arrival.translate(state.language, state.name, workshop.takeaway());
  translateSound(state.language);
  if(state.reliving)document.querySelector<HTMLElement>('[data-copy=received]')!.textContent=language.reliveNotice;
  renderProgress();
  renderWallet();
  const finalLink=find('open-final-survey');finalLink.dataset.copy=arrival.snapshot().finished?'travelMenu':'enterFinalSurvey';finalLink.textContent=language[finalLink.dataset.copy as CopyKey];
}

function currentStop() {
  if (phase === 'arrival' || phase === 'menu') return 6;
  if (phase === 'finalSurvey') return 5;
  if (phase === 'workshop') return 4;
  if (phase === 'materials') return 3;
  return phase === 'survey' || phase === 'takeoff' ? 2 : 1;
}

function renderPhase() {
  journey.dataset.phase = phase;
  journey.dataset.completed=String(arrival.snapshot().finished);
  gate.hidden = phase !== 'gate';
  boarding.hidden = phase !== 'boarding';
  survey.hidden = phase !== 'survey';
  materials.hidden = phase !== 'materials';
  workshopSection.hidden = phase !== 'workshop';
  finalSection.hidden = phase !== 'finalSurvey';
  arrivalSection.hidden = phase !== 'arrival';
  menuSection.hidden=phase!=='menu';
  menuButton.hidden=!arrival.snapshot().finished||phase==='menu';
  topMenu.hidden=menuButton.hidden;stageLabel.parentElement!.hidden=!topMenu.hidden;
  progress.hidden = phase === 'gate'||phase==='menu'||arrival.snapshot().finished;
  find('relive-notice').hidden=!state.reliving;
  const stop = currentStop();
  state.furthestStop = Math.max(stop, state.furthestStop);
  progress.dataset.stop = String(state.furthestStop);
  renderProgress();
  renderWallet();
  resumeFinal.hidden = arrival.snapshot().finished || (!workshop.snapshot().stamped && state.furthestStop < 5);
  resumeArrival.hidden = arrival.snapshot().finished || state.furthestStop < 6;
}

function renderProgress(){
  const stop=currentStop(),words=copy[state.language];
  const labels=[words.welcome,words.survey,words.materials,words.workshopTitle,words.finalSurvey,words.arrival];
  progress.style.setProperty('--current',`${(stop-1)*20}%`);progress.style.setProperty('--travelled',`${(state.furthestStop-1)*20}%`);
  progressValue.textContent=`${stop} / 6`;find('progress-current').textContent=labels[stop-1];
  progress.querySelectorAll<HTMLElement>('.progress-track i').forEach((dot,index)=>{dot.classList.toggle('is-visited',index<state.furthestStop);dot.classList.toggle('is-current',index===stop-1);});
}
let leafAnimation:Animation|undefined;
function renderWallet(){
  find('wallet-page-1').hidden=state.walletPage!==1;find('wallet-page-2').hidden=state.walletPage!==2;
  find('wallet-next').hidden=state.walletPage===2;find('wallet-previous').hidden=state.walletPage===1;
  find('wallet-position').textContent=`0${state.walletPage} / 02`;
}
function turnWallet(page:1|2){
  if(phase!=='materials'||wallet.inert)return;leafAnimation?.cancel();state.walletPage=page;renderWallet();save();sound('paper');
  const leaf=find(`wallet-page-${page}`);if(!reducedMotion.matches)leafAnimation=leaf.animate([{opacity:.35,transform:`perspective(900px) rotateY(${page===2?10:-10}deg) translateX(${page===2?12:-12}px)`},{opacity:1,transform:'none'}],{duration:500,easing:'ease-out'});
  find(page===2?'wallet-previous':'wallet-next').focus({preventScroll:true});
}

function openBoarding(focusButton = false) {
  if (phase !== 'gate') return;
  sound('whoosh');
  phase = 'boarding';
  renderPhase();
  takeoff.preload();
  if (focusButton) passportCover.focus({ preventScroll: true });
  if (reducedMotion.matches) return;
  gsap.fromTo(windowPhoto, { opacity: .5, scale: 1.025 }, {
    opacity: 1, scale: 1, duration: .9, ease: 'sine.out', clearProps: 'opacity,transform',
  });
  gsap.fromTo(boarding, { opacity: 0, y: 28 }, {
    opacity: 1, y: 0, duration: 1.05, ease: 'power2.out', clearProps: 'opacity,transform',
  });
}

function prepareBoarding(focusButton = false) {
  find('intro-start').hidden=true;renderDestination(true);
  window.setTimeout(() => openBoarding(focusButton), introReadingTime);
}

function openPassport() {
  if (phase !== 'boarding' || passportOpened || passportOpening) return;
  sound('paper');
  passportCover.disabled = true;
  passportCover.setAttribute('aria-expanded', 'true');
  ticket.hidden = false;
  const finishOpening = () => {
    passportOpening = undefined;
    passportOpened = true;
    passportCover.hidden = true;
    ticket.inert = false;
    passportTitle.focus({ preventScroll: true });
  };
  if (reducedMotion.matches) {
    finishOpening();
    return;
  }
  passportOpening = gsap.timeline({ onComplete: finishOpening })
    .fromTo(passportCover, { rotationY: 0 }, {
      rotationY: -164, duration: 1.6, ease: 'sine.inOut', clearProps: 'transform',
    }, 0)
    .to(passportCover, { opacity: 0, duration: .3, clearProps: 'opacity' }, 1.26)
    .fromTo(ticket, { opacity: .25 }, {
      opacity: 1, duration: 1, ease: 'sine.inOut', clearProps: 'opacity',
    }, .4);
}

function openSurvey() {
  flight = undefined;
  if(arrival.snapshot().finished){phase='survey';beginFlight();return;}
  phase = 'survey';
  renderPhase();
  renderLanguage();
  save();
  window.scrollTo(0, 0);
  (state.submitted ? answerTitle : surveyTitle).focus({ preventScroll: true });
  if (!reducedMotion.matches) {
    gsap.from(survey, { opacity: 0, y: 19, duration: .45, ease: 'power2.out', clearProps: 'opacity,transform' });
  }
}

function boardJourney() {
  if (phase !== 'boarding' || !passportOpened || boardButton.disabled) return;
  state.name = nameInput.value;
  save();
  nameInput.blur();
  gsap.killTweensOf([boarding, windowPhoto]);
  gsap.set([boarding, windowPhoto], { clearProps: 'opacity,transform' });
  boardButton.disabled = true;
  nameInput.readOnly = true;
  stamp.hidden = false;
  sound('stamp',reducedMotion.matches?0:.4);
  renderLanguage();
  if (reducedMotion.matches) {
    flight = gsap.timeline({ onComplete: openSurvey })
      .set(stamp, { opacity: 1, rotation: -8 })
      .to(stamp, { duration: stampExtraTime });
    return;
  }

  flight = gsap.timeline({ onComplete: openSurvey })
    .fromTo(stamp, { opacity: 0, scale: 1.55, y: -51, rotation: -21 }, {
      opacity: 1, scale: 1, y: 0, rotation: -8, duration: .43, ease: 'power2.in',
    })
    .to(ticket, { y: 3, scaleY: .989, duration: .07, ease: 'power2.out' }, .40)
    .to(ticket, { y: 0, scaleY: 1, duration: .20, ease: 'power2.out' }, .47)
    .to(stamp, { y: -6, scale: 1.035, rotation: -10, duration: .14, ease: 'sine.out' }, .43)
    .to(stamp, { y: 0, scale: 1, rotation: -8, duration: .22, ease: 'sine.in' }, .57)
    .to(boarding, { y: 24, opacity: 0, duration: .3, ease: 'power2.in' }, .77 + stampExtraTime);
}

function openMaterials(fromFlight = false) {
  flight = undefined;
  flightBeat = null;
  const scene = find('flight-scene');
  if (fromFlight) {
    // Keep the last flight frame in place while the wider materials page appears.
    gsap.set(scene, {
      width: scene.offsetWidth,
      height: scene.offsetHeight,
      left: '50%',
      xPercent: -50,
      zIndex: 2,
    });
  }
  phase = 'materials';
  renderPhase();
  renderLanguage();
  if (!fromFlight) takeoff.clear();
  save();
  window.scrollTo(0, 0);
  materialsTitle.focus({ preventScroll: true });
  if (reducedMotion.matches) {
    takeoff.clear();
    return;
  }
  materials.inert = true;
  wallet.inert = true;
  walletOpening = gsap.timeline({
    onComplete() {
      walletOpening = undefined;
      wallet.inert = false;
      materials.inert = false;
    },
  });
  if (fromFlight) {
    walletOpening
      .fromTo(materials, { opacity: 0 }, {
        opacity: 1, duration: .85, ease: 'sine.inOut', clearProps: 'opacity',
      }, 0)
      .to(scene, {
        opacity: 0, duration: .85, ease: 'sine.inOut', onComplete: takeoff.clear,
      }, 0);
  }
  const arrival = fromFlight ? .5 : 0;
  walletOpening
    .from(wallet, { y: 24, opacity: 0, duration: .85, ease: 'sine.out', clearProps: 'transform,opacity' }, arrival)
    .fromTo(walletCover, { rotationY: 0, opacity: 1 }, {
      rotationY: -168, duration: 1.75, ease: 'sine.inOut', clearProps: 'transform,opacity',
    }, arrival + .65)
    .to(walletCover, { opacity: 0, duration: .32, ease: 'sine.in' }, arrival + 2.05)
    .from(walletContents, { opacity: 0, duration: .8, ease: 'sine.out', clearProps: 'opacity' }, arrival + 1.1);
}

function beginFlight() {
  if (phase !== 'survey' || state.submitted === null) return;
  if (reducedMotion.matches) {
    openMaterials();
    return;
  }
  startFlightSound('takeoff');
  phase = 'takeoff';
  flightBeat = 'runway';
  renderPhase();
  renderLanguage();
  window.scrollTo(0, 0);
  // Restore the last safe stop if the page is reloaded mid-flight.
  save();
  flight = gsap.timeline();
  takeoff.addTo(flight, () => {
    flightBeat = 'runway';
    renderStageLabel();
  }, () => {
    flightBeat = 'climb';
    renderStageLabel();
  });
  flight.call(() => openMaterials(true), [], flightExit);
}

function openWorkshop(skipPrelude=false) {
  if (phase !== 'materials') return;
  phase = 'workshop';
  renderPhase();
  renderLanguage();
  save();
  window.scrollTo(0, 0);
  sound('paper');
  if(skipPrelude)workshopTitle.focus({preventScroll:true});
  else memory.play(() => {
    if (phase === 'workshop') workshopTitle.focus({ preventScroll: true });
  });
}

function backToMaterials() {
  if (phase !== 'workshop' || closingMemory) return;
  const reveal = () => {
    workshopSection.inert = false;
    phase = 'materials';
    renderPhase();
    renderLanguage();
    renderSurveySync();
    save();
    enterWorkshop.focus({ preventScroll: true });
    enterWorkshop.scrollIntoView({ block: 'center' });
  };
  if (reducedMotion.matches) {
    reveal();
    return;
  }
  workshopSection.inert = true;
  closingMemory = workshopSection.animate([
    { opacity: 1, transform: 'perspective(1000px) rotateY(0deg)' },
    { opacity: 0, transform: 'perspective(1000px) rotateY(-4deg) translateX(-12px)' },
  ], { duration: 550, easing: 'ease-in', fill: 'both' });
  closingMemory.onfinish = () => {
    reveal();
    closingMemory?.cancel();
    closingMemory = undefined;
  };
}

function openFinalSurvey() {
  if(arrival.snapshot().finished){openMenu();return;}
  if (phase !== 'workshop' && phase !== 'materials') return;
  if (!workshop.snapshot().stamped && state.furthestStop < 5) return;
  phase = 'finalSurvey';
  renderPhase();
  renderLanguage();
  save();
  window.scrollTo({ top: 0, behavior: 'instant' });
  finalTitle.focus({ preventScroll: true });
}

function leaveFinalSurvey(destination: 'materials' | 'workshop') {
  if (phase !== 'finalSurvey') return;
  phase = destination;
  renderPhase();
  renderLanguage();
  save();
  window.scrollTo({ top: 0, behavior: 'instant' });
  (destination === 'materials' ? materialsTitle : workshopTitle).focus({ preventScroll: true });
}

function openArrival() {
  if (phase !== 'finalSurvey' && phase !== 'materials') return;
  if (!finalSurvey.snapshot().submitted && state.furthestStop < 6) return;
  phase = 'arrival';renderPhase();renderLanguage();save();
  window.scrollTo({top:0,behavior:'instant'});arrival.play();
}

function leaveArrival() {
  if (phase !== 'arrival') return;
  if(arrival.snapshot().finished){openMenu();return;}
  arrival.pauseAudio();phase='materials';renderPhase();renderLanguage();save();
  window.scrollTo({top:0,behavior:'instant'});materialsTitle.focus({preventScroll:true});
}

function openMenu(animatePassport=false){
  if(!arrival.snapshot().finished)return;
  if(state.reliving){state.reliving=false;arrival.setReplay(false);restore();}
  stopFlightSound();
  memory.cancel();flight?.kill();flight=undefined;takeoff.clear();
  passportOpening?.kill();passportOpening=undefined;walletOpening?.kill();walletOpening=undefined;
  wallet.inert=false;materials.inert=false;
  gsap.set([wallet,walletCover,walletContents,materials],{clearProps:'opacity,transform'});
  closingMemory?.cancel();closingMemory=undefined;workshopSection.inert=false;
  menuEntrance?.kill();menuEntrance=undefined;
  arrival.pauseAudio();phase='menu';renderPhase();renderLanguage();save();
  const menuPassport=menuSection.querySelector('.menu-passport')!;
  gsap.set(menuPassport,{clearProps:'transform,opacity'});
  if(animatePassport&&!reducedMotion.matches){
    menuEntrance=gsap.timeline({onComplete:()=>{menuEntrance=undefined;}})
      .fromTo(menuPassport,{y:-260,rotation:18,opacity:0},{y:0,rotation:-7,opacity:1,duration:1.1,ease:'bounce.out',clearProps:'transform,opacity'});
  }
  window.scrollTo({top:0,behavior:'instant'});find('travel-menu-title').focus({preventScroll:true});
}
function explore(part:string){
  menuEntrance?.kill();menuEntrance=undefined;
  gsap.set(menuSection.querySelector('.menu-passport')!,{clearProps:'transform,opacity'});
  if(!arrival.snapshot().finished||phase!=='menu')return;
  sound('paper');
  if(part==='materials'){openMaterials();return;}
  if(part==='flight'){phase='survey';beginFlight();return;}
  if(part==='workshop'){workshop.reset();phase='materials';openWorkshop();return;}
  if(part==='memories'){phase='arrival';arrival.revisit();renderPhase();renderLanguage();save();arrival.play();return;}
  if(part==='passport'){
    passportOpening?.kill();passportOpening=undefined;passportOpened=false;
    passportCover.hidden=false;passportCover.disabled=false;passportCover.setAttribute('aria-expanded','false');
    ticket.hidden=true;ticket.inert=true;boardButton.disabled=false;stamp.hidden=true;nameInput.readOnly=false;
    gsap.set([passportCover,boarding,ticket,stamp,windowPhoto],{clearProps:'opacity,transform'});
    phase='gate';renderPhase();renderLanguage(false);save();window.scrollTo(0,0);prepareBoarding(true);
  }
}

function restartJourney() {
  if(arrival.snapshot().finished&&!state.reliving){openMenu();return;}
  memory.cancel();
  closingMemory?.cancel();
  closingMemory = undefined;
  workshopSection.inert = false;
  flight?.kill();
  flight = undefined;
  passportOpening?.kill();
  passportOpening = undefined;
  passportOpened = false;
  passportCover.hidden = false;
  passportCover.disabled = false;
  passportCover.setAttribute('aria-expanded', 'false');
  ticket.hidden = true;
  ticket.inert = true;
  gsap.set(passportCover, { clearProps: 'opacity,transform' });
  walletOpening?.kill();
  walletOpening = undefined;
  wallet.inert = false;
  materials.inert = false;
  gsap.set(materials, { clearProps: 'opacity' });
  gsap.set([wallet, walletCover, walletContents], { clearProps: 'transform,opacity' });
  reader.reset();
  archive.reset();
  workshop.reset();
  finalSurvey.reset();
  arrival.reset();
  flightBeat = null;
  takeoff.clear();
  gsap.killTweensOf([boarding, survey, result, confirmationStamp, windowPhoto, workshopSection]);
  gsap.set([boarding, survey, result, confirmationStamp, ticket, stamp, windowPhoto, workshopSection], {
    clearProps: 'opacity,transform',
  });
  if(!state.reliving)surveySync.newVisit();
  state.name = '';
  state.selected = null;
  state.submitted = null;
  state.furthestStop = 1;
  state.walletPage=1;find('intro-start').hidden=false;
  nameInput.value = '';
  nameInput.readOnly = false;
  boardButton.disabled = false;
  stamp.hidden = true;
  for (const option of pollOptions) option.checked = false;
  phase = 'gate';
  renderPhase();
  renderLanguage(false);
  save();
  window.scrollTo(0, 0);
  find('intro-start').focus({preventScroll:true});
}

restore();
nameInput.value = state.name;
for (const option of pollOptions) {
  option.checked = option.value === state.selected;
}
renderPhase();
renderLanguage(false);
renderSurveySync();
reader.syncRoute();
archive.syncRoute();
if ((phase as Phase) === 'arrival') arrival.play();

let languageFades: Animation[] = [];
for (const button of languageButtons) {
  button.addEventListener('click', () => {
    const language = button.dataset.lang as Language;
    if (language === state.language) return;
    state.language = language;
    renderLanguage();
    renderSurveySync();
    save();

    for (const fade of languageFades) fade.cancel();
    if (reducedMotion.matches) return;
    const readerPanel = journey.querySelector('.reader:not([hidden])');
    const surfaces = readerPanel
      ? [...readerPanel.querySelectorAll('.reader-header, .reader-controls, figcaption')]
      : [gate, boarding, survey, materials, workshopSection, finalSection, arrivalSection,menuSection].filter(surface => !surface.hidden);
    languageFades = [stageLabel, ...surfaces].map(surface =>
      surface.animate([{ opacity: .68 }, { opacity: 1 }], { duration: 160, easing: 'ease-out' }),
    );
  });
}

nameInput.addEventListener('input', () => {
  state.name = nameInput.value;
  save();
});
nameInput.addEventListener('keydown', event => {
  if (event.key === 'Enter' && !event.isComposing) {
    event.preventDefault();
    nameInput.blur();
  }
});
ticketForm.addEventListener('submit', event => {
  event.preventDefault();
  boardJourney();
});
passportCover.addEventListener('click', openPassport);
restart.addEventListener('click', restartJourney);
menuButton.addEventListener('click',()=>openMenu());
topMenu.addEventListener('click',()=>openMenu());
for(const button of menuSection.querySelectorAll<HTMLButtonElement>('[data-explore]'))button.addEventListener('click',()=>explore(button.dataset.explore!));

surveyForm.addEventListener('change', event => {
  if (!(event.target instanceof HTMLInputElement) || !isExpectation(event.target.value)) return;
  state.selected = event.target.value;
  renderPoll();
  save();
});
surveyForm.addEventListener('submit', event => {
  event.preventDefault();
  if (state.selected === null || state.submitted !== null) return;
  state.submitted = state.selected;
  save();
  renderPoll();
  answerTitle.focus({ preventScroll: true });
  if (reducedMotion.matches) return;
  gsap.from(result, { y: 14, opacity: 0, duration: .45, ease: 'power2.out', clearProps: 'transform,opacity' });
  gsap.from(confirmationStamp, { scale: .62, rotation: -9, duration: .50, ease: 'back.out(1.35)', clearProps: 'transform' });
});

continueJourney.addEventListener('click', beginFlight);
enterWorkshop.addEventListener('click',()=>openWorkshop());
find('continue-to-workshop').addEventListener('click',()=>openWorkshop(true));
find('open-final-survey').addEventListener('click', openFinalSurvey);
resumeFinal.addEventListener('click', openFinalSurvey);
find('start-arrival').addEventListener('click',openArrival);
resumeArrival.addEventListener('click',openArrival);
find('arrival-materials').addEventListener('click',leaveArrival);
find('final-back').addEventListener('click', () => leaveFinalSurvey('workshop'));
find('final-materials').addEventListener('click', () => leaveFinalSurvey('materials'));
for (const button of workshopSection.querySelectorAll('[data-back-materials]')) {
  button.addEventListener('click', backToMaterials);
}

const viewport = window.visualViewport;
if (viewport) {
  let heightBeforeFocus = 0;
  nameInput.addEventListener('focus', () => {
    if (!journey.classList.contains('is-keyboard-open')) heightBeforeFocus = viewport.height;
  });
  viewport.addEventListener('resize', () => {
    const wasOpen = journey.classList.contains('is-keyboard-open');
    const canBeOpen = document.activeElement === nameInput || wasOpen;
    const keyboardOpen = canBeOpen && heightBeforeFocus - viewport.height > 105 && viewport.scale === 1;
    journey.classList.toggle('is-keyboard-open', keyboardOpen);
    if (keyboardOpen) {
      journey.style.setProperty('--view-height', `${Math.round(viewport.height)}px`);
    } else {
      journey.style.removeProperty('--view-height');
    }
  });
}

find('intro-start').addEventListener('click',()=>prepareBoarding());
find('wallet-next').addEventListener('click',()=>turnWallet(2));
find('wallet-previous').addEventListener('click',()=>turnWallet(1));
find('relive-journey').addEventListener('click',()=>{
  if(phase!=='menu')return;const passenger=state.name;state.reliving=true;arrival.setReplay(true);restartJourney();state.name=passenger;nameInput.value=passenger;
});
let lastSignature=state.name;
nameInput.addEventListener('change',()=>{if(nameInput.value.trim()&&nameInput.value!==lastSignature){sound('pen');lastSignature=nameInput.value;}});
