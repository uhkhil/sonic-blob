/* nav.js */
(function () {
  const currentUrl = window.location.href;
  const slideMatch = currentUrl.match(/slide-(\d+)\.html/);
  const currentIdx = slideMatch ? parseInt(slideMatch[1]) : 1;
  const totalSlides = 5;

  window.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowRight' && currentIdx < totalSlides) {
      window.location.href = `slide-${currentIdx + 1}.html`;
    } else if (e.key === 'ArrowLeft' && currentIdx > 1) {
      window.location.href = `slide-${currentIdx - 1}.html`;
    }
  });
})();
