// UltimateQueueAndPreview.js
// Combines AutoContinueQueue + PlayVideoIfPreviewNotFound.
// Uses only minimal helpers extracted from TetraxUserscriptLibrary.

(function () {
  "use strict";

  const state = {
    lastHref: "",
    previewScanTimer: null,
    routePollTimer: null,
    bodyObserver: null,
  };

  function waitForElement(selector, timeoutMs = 0, root = document.body) {
    return new Promise((resolve) => {
      const found = document.querySelector(selector);
      if (found) {
        resolve(found);
        return;
      }

      const observer = new MutationObserver(() => {
        const target = document.querySelector(selector);
        if (target) {
          observer.disconnect();
          if (timeoutId) {
            clearTimeout(timeoutId);
          }
          resolve(target);
        }
      });

      observer.observe(root, { childList: true, subtree: true });

      let timeoutId = null;
      if (timeoutMs > 0) {
        timeoutId = setTimeout(() => {
          observer.disconnect();
          resolve(null);
        }, timeoutMs);
      }
    });
  }

  function onRouteChange(callback) {
    const emitIfChanged = () => {
      if (state.lastHref === window.location.href) {
        return;
      }
      state.lastHref = window.location.href;
      callback();
    };

    state.lastHref = window.location.href;
    callback();

    if (window.PluginApi && window.PluginApi.Event && window.PluginApi.Event.addEventListener) {
      window.PluginApi.Event.addEventListener("stash:location", emitIfChanged);
    }

    window.addEventListener("popstate", emitIfChanged);
    window.addEventListener("hashchange", emitIfChanged);

    state.routePollTimer = setInterval(emitIfChanged, 1000);
  }

  function isSceneDetailPage() {
    return /^\/scenes\/\d+/.test(window.location.pathname);
  }

  function autoEnableContinueQueue() {
    if (!isSceneDetailPage()) {
      return;
    }

    if (!document.querySelector("#queue-viewer")) {
      return;
    }

    const checkbox = document.getElementById("continue-checkbox");
    if (!checkbox || checkbox.checked) {
      return;
    }

    checkbox.click();
  }

  async function ensurePreviewFallback(video) {
    const source = video.currentSrc || video.src;
    if (!source || !source.includes("/preview")) {
      return;
    }

    if (video.dataset.uqpCheckedSource === source) {
      return;
    }
    video.dataset.uqpCheckedSource = source;

    try {
      const response = await fetch(source, {
        method: "HEAD",
        cache: "no-store",
      });

      if (!response.ok) {
        video.src = source.replace("/preview", "/stream");
      }
    } catch (_error) {
      video.src = source.replace("/preview", "/stream");
    }
  }

  function scanPreviewVideos() {
    const videos = document.querySelectorAll(".scene-card-preview-video");
    videos.forEach((video) => {
      ensurePreviewFallback(video);
    });
  }

  function schedulePreviewScan() {
    if (state.previewScanTimer !== null) {
      return;
    }

    state.previewScanTimer = setTimeout(() => {
      state.previewScanTimer = null;
      scanPreviewVideos();
    }, 120);
  }

  function handleUiChange() {
    autoEnableContinueQueue();
    schedulePreviewScan();
  }

  async function init() {
    await waitForElement("body", 10000, document.documentElement);

    state.bodyObserver = new MutationObserver(handleUiChange);
    state.bodyObserver.observe(document.body, { childList: true, subtree: true });

    onRouteChange(handleUiChange);

    window.addEventListener("load", handleUiChange);

    handleUiChange();
  }

  init();
})();