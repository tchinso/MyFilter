// ==UserScript==
// @name         kio.ac - "B/s)" 항목을 페이지 최상단 고정으로 이동
// @namespace    https://greasyfork.org/
// @version      1.0.2
// @description  kio.ac에서 텍스트에 "B/s)"가 포함된 div.grow.overflow-hidden DOM을 페이지 최상단(고정 오버레이)으로 이동
// @match        https://kio.ac/*
// @run-at       document-idle
// @grant        none
// ==/UserScript==

(() => {
  'use strict';

  const TARGET_TEXT = 'B/s)';
  const TARGET_SELECTOR = 'div.grow.overflow-hidden';
  const BOX_ID = 'gf-kio-bps-topbox';

  function ensureTopBox() {
    let box = document.getElementById(BOX_ID);
    if (box) return box;

    box = document.createElement('div');
    box.id = BOX_ID;

    // 페이지 최상단 고정 (항상 보이게)
    Object.assign(box.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      right: '0',
      zIndex: '2147483647',
      maxHeight: '45vh',
      overflow: 'auto',
      padding: '8px',
      display: 'block',
      background: 'rgba(0,0,0,0.55)',
      backdropFilter: 'blur(6px)',
      WebkitBackdropFilter: 'blur(6px)',
      borderBottom: '1px solid rgba(255,255,255,0.18)',
    });

    // 안쪽에서 원래 DOM 스타일이 깨질 수 있어서, 최소한의 “배치용 래퍼”만 둠
    const inner = document.createElement('div');
    inner.setAttribute('data-gf-inner', '1');
    Object.assign(inner.style, {
      display: 'flex',
      flexDirection: 'column',
      gap: '6px',
      pointerEvents: 'auto',
    });

    // 상단 박스 자체도 클릭/스크롤 가능하게
    box.style.pointerEvents = 'auto';
    box.appendChild(inner);

    // body 최상단에 삽입
    (document.body || document.documentElement).prepend(box);
    return box;
  }

  function isTarget(el) {
    return (
      el &&
      el.nodeType === 1 &&
      el.matches(TARGET_SELECTOR) &&
      typeof el.textContent === 'string' &&
      el.textContent.includes(TARGET_TEXT)
    );
  }

  function moveToPageTop(el) {
    const box = ensureTopBox();
    const inner = box.querySelector('[data-gf-inner="1"]');
    if (!inner) return;

    // 이미 상단 박스 안이면 맨 위로만 올림
    if (inner.contains(el)) {
      if (inner.firstElementChild !== el) inner.prepend(el);
      return;
    }

    // “이동됨” 표시 (중복 처리 방지 + 추적용)
    el.dataset.gfKioMoved = '1';

    // DOM을 통째로 상단 박스로 이동 + 맨 위로
    inner.prepend(el);
  }

  function scanWithin(root) {
    if (!root) return;

    // root 자체가 엘리먼트면 먼저 체크
    if (root.nodeType === 1 && isTarget(root)) {
      moveToPageTop(root);
    }

    // root 내부에서 전부 찾기
    const scope = (root.nodeType === 1) ? root : document.documentElement;
    const list = scope.querySelectorAll?.(TARGET_SELECTOR);
    if (!list || !list.length) return;

    for (const el of list) {
      if (isTarget(el)) moveToPageTop(el);
    }
  }

  // 초기 스캔
  scanWithin(document.documentElement);

  // 변동 감지: “나중에 생김” + “텍스트가 바뀜”까지 대응
  const pending = new Set();
  let scheduled = false;

  function schedule(node) {
    if (node && node.nodeType) pending.add(node);
    if (scheduled) return;

    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;

      // body가 늦게 생기는 경우 대비
      if (!document.getElementById(BOX_ID) && document.body) ensureTopBox();

      for (const n of pending) {
        // 텍스트 변경은 text node가 들어오니까, 부모로 올려서 스캔
        if (n.nodeType === 3) {
          scanWithin(n.parentElement);
        } else {
          scanWithin(n);
        }
      }
      pending.clear();
    });
  }

  const observer = new MutationObserver((mutations) => {
    for (const m of mutations) {
      if (m.type === 'childList') {
        for (const n of m.addedNodes) schedule(n);
      } else if (m.type === 'characterData') {
        schedule(m.target); // text node
      }
    }
  });

  observer.observe(document.documentElement, {
    childList: true,
    subtree: true,
    characterData: true,
  });
})();
