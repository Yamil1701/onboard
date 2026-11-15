import { gsap } from 'gsap';
import { copy, type CopyKey, type Language } from './copy';
import './style.css';

type Phase = 'gate' | 'boarding' | 'takeoff' | 'survey';
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
const lights = find('runway-lights');
const streaks = Array.from(lights.children);
const takeoffVeil = find('takeoff-veil');
const survey = find('survey');
const surveyTitle = find('survey-title');
const surveyForm = find<HTMLFormElement>('survey-form');
const send = find<HTMLButtonElement>('send-answer');
const result = find('survey-result');
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
    if (stored.stop === 2) phase = 'survey';
  } catch {
    // A malformed or inaccessible session should still allow boarding.
  }
}

function save() {
  if (storageBlock) return;
  try {
    sessionStorage.setItem(storageKey, JSON.stringify({
      ...state,
      stop: phase === 'survey' ? 2 : 1,
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
  send.disabled = state.selected === null || state.selected === state.submitted;
  result.hidden = state.submitted === null || state.selected !== state.submitted;
  if (!result.hidden) result.textContent = copy[state.language].received;
}

function renderLanguage() {
  const language = copy[state.language];
  document.documentElement.lang = state.language === 'fr' ? 'fr' : 'es-AR';
  document.title = `${language.titleLead} ${language.titleEnd}`;
  stageLabel.dataset.copy = phase === 'survey' ? 'survey' : 'welcome';
  boardAction.dataset.copy = phase === 'takeoff' ? 'boardingAction' : 'board';
  for (const element of translated) {
    element.textContent = language[element.dataset.copy as CopyKey];
  }
  languageGroup.setAttribute('aria-label', language.language);
  for (const button of languageButtons) {
    button.setAttribute('aria-pressed', String(button.dataset.lang === state.language));
  }
  if (phase === 'gate') renderDestination();
  renderPoll();
}

function renderPhase() {
  journey.dataset.phase = phase;
  gate.hidden = phase !== 'gate';
  boarding.hidden = phase !== 'boarding' && phase !== 'takeoff';
  survey.hidden = phase !== 'survey';
  progress.hidden = phase === 'gate';
  const stop = phase === 'survey' ? '2' : '1';
  progress.dataset.stop = stop;
  progressValue.textContent = `${stop} / 6`;
}

function openBoarding(focusButton = false) {
  if (phase !== 'gate') return;
  phase = 'boarding';
  renderPhase();
  gsap.fromTo(boarding, { opacity: 0, y: 7 }, {
    opacity: 1, y: 0, duration: .45, ease: 'power2.out', clearProps: 'opacity,transform',
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

function beginFlight() {
  if (phase !== 'boarding') return;
  state.name = nameInput.value;
  save();
  nameInput.blur();
  phase = 'takeoff';
  renderPhase();
  renderLanguage();
  boardButton.disabled = true;
  nameInput.readOnly = true;
  stamp.hidden = false;

  flight = gsap.timeline({
    onComplete() {
      flight = undefined;
      phase = 'survey';
      renderPhase();
      renderLanguage();
      save();
      window.scrollTo(0, 0);
      surveyTitle.focus({ preventScroll: true });
      gsap.fromTo(survey, { opacity: 0, y: 9 }, {
        opacity: 1, y: 0, duration: .48, ease: 'power2.out', clearProps: 'opacity,transform',
      });
    },
  })
    .fromTo(stamp, { opacity: 0, scale: 1.55, y: -51, rotation: -21 }, {
      opacity: 1, scale: 1, y: 0, rotation: -8, duration: .43, ease: 'power2.in',
    })
    .to(ticket, { y: 3, scaleY: .989, duration: .07, ease: 'power2.out' }, .40)
    .to(ticket, { y: 0, scaleY: 1, duration: .20, ease: 'power2.out' }, .47)
    .addLabel('roll', 1.14)
    .to(lights, { opacity: .92, duration: .25, ease: 'power1.inOut' }, 'roll')
    .to(windowPhoto, { y: 31, scale: 1.13, duration: 1.37, ease: 'power2.in' }, 'roll')
    .to(streaks, {
      x: index => index < 3 ? -148 : 148, y: 53, scaleX: 2.2,
      opacity: .08, duration: 1.37, ease: 'power2.in',
    }, 'roll')
    .to(boarding, { y: 45, opacity: 0, duration: .58, ease: 'power2.in' }, 1.91)
    .to(takeoffVeil, { opacity: 1, duration: .53, ease: 'power1.in' }, 1.98);
}

function restartJourney() {
  flight?.kill();
  flight = undefined;
  gsap.killTweensOf([boarding, survey]);
  gsap.set([boarding, survey, ticket, stamp, windowPhoto, lights, takeoffVeil, ...streaks], {
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
  beginFlight();
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
  if (state.selected === null || state.selected === state.submitted) return;
  state.submitted = state.selected;
  save();
  renderPoll();
});

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
