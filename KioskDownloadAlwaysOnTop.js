// ==UserScript==
// @name         kio.ac 실시간 전송 상태 표시기 (완벽 우회판)
// @namespace    http://tampermonkey.net/
// @version      1.0.5
// @description  kio.ac 사이트의 Svelte DOM 통제와 CSS 간섭을 완벽히 우회하여 전송 상태를 표시합니다.
// @author       You
// @match        *://kio.ac/*
// @match        *://*.kio.ac/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 오버레이 컨테이너 생성 (Shadow DOM 적용)
    function getOverlayContainer() {
        // 호스트 ID 설정
        let host = document.getElementById('kio-speed-tracker-host');
        
        if (!host) {
            host = document.createElement('div');
            host.id = 'kio-speed-tracker-host';
            
            // [핵심1] body가 아닌 html 문서 전체를 기준으로 강제 고정
            host.style.cssText = `
                position: fixed !important;
                top: 0 !important;
                left: 0 !important;
                width: 100vw !important;
                z-index: 2147483647 !important;
                pointer-events: none !important;
            `;
            
            // [핵심2] SvelteKit의 DOM 파괴를 피하기 위해 documentElement(<html> 태그)에 부착
            if (document.documentElement) {
                document.documentElement.appendChild(host);
            }

            // [핵심3] Shadow DOM 개통 - 기존 사이트의 Tailwind CSS 등 스타일 간섭을 100% 차단
            const shadow = host.attachShadow({ mode: 'open' });
            const container = document.createElement('div');
            container.id = 'kio-container';
            
            // CSP(Content-Security-Policy) 방어를 위해 style 태그가 아닌 요소 자체에 CSS 직접 부여
            container.style.cssText = `
                display: none;
                flex-direction: column;
                background-color: rgba(0, 0, 0, 0.85);
                font-family: 'Segoe UI', sans-serif;
                font-size: 14px;
                max-height: 40vh;
                overflow-y: hidden;
                width: 100%;
                box-sizing: border-box;
                border-bottom: 2px solid #3b82f6;
            `;
            
            shadow.appendChild(container);
        }
        
        return host.shadowRoot.getElementById('kio-container');
    }

    // 2. 상태 추출 및 실시간 업데이트 루프 (0.5초)
    setInterval(() => {
        const container = getOverlayContainer();
        if (!container) return;

        // 사이트 내의 타겟 요소 찾기
        const targetElements = document.querySelectorAll('div.grow.overflow-hidden');
        let hasActiveTransfers = false;
        let overlayHtml = '';

        targetElements.forEach(el => {
            const fullText = el.textContent || '';
            
            // B/s) 문자열이 존재하면 진행 중인 다운로드로 간주
            if (fullText.includes('B/s)')) {
                hasActiveTransfers = true;
                
                let nameText = '';
                let speedText = '';
                
                // 첨부된 HTML 구조 기준: .text-xs가 없는 것은 파일명, 있는 것은 속도/진행률
                const nameEl = el.querySelector('div.overflow-hidden.text-ellipsis:not(.text-xs)');
                const speedEl = el.querySelector('div.overflow-hidden.text-ellipsis.text-xs');

                if (nameEl && speedEl) {
                    nameText = nameEl.textContent.trim();
                    speedText = speedEl.textContent.trim();
                } else {
                    // 추후 웹페이지 구조 변경 시 안전장치 (정규식 분해)
                    const match = fullText.match(/(.*?)\s+(\d.*B\/s\))/i);
                    if (match) {
                        nameText = match[1].trim();
                        speedText = match[2].trim();
                    } else {
                        nameText = fullText.trim();
                    }
                }

                // 인라인 스타일로 UI 생성 (Shadow DOM 내부에 들어가므로 웹사이트의 CSS 파괴에 면역)
                overlayHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 8px 24px; border-bottom: 1px solid rgba(255, 255, 255, 0.1); color: #ffffff;">
                        <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 65%; color: #93c5fd;">
                            ${nameText}
                        </span>
                        <span style="white-space: nowrap; font-family: monospace; font-size: 13px; color: #6ee7b7;">
                            ${speedText}
                        </span>
                    </div>
                `;
            }
        });

        // 결과 업데이트
        if (hasActiveTransfers) {
            container.innerHTML = overlayHtml;
            container.style.display = 'flex';
        } else {
            container.style.display = 'none';
        }
        
    }, 500);
})();
