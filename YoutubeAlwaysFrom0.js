// ==UserScript==
// @name         YouTube – always from 0 s (hiyori v3 – seekTo hammer)
// @namespace    NyanKatX3
// @version      1.3.0
// @description  플레이어가 완전히 뜬 뒤에도 집요하게 seekTo(0) 연타해서 이어보기를 무력화해…
// @match        https://www.youtube.com/*
// @run-at       document-start
// ==/UserScript==

(() => {
  'use strict';

  /** 한 동영상마다 최대 5 s 동안 0초로 끌어당기는 망치 */
  const hammer = () => {
    let ticks = 0;
    const id = setInterval(() => {
      /* Polymer 플레이어 객체 구하기 */
      const playerEl = document.querySelector('ytd-player') || document.querySelector('ytd-watch-flexy');
      const player = playerEl && typeof playerEl.getPlayer === 'function' ? playerEl.getPlayer() : null;

      if (player && typeof player.seekTo === 'function') {
        const t = player.getCurrentTime?.() || 0;
        if (t > 0.05) player.seekTo(0, true);   // true → allowSeekAhead
      }

      if (++ticks > 100) clearInterval(id);  // 50 ms × 100 = 5 s 동안 망치질
    }, 50);
  };

  /** 동영상 전환마다 망치 준비 */
  const bind = () => {
    document.addEventListener('yt-navigate-finish', hammer, true);
    hammer(); // 첫 진입용
  };

  /* 스크립트 주입이 너무 일러서 ytd-player가 아직 없을 때 대비해 살짝 뒤에서 실행 */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind, { once: true });
  } else {
    bind();
  }
})();
