/* ============================================================
   DROPTHAN — SCROLL-DRIVEN FRAME ANIMATION + UI
   ============================================================ */

(function () {
  'use strict';

  /* ── Config ── */
  const TOTAL_FRAMES = 21;
  const FRAME_BASE   = 'ezgif-8a8b7b8f7533085b-jpg/ezgif-frame-';
  // Pad frame number: 1 → "001"
  const frameSrc = n => FRAME_BASE + String(n).padStart(3, '0') + '.jpg';

  /* ── DOM ── */
  const heroContainer  = document.getElementById('heroScrollContainer');
  const heroSticky     = document.getElementById('heroSticky');
  const heroFrame      = document.getElementById('heroFrame');
  const heroDtWrap     = document.getElementById('heroDtWrap');
  const heroLetters    = heroDtWrap ? heroDtWrap.querySelectorAll('.hero-dt-letter') : [];
  const heroWelcome    = document.getElementById('heroWelcomeLabel');
  const heroPortrait   = document.getElementById('heroPortraitWrap');
  const heroGlow       = heroPortrait ? heroPortrait.querySelector('.hero-portrait-glow') : null;
  const scrollIndicator = document.getElementById('scrollIndicator');
  const header         = document.getElementById('header');
  const hamburger      = document.getElementById('hamburger');
  const mobileNav      = document.getElementById('mobileNav');

  /* ── Preload all frames ── */
  const preloaded = [];
  for (let i = 1; i <= TOTAL_FRAMES; i++) {
    const img = new Image();
    img.src = frameSrc(i);
    preloaded.push(img);
  }

  /* ============================================================
     SCROLL-DRIVEN ENGINE
     progress 0 → 1 as scroll moves through heroScrollContainer
  ============================================================ */
  let lastFrame  = -1;
  let ticking    = false;
  let scrollHidden = false;

  function getProgress() {
    if (!heroContainer) return 0;
    const rect    = heroContainer.getBoundingClientRect();
    const total   = heroContainer.offsetHeight - window.innerHeight;
    const scrolled = -rect.top;
    return Math.min(1, Math.max(0, scrolled / total));
  }

  function applyProgress(p) {
    /* 1. Frame swap */
    const frameIndex = Math.round(p * (TOTAL_FRAMES - 1)) + 1;
    if (frameIndex !== lastFrame && heroFrame) {
      heroFrame.src = frameSrc(frameIndex);
      lastFrame = frameIndex;
    }

    /* 2. Portrait: blur 16→0px, brightness 0.3→1.05, opacity 0.4→1 */
    if (heroFrame) {
      const blurVal    = 16 * (1 - p);
      const brightVal  = 0.3 + 0.75 * p;
      const opacityVal = 0.4 + 0.6 * p;
      heroFrame.style.filter  = `blur(${blurVal.toFixed(1)}px) brightness(${brightVal.toFixed(2)})`;
      heroFrame.style.opacity = opacityVal.toFixed(3);
    }
    if (heroGlow) {
      heroGlow.style.opacity = (p * 0.85).toFixed(3);
    }

    /* 3. DROPTHAN letters: wireframe → solid
       Each letter solidifies staggered by --i */
    const textFadeProgress = Math.min(1, Math.max(0, (p - 0.55) / 0.25));
    const textOpacity = 1 - (textFadeProgress * textFadeProgress * (3 - 2 * textFadeProgress));
    if (heroDtWrap) {
      heroDtWrap.style.opacity = textOpacity.toFixed(3);
    }
    heroLetters.forEach((letter, i) => {
      const letterP = Math.min(1, Math.max(0, (p * TOTAL_FRAMES - i * 0.5) / (TOTAL_FRAMES * 0.4)));
      // Stroke fades out, fill fades in
      const strokeAlpha = (1 - letterP) * 0.35;
      const fillAlpha   = letterP;
      const glowStrength = letterP * 18;
      letter.style.cssText = `
        --i: ${i};
        color: rgba(255,255,255,${fillAlpha.toFixed(3)});
        -webkit-text-stroke: ${(1.5 * (1 - letterP)).toFixed(2)}px rgba(180,210,255,${strokeAlpha.toFixed(3)});
        text-shadow: 0 0 ${glowStrength.toFixed(0)}px rgba(180,220,255,${(letterP * 0.4).toFixed(3)}),
                     0 0 ${(glowStrength * 2).toFixed(0)}px rgba(77,166,255,${(letterP * 0.15).toFixed(3)});
        opacity: ${(0.25 + 0.75 * fillAlpha).toFixed(3)};
      `;
    });

    /* 4. WELCOME: slides upward as scroll progresses, brighter */
    if (heroWelcome) {
      heroWelcome.style.opacity = textOpacity.toFixed(3);
      // Moves from just-below-title to well-above-title over scroll
      const baseTop  = 38;   /* % from top — matches .hero-dt-wrap top */
      const offsetPx = 38 + (1 - p) * 60; /* starts further below, rises */
      heroWelcome.style.top     = `calc(${baseTop}% - ${offsetPx.toFixed(1)}px)`;
      heroWelcome.style.color   = `rgba(255,255,255,${(0.18 + 0.67 * p).toFixed(3)})`;
      heroWelcome.style.letterSpacing = `${(10 + p * 12).toFixed(1)}px`;
    }

    /* 5. Scroll indicator: hide immediately on any scroll */
    if (scrollIndicator) {
      if (p > 0.01 && !scrollHidden) {
        scrollIndicator.classList.add('hidden');
        scrollHidden = true;
      } else if (p <= 0.01 && scrollHidden) {
        scrollIndicator.classList.remove('hidden');
        scrollHidden = false;
      }
    }
  }

  function onScroll() {
    if (!ticking) {
      requestAnimationFrame(() => {
        applyProgress(getProgress());
        ticking = false;
      });
      ticking = true;
    }

    /* Header style */
    if (header) {
      header.classList.toggle('scrolled', window.scrollY > 30);
    }

    /* Scroll-reveal for sections below hero */
    checkReveal();
  }

  window.addEventListener('scroll', onScroll, { passive: true });

  /* Init on load */
  window.addEventListener('load', () => {
    applyProgress(0);
    checkReveal();
  });

  /* ============================================================
     SCROLL REVEAL (sections below hero)
  ============================================================ */
  function checkReveal() {
    document.querySelectorAll('.reveal-up, .reveal-left, .reveal-right').forEach(el => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight - 60) {
        el.classList.add('visible');
      }
    });
  }

  /* ============================================================
     HAMBURGER MENU
  ============================================================ */
  if (hamburger && mobileNav) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('open');
      mobileNav.classList.toggle('open');
    });
    mobileNav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('open');
        mobileNav.classList.remove('open');
      });
    });
  }

  /* ============================================================
     SERVICE CAROUSEL — automatic sequential spotlight rotation
  ============================================================ */
  const servicesGrid = document.getElementById('servicesGrid');
  const servicesActions = document.getElementById('servicesActions');
  const servicesRotationStatus = document.getElementById('servicesRotationStatus');
  const servicesRotationToggle = document.getElementById('servicesRotationToggle');
  const serviceCards = servicesGrid ? Array.from(servicesGrid.querySelectorAll('.service-card')) : [];

  if (servicesGrid && servicesActions && servicesRotationToggle && serviceCards.length) {
    let activeServiceIndex = 0;
    let manuallyPaused = false;
    let hovered = false;
    let focused = false;

    const isPaused = () => manuallyPaused || hovered || focused || document.hidden;
    const updateStatus = () => {
      const serviceNumber = activeServiceIndex + 1;
      if (servicesRotationStatus) {
        servicesRotationStatus.textContent = `${isPaused() ? 'Paused' : 'Auto rotation'} · Service ${serviceNumber} of ${serviceCards.length}`;
      }
      servicesRotationToggle.textContent = manuallyPaused ? 'Resume rotation' : 'Pause rotation';
      servicesRotationToggle.setAttribute('aria-pressed', String(manuallyPaused));
    };
    const selectService = index => {
      activeServiceIndex = index;
      serviceCards.forEach((card, cardIndex) => {
        card.classList.toggle('is-active', cardIndex === activeServiceIndex);
        card.setAttribute('aria-pressed', String(manuallyPaused && cardIndex === activeServiceIndex));
      });
      updateStatus();
    };

    servicesActions.classList.add('is-enabled');
    servicesGrid.classList.add('rotation-ready');
    selectService(activeServiceIndex);

    servicesRotationToggle.addEventListener('click', () => {
      manuallyPaused = !manuallyPaused;
      selectService(activeServiceIndex);
    });

    serviceCards.forEach((card, index) => {
      card.addEventListener('pointerenter', () => {
        hovered = true;
        selectService(index);
      });
      card.addEventListener('pointerleave', () => {
        hovered = false;
        updateStatus();
      });
      card.addEventListener('focusin', () => {
        focused = true;
        selectService(index);
      });
      card.addEventListener('focusout', event => {
        if (!card.contains(event.relatedTarget)) {
          focused = false;
          updateStatus();
        }
      });
      card.addEventListener('click', () => {
        if (manuallyPaused && activeServiceIndex === index) {
          manuallyPaused = false;
        } else {
          manuallyPaused = true;
        }
        selectService(index);
      });
      card.addEventListener('keydown', event => {
        if (event.target !== card || (event.key !== 'Enter' && event.key !== ' ')) return;
        event.preventDefault();
        card.click();
      });
    });

    window.setInterval(() => {
      if (isPaused()) return;
      selectService((activeServiceIndex + 1) % serviceCards.length);
    }, 4200);
  }

  /* ============================================================
     SMOOTH SCROLL for anchor links
  ============================================================ */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const headerH = header ? header.offsetHeight : 68;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 10;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* ============================================================
     LOGO — click scrolls to top
  ============================================================ */
  const logoEl = document.getElementById('logo-link');
  if (logoEl) {
    logoEl.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  /* ============================================================
     CONTACT CARDS — subtle 3D tilt
  ============================================================ */
  document.querySelectorAll('.contact-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r  = card.getBoundingClientRect();
      const dx = (e.clientX - r.left - r.width  / 2) / (r.width  / 2);
      const dy = (e.clientY - r.top  - r.height / 2) / (r.height / 2);
      card.style.transform = `translateY(-4px) rotateX(${(-dy*4).toFixed(1)}deg) rotateY(${(dx*4).toFixed(1)}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });

})();
