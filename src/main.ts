import { gsap } from 'gsap';
import { copy, type CopyKey, type Language } from './copy';
import { createTakeoff, flightExit } from './takeoff';
import { createReader } from './reader';
import { createArchive } from './archive';
import './style.css';

type Phase = 'gate' | 'boarding' | 'takeoff' | 'survey' | 'materials';
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
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const progress = find('progress');
const progressValue = find('progress-value');
const restart = find<HTMLButtonElement>('restart-journey');
const pollOptions = Array.from(surveyForm.querySelectorAll<HTMLInputElement>('input[type=radio]'));
const translated = document.querySelectorAll<HTMLElement>('[data-copy]');

const storageKey = 'voyageurs-preview';
let phase: Phase = 'gate';
const state: {
  language: Language;
  name: string;
  selected: Expectation | null;
  submitted: Expectation | null;
} = { language: 'ar', name: '', selected: null, submitted: null };
let storageBlock = false;
let flight: gsap.core.Timeline | undefined;
let flightBeat: 'runway' | 'climb' | null = null;
let walletOpening: gsap.core.Timeline | undefined;
const reader = createReader(() => phase === 'materials');
const archive = createArchive(() => phase === 'materials');

function isExpectation(value: unknown): value is Expectation {
  return value === 'adapt' || value === 'play' || value === 'ideas';
}

function restore() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(storageKey) ?? 'null');
    if (!stored) return;
    if (stored.language === 'fr') state.language = 'fr';
    if (typeof stored.name === 'string') state.name = stored.name;
    if (isExpectation(stored.selected)) state.selected = stored.selected;
    if (isExpectation(stored.submitted)) state.submitted = stored.submitted;
    if (stored.stop === 3 && state.submitted) phase = 'materials';
    else if (stored.stop === 2) phase = 'survey';
  } catch {
    // A malformed or inaccessible session should still allow boarding.
  }
}

function save() {
  if (storageBlock) return;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({
      ...state,
      stop: currentStop(),
    }));
  } catch {
    storageBlock = true;
  }
}

function renderDestination() {
  const rows = copy[state.language].boardRows;
  const columns = Math.max(...rows.map(row => row.length));
  destination.setAttribute('aria-label', rows.join(' '));
  destination.style.setProperty('--flap-columns', String(columns));
  destination.replaceChildren(...rows.map(row => {
    const line = document.createElement('span');
    line.className = 'flap-row';
    line.setAttribute('aria-hidden', 'true');
    for (const char of row) {
      const flap = document.createElement('span');
      flap.className = 'flap';
      if (char !== ' ') flap.textContent = char;
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
  const key = phase === 'materials' || phase === 'survey' ? phase : flightBeat ?? 'welcome';
  stageLabel.dataset.copy = key;
  stageLabel.textContent = copy[state.language][key];
}

function renderLanguage() {
  const language = copy[state.language];
  document.documentElement.lang = state.language === 'fr' ? 'fr' : 'es-AR';
  document.title = `${language.titleLead} ${language.titleEnd}`;
  renderStageLabel();
  boardAction.dataset.copy = boardButton.disabled ? 'boardingAction' : 'board';
  for (const element of translated) {
    element.textContent = language[element.dataset.copy as CopyKey];
  }
  languageGroup.setAttribute('aria-label', language.language);
  for (const button of languageButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === state.language));
  }
  if (phase === 'gate') renderDestination();
  renderPoll();
  reader.translate(language);
  archive.translate(state.language);
}

function currentStop() {
  return phase === 'materials' ? 3 : phase === 'survey' || phase === 'takeoff' ? 2 : 1;
}

function renderPhase() {
  journey.dataset.phase = phase;
  gate.hidden = phase !== 'gate';
  boarding.hidden = phase !== 'boarding';
  survey.hidden = phase !== 'survey';
  materials.hidden = phase !== 'materials';
  progress.hidden = phase === 'gate';
  const stop = currentStop();
  progress.dataset.stop = String(stop);
  progressValue.textContent = `${stop} / 6`;
}

function openBoarding(focusButton = false) {
  if (phase !== 'gate') return;
  phase = 'boarding';
  renderPhase();
  takeoff.preload();
  gsap.fromTo(windowPhoto, { opacity: .5, scale: 1.025 }, {
    opacity: 1, scale: 1, duration: .9, ease: 'sine.out', clearProps: 'opacity,transform',
  });
  gsap.fromTo(boarding, { opacity: 0, y: 28 }, {
    opacity: 1, y: 0, duration: .76, ease: 'power2.out', clearProps: 'opacity,transform',
  });
  if (focusButton) boardButton.focus({ preventScroll: true });
}

function prepareBoarding(focusButton = false) {
  // Even if the cabin photo fails, the ticket remains usable.
  const reveal = () => openBoarding(focusButton);
  if ('decode' in windowPhoto) {
    void windowPhoto.decode().then(reveal, reveal);
  } else {
    reveal();
  }
}

function openSurvey() {
  flight = undefined;
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
  if (phase !== 'boarding' || boardButton.disabled) return;
  state.name = nameInput.value;
  save();
  nameInput.blur();
  gsap.killTweensOf([boarding, windowPhoto]);
  gsap.set([boarding, windowPhoto], { clearProps: 'opacity,transform' });
  boardButton.disabled = true;
  nameInput.readOnly = true;
  stamp.hidden = false;
  renderLanguage();
  if (reducedMotion.matches) {
    openSurvey();
    return;
  }

  flight = gsap.timeline({ onComplete: openSurvey })
    .fromTo(stamp, { opacity: 0, scale: 1.55, y: -51, rotation: -21 }, {
      opacity: 1, scale: 1, y: 0, rotation: -8, duration: .43, ease: 'power2.in',
    })
    .to(ticket, { y: 3, scaleY: .989, duration: .07, ease: 'power2.out' }, .40)
    .to(ticket, { y: 0, scaleY: 1, duration: .20, ease: 'power2.out' }, .47)
    .to(boarding, { y: 24, opacity: 0, duration: .3, ease: 'power2.in' }, .77);
}

function openMaterials() {
  flight = undefined;
  flightBeat = null;
  phase = 'materials';
  renderPhase();
  renderLanguage();
  takeoff.clear();
  save();
  window.scrollTo(0, 0);
  materialsTitle.focus({ preventScroll: true });
  if (reducedMotion.matches) return;
  wallet.inert = true;
  walletOpening = gsap.timeline({
    onComplete() {
      walletOpening = undefined;
      wallet.inert = false;
    },
  })
    .from(wallet, { y: 34, rotation: -2, opacity: 0, duration: .52, ease: 'power2.out', clearProps: 'transform,opacity' })
    .fromTo(walletCover, { rotationX: 0, opacity: 1 }, {
      rotationX: 87, opacity: 0, duration: .57, ease: 'power2.inOut', clearProps: 'transform,opacity',
    }, .27)
    .from(walletContents, { y: 10, opacity: 0, duration: .40, ease: 'power2.out', clearProps: 'transform,opacity' }, .62);
}

function beginFlight() {
  if (phase !== 'survey' || state.submitted === null) return;
  if (reducedMotion.matches) {
    openMaterials();
    return;
  }
  phase = 'takeoff';
  flightBeat = 'runway';
  renderPhase();
  renderLanguage();
  window.scrollTo(0, 0);
  // Restore the last safe stop if the page is reloaded mid-flight.
  save();
  flight = gsap.timeline({ onComplete: openMaterials });
  takeoff.addTo(flight, () => {
    flightBeat = 'runway';
    renderStageLabel();
  }, () => {
    flightBeat = 'climb';
    renderStageLabel();
  });
  flight.to(find('flight-scene'), { opacity: 0, duration: .40, ease: 'sine.inOut' }, flightExit);
}

function restartJourney() {
  flight?.kill();
  flight = undefined;
  walletOpening?.kill();
  walletOpening = undefined;
  wallet.inert = false;
  gsap.set([wallet, walletCover, walletContents], { clearProps: 'transform,opacity' });
  reader.reset();
  archive.reset();
  flightBeat = null;
  takeoff.clear();
  gsap.killTweensOf([boarding, survey, result, confirmationStamp, windowPhoto]);
  gsap.set([boarding, survey, result, confirmationStamp, ticket, stamp, windowPhoto], {
    clearProps: 'opacity,transform',
  });
  state.name = '';
  state.selected = null;
  state.submitted = null;
  nameInput.value = '';
  nameInput.readOnly = false;
  boardButton.disabled = false;
  stamp.hidden = true;
  for (const option of pollOptions) option.checked = false;
  phase = 'gate';
  renderPhase();
  renderLanguage();
  save();
  window.scrollTo(0, 0);
  prepareBoarding(true);
}

restore();
nameInput.value = state.name;
for (const option of pollOptions) {
  option.checked = option.value === state.selected;
}
renderPhase();
renderLanguage();
reader.syncRoute();
archive.syncRoute();

for (const button of languageButtons) {
  button.addEventListener('click', () => {
    state.language = button.dataset.lang as Language;
    renderLanguage();
    save();
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
restart.addEventListener('click', restartJourney);

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

if (phase === 'gate') prepareBoarding();
