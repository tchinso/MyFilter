// ==UserScript==
// @name         kio.ac 전송 상태 모니터
// @namespace    http://tampermonkey.net/
// @version      1.0.6
// @description  kio.ac 사이트에서 파일 전송 상태(B/s)를 감지하여 별도의 탭에서 실시간으로 보여줍니다. (DOM 차단 우회)
// @author       You
// @match        *://kio.ac/*
// @match        *://*.kio.ac/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let monitorWindow = null;
    let lastDataString = "";
    let popupWarned = false;

    // 모니터 창에 데이터를 실시간으로 업데이트하는 함수
    function updateMonitorWindow(dataArray) {
        // 데이터 변경이 없으면 업데이트하지 않음 (성능 최적화)
        const dataString = JSON.stringify(dataArray);
        if (dataString === lastDataString) return;
        lastDataString = dataString;

        // 새 창이 없거나 닫혔으면 새로 엽니다.
        if (!monitorWindow || monitorWindow.closed) {
            // 빈 창 열기
            monitorWindow = window.open('', 'KioTransferMonitor', 'width=500,height=600');
            
            // 팝업 차단에 걸렸을 경우 사용자에게 알림
            if (!monitorWindow) {
                if (!popupWarned) {
                    alert("[kio.ac 모니터 스크립트]\n팝업이 차단되었습니다. 주소창 우측에서 팝업 차단을 해제하고 페이지를 새로고침 해주세요.");
                    popupWarned = true;
                }
                return;
            }

            // 새 창의 초기 HTML 구조 작성 (다크 모드 스타일 적용)
            monitorWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <title>전송 모니터 (kio.ac)</title>
                    <style>
                        body { font-family: 'Malgun Gothic', sans-serif; background: #121212; color: #ffffff; padding: 20px; margin: 0; }
                        h2 { border-bottom: 1px solid #333; padding-bottom: 10px; margin-top: 0; }
                        .item { background: #1e1e1e; padding: 15px; margin-bottom: 15px; border-radius: 8px; border: 1px solid #333; }
                        .filename { font-weight: bold; font-size: 16px; margin-bottom: 8px; word-break: break-all; color: #4dabf7; }
                        .progress { font-size: 14px; color: #b2f2bb; }
                        .empty { color: #888; font-style: italic; }
                    </style>
                </head>
                <body>
                    <h2>🚀 실시간 전송 모니터</h2>
                    <div id="content"><div class="empty">대기 중... (전송이 시작되면 여기에 표시됩니다)</div></div>
                </body>
                </html>
            `);
            monitorWindow.document.close();
        }

        // 새 창의 DOM에 접근하여 내용 업데이트
        const contentDiv = monitorWindow.document.getElementById('content');
        if (contentDiv) {
            if (dataArray.length === 0) {
                contentDiv.innerHTML = '<div class="empty">현재 진행 중인 전송이 없습니다.</div>';
            } else {
                let html = '';
                dataArray.forEach(item => {
                    html += `
                        <div class="item">
                            <div class="filename">${item.filename}</div>
                            <div class="progress">${item.progress}</div>
                        </div>
                    `;
                });
                contentDiv.innerHTML = html;
            }
        }
    }

    // 원본 웹페이지에서 "B/s)"가 포함된 요소를 찾아 데이터 추출
    function extractData() {
        // XPath를 사용해 직접적으로 텍스트 노드에 "B/s)"가 포함된 div만 정확하게 찾음 (부모 div 중복 선택 방지)
        const xpath = "//div[text()[contains(., 'B/s)')]]";
        const result = document.evaluate(xpath, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);

        let extractedData = [];

        for (let i = 0; i < result.snapshotLength; i++) {
            let progressNode = result.snapshotItem(i);
            let progressText = progressNode.textContent.trim();

            // 예시 구조에 따라 이전 형제 요소(previousElementSibling)가 파일명
            let filenameNode = progressNode.previousElementSibling;
            let filenameText = filenameNode ? filenameNode.textContent.trim() : "알 수 없는 파일";

            extractedData.push({
                filename: filenameText,
                progress: progressText
            });
        }

        // 데이터가 있거나, 데이터가 0개가 되었을 때(완료되었을 때) 화면 갱신
        if (extractedData.length > 0 || (monitorWindow && !monitorWindow.closed && lastDataString !== "[]")) {
            updateMonitorWindow(extractedData);
        }
    }

    // MutationObserver를 사용하여 동적 DOM 변화 감지
    // SPA 특성상 DOM 변화가 매우 잦으므로 성능을 위해 디바운스(Debounce) 적용
    let timeoutId;
    const observer = new MutationObserver(() => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(extractData, 300); // DOM 변경 후 0.3초 대기 후 추출 실행
    });

    // Body 전체의 자식 요소 추가/삭제 및 텍스트 변화 감지
    observer.observe(document.body, { childList: true, subtree: true, characterData: true });

})();
