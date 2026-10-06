/* ui.js — Toast und Rückfrage-Dialog, für beide Seiten */

import { esc } from './aufgaben.js';

let toastEl = null, toastTimer = null;

export function toast(text, art = '') {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    document.body.appendChild(toastEl);
  }
  toastEl.textContent = text;
  toastEl.className = `toast ${art}`;
  requestAnimationFrame(() => toastEl.classList.add('zeigen'));
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove('zeigen'), 4000);
}

/* Rückfrage mit zwei Knöpfen → Promise<boolean> */
export function frage(titel, text, ja = 'Ja', nein = 'Abbrechen', gefahr = false) {
  return new Promise(resolve => {
    const hg = document.createElement('div');
    hg.className = 'dialog-hg';
    hg.innerHTML = `<div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-titel">
      <h2 id="dlg-titel">${esc(titel)}</h2><p>${esc(text)}</p>
      <div class="knoepfe">
        <button class="knopf hell" data-w="0">${esc(nein)}</button>
        <button class="knopf${gefahr ? ' gefahr' : ''}" data-w="1">${esc(ja)}</button>
      </div></div>`;
    const schliesse = wert => { hg.remove(); document.removeEventListener('keydown', taste); resolve(wert); };
    const taste = e => { if (e.key === 'Escape') schliesse(false); };
    hg.addEventListener('click', e => {
      if (e.target === hg) return schliesse(false);
      const w = e.target.closest('[data-w]');
      if (w) schliesse(w.dataset.w === '1');
    });
    document.addEventListener('keydown', taste);
    document.body.appendChild(hg);
    hg.querySelector('[data-w="1"]').focus();
  });
}
