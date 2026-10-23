// ==UserScript==
// @name         GitHub repo root: fold the file list
// @namespace    https://github.com/jesse/github-repo-root-fold
// @version      1.1.0
// @description  Folds the file listing on a repository's root page by default and adds a fold icon (in the latest-commit bar) to unfold it.
// @match        https://github.com/*
// @run-at       document-start
// @grant        none
// @noframes
// ==/UserScript==

(() => {
  'use strict';

  const FOLDED_STORAGE_KEY = 'github-repo-root-fold:folded';
  const FOLDED_CLASS = 'gh-rlf-folded';
  const ACTIVE_CLASS = 'gh-rlf-active';

  const REPO_ROOT_PATH = /^\/[^/]+\/[^/]+\/?$/;
  const DIRECTORY_CONTENT_SELECTOR = '[data-testid="directory-content"]';
  const DIRECTORY_ROW_SELECTOR = '.react-directory-row';
  const LATEST_COMMIT_SELECTOR = '[data-testid="latest-commit"]';

  const CHEVRON_DOWN =
    '<svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true" focusable="false">' +
    '<path fill="currentColor" d="M12.78 6.22a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L3.22 7.28a.75.75 0 0 1 1.06-1.06L8 9.94l3.72-3.72a.75.75 0 0 1 1.06 0Z"/>' +
    '</svg>';

  const root = document.documentElement;

  root.classList.toggle(FOLDED_CLASS, localStorage.getItem(FOLDED_STORAGE_KEY) !== '0');

  const style = document.createElement('style');
  style.textContent = `
    html.${FOLDED_CLASS} ${DIRECTORY_CONTENT_SELECTOR} { display: none !important; }

    .gh-rlf-toggle {
      display: none;
      align-items: center;
      gap: 2px;
      height: 20px;
      padding: 0 4px;
      font: inherit;
      font-size: var(--text-body-size-small, 12px);
      line-height: 20px;
      color: var(--fgColor-muted, #59636e);
      background: transparent;
      border: 0;
      border-radius: var(--borderRadius-medium, 6px);
      cursor: pointer;
    }
    html.${ACTIVE_CLASS} .gh-rlf-toggle { display: inline-flex; }
    .gh-rlf-toggle:hover {
      color: var(--fgColor-default, #1f2328);
      background: var(--control-transparent-bgColor-hover, rgba(129, 139, 152, .12));
    }
    .gh-rlf-toggle:focus-visible {
      outline: 2px solid var(--fgColor-accent, #0969da);
      outline-offset: 0;
    }
    .gh-rlf-toggle svg { flex: none; transition: rotate .15s ease; }
    html.${FOLDED_CLASS} .gh-rlf-toggle svg { rotate: -90deg; }
  `;
  root.appendChild(style);

  const toggle = document.createElement('button');
  toggle.type = 'button';
  toggle.className = 'gh-rlf-toggle';
  toggle.innerHTML = CHEVRON_DOWN;

  const countLabel = document.createElement('span');
  toggle.appendChild(countLabel);

  function isFolded() {
    return root.classList.contains(FOLDED_CLASS);
  }

  function countItems() {
    return document.querySelectorAll(DIRECTORY_ROW_SELECTOR).length;
  }

  function syncToggle() {
    const folded = isFolded();
    const count = countItems();
    const label = folded ? 'Unfold file list' : 'Fold file list';
    countLabel.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
    toggle.setAttribute('aria-label', `${label} (${countLabel.textContent})`);
    toggle.setAttribute('aria-expanded', String(!folded));
    toggle.title = label;
  }

  function setFolded(folded) {
    root.classList.toggle(FOLDED_CLASS, folded);
    localStorage.setItem(FOLDED_STORAGE_KEY, folded ? '1' : '0');
    syncToggle();
  }

  toggle.addEventListener('click', () => setFolded(!isFolded()));

  function findMountTarget(directoryContent) {
    const fileListBox = directoryContent.parentElement;
    const latestCommit = fileListBox.querySelector(LATEST_COMMIT_SELECTOR);
    if (latestCommit === null) return fileListBox;

    const commitRow = latestCommit.parentElement;
    const trailingControls = commitRow.lastElementChild;
    return trailingControls === latestCommit ? commitRow : trailingControls;
  }

  function refresh() {
    const directoryContent = REPO_ROOT_PATH.test(location.pathname)
      ? document.querySelector(DIRECTORY_CONTENT_SELECTOR)
      : null;

    if (directoryContent === null) {
      root.classList.remove(ACTIVE_CLASS);
      toggle.remove();
      return;
    }

    const mountTarget = findMountTarget(directoryContent);
    if (toggle.parentElement !== mountTarget) mountTarget.prepend(toggle);

    root.classList.add(ACTIVE_CLASS);
    syncToggle();
  }

  let refreshTimer = 0;
  function queueRefresh() {
    if (refreshTimer !== 0) return;
    refreshTimer = window.setTimeout(() => {
      refreshTimer = 0;
      refresh();
    }, 150);
  }

  function start() {
    refresh();
    new MutationObserver(queueRefresh).observe(root, {
      childList: true,
      subtree: true,
    });
    window.addEventListener('turbo:load', queueRefresh);
    window.addEventListener('turbo:render', queueRefresh);
    window.addEventListener('popstate', queueRefresh);
  }

  if (document.body) start();
  else document.addEventListener('DOMContentLoaded', start, { once: true });
})();
