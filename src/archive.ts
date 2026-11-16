import albums from './archive-data.json';
import { copy, type Language } from './copy';

type AlbumId = keyof typeof albums;
const albumIds = Object.keys(albums) as AlbumId[];
const archiveHash = '#archivo-';
const archivePath = `${import.meta.env.BASE_URL}materiales/archivo/`;
const photoCount = Object.values(albums).reduce((count, album) => count + album.photos.length, 0);

function find<T extends HTMLElement = HTMLElement>(id: string) {
  return document.getElementById(id) as T;
}

export function createArchive(canOpen: () => boolean) {
  const journey = find('journey');
  const stage = journey.querySelector<HTMLElement>('.stage')!;
  const progress = find('progress');
  const archive = find<HTMLDetailsElement>('wallet-archive');
  const list = find('archive-list');
  const panel = find('archive-reader');
  const title = find('archive-reader-title');
  const view = find('archive-view');
  const caption = find('photo-caption');
  const frame = find('photo-frame');
  const position = find('photo-position');
  const openImage = find<HTMLAnchorElement>('photo-original');
  const prev = find<HTMLButtonElement>('previous-photo');
  const next = find<HTMLButtonElement>('next-photo');
  const buttons = new Map<AlbumId, HTMLButtonElement>();
  let active: AlbumId | undefined;
  let language: Language | undefined;
  let index = 0;
  let originY = 0;

  function quantity(total: number, lang: Language) {
    return `${total} ${copy[lang][total === 1 ? 'photo' : 'photos']}`;
  }

  function showPhoto() {
    if (!active || !language) return;
    const album = albums[active];
    const photo = album.photos[index];
    const src = archivePath + photo.image;
    title.textContent = album.title[language];
    caption.textContent = photo.title[language];
    position.textContent = `${index + 1} / ${album.photos.length}`;
    if (openImage.getAttribute('href') !== src) {
      const image = new Image();
      image.src = src;
      image.decoding = 'async';
      frame.replaceChildren(image);
      openImage.setAttribute('href', src);
      view.scrollTop = 0;
    }
    frame.querySelector('img')!.alt = photo.title[language];
    prev.disabled = index === 0;
    next.disabled = index === album.photos.length - 1;
  }

  function syncRoute() {
    const hash = location.hash;
    const requested = albumIds.find(id => hash === archiveHash + id);
    if (requested && canOpen()) {
      if (active === requested) return;
      if (!active) originY = window.scrollY;
      active = requested;
      index = 0;
      archive.open = true;
      panel.hidden = false;
      journey.classList.add('is-reading');
      stage.inert = progress.inert = true;
      showPhoto();
      title.focus({ preventScroll: true });
      return;
    }
    if (hash.startsWith(archiveHash)) {
      history.replaceState(history.state, '', location.pathname + location.search);
    }
    if (active) {
      const trigger = buttons.get(active);
      active = undefined;
      panel.hidden = true;
      frame.replaceChildren();
      openImage.removeAttribute('href');
      if (hash !== '#informe') {
        journey.classList.remove('is-reading');
        stage.inert = progress.inert = false;
        window.scrollTo(0, originY);
        trigger?.focus({ preventScroll: true });
      }
    }
  }

  function close() {
    if (history.state?.workArchive) history.back();
    else {
      history.replaceState(history.state, '', location.pathname + location.search);
      syncRoute();
    }
  }

  function step(delta: number) {
    if (delta < 0 ? prev.disabled : next.disabled) return;
    const focused = document.activeElement;
    index += delta;
    showPhoto();
    if (focused === prev && prev.disabled) next.focus();
    if (focused === next && next.disabled) prev.focus();
  }

  for (const id of albumIds) {
    const button = document.createElement('button');
    button.className = 'archive-entry';
    button.type = 'button';
    const thumb = new Image();
    thumb.src = `${archivePath}${id}/portada.webp`;
    thumb.alt = '';
    thumb.loading = 'lazy';
    thumb.decoding = 'async';
    const text = document.createElement('span');
    text.append(document.createElement('strong'), document.createElement('small'));
    button.append(thumb, text);
    button.addEventListener('click', () => {
      history.pushState({ ...history.state, workArchive: true }, '', archiveHash + id);
      syncRoute();
    });
    buttons.set(id, button);
    list.append(button);
  }

  find('close-archive').addEventListener('click', close);
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  window.addEventListener('popstate', syncRoute);
  document.addEventListener('keydown', event => {
    if (!active) return;
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      step(event.key === 'ArrowLeft' ? -1 : 1);
    }
  });

  return {
    translate(lang: Language) {
      if (lang === language) return;
      language = lang;
      find('archive-count').textContent = quantity(photoCount, lang);
      for (const [id, button] of buttons) {
        button.querySelector('strong')!.textContent = albums[id].title[lang];
        button.querySelector('small')!.textContent = quantity(albums[id].photos.length, lang);
      }
      showPhoto();
    },
    syncRoute,
    reset() {
      archive.open = false;
    },
  };
}
