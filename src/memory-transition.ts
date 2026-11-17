import { gsap } from 'gsap';
import { copy, type Language } from './copy';

export function createMemoryTransition() {
  const root = document.querySelector<HTMLElement>('#memory-transition')!;
  const stage = document.querySelector<HTMLElement>('.stage')!;
  const journey = document.querySelector<HTMLElement>('#journey')!;
  const book = root.querySelector<HTMLElement>('.memory-book')!;
  const flap = root.querySelector<HTMLElement>('.memory-flap')!;
  const room = root.querySelector<HTMLElement>('.memory-room')!;
  const photo = room.querySelector('img')!;
  const caption = root.querySelector<HTMLElement>('#memory-caption')!;
  const skip = root.querySelector<HTMLButtonElement>('#skip-memory')!;
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let timeline: gsap.core.Timeline | undefined;
  let onComplete: (() => void) | undefined;
  let language: Language = 'ar';
  let returning = false;

  function renderCaption() {
    root.setAttribute('aria-label', copy[language].workshop);
    caption.textContent = copy[language][returning ? 'memoryReturning' : 'memoryOpening'];
  }

  function cancel() {
    timeline?.kill();
    timeline = undefined;
    gsap.killTweensOf(caption);
    onComplete = undefined;
    root.hidden = true;
    stage.inert = false;
    journey.classList.remove('is-recalling');
    gsap.set([root, book, flap, room, photo, caption], { clearProps: 'opacity,transform' });
  }

  function finish() {
    const complete = onComplete;
    cancel();
    complete?.();
  }

  skip.addEventListener('click', finish);

  return {
    play(complete: () => void) {
      cancel();
      if (reducedMotion.matches) {
        complete();
        return;
      }
      onComplete = complete;
      returning = false;
      renderCaption();
      root.hidden = false;
      stage.inert = true;
      journey.classList.add('is-recalling');
      skip.focus({ preventScroll: true });
      gsap.set(root, { opacity: 1 });
      gsap.set(room, { opacity: 0 });
      timeline = gsap.timeline({ onComplete: finish })
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
        .fromTo(photo, { scale: 1.18 }, { scale: 1, duration: 3.4, ease: 'sine.out' }, 2.4)
        .to(book, { scale: 1.55, opacity: 0, duration: 1.25, ease: 'sine.inOut' }, 2.4)
        .to(root, { opacity: 0, duration: .9, ease: 'sine.inOut' }, 5.8);
    },
    translate(lang: Language) {
      language = lang;
      renderCaption();
    },
    cancel,
  };
}
