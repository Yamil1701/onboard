import type { Language } from './copy';
import {sound} from './sound';
import { workshopCopy } from './workshop-copy';

type Decision = 'confirm' | 'verify';
type Reflection = 'together' | 'consult' | 'revisit';
type Reply = { decision: Decision; consulted: boolean; shared: boolean };
type WorkshopState = { replies: Array<Reply | null>; reflection: Reflection | null; stamped: boolean };

function emptyState(): WorkshopState {
  return { replies: [null, null, null], reflection: null, stamped: false };
}

export function createWorkshop(onChange: () => void) {
  const root = document.querySelector<HTMLElement>('#workshop')!;
  const find = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  const paper = find('workshop-paper');
  const story = find('workshop-story');
  const completed = find('workshop-completed');
  const title = find('workshop-question');
  const decisions = find('workshop-decisions');
  const response = find('workshop-response');
  const echo = find('workshop-decision-echo');
  const changeDecision = find<HTMLButtonElement>('workshop-change-decision');
  const consult = find<HTMLButtonElement>('workshop-consult');
  const evidence = find('workshop-evidence');
  const photo = find('workshop-photo');
  const image = find<HTMLImageElement>('workshop-litchi');
  const rule = find('workshop-rule');
  const share = find<HTMLButtonElement>('workshop-share');
  const form = find<HTMLFormElement>('workshop-reflection');
  const radios = Array.from(form.querySelectorAll<HTMLInputElement>('input'));
  const sealButton = find<HTMLButtonElement>('workshop-seal-button');
  const seal = find('workshop-seal');
  const summary = find('workshop-summary');
  const feedback = find('workshop-feedback');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let data = emptyState();
  let language: Language = 'ar';
  let name = '';
  let pageAnimation: Animation | undefined;
  let sealAnimation: Animation | undefined;
  let feedbackAnimation: Animation | undefined;
  let photoFailed = false;

  function activeIndex() {
    const index = data.replies.findIndex(reply => !reply?.shared);
    return index === -1 ? 3 : index;
  }

  function render() {
    const words = workshopCopy[language];
    for (const element of root.querySelectorAll<HTMLElement>('[data-workshop-copy]')) {
      const key = element.dataset.workshopCopy as keyof typeof words;
      const text = words[key];
      if (typeof text === 'string') element.textContent = text;
    }
    find('workshop-welcome').textContent = name
      ? words.namedWelcome.replace('{name}', () => name) : words.welcome;
    const index = activeIndex();
    paper.hidden = index === 3;
    story.hidden = index !== 3 || data.stamped;
    completed.hidden = !data.stamped;
    root.dataset.step = String(index);
    image.alt = words.lycheeAlt;

    if (index < 3) {
      const item = words.cases[index];
      const reply = data.replies[index];
      find('workshop-position').textContent = words.position.replace('{step}', String(index + 1));
      find('workshop-context').textContent = item.context;
      title.textContent = item.question;
      decisions.hidden = reply !== null;
      response.hidden = reply === null;
      changeDecision.hidden = !reply || reply.consulted;
      echo.textContent = reply?.decision === 'confirm' ? words.confirmed : words.verified;
      consult.querySelector('span')!.textContent = index === 2 ? words.rule : words.glossary;
      consult.hidden = Boolean(reply?.consulted);
      evidence.hidden = !reply?.consulted;
      photo.hidden = index !== 0 || photoFailed;
      rule.hidden = index !== 2;
      find('workshop-answer').textContent = item.answer;
      find('workshop-explanation').textContent = item.explanation;
      find('workshop-shared-answer').textContent = item.response;
    }

    for (const radio of radios) radio.checked = radio.value === data.reflection;
    sealButton.disabled = data.reflection === null;
    find('workshop-completed-title').textContent = name
      ? words.personalCompleted.replace('{name}', () => name) : words.completed;
    find('workshop-takeaway').textContent = data.reflection ? words[data.reflection] : '';
    summary.replaceChildren(...words.cases.map((item, index) => {
      const row = document.createElement('li');
      const initial = document.createElement('small');
      initial.textContent = data.replies[index]?.decision === 'confirm' ? words.firstConfirm : words.firstVerify;
      const answer = document.createElement('p');
      answer.textContent = item.response;
      row.append(initial, answer);
      return row;
    }));
  }

  function settle(target: HTMLElement, block: ScrollLogicalPosition = 'start') {
    pageAnimation?.cancel();
    if (!reducedMotion.matches) {
      pageAnimation = target.animate(
        [{ opacity: .25, transform: 'perspective(900px) rotateY(-4deg) translateY(10px)' }, { opacity: 1, transform: 'perspective(900px) rotateY(0deg) translateY(0)' }],
        { duration: 650, easing: 'ease-out' },
      );
    }
    target.focus({ preventScroll: true });
    target.scrollIntoView({ behavior: reducedMotion.matches ? 'instant' : 'smooth', block });
  }

  for (const button of decisions.querySelectorAll<HTMLButtonElement>('[data-decision]')) {
    button.addEventListener('click', () => {
      const index = activeIndex();
      if (index === 3 || data.replies[index]) return;
      data.replies[index] = { decision: button.dataset.decision as Decision, consulted: false, shared: false };
      render();
      onChange();
      settle(response, 'nearest');
    });
  }

  changeDecision.addEventListener('click', () => {
    const index = activeIndex();
    const reply = data.replies[index];
    if (!reply || reply.consulted) return;
    data.replies[index] = null;
    render();
    onChange();
    settle(paper);
  });

  consult.addEventListener('click', () => {
    const reply = data.replies[activeIndex()];
    if (!reply || reply.consulted) return;
    reply.consulted = true;
    render();
    onChange();
    settle(evidence);
  });

  share.addEventListener('click', () => {
    const reply = data.replies[activeIndex()];
    if (!reply?.consulted) return;
    reply.shared = true;
    render();
    onChange();
    settle(activeIndex() < 3 ? paper : story);
    feedbackAnimation?.cancel();
    feedback.hidden = false;
    feedbackAnimation = feedback.animate(reducedMotion.matches
      ? [{ opacity: 1 }, { opacity: 1 }]
      : [
        { opacity: 0, translate: '0 8px', offset: 0 },
        { opacity: 1, translate: '0 0', offset: .15 },
        { opacity: 1, translate: '0 0', offset: .8 },
        { opacity: 0, translate: '0 -4px', offset: 1 },
      ], { duration: 2200, easing: 'ease-out' });
    feedbackAnimation.onfinish = () => { feedback.hidden = true; };
  });

  form.addEventListener('change', event => {
    if (!(event.target instanceof HTMLInputElement)) return;
    data.reflection = event.target.value as Reflection;
    render();
    onChange();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (activeIndex() !== 3 || !data.reflection || data.stamped) return;
    data.stamped = true;
    sound('stamp');
    render();
    onChange();
    settle(completed);
    if (!reducedMotion.matches) {
      sealAnimation = seal.animate([
        { opacity: 0, transform: 'translateY(-20px) rotate(-15deg) scale(1.35)', offset: 0 },
        { opacity: 1, transform: 'translateY(2px) rotate(-7deg) scale(.98)', offset: .55 },
        { opacity: 1, transform: 'translateY(-3px) rotate(-8deg) scale(1.02)', offset: .75 },
        { opacity: 1, transform: 'translateY(0) rotate(-7deg) scale(1)', offset: 1 },
      ], { duration: 900, easing: 'ease-out' });
    }
  });

  find('workshop-replay').addEventListener('click', () => {
    data = emptyState();
    sealAnimation?.cancel();
    feedbackAnimation?.cancel();
    feedback.hidden = true;
    render();
    onChange();
    settle(paper);
  });

  image.addEventListener('load', () => {
    photo.classList.add('is-ready');
    photo.removeAttribute('aria-busy');
  });
  image.addEventListener('error', () => {
    photoFailed = true;
    photo.hidden = true;
  });
  if (image.complete && image.naturalWidth > 0) {
    photo.classList.add('is-ready');
    photo.removeAttribute('aria-busy');
  }
  render();

  return {
    translate(lang: Language, passenger: string) {
      if (language === lang && passenger === name) return;
      language = lang;
      name = passenger;
      render();
    },
    snapshot: () => data,
    takeaway: () => data.reflection ? workshopCopy[language][data.reflection] : '',
    restore(value: unknown) {
      if (!value || typeof value !== 'object') return;
      const stored = value as Record<string, unknown>;
      if (!Array.isArray(stored.replies) || stored.replies.length !== 3) return;
      const replies = stored.replies.map((value: unknown): Reply | null => {
        if (!value || typeof value !== 'object') return null;
        const reply = value as Record<string, unknown>;
        if (reply.decision !== 'confirm' && reply.decision !== 'verify') return null;
        if (typeof reply.consulted !== 'boolean' || typeof reply.shared !== 'boolean') return null;
        if (reply.shared && !reply.consulted) return null;
        return { decision: reply.decision, consulted: reply.consulted, shared: reply.shared };
      });
      if (replies.some((reply, index) => reply && index > 0 && !replies[index - 1]?.shared)) return;
      const finished = replies.every(reply => reply?.shared);
      const reflection = finished && ['together', 'consult', 'revisit'].includes(String(stored.reflection))
        ? stored.reflection as Reflection : null;
      data = { replies, reflection, stamped: finished && reflection !== null && stored.stamped === true };
      render();
    },
    reset() {
      pageAnimation?.cancel();
      sealAnimation?.cancel();
      feedbackAnimation?.cancel();
      feedback.hidden = true;
      data = emptyState();
      render();
    },
  };
}
