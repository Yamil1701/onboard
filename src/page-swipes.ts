import { sound } from './sound';

type SwipeActions = {
  canStart: () => boolean;
  turnPage: (delta: number) => boolean;
};

export function bindPageSwipes(view: HTMLElement, content: HTMLElement, actions: SwipeActions) {
  const pointers = new Set<number>();
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let start: { id: number; x: number; y: number; time: number; horizontal: boolean } | undefined;
  let shift = 0;
  let rebound: Animation | undefined;

  function resetVisual() {
    rebound?.cancel();
    content.style.removeProperty('translate');
    if (shift && !reducedMotion.matches) {
      rebound = content.animate([{ translate: `${shift}px 0` }, { translate: '0px 0' }], {
        duration: 260, easing: 'cubic-bezier(.2,.7,.3,1)',
      });
    }
    shift = 0;
  }

  function reset() {
    start = undefined;
    pointers.clear();
    resetVisual();
  }

  function refresh() {
    view.toggleAttribute('data-page-swipe', actions.canStart() && (window.visualViewport?.scale ?? 1) <= 1.01);
  }

  window.addEventListener('pointerdown', event => {
    pointers.add(event.pointerId);
    if (pointers.size > 1) {
      start = undefined;
      resetVisual();
    }
  }, { capture: true, passive: true });

  view.addEventListener('pointerdown', event => {
    if (pointers.size !== 1 || event.button !== 0 || !actions.canStart()) return;
    if ((window.visualViewport?.scale ?? 1) > 1.01) return;
    if (!(event.target instanceof Element)) return;
    if (event.target.closest('button, a, input, textarea, select, figcaption, [role="status"]')) return;
    if (!content.contains(event.target)) return;
    rebound?.cancel();
    start = { id: event.pointerId, x: event.clientX, y: event.clientY, time: event.timeStamp, horizontal: false };
    view.setPointerCapture(event.pointerId);
  });

  view.addEventListener('pointermove', event => {
    if (!start || event.pointerId !== start.id) return;
    const x = event.clientX - start.x;
    const y = event.clientY - start.y;
    if (Math.abs(y) > 18 && Math.abs(y) >= Math.abs(x) * .7) {
      start = undefined;
      resetVisual();
      return;
    }
    if (!actions.canStart() || pointers.size !== 1) {
      start = undefined;
      resetVisual();
      return;
    }
    if (Math.abs(x) > 12 && Math.abs(x) > Math.abs(y) * 1.6) start.horizontal = true;
    if (!start.horizontal) return;
    if (event.cancelable) event.preventDefault();
    shift = Math.max(-72, Math.min(72, x * .38));
    if (!reducedMotion.matches) content.style.translate = `${shift}px 0`;
  }, { passive: false });

  window.addEventListener('pointerup', event => {
    pointers.delete(event.pointerId);
    if (!start || event.pointerId !== start.id) return;
    const gesture = start;
    start = undefined;
    const x = event.clientX - gesture.x;
    const y = event.clientY - gesture.y;
    const threshold = Math.max(56, Math.min(100, view.clientWidth * .22));
    const deliberate = gesture.horizontal && Math.abs(x) >= threshold
      && Math.abs(x) > Math.abs(y) * 1.7 && event.timeStamp - gesture.time < 1800;
    if (deliberate && pointers.size === 0 && actions.canStart()
      && (window.visualViewport?.scale ?? 1) <= 1.01) {
      if(actions.turnPage(x < 0 ? 1 : -1))sound('paper');
    }
    resetVisual();
  });
  window.addEventListener('pointercancel', event => {
    pointers.delete(event.pointerId);
    if (event.pointerId !== start?.id) return;
    start = undefined;
    resetVisual();
  });
  window.addEventListener('blur', reset);
  window.visualViewport?.addEventListener('resize', () => {
    start = undefined;
    resetVisual();
    refresh();
  });
  view.addEventListener('dragstart', event => {
    if (start) event.preventDefault();
  });
  refresh();
  return { reset, refresh };
}
