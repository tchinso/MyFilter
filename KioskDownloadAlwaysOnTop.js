// ==UserScript==
// @name         kio.ac 실시간 전송 상태 표시기 (SPA/스타일 충돌 해결)
// @namespace    http://tampermonkey.net/
// @version      1.0.4
// @description  kio.ac 사이트에서 전송 중인 파일 상태를 추출하여 최상단에 실시간으로 표시합니다.
// @author       You
// @match        *://kio.ac/*
// @match        *://*.kio.ac/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let overlay = null;

    // 1. 오버레이 DOM 생성 및 유지 (사이트 라우팅 중 삭제되면 다시 생성)
    function ensureOverlay() {
        overlay = document.getElementById('kio-speed-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'kio-speed-overlay';
            // 사이트 테마의 간섭을 막기 위해 모든 속성에 !important 강제
            overlay.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100% !important;
                background-color: rgba(0, 0, 0, 0.85) !important;
                color: #ffffff !important;
                z-index: 2147483647 !important; /* 브라우저가 허용하는 최대 높이 */
                pointer-events: none !important; /* 클릭 방해 금지 */
                display: none !important;
                flex-direction: column !important;
                font-size: 13px !important;
                font-family: sans-serif !important;
                max-height: 40vh !important;
                overflow-y: hidden !important;
                box-sizing: border-box !important;
            `;
            if (document.body) {
                document.body.appendChild(overlay);
            }
        }
        return overlay;
    }

    // 2. 0.5초마다 데이터 추출 및 갱신
    setInterval(() => {
        const activeOverlay = ensureOverlay();
        if (!activeOverlay) return;

        // 첨부해주신 HTML 구조 기준 매칭 요소 탐색
        const targetElements = document.querySelectorAll('div.grow.overflow-hidden');
        let hasActiveTransfers = false;
        let overlayHtml = '';

        targetElements.forEach(el => {
            const fullText = el.textContent || '';
            
            // 정규식을 사용해 대소문자나 공백에 상관없이 B/s) 가 있는지 검사 (예: MiB/s) , B/s) 등)
            if (/B\/s\)/i.test(fullText)) {
                hasActiveTransfers = true;
                
                const nameEl = el.querySelector('div.overflow-hidden.text-ellipsis:not(.text-xs)');
                const speedEl = el.querySelector('div.overflow-hidden.text-ellipsis.text-xs');

                let nameText = '';
                let speedText = '';

                if (nameEl && speedEl) {
                    nameText = nameEl.textContent.trim();
                    speedText = speedEl.textContent.trim();
                } else {
                    // Fallback: 자식 요소를 못 찾을 경우 텍스트를 나누어서 강제 추출하는 백업 로직
                    const match = fullText.match(/(.*?)\s+(\d.*B\/s\))/i);
                    if(match) {
                        nameText = match[1].trim();
                        speedText = match[2].trim();
                    } else {
                        nameText = fullText.trim();
                    }
                }

                // 출력할 HTML 템플릿 (사이트 CSS에 묻히지 않도록 인라인 스타일 important 강제)
                overlayHtml += `
                    <div style="display: flex !important; justify-content: space-between !important; padding: 6px 20px !important; border-bottom: 1px solid rgba(255,255,255,0.15) !important;">
                        <span style="font-weight: 600 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; max-width: 60% !important; color: #60a5fa !important;">
                            ${nameText}
                        </span>
                        <span style="white-space: nowrap !important; font-family: monospace !important; font-size: 12px !important; color: #a7f3d0 !important;">
                            ${speedText}
                        </span>
                    </div>
                `;
            }
        });

        // 추출된 데이터가 있다면 표시하고, 없으면 숨김
        if (hasActiveTransfers) {
            activeOverlay.innerHTML = overlayHtml;
            // display 속성도 !important로 강제
            activeOverlay.style.setProperty('display', 'flex', 'important');
        } else {
            activeOverlay.style.setProperty('display', 'none', 'important');
        }
    }, 500);
})();
