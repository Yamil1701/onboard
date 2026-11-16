import workerUrl from 'pdfjs-dist/legacy/build/pdf.worker.min.mjs?url';
import type { copy, CopyKey } from './copy';

type PdfLibrary = typeof import('pdfjs-dist');
type PdfDocument = Awaited<ReturnType<PdfLibrary['getDocument']>['promise']>;
type ReaderCopy = (typeof copy)[keyof typeof copy];

const reportUrl = `${import.meta.env.BASE_URL}materiales/Pasaporte_de_la_practica_docente.pdf`;
const reportHash = '#informe';
const zoomLevels = [1, 1.35, 1.8, 2.4, 3];

export function createReader(onOpen: () => boolean) {
  const element = document.querySelector<HTMLElement>('#reader')!;
  const find = <T extends HTMLElement = HTMLElement>(id: string) => element.querySelector<T>(`#${id}`)!;
  const view = find('reader-view');
  const paper = find('reader-paper');
  const title = find('reader-title');
  const notice = find('reader-notice');
  const message = find('reader-message');
  const retry = find<HTMLButtonElement>('retry-reader');
  const download = find<HTMLAnchorElement>('download-report');
  const pager = find('reader-page');
  const prev = find<HTMLButtonElement>('previous-page');
  const next = find<HTMLButtonElement>('next-page');
  const minus = find<HTMLButtonElement>('zoom-out');
  const plus = find<HTMLButtonElement>('zoom-in');
  const fit = find<HTMLButtonElement>('zoom-fit');
  const closeButton = find<HTMLButtonElement>('close-reader');
  const stage = document.querySelector<HTMLElement>('.stage')!;
  const progress = document.querySelector<HTMLElement>('#progress')!;
  const openButton = document.querySelector<HTMLButtonElement>('#open-passport')!;
  const journey = document.querySelector<HTMLElement>('#journey')!;

  download.href = reportUrl;
  let documentTask: ReturnType<PdfLibrary['getDocument']> | undefined;
  let pdf: PdfDocument | undefined;
  let renderer: ReturnType<Awaited<ReturnType<PdfDocument['getPage']>>['render']> | undefined;
  let number = 1;
  let zoom = 0;
  let generation = 0;
  let mode: 'loading' | 'ready' | 'error' = 'loading';
  let words: ReaderCopy;
  let originY = 0;
  let priorOffset = { x: 0, y: 0 };

  function controls() {
    const usable = mode === 'ready' && Boolean(pdf);
    pager.textContent = pdf ? `${number} / ${pdf.numPages}` : '—';
    prev.disabled = !usable || number <= 1;
    next.disabled = !usable || number >= (pdf?.numPages ?? 0);
    minus.disabled = !usable || zoom === 0;
    plus.disabled = !usable || zoom === zoomLevels.length - 1;
    fit.disabled = minus.disabled;
    notice.hidden = mode === 'ready';
    retry.hidden = download.hidden = mode !== 'error';
    if (mode !== 'ready' && words) {
      const key: CopyKey = mode === 'error' ? 'errorPdf' : 'loadingPdf';
      message.textContent = words[key];
    }
  }

  async function render(offset = { x: 0, y: 0 }) {
    const id = ++generation;
    renderer?.cancel();
    if (!pdf || element.hidden) return;
    controls();
    try {
      const page = await pdf.getPage(number);
      if (id !== generation) return;
      const unit = page.getViewport({ scale: 1 });
      const width = Math.max(220, view.clientWidth - 24);
      const viewport = page.getViewport({ scale: width * zoomLevels[zoom] / unit.width });
      const canvas = document.createElement('canvas');
      const scale = Math.min(window.devicePixelRatio || 1, 2, 1950 / viewport.width);
      canvas.width = Math.round(viewport.width * scale);
      canvas.height = Math.round(viewport.height * scale);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      canvas.setAttribute('role', 'img');
      canvas.setAttribute('aria-label', `${number} / ${pdf.numPages}`);
      renderer = page.render({ canvas, viewport, transform: [scale, 0, 0, scale, 0, 0] });
      await renderer.promise;
      if (id !== generation) return;
      paper.replaceChildren(canvas);
      mode = 'ready';
      controls();
      view.scrollTo(offset.x, offset.y);
    } catch {
      if (id !== generation) return;
      mode = 'error';
      controls();
    }
  }

  async function load() {
    mode = 'loading';
    controls();
    if (pdf) {
      await render(priorOffset);
      return;
    }
    try {
      const library = await import('pdfjs-dist/legacy/build/pdf.mjs') as PdfLibrary;
      library.GlobalWorkerOptions.workerSrc = workerUrl;
      documentTask ??= library.getDocument({ url: reportUrl });
      pdf = await documentTask.promise;
      if (!element.hidden) await render(priorOffset);
    } catch {
      documentTask = undefined;
      mode = 'error';
      controls();
    }
  }

  function syncRoute() {
    if (location.hash === reportHash) {
      if (!element.hidden) return;
      if (!onOpen()) {
        history.replaceState(history.state, '', location.pathname + location.search);
        return;
      }
      originY = window.scrollY;
      element.hidden = false;
      journey.classList.add('is-reading');
      stage.inert = progress.inert = true;
      title.focus({ preventScroll: true });
      void load();
    } else if (!element.hidden) {
      priorOffset = { x: view.scrollLeft, y: view.scrollTop };
      ++generation;
      renderer?.cancel();
      element.hidden = true;
      journey.classList.remove('is-reading');
      stage.inert = progress.inert = false;
      window.scrollTo(0, originY);
      openButton.focus({ preventScroll: true });
    }
  }

  function close() {
    if (history.state?.passportReader) history.back();
    else {
      history.replaceState(history.state, '', location.pathname + location.search);
      syncRoute();
    }
  }

  function changePage(delta: number) {
    number += delta;
    priorOffset = { x: 0, y: 0 };
    void render();
  }

  function changeZoom(value: number) {
    const factor = zoomLevels[value] / zoomLevels[zoom];
    const x = Math.max(0, (view.scrollLeft + view.clientWidth / 2) * factor - view.clientWidth / 2);
    const y = view.scrollTop * factor;
    zoom = value;
    priorOffset = { x, y };
    void render(priorOffset);
  }

  openButton.addEventListener('click', () => {
    history.pushState({ ...history.state, passportReader: true }, '', reportHash);
    syncRoute();
  });
  closeButton.addEventListener('click', close);
  prev.addEventListener('click', () => changePage(-1));
  next.addEventListener('click', () => changePage(1));
  minus.addEventListener('click', () => changeZoom(zoom - 1));
  plus.addEventListener('click', () => changeZoom(zoom + 1));
  fit.addEventListener('click', () => changeZoom(0));
  retry.addEventListener('click', () => void load());
  window.addEventListener('popstate', syncRoute);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && !element.hidden) close();
  });
  let viewportWidth = 0;
  new ResizeObserver(() => {
    if (element.hidden || view.clientWidth === viewportWidth) return;
    viewportWidth = view.clientWidth;
    if (pdf && mode === 'ready') void render({ x: view.scrollLeft, y: view.scrollTop });
  }).observe(view);

  return {
    translate(language: ReaderCopy) {
      words = language;
      controls();
    },
    syncRoute,
    reset() {
      number = 1;
      zoom = 0;
      priorOffset = { x: 0, y: 0 };
    },
  };
}
