import dimensions from './material-image-sizes.json';
import type { Language } from './copy';

export function materialImageSize(path: string): readonly [number, number] {
  const size = (dimensions as Record<string, number[]>)[path];
  return size ? [size[0], size[1]] : [1200, 900];
}

/** Bind each rendered photo once. Detached or superseded photos cannot update the new page. */
export function bindMaterialImages(root: HTMLElement, language: Language) {
  const unavailable = language === 'ar' ? 'No se pudo cargar la imagen.' : 'Impossible de charger l’image.';
  const retryLabel = language === 'ar' ? 'Reintentar' : 'Réessayer';
  for (const image of root.querySelectorAll<HTMLImageElement>('.practice-photo-surface img')) {
    const frame = image.closest<HTMLElement>('.practice-photo-surface')!;
    const status = frame.querySelector<HTMLElement>('.practice-image-status')!;
    let generation = 0;
    const showError = (attempt: number) => {
      if (!frame.isConnected || attempt !== generation) return;
      frame.dataset.imageState = 'error';
      frame.setAttribute('aria-busy', 'false');
      status.hidden = false;
      const message = document.createElement('span');
      message.textContent = unavailable;
      const retry = document.createElement('button');
      retry.type = 'button';
      retry.textContent = retryLabel;
      retry.addEventListener('click', () => {
        generation++;
        frame.dataset.imageState = 'loading';
        frame.setAttribute('aria-busy', 'true');
        const spinner = document.createElement('span');
        spinner.className = 'practice-image-spinner';
        spinner.setAttribute('aria-hidden', 'true');
        message.textContent = language === 'ar' ? 'Cargando imagen…' : 'Chargement de l’image…';
        status.replaceChildren(spinner, message);
        // Reassigning src retries only this photo, keeping its reserved frame and page position.
        const src = image.getAttribute('src')!;
        image.removeAttribute('src');
        image.src = src;
      });
      status.replaceChildren(message, retry);
    };
    const settle = () => {
      const attempt = generation;
      if (!image.naturalWidth) { showError(attempt); return; }
      void image.decode().then(() => {
        if (!frame.isConnected || attempt !== generation) return;
        frame.dataset.imageState = 'ready';
        frame.setAttribute('aria-busy', 'false');
        status.hidden = true;
      }, () => showError(attempt));
    };
    image.addEventListener('load', settle);
    image.addEventListener('error', () => showError(generation));
    if (image.complete) settle();
  }
}
