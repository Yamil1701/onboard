import { gsap } from 'gsap';
import { copy, type Language } from './copy';

export function createMemoryTransition() {
  const root = document.querySelector<HTMLElement>('#memory-transition')!;
  const stage = document.querySelector<HTMLElement>('.stage')!;
  const journey = document.querySelector<HTMLElement>('#journey')!;
  const book = root.querySelector<HTMLElement>('.memory-book')!;
  const flap = root.querySelector<HTMLElement>('.memory-flap')!;
  const room = root.querySelector<HTMLElement>('.memory-room')!;
  const caption = root.querySelector<HTMLElement>('#memory-caption')!;
  const skip = root.querySelector<HTMLButtonElement>('#skip-memory')!;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timeline: gsap.core.Timeline | undefined;
  let onComplete: (() => void) | undefined;
  let language: Language = 'ar';
  let returning = false;
  let lockedScroll: number | undefined;

  function renderCaption() {
    root.setAttribute('aria-label', copy[language].workshop);
    caption.textContent = copy[language][returning ? 'memoryReturning' : 'memoryOpening'];
  }

  function waitForContinue() {
    timeline = undefined;
    root.dataset.ready = '';
    skip.disabled = false;
  }

  function cancel() {
    timeline?.kill();
    timeline = undefined;
    gsap.killTweensOf(caption);
    onComplete = undefined;
    root.hidden = true;
    delete root.dataset.ready;
    skip.disabled = false;
    stage.inert = false;
    journey.classList.remove('is-recalling');
    gsap.set([root, book, flap, room, caption], { clearProps: 'opacity,transform' });
    if (lockedScroll !== undefined) {
      document.documentElement.classList.remove('is-memory-transition');
      window.scrollTo({ top: lockedScroll, behavior: 'instant' });
      lockedScroll = undefined;
    }
  }

  function finish() {
    const complete = onComplete;
    cancel();
    complete?.();
  }

  skip.addEventListener('click', () => {
    if (!skip.disabled) finish();
  });

  return {
    play(complete: () => void) {
      cancel();
      onComplete = complete;
      returning = false;
      renderCaption();
      root.hidden = false;
      stage.inert = true;
      journey.classList.add('is-recalling');
      lockedScroll = window.scrollY;
      document.documentElement.classList.add('is-memory-transition');
      skip.disabled = true;
      root.focus({ preventScroll: true });
      gsap.set(root, { opacity: 1 });
      gsap.set(room, { opacity: 0 });
      if (reducedMotion.matches) {
        returning = true;
        renderCaption();
        gsap.set(book, { opacity: 0 });
        gsap.set(room, { opacity: 1 });
        waitForContinue();
        skip.focus({ preventScroll: true });
        return;
      }
      timeline = gsap.timeline({ onComplete: waitForContinue })
        .fromTo(book, { y: 34, rotation: -3, opacity: 0 }, {
          y: 0, rotation: 0, opacity: 1, duration: .95, ease: 'sine.out',
        }, 0)
        .fromTo(flap, { rotationY: 0 }, { rotationY: -162, duration: 1.65, ease: 'sine.inOut' }, .85)
        .to(flap, { opacity: 0, duration: .35 }, 2.1)
        .call(() => {
          returning = true;
          renderCaption();
          gsap.fromTo(caption, { opacity: .25 }, { opacity: 1, duration: .5 });
        }, [], 2.5)
        .fromTo(room, { opacity: 0 }, { opacity: 1, duration: 1.2, ease: 'sine.inOut' }, 2.4)
        .to(book, { opacity: 0, duration: 1.2, ease: 'sine.inOut' }, 2.4);
    },
    translate(lang: Language) {
      language = lang;
      renderCaption();
    },
    cancel,
  };
}
