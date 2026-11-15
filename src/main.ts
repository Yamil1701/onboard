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
const ticketForm = find<HTMLFormElement>('ticket-form');
const boardButton = ticketForm.querySelector<HTMLButtonElement>('button')!;
const nameInput = find<HTMLInputElement>('passenger');
const stamp = find('stamp');
const lights = find('runway-lights');
const survey = find('survey');
const surveyTitle = find('survey-title');
const surveyForm = find<HTMLFormElement>('survey-form');
const send = find<HTMLButtonElement>('send-answer');
const result = find('survey-result');
const progress = find('progress');
const progressValue = find('progress-value');
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
  stageLabel.dataset.copy = phase === 'survey' ? 'survey' : 'welcome';
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

function openBoarding() {
  if (phase !== 'gate') return;
  phase = 'boarding';
  renderPhase();
  gsap.from(boarding, { opacity: 0, duration: .23, ease: 'power1.out', clearProps: 'opacity' });
}

function beginFlight() {
  if (phase !== 'boarding') return;
  state.name = nameInput.value;
  save();
  nameInput.blur();
  phase = 'takeoff';
  renderPhase();
  boardButton.disabled = true;
  nameInput.readOnly = true;
  stamp.hidden = false;

  gsap.timeline({
    onComplete() {
      phase = 'survey';
      renderPhase();
      renderLanguage();
      save();
      window.scrollTo(0, 0);
      surveyTitle.focus({ preventScroll: true });
      gsap.from(survey, { opacity: 0, duration: .18, clearProps: 'opacity' });
    },
  })
    .fromTo(stamp, { opacity: 0, scale: 1.65, y: -37, rotation: -13 }, {
      opacity: 1, scale: 1, y: 0, rotation: -10, duration: .18, ease: 'power3.in',
    })
    .to(lights, { opacity: 1, duration: .09 }, .15)
    .to(windowPhoto, { y: 23, scale: 1.09, duration: .42, ease: 'power2.in' }, .17)
    .to(Array.from(lights.children), {
      x: index => index < 3 ? -112 : 112, y: 42, opacity: .1, duration: .42, ease: 'power2.in',
    }, .17)
    .to(boarding, { opacity: 0, duration: .17 }, .47);
}

restore();
nameInput.value = state.name;
for (const option of surveyForm.querySelectorAll<HTMLInputElement>('input[type=radio]')) {
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

if (phase === 'gate') {
  // Image failure still reaches the usable ticket. Skip the board once the photo can paint.
  if ('decode' in windowPhoto) {
    void windowPhoto.decode().then(openBoarding, openBoarding);
  } else {
    openBoarding();
  }
}
