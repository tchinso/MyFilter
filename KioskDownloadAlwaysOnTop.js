// ==UserScript==
// @name         kio.ac 실시간 전송 상태 표시기
// @namespace    http://tampermonkey.net/
// @version      1.0.3
// @description  kio.ac 사이트에서 전송 중인 파일 상태(B/s)를 추출하여 최상단에 실시간으로 표시합니다.
// @author       You
// @match        *://kio.ac/*
// @match        *://*.kio.ac/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // 1. 최상단에 고정될 표시용 오버레이 DOM 생성
    const overlay = document.createElement('div');
    overlay.id = 'kio-speed-overlay';
    Object.assign(overlay.style, {
        position: 'fixed',
        top: '0',
        left: '0',
        width: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.85)', // 가독성을 위한 반투명 검은색 배경
        color: '#ffffff',
        zIndex: '999999',
        pointerEvents: 'none', // 이 오버레이가 기존 사이트 버튼 클릭을 방해하지 않도록 함 (클릭 관통)
        display: 'none',
        flexDirection: 'column',
        fontSize: '13px',
        fontFamily: 'sans-serif',
        maxHeight: '40vh',
        overflowY: 'hidden',
        boxSizing: 'border-box'
    });

    // Body 로드 대기 후 DOM 추가
    const initOverlay = () => {
        if (!document.body) {
            requestAnimationFrame(initOverlay);
            return;
        }
        document.body.appendChild(overlay);
    };
    initOverlay();

    // 2. 0.5초마다 DOM을 검사하여 상태 업데이트 (실시간 복제)
    setInterval(() => {
        // 조건에 맞는 DOM 찾기 (사용자가 지정한 class)
        const targetElements = document.querySelectorAll('div.grow.overflow-hidden');
        let hasActiveTransfers = false;
        let overlayHtml = '';

        targetElements.forEach(el => {
            const fullText = el.textContent || '';
            
            // "B/s)" 문자열이 포함된 DOM만 처리
            if (fullText.includes('B/s)')) {
                hasActiveTransfers = true;
                
                // 예시 구조를 바탕으로 파일명과 속도 텍스트 추출
                const nameEl = el.querySelector('div.overflow-hidden.text-ellipsis:not(.text-xs)');
                const speedEl = el.querySelector('div.overflow-hidden.text-ellipsis.text-xs');

                let nameText = '';
                let speedText = '';

                if (nameEl && speedEl) {
                    // 예시 DOM 구조와 정확히 일치할 때
                    nameText = nameEl.textContent.trim();
                    speedText = speedEl.textContent.trim();
                } else {
                    // 추후 웹사이트 구조가 살짝 바뀌었을 때를 대비한 Fallback (안전장치)
                    const parts = (el.innerText || fullText).split('\n');
                    if (parts.length >= 2) {
                        nameText = parts[0].trim();
                        speedText = parts.slice(1).join(' ').trim();
                    } else {
                        nameText = fullText.trim();
                    }
                }

                // 복제할 내용을 HTML로 구성
                overlayHtml += `
                    <div style="display: flex; justify-content: space-between; padding: 6px 20px; border-bottom: 1px solid rgba(255,255,255,0.15);">
                        <span style="font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 60%; color: #60a5fa;">
                            ${nameText}
                        </span>
                        <span style="white-space: nowrap; font-family: monospace; font-size: 12px; color: #a7f3d0;">
                            ${speedText}
                        </span>
                    </div>
                `;
            }
        });

        // 3. 화면 표시 업데이트 로직
        if (hasActiveTransfers) {
            overlay.innerHTML = overlayHtml;
            if (overlay.style.display !== 'flex') {
                overlay.style.display = 'flex';
            }
        } else {
            // 조건에 맞는 진행 중인 항목이 없으면 오버레이 숨김
            if (overlay.style.display !== 'none') {
                overlay.style.display = 'none';
            }
        }
    }, 500); // 0.5초(500ms)마다 갱신 (부하 없이 실시간처럼 작동)
})();
