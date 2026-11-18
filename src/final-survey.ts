import type { Language } from './copy';
import { finalSurveyCopy } from './final-survey-copy';

type Answer = 0 | 1 | 2 | null;
type SurveyState = { answers: Answer[]; step: number; submitted: boolean; rating: number | null };
const emptyState = (): SurveyState => ({ answers: [null, null, null, null, null], step: 0, submitted: false, rating: null });
const isAnswer = (value: unknown): value is Answer => value === null || value === 0 || value === 1 || value === 2;

export function createFinalSurvey(onChange: () => void) {
  const root = document.querySelector<HTMLElement>('#final-survey')!;
  const find = <T extends HTMLElement = HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  const paper = find('final-paper');
  const form = find<HTMLFormElement>('final-form');
  const question = find('final-question');
  const radios = [...form.querySelectorAll<HTMLInputElement>('input')];
  const previous = find<HTMLButtonElement>('final-previous');
  const next = find<HTMLButtonElement>('final-next');
  const review = find('final-review');
  const reviewList = find('final-review-list');
  const completed = find('final-completed');
  const expectationLine = find('final-expectation');
  const rating = find('final-rating');
  const ratingRadios = [...rating.querySelectorAll<HTMLInputElement>('input')];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let data = emptyState();
  let language: Language = 'ar';
  let expectation = '';
  let replaying=false;
  let editingFromReview = false;
  let motion: Animation | undefined;
  const allAnswered = () => data.answers.every(value => value !== null);

  function renderRating() {
    const words = finalSurveyCopy[language];
    for (const radio of ratingRadios) {
      const value = Number(radio.value);
      radio.checked = data.rating === value;
      radio.closest('label')!.classList.toggle('is-filled', value > 0 && data.rating !== null && value <= data.rating);
      const label = radio.closest('label')!.querySelector('.visually-hidden');
      if (label) label.textContent = value === 1 ? words.ratingOne : words.ratingStars.replace('{count}', String(value));
    }
    find('rating-value').textContent = data.rating === null ? words.ratingEmpty : `${data.rating}/5`;
  }

  function render() {
    const words = finalSurveyCopy[language];
    for (const element of root.querySelectorAll<HTMLElement>('[data-final-copy]')) {
      const value = words[element.dataset.finalCopy as keyof typeof words];
      if (typeof value === 'string') element.textContent = value;
    }
    if(replaying){root.querySelector<HTMLElement>('[data-final-copy=done]')!.textContent=language==='ar'?'Esta es una repetición. Tus respuestas no se guardan.':'C’est une répétition. Tes réponses ne sont pas enregistrées.';root.querySelector<HTMLElement>('[data-final-copy=local]')!.textContent=language==='ar'?'Modo revivir · sin guardar ni enviar respuestas.':'Mode souvenir · sans enregistrer ni envoyer de réponses.';}
    const reviewing = data.step === 5;
    root.dataset.mode = data.submitted ? 'completed' : reviewing ? 'review' : 'question';
    form.hidden = reviewing || data.submitted;
    review.hidden = !reviewing || data.submitted;
    completed.hidden = !data.submitted;
    renderRating();
    expectationLine.hidden = !expectation || data.step !== 0 || data.submitted;
    expectationLine.textContent = words.expectation.replace('{answer}', expectation);
    find('final-position').textContent = words.progress.replace('{count}', String(data.answers.filter(value => value !== null).length));
    root.querySelectorAll<HTMLElement>('.final-route i').forEach((point, index) => {
      point.classList.toggle('is-answered', data.answers[index] !== null);
      point.classList.toggle('is-current', index === data.step && !data.submitted);
    });
    if (!reviewing) {
      const item = words.questions[data.step];
      question.textContent = item.question;
      find('final-question-position').textContent = words.position.replace('{step}', String(data.step + 1));
      radios.forEach((radio, index) => {
        radio.checked = data.answers[data.step] === index;
        radio.nextElementSibling!.textContent = item.options[index];
      });
      previous.hidden = data.step === 0;
      next.disabled = data.answers[data.step] === null;
      next.textContent = data.step === 4 || editingFromReview ? words.review : words.next;
    }
    reviewList.replaceChildren(...words.questions.map((item, index) => {
      const row = document.createElement('li');
      const title = document.createElement('span');
      title.className = 'final-review-label';
      title.textContent = words.reviewLabels[index];
      const answer = document.createElement('span');
      answer.className = 'final-review-answer';
      const value = data.answers[index];
      answer.textContent = value === null ? '—' : item.options[value];
      const edit = document.createElement('button');
      edit.type = 'button';
      edit.setAttribute('aria-label', `${words.edit.replace('{step}', String(index + 1))}: ${item.question}`);
      const text = document.createElement('span');
      text.append(title, answer);
      const pencil = document.createElement('span');
      pencil.className = 'final-review-edit';
      pencil.setAttribute('aria-hidden', 'true');
      pencil.textContent = '✎';
      edit.append(text, pencil);
      edit.addEventListener('click', () => {
        editingFromReview = true;
        data.submitted = false;
        data.step = index;
        update();
      });
      row.append(edit);
      return row;
    }));
  }

  function focusPage(animate = true) {
    const target = find(data.submitted ? 'final-done-title' : data.step === 5 ? 'final-review-title' : 'final-question');
    target.focus({ preventScroll: true });
    paper.scrollIntoView({ block: 'start', behavior: reducedMotion.matches ? 'instant' : 'smooth' });
    motion?.cancel();
    if (animate && !reducedMotion.matches) motion = paper.animate([
      { opacity: .45, transform: 'translateY(7px)' }, { opacity: 1, transform: 'translateY(0)' },
    ], { duration: 260, easing: 'ease-out' });
  }

  function update() { render(); onChange(); focusPage(); }
  form.addEventListener('change', event => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const value = Number(event.target.value);
    if (value !== 0 && value !== 1 && value !== 2) return;
    data.answers[data.step] = value;
    render();
    onChange();
  });
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (data.answers[data.step] === null) return;
    data.step = editingFromReview && allAnswered() ? 5 : Math.min(5, data.step + 1);
    editingFromReview = false;
    update();
  });
  previous.addEventListener('click', () => {
    data.step = Math.max(0, data.step - 1);
    editingFromReview = false;
    update();
  });
  find('final-finish').addEventListener('click', () => {
    if (!allAnswered()) return;
    data.submitted = true;
    update();
  });
  rating.addEventListener('change', event => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const value = Number(event.target.value);
    if (!Number.isInteger(value) || value < 1 || value > 5) return;
    data.rating = value;
    renderRating();
    onChange();
  });
  render();

  return {
    translate(lang: Language, initialExpectation: string, replay=false) {
      // Preserve the focused radio and keyboard arrow navigation on language changes.
      language = lang; expectation = initialExpectation;replaying=replay; render();
    },
    snapshot: () => ({ ...data, answers: [...data.answers] }),
    restore(value: unknown) {
      if (!value || typeof value !== 'object') return;
      const stored = value as Record<string, unknown>;
      if (!Array.isArray(stored.answers) || stored.answers.length !== 5 || !stored.answers.every(isAnswer)) return;
      const firstMissing = stored.answers.indexOf(null);
      const requested = typeof stored.step === 'number' && Number.isInteger(stored.step) && stored.step >= 0 && stored.step <= 5 ? stored.step : 0;
      const restoredRating = typeof stored.rating === 'number' && Number.isInteger(stored.rating) && stored.rating >= 1 && stored.rating <= 5 ? stored.rating : null;
      data = { answers: [...stored.answers], step: firstMissing === -1 ? requested : Math.min(requested, firstMissing), submitted: firstMissing === -1 && stored.submitted === true, rating: restoredRating };
      if (data.submitted) data.step = 5;
      editingFromReview = firstMissing === -1 && data.step < 5;
      render();
    },
    reset() { motion?.cancel(); data = emptyState(); editingFromReview = false; render(); },
  };
}
