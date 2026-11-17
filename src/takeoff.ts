import { gsap } from 'gsap';
import airUrl from './assets/flight-air.webp';
import asphaltUrl from './assets/runway-asphalt.webp';
import { createRunway, type RunwayCamera } from './runway';

const runwayStart = 1.8;
const wheelsUp = 4.65;
const climbDuration = 3.75;
export const flightExit = wheelsUp + climbDuration;

const eyeLevel: RunwayCamera = { travel: 0, height: 3.3, horizon: .407, speed: 0 };

export function createTakeoff(scene: HTMLElement) {
  const frame = scene.querySelector<HTMLElement>('.flight-window')!;
  const distant = scene.querySelector<HTMLElement>('.flight-distant')!;
  const fallback = scene.querySelector<HTMLElement>('.flight-fallback')!;
  const air = scene.querySelector<HTMLImageElement>('.flight-air')!;
  const wing = scene.querySelector<HTMLElement>('.flight-wing')!;
  const glint = scene.querySelector<HTMLElement>('.flight-glint')!;
  const canvas = scene.querySelector<HTMLCanvasElement>('.flight-runway')!;
  const asphalt = new Image();
  const camera = { ...eyeLevel };
  let renderer: ReturnType<typeof createRunway> | undefined;

  canvas.addEventListener('webglcontextlost', () => {
    renderer = null;
    scene.dataset.renderer = 'photo';
  });

  function preload() {
    if (air.hasAttribute('src')) return;
    air.src = airUrl;
    asphalt.src = asphaltUrl;
  }

  function drawRunway() {
    renderer?.draw(camera);
  }

  function addTo(timeline: gsap.core.Timeline, onRunway: () => void, onClimb: () => void) {
    preload();
    if (renderer === undefined) renderer = createRunway(canvas, asphalt);
    scene.dataset.renderer = renderer ? 'webgl' : 'photo';
    scene.hidden = false;
    drawRunway();

    timeline
      .fromTo(scene, { opacity: 0 }, { opacity: 1, duration: .78, ease: 'sine.inOut' }, 1.02)
      .fromTo(frame, { scale: 1, y: 0 }, { scale: 1.14, y: 90, duration: .79, ease: 'power2.inOut' }, 1.0)
      .call(onRunway, [], runwayStart)
      .to(camera, { travel: 111, speed: 1, duration: 2.85, ease: 'power1.in', onUpdate: drawRunway }, runwayStart)
      .to(distant, { xPercent: -1.3, scale: 1.045, duration: 2.85, ease: 'power1.in' }, runwayStart)
      .to(fallback, { xPercent: -5.5, scale: 1.135, duration: 2.85, ease: 'power2.in' }, runwayStart)
      .to(glint, { opacity: .50, duration: 1.18, ease: 'sine.inOut' }, 3.12)
      .call(onClimb, [], wheelsUp)
      .to(camera, {
        height: 32, horizon: .565, speed: .65, duration: 3.05, ease: 'sine.inOut',
      }, wheelsUp)
      .to(camera, { travel: 340, duration: 3.05, ease: 'none', onUpdate: drawRunway }, wheelsUp)
      .to(distant, { xPercent: -3.3, yPercent: 9, opacity: 0, duration: 1.92, ease: 'sine.inOut' }, wheelsUp)
      .to(fallback, { xPercent: -9.2, yPercent: 18, opacity: 0, duration: 2.32, ease: 'sine.inOut' }, wheelsUp)
      .to(canvas, { opacity: 0, duration: 1.36, ease: 'sine.inOut' }, 5.78)
      .fromTo(air, { scale: 1.14, xPercent: 2.8, yPercent: -3 }, {
        scale: 1.065, xPercent: -4.1, yPercent: 2, duration: climbDuration, ease: 'sine.out',
      }, wheelsUp)
      .to(wing, { rotation: 1.6, yPercent: -.8, duration: 1.19, ease: 'sine.inOut' }, wheelsUp)
      .to(wing, { rotation: .75, yPercent: -.45, duration: 1.34, ease: 'sine.inOut' }, wheelsUp + 1.19)
      .to(glint, { opacity: .24, duration: 2.15, ease: 'sine.inOut' }, wheelsUp + .1);
  }

  function clear() {
    scene.hidden = true;
    Object.assign(camera, eyeLevel);
    gsap.set([scene, frame, distant, fallback, canvas, air, wing, glint], { clearProps: 'transform,opacity' });
    gsap.set(scene, { clearProps: 'width,height,left,zIndex' });
  }

  return { preload, addTo, clear };
}
