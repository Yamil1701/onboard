import { gsap } from 'gsap';
import groundUrl from './assets/flight-ground.webp';
import airUrl from './assets/flight-air.webp';

const runwayStart = 1.58;
const wheelsUp = 4.27;
export const surveyEntry = 7.42;

const amber = { core: '#ffe0a1', glow: '255, 175, 83' };
const cyan = { core: '#b6fffb', glow: '51, 227, 231' };

// Offset and spacing in runway coordinates. The perspective divides each by depth.
const runwayRows = [
  { offset: -.67, spacing: 136, count: 6, shift: 53, color: amber },
  { offset: -.29, spacing: 88, count: 8, shift: 27, color: cyan },
  { offset: .082, spacing: 88, count: 8, shift: 7, color: cyan },
  { offset: .54, spacing: 129, count: 6, shift: 48, color: amber },
];

function glowTexture(color: typeof amber) {
  const texture = document.createElement('canvas');
  texture.width = texture.height = 44;
  const context = texture.getContext('2d');
  if (!context) return texture;
  const glow = context.createRadialGradient(22, 22, 0, 22, 22, 22);
  glow.addColorStop(0, `rgba(${color.glow}, .86)`);
  glow.addColorStop(.22, `rgba(${color.glow}, .45)`);
  glow.addColorStop(.55, `rgba(${color.glow}, .12)`);
  glow.addColorStop(1, `rgba(${color.glow}, 0)`);
  context.fillStyle = glow;
  context.fillRect(0, 0, 44, 44);
  return texture;
}

export function createTakeoff(scene: HTMLElement) {
  const frame = scene.querySelector<HTMLElement>('.flight-window')!;
  const ground = scene.querySelector<HTMLImageElement>('.flight-ground')!;
  const distant = scene.querySelector<HTMLImageElement>('.flight-distant')!;
  const air = scene.querySelector<HTMLImageElement>('.flight-air')!;
  const wing = scene.querySelector<HTMLElement>('.flight-wing')!;
  const glint = scene.querySelector<HTMLElement>('.flight-glint')!;
  const canvas = scene.querySelector<HTMLCanvasElement>('.flight-lights')!;
  const context = canvas.getContext('2d');
  const width = canvas.width;
  const height = canvas.height;
  const halo = context ? new Map([[amber, glowTexture(amber)], [cyan, glowTexture(cyan)]]) : null;
  const motion = { travel: 0, speed: 0, climb: 0, brightness: 0 };

  function preload() {
    if (ground.hasAttribute('src')) return;
    ground.src = groundUrl;
    distant.src = groundUrl;
    air.src = airUrl;
  }

  function drawLights() {
    if (!context || !halo) return;
    context.clearRect(0, 0, width, height);
    if (motion.brightness < .01) return;

    const horizon = .422 + motion.climb * .205;
    const altitude = .457 + motion.climb * .22;
    for (const row of runwayRows) {
      const length = row.spacing * row.count;
      const advance = motion.travel % length;
      context.strokeStyle = row.color.core;
      context.fillStyle = row.color.core;
      for (let i = 0; i < row.count; i++) {
        const z = 12 + (i * row.spacing + row.shift - advance + length) % length;
        const depth = 79 / (79 + z);
        const y = (horizon + altitude * depth) * height;
        if (y > height * .678) continue;
        const x = (.493 + row.offset * depth) * width;
        const tailDepth = 79 / (79 + z + 4 + motion.speed * 57);
        const tailX = (.493 + row.offset * tailDepth) * width;
        const tailY = (horizon + altitude * tailDepth) * height;
        const brightness = motion.brightness * Math.min(.9, depth * 2.8);
        const radius = .65 + depth * 5;

        context.globalAlpha = brightness * .29 * (1 - motion.climb);
        context.lineWidth = Math.max(.5, radius * .75);
        context.beginPath();
        context.moveTo(x, y + 3);
        context.lineTo(x + (x - tailX) * .22, y + 5 + depth * 44);
        context.stroke();

        context.globalAlpha = brightness;
        context.drawImage(halo.get(row.color)!, x - radius * 3, y - radius * 3, radius * 6, radius * 6);
        context.lineWidth = Math.max(.65, radius * .75);
        context.beginPath();
        context.moveTo(tailX, tailY);
        context.lineTo(x, y);
        context.stroke();
        context.fillRect(x - radius * .34, y - radius * .34, radius * .68, radius * .68);
      }
    }
    context.globalAlpha = 1;
  }

  function addTo(timeline: gsap.core.Timeline, onRunway: () => void, onClimb: () => void) {
    preload();
    scene.hidden = false;
    timeline
      .fromTo(scene, { opacity: 0 }, { opacity: 1, duration: .68, ease: 'sine.inOut' }, 1.17)
      .fromTo(frame, { scale: 1, y: 0 }, { scale: 1.14, y: 94, duration: .94, ease: 'power2.inOut' }, 1.18)
      .call(onRunway, [], runwayStart)
      .to(motion, { travel: 475, speed: 1, duration: 2.69, ease: 'power2.in', onUpdate: drawLights }, runwayStart)
      .to(motion, { brightness: .93, duration: .96, ease: 'sine.in' }, runwayStart)
      .to(ground, { scale: 1.135, xPercent: -2.6, yPercent: 2, duration: 2.69, ease: 'power2.in' }, runwayStart)
      .to(distant, { scale: 1.028, xPercent: -.5, duration: 2.69, ease: 'sine.inOut' }, runwayStart)
      .to(wing, { rotation: -.8, yPercent: .5, duration: 2.35, ease: 'sine.inOut' }, runwayStart + .22)
      .to(glint, { xPercent: 28, opacity: .62, duration: 1.22, ease: 'power1.inOut' }, 2.87)
      .call(onClimb, [], wheelsUp)
      .to(motion, {
        travel: 845, speed: .31, climb: 1, brightness: 0,
        duration: 2.81, ease: 'sine.inOut', onUpdate: drawLights,
      }, wheelsUp)
      .to(ground, { yPercent: 34, xPercent: -5, scale: .8, rotation: -4.4, duration: 2.53, ease: 'power2.out' }, wheelsUp)
      .to(ground, { '--terrain-cut': '29%', duration: .84, ease: 'power1.out' }, wheelsUp)
      .to(distant, { yPercent: 23, xPercent: -2.3, scale: .95, rotation: -2.1, duration: 2.65, ease: 'sine.inOut' }, wheelsUp)
      .to(wing, { rotation: 4.5, yPercent: -1.7, duration: .91, ease: 'sine.inOut' }, wheelsUp)
      .to(wing, { rotation: 2.2, yPercent: -.9, duration: 1.58, ease: 'sine.inOut' }, wheelsUp + .91)
      .to(glint, { xPercent: 51, opacity: .24, duration: 2.5, ease: 'sine.inOut' }, wheelsUp + .12)
      .fromTo(air, { scale: 1.135, yPercent: -4 }, { scale: 1.02, yPercent: 1, duration: 2.8, ease: 'sine.inOut' }, wheelsUp)
      .to(ground, { opacity: 0, duration: 1.6, ease: 'sine.inOut' }, 5.14)
      .to(distant, { opacity: 0, duration: 1.46, ease: 'sine.inOut' }, 5.48);
  }

  function clear() {
    scene.hidden = true;
    Object.assign(motion, { travel: 0, speed: 0, climb: 0, brightness: 0 });
    context?.clearRect(0, 0, width, height);
    gsap.set([scene, frame, ground, distant, air, wing, glint], { clearProps: 'transform,opacity' });
    ground.style.removeProperty('--terrain-cut');
  }

  return { preload, addTo, clear };
}
