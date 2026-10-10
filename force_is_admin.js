// ==UserScript==
// @name         Force is_admin (테스트용)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  본인 사이트 테스트용 is_admin 강제 설정
// @match        https://commi.kr/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
    'use strict';

    function forceAdmin() {
        try {
            if (window.AUTH && window.AUTH.profile) {
                window.AUTH.profile.is_admin = true;
            }
        } catch (e) {}
    }

    // 페이지 로드 시 즉시 시도
    forceAdmin();

    // AUTH 객체가 나중에 생성되는 경우를 대비해 주기적으로 확인
    const timer = setInterval(forceAdmin, 300);

    // SPA 이동(history.pushState / replaceState) 대응
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function() {
        originalPushState.apply(this, arguments);
        setTimeout(forceAdmin, 50);
    };
    history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        setTimeout(forceAdmin, 50);
    };

    window.addEventListener('popstate', () => setTimeout(forceAdmin, 50));

    // 너무 오래 돌지 않도록 (필요하면 시간 조정)
    setTimeout(() => clearInterval(timer), 30000);
})();
