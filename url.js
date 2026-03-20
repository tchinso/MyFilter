(() => {
  // 키워드와 이동할 주소를 여기서만 관리하면 됩니다.
  // 새 규칙 추가 예시:
  // { keyword: "blog", target: "https://example.com/blog" },
  const redirectRules = [
    { keyword: "twt", target: "https://x.com/i/communities/1489301791259115521" },
    { keyword: "video", target: "https://www.youtube.com/watch?v=DBcP4hq7oUU" },
    { keyword: "base64", target: "https://tchinso.github.io/Favorites/app/TextDecoder" }
  ];

  const currentUrl = decodeURIComponent(window.location.href).toLowerCase();

  for (const rule of redirectRules) {
    if (!rule?.keyword || !rule?.target) continue;

    const keyword = String(rule.keyword).toLowerCase();
    if (!currentUrl.includes(keyword)) continue;

    // 뒤로 가기 히스토리를 남기지 않도록 replace 사용
    if (window.location.href !== rule.target) {
      window.location.replace(rule.target);
    }
    break;
  }
})();
