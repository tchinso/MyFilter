// ==UserScript==
// @name         kio.ac bits-c* 항상 최상단(강제)
// @namespace    https://greasyfork.org/
// @version      1.0.0
// @description  kio.ac에서 id가 bits-c[숫자] 형태인 요소를 항상 다른 모든 요소보다 최상단으로 올림(동적 생성 포함)
// @author       you
// @match        *://kio.ac/*
// @match        *://www.kio.ac/*
// @match        *://*.kio.ac/*
// @run-at       document-start
// @grant        none
// @license      MIT
// ==/UserScript==

(() => {
  'use strict';

  // kio.ac###bits-c112 같은 패턴 => id: bits-c + 숫자
  const ID_RE = /^bits-c\d+$/;
  const MARK_CLASS = '__gf_bits_top__';
  const Z = '2147483647';

  function isElement(n) {
    return n && n.nodeType === 1;
  }

  function isTarget(el) {
    return isElement(el) && typeof el.id === 'string' && ID_RE.test(el.id);
  }

  function elevate(el) {
    if (!isTarget(el)) return;

    // 마킹
    if (!el.classList.contains(MARK_CLASS)) el.classList.add(MARK_CLASS);

    // 같은 부모 안에서라도 "마지막에 그려지게" (동일 z-index 상황에서 유리)
    const p = el.parentNode;
    if (p && p.lastChild !== el) {
      try { p.appendChild(el); } catch (_) {}
    }

    // z-index가 먹게(기본 static이면 z-index 무시되는 경우가 많음)
    try {
      const pos = getComputedStyle(el).position;
      if (pos === 'static') {
        el.style.setProperty('position', 'relative', 'important');
      }
    } catch (_) {
      // getComputedStyle 실패해도 그냥 진행
      el.style.setProperty('position', 'relative', 'important');
    }

    // 최상단 강제
    el.style.setProperty('z-index', Z, 'important');
    // stacking 꼬임 방지용(가끔 부모/형제 컨텍스트가 지저분할 때 도움됨)
    el.style.setProperty('isolation', 'isolate', 'important');
  }

  function scan(root = document) {
    // prefix로 먼저 거르고, 정규식으로 최종 판정
    const list = root.querySelectorAll('[id^="bits-c"]');
    for (const el of list) {
      if (ID_RE.test(el.id)) elevate(el);
    }
  }

  // 너무 자주 스캔하면 피곤하니까 rAF로 한 번에 몰아서 처리
  let scheduled = false;
  function scheduleScan() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(() => {
      scheduled = false;
      scan();
    });
  }

  function start() {
    // 최초 1회
    scan();

    // 동적 생성/변경 감시
    const observer = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'childList') {
          for (const n of m.addedNodes) {
            if (!isElement(n)) continue;

            // 노드 자체가 타겟이면 바로
            if (isTarget(n)) elevate(n);

            // 자식/후손 중 타겟이 섞여 들어오는 경우
            if (n.querySelectorAll) {
              const found = n.querySelectorAll('[id^="bits-c"]');
              for (const el of found) {
                if (ID_RE.test(el.id)) elevate(el);
              }
            }
          }
        } else if (m.type === 'attributes' && m.attributeName === 'id') {
          // 기존 노드가 나중에 id를 부여받는 케이스
          elevate(m.target);
        }
      }
      scheduleScan();
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['id'],
    });

    // 사이트 쪽에서 style을 계속 덮어쓰는 경우 대비: 마킹된 것만 가볍게 재적용
    setInterval(() => {
      const marked = document.querySelectorAll('.' + MARK_CLASS);
      for (const el of marked) elevate(el);
    }, 2000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
  } else {
    start();
  }
})();
