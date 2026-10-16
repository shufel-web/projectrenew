/* ============================================
   PROJECT RENEW — NSTP-CWTS 2026
   Vanilla JS — slide navigation, scroll reveal,
   animated budget chart, mobile menu
   ============================================ */

(function () {
  'use strict';

  const slides       = Array.from(document.querySelectorAll('.slide'));
  const totalSlides  = slides.length;
  const dots         = Array.from(document.querySelectorAll('.dot'));
  const navLinks     = Array.from(document.querySelectorAll('.nav-links a'));
  const prevBtn      = document.getElementById('nav-prev');
  const nextBtn      = document.getElementById('nav-next');
  const counter      = document.getElementById('slide-counter');
  const topnav       = document.getElementById('topnav');
  const navToggle    = document.getElementById('nav-toggle');
  const navLinksEl   = document.getElementById('nav-links');
  const chartBars    = document.querySelectorAll('#chart-bars .bar');

  let currentSlide = 1;
  let isAnimating = false;
  const ANIM_LOCK = 350; // ms

  /* ---------- 1. GO TO SLIDE ---------- */
  function goToSlide(n, opts) {
    opts = opts || {};
    if (n < 1 || n > totalSlides) return;
    if (isAnimating && !opts.instant) return;
    if (n === currentSlide && !opts.force) return;

    isAnimating = true;

    // toggle active class on slides
    slides.forEach(function (s, i) {
      const idx = i + 1;
      if (idx === n) {
        s.classList.add('active');
        // match body background to slide bg
        const bg = s.dataset.bg;
        document.body.style.background = bg || '#F8F9FA';
      } else {
        s.classList.remove('active');
      }
    });

    currentSlide = n;
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    // update dots
    dots.forEach(function (d, i) {
      d.classList.toggle('active', i + 1 === n);
    });

    // update nav links
    navLinks.forEach(function (a) {
      const slideNum = parseInt(a.dataset.slide, 10);
      a.classList.toggle('active', slideNum === n);
    });

    // update counter
    counter.textContent = String(n).padStart(2, '0') + ' / ' + String(totalSlides).padStart(2, '0');

    // update arrows
    prevBtn.disabled = n === 1;
    nextBtn.disabled = n === totalSlides;

    // close mobile menu on nav
    if (navLinksEl.classList.contains('open')) {
      navLinksEl.classList.remove('open');
      navToggle.classList.remove('open');
    }

    // trigger chart animation if entering slide 7
    if (n === 7) animateChart();

    // trigger scroll-reveal inside the now-active slide
    revealSlideContents(slides[n - 1]);

    // update hash without scrolling
    if (history.replaceState) {
      history.replaceState(null, '', '#slide-' + n);
    }

    setTimeout(function () { isAnimating = false; }, ANIM_LOCK);
  }

  /* ---------- 2. SCROLL REVEAL INSIDE ACTIVE SLIDE ---------- */
  function revealSlideContents(slide) {
    const items = slide.querySelectorAll('.reveal-up');
    items.forEach(function (el) { el.classList.remove('revealed'); });
    // force reflow
    void slide.offsetWidth;
    requestAnimationFrame(function () {
      items.forEach(function (el) { el.classList.add('revealed'); });
    });
  }

  /* ---------- 3. CHART ANIMATION ---------- */
  function animateChart() {
    chartBars.forEach(function (bar, i) {
      bar.classList.remove('animated');
      bar.style.removeProperty('--target-h');
      // small stagger
      setTimeout(function () {
        const h = parseFloat(bar.dataset.h) || 0;
        bar.style.setProperty('--target-h', h + '%');
        bar.classList.add('animated');
      }, 80 * i + 200);
    });
  }

  function closeMenu() {
    navLinksEl.classList.remove('open');
    navToggle.classList.remove('open');
  }

  // true if the page can still scroll natively in the given direction (1 = down, -1 = up)
  function canScrollPage(dir) {
    const el = document.scrollingElement || document.documentElement;
    if (el.scrollHeight <= el.clientHeight + 2) return false;
    return dir > 0
      ? el.scrollTop + el.clientHeight < el.scrollHeight - 2
      : el.scrollTop > 2;
  }

  /* ---------- 4. EVENT BINDINGS ---------- */

  // prev / next
  prevBtn.addEventListener('click', function () { goToSlide(currentSlide - 1); });
  nextBtn.addEventListener('click', function () { goToSlide(currentSlide + 1); });

  // dots
  dots.forEach(function (d) {
    d.addEventListener('click', function () {
      goToSlide(parseInt(d.dataset.slide, 10));
    });
  });

  // top nav links
  navLinks.forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      closeMenu();
      goToSlide(parseInt(a.dataset.slide, 10));
    });
  });

  // brand click → slide 1
  document.querySelector('.brand').addEventListener('click', function (e) {
    e.preventDefault();
    goToSlide(1);
  });

  // keyboard navigation
  document.addEventListener('keydown', function (e) {
    // ignore when typing in input
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    if (e.key === ' ' && (e.target.tagName === 'BUTTON' || e.target.tagName === 'A')) return;
    if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
      e.preventDefault();
      goToSlide(currentSlide + 1);
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goToSlide(currentSlide - 1);
    } else if (e.key === 'Home') {
      e.preventDefault();
      goToSlide(1);
    } else if (e.key === 'End') {
      e.preventDefault();
      goToSlide(totalSlides);
    }
  });

  // wheel / trackpad navigation (debounced)
  let wheelLock = false;
  document.addEventListener('wheel', function (e) {
    if (wheelLock) return;
    // ignore tiny trackpad jitter
    if (Math.abs(e.deltaY) < 30) return;
    if (canScrollPage(e.deltaY > 0 ? 1 : -1)) return;
    wheelLock = true;
    if (e.deltaY > 0) goToSlide(currentSlide + 1);
    else goToSlide(currentSlide - 1);
    setTimeout(function () { wheelLock = false; }, 800);
  }, { passive: true });

  // touch swipe (mobile)
  let touchStartY = 0;
  let touchStartX = 0;
  let touchStartScroll = 0;
  document.addEventListener('touchstart', function (e) {
    touchStartY = e.touches[0].clientY;
    touchStartX = e.touches[0].clientX;
    touchStartScroll = window.scrollY;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    const dy = e.changedTouches[0].clientY - touchStartY;
    const dx = e.changedTouches[0].clientX - touchStartX;
    if (Math.abs(dy) > 60 && Math.abs(dy) > Math.abs(dx)) {
      if (window.scrollY !== touchStartScroll || canScrollPage(dy < 0 ? 1 : -1)) return;
      if (dy < 0) goToSlide(currentSlide + 1);
      else goToSlide(currentSlide - 1);
    }
  }, { passive: true });

  // mobile nav toggle
  navToggle.addEventListener('click', function () {
    navLinksEl.classList.toggle('open');
    navToggle.classList.toggle('open');
  });

  // nav shadow on scroll (only used when body actually scrolls — page is slide-locked, so this is mainly for safety)
  window.addEventListener('scroll', function () {
    topnav.classList.toggle('scrolled', window.scrollY > 4);
  });

  /* ---------- 5. INIT ---------- */
  function init() {
    // pick starting slide from hash
    const hash = window.location.hash;
    let start = 1;
    if (hash) {
      const m = hash.match(/slide-(\d+)/);
      if (m) start = Math.max(1, Math.min(totalSlides, parseInt(m[1], 10)));
    }
    goToSlide(start, { instant: true, force: true });
  }

  // run init after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
