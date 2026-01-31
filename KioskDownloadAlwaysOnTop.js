// ==UserScript==
// @name         kio.ac - "B/s)" 항목 최상단으로 올리기
// @namespace    https://greasyfork.org/
// @version      1.0.1
// @description  kio.ac에서 텍스트에 "B/s)"가 포함된 div.grow.overflow-hidden 항목을 부모 컨테이너의 최상단으로 이동
// @match        https://kio.ac/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const TARGET_TEXT = 'B/s)';
  const TARGET_SELECTOR = 'div.grow.overflow-hidden';

  function isTarget(el) {
    return (
      el &&
      el.nodeType === 1 &&
      el.matches(TARGET_SELECTOR) &&
      typeof el.textContent === 'string' &&
      el.textContent.includes(TARGET_TEXT)
    );
  }

  function promoteToTop(el) {
    const parent = el.parentElement;
    if (!parent) return;

    const first = parent.firstElementChild;
    if (first === el) return; // 이미 최상단이면 패스

    parent.insertBefore(el, first);
  }

  function scanWithin(root) {
    if (!root || root.nodeType !== 1) return;

    // root 자체가 타겟일 수도 있음
    if (isTarget(root)) promoteToTop(root);

    // root 내부에 타겟이 있을 수도 있음
    const list = root.querySelectorAll?.(TARGET_SELECTOR);
    if (!list || !list.length) return;

    for (const el of list) {
      if (isTarget(el)) promoteToTop(el);
    }
  }

  // 초기 스캔 (혹시 이미 떠있는 경우)
  scanWithin(document.documentElement);

  // 동적 추가 감시
  const pending = new Set();
  let scheduled = false;

  function schedule(node) {
    if (node && node.nodeType === 1) pending.add(node);
    if (scheduled) return;

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      for (const n of pending) scanWithin(n);
      pending.clear();
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        for (const n of m.addedNodes) schedule(n);
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true
  });
})();
