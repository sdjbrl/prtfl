'use strict';

// ——— Boot screen ———
const bootScreen = document.getElementById('boot-screen');
if (bootScreen) {
  const bootDate = document.getElementById('boot-date');
  const bootTime = document.getElementById('boot-time');
  const progress = document.getElementById('boot-progress');
  const lines    = bootScreen.querySelectorAll('.boot-line');

  const DAYS   = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

  function pad(n) { return String(n).padStart(2, '0'); }

  function setDate() {
    const d = new Date();
    bootDate.textContent = `DATE &nbsp;&nbsp;: ${DAYS[d.getDay()]} ${pad(d.getDate())} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  function setTime() {
    const d = new Date();
    bootTime.textContent = `TIME &nbsp;&nbsp;: ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  }

  setDate();
  setTime();
  const clock = setInterval(setTime, 1000);

  // Apparition des lignes une par une
  lines.forEach((line, i) => setTimeout(() => line.classList.add('visible'), i * 220));

  // Barre de progression
  setTimeout(() => { progress.style.width = '100%'; }, 150);

  // Fermeture
  setTimeout(() => {
    clearInterval(clock);
    bootScreen.classList.add('fade-out');
    setTimeout(() => bootScreen.remove(), 700);
  }, 3000);
}

// ——— Horloge navbar ———
const navClock = document.getElementById('nav-clock');
if (navClock) {
  function updateNavClock() {
    const d = new Date();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    navClock.textContent = `${hh}:${mm}:${ss}`;
  }
  updateNavClock();
  setInterval(updateNavClock, 1000);
}

// ——— Navbar : masquer au scroll bas, réafficher au scroll haut ———
const navbar = document.querySelector('[data-navbar]');
const topBar = document.querySelector('[data-top-bar]');
let lastY = window.scrollY;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  const shouldHide = y > lastY && y > 80;
  
  if (topBar) topBar.classList.toggle('hidden', shouldHide);
  if (navbar) navbar.classList.toggle('hidden', shouldHide);
  
  lastY = y;
}, { passive: true });

// ——— Back to top button ———
const backToTop = document.querySelector('[data-back-to-top]');

if (backToTop) {
  window.addEventListener('scroll', () => {
    backToTop.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  
  backToTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// ——— Navigation mobile ———
const navToggle = document.querySelector('[data-nav-toggle]');
const navLinks  = document.querySelector('[data-nav-links]');

if (navToggle && navLinks) {
  navToggle.addEventListener('click', () => navLinks.classList.toggle('open'));
  navLinks.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('open'));
  });
}

// ——— Scroll reveal ———
const revealObs = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObs.unobserve(entry.target);
    }
  });
}, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

document.querySelectorAll('.reveal').forEach(el => revealObs.observe(el));

// ——— Filtre portfolio ———
const filterBtns  = document.querySelectorAll('[data-filter-btn]');
const filterItems = document.querySelectorAll('[data-filter-item]');

function normalize(t) {
  return t.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    const selected = normalize(btn.dataset.filter);
    filterItems.forEach(item => {
      const cat = normalize(item.dataset.category || '');
      item.classList.toggle('hidden', selected !== 'tous' && cat !== selected);
    });
  });
});

// ——— Modal projet ———
const modal      = document.querySelector('[data-modal]');
const modalClose = document.querySelectorAll('[data-modal-close]');

function openModal(card) {
  const d = card.dataset;
  modal.querySelector('[data-pd-title]').textContent    = d.projectTitle    || '';
  modal.querySelector('[data-pd-category]').textContent = d.projectCategory || '';
  modal.querySelector('[data-pd-dates]').textContent    = d.projectDates    || '';
  modal.querySelector('[data-pd-context]').textContent  = d.projectContext  || '';
  modal.querySelector('[data-pd-methods]').textContent  = d.projectMethods  || '';

  const skillsBox = modal.querySelector('[data-pd-skills]');
  skillsBox.innerHTML = '';
  if (d.projectSkills) {
    d.projectSkills.split(',').forEach(s => {
      const tag = document.createElement('span');
      tag.className = 'skill-tag';
      tag.textContent = s.trim();
      skillsBox.appendChild(tag);
    });
  }

  const ganttFig = modal.querySelector('[data-pd-gantt]');
  const ganttImg = modal.querySelector('[data-pd-gantt-img]');
  if (d.projectGantt) {
    ganttImg.src = d.projectGantt;
    ganttFig.style.display = '';
  } else {
    ganttFig.style.display = 'none';
  }

  const linkEl    = modal.querySelector('[data-pd-link]');
  const linkLabel = modal.querySelector('[data-pd-link-label]');
  if (d.projectLink) {
    linkEl.href = d.projectLink;
    linkLabel.textContent = d.projectLinkLabel || 'Voir le projet';
    linkEl.classList.remove('hidden');
  } else {
    linkEl.classList.add('hidden');
  }

  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', () => openModal(card));
});

const featBtn = document.querySelector('[data-open-modal]');
if (featBtn) {
  featBtn.addEventListener('click', (e) => {
    e.preventDefault();
    const featProject = featBtn.closest('[data-filter-item]');
    if (featProject) openModal(featProject);
  });
}

modalClose.forEach(el => el.addEventListener('click', closeModal));
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });

// ——— Formulaire contact ———
const form        = document.querySelector('[data-form]');
const formInputs  = document.querySelectorAll('[data-form-input]');
const formBtn     = document.querySelector('[data-form-btn]');
const formSuccess = document.querySelector('[data-form-success]');

if (form && formBtn) {
  formInputs.forEach(input => {
    input.addEventListener('input', () => {
      formBtn.disabled = !form.checkValidity();
    });
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formBtn.disabled = true;
    formBtn.textContent = 'Envoi en cours...';

    try {
      const res = await fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { Accept: 'application/json' }
      });
      if (res.ok) {
        form.classList.add('hidden');
        if (formSuccess) formSuccess.classList.remove('hidden');
      } else {
        formBtn.disabled = false;
        formBtn.textContent = 'Réessayer';
      }
    } catch {
      formBtn.disabled = false;
      formBtn.textContent = 'Réessayer';
    }
  });
}

// ——— Bouton section suivante ———
const sectionNavBtn   = document.getElementById('section-nav-btn');
const sectionNavLabel = document.getElementById('section-nav-label');
const SECTIONS = ['hero', 'apropos', 'arsenal', 'cv', 'portfolio', 'veille', 'contact'];
const SECTION_LABELS = {
  hero:      'À propos',
  apropos:   'Arsenal',
  arsenal:   'Parcours',
  cv:        'Projets',
  portfolio: 'Veille',
  veille:    'Contact',
  contact:   'Haut de page',
};

if (sectionNavBtn) {
  function getCurrentSection() {
    const scrollY = window.scrollY + 100;
    let current = SECTIONS[0];
    for (const id of SECTIONS) {
      const el = document.getElementById(id);
      if (el && el.offsetTop <= scrollY) current = id;
    }
    return current;
  }

  function updateNavBtn() {
    const current = getCurrentSection();
    sectionNavLabel.textContent = SECTION_LABELS[current] || 'Suivant';
  }

  sectionNavBtn.addEventListener('click', () => {
    const current = getCurrentSection();
    const idx = SECTIONS.indexOf(current);
    if (idx < SECTIONS.length - 1) {
      document.getElementById(SECTIONS[idx + 1]).scrollIntoView({ behavior: 'smooth' });
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  });

  updateNavBtn();
  window.addEventListener('scroll', updateNavBtn, { passive: true });
}

// ——— PSR Accordion (Problématique-Solution-Résultat) ———
const psrToggles = document.querySelectorAll('[data-psr-toggle]');

psrToggles.forEach(toggle => {
  toggle.addEventListener('click', () => {
    const psr = toggle.closest('.project-psr');
    const body = psr.querySelector('.psr-body');
    const isOpen = body.classList.contains('open');
    
    // Toggle l'accordéon
    body.classList.toggle('open');
    toggle.classList.toggle('open');
    
    // Animation smooth
    if (!isOpen) {
      body.style.maxHeight = body.scrollHeight + 'px';
    } else {
      body.style.maxHeight = '0';
    }
  });
});

// ——— Drawer PDF tableau de synthèse ———
const pdfDrawer = document.querySelector('[data-pdf-drawer]');
if (pdfDrawer) {
  const toggle   = pdfDrawer.querySelector('[data-pdf-toggle]');
  const frame    = pdfDrawer.querySelector('[data-pdf-frame]');
  const closeBtn = pdfDrawer.querySelector('[data-pdf-close]');

  toggle.addEventListener('click', () => {
    const isOpen = !frame.hidden;
    frame.hidden = isOpen;
    pdfDrawer.classList.toggle('open', !isOpen);
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => {
      frame.hidden = true;
      pdfDrawer.classList.remove('open');
    });
  }
}

// ============================================================
// SCROLL ANIMATIONS - Intersection Observer
// ============================================================

// Configuration de l'observer
const observerOptions = {
  threshold: 0.1, // 10% de l'élément visible
  rootMargin: '0px 0px -100px 0px' // Trigger 100px avant le bottom
};

// Callback quand un élément devient visible
const handleIntersection = (entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      // Option: unobserve après animation (performance)
      // observer.unobserve(entry.target);
    }
  });
};

// Créer l'observer
const scrollObserver = new IntersectionObserver(handleIntersection, observerOptions);

// Sélectionner tous les éléments à animer
const animatedElements = document.querySelectorAll(
  '.fade-in-up, .fade-in, .slide-in-left, .slide-in-right, .scale-in, .animate-on-scroll'
);

// Observer chaque élément
animatedElements.forEach(el => scrollObserver.observe(el));

// ============================================================
// HOVER GLOW EFFECT - Suivi de souris
// ============================================================
const glowCards = document.querySelectorAll('.glow-card');

glowCards.forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  });
});

// ============================================================
// PRELOAD OPTIMIZATION
// ============================================================
// Lazy load des images (si besoin)
if ('loading' in HTMLImageElement.prototype) {
  const images = document.querySelectorAll('img[loading="lazy"]');
  images.forEach(img => {
    img.src = img.dataset.src || img.src;
  });
} else {
  // Fallback pour navigateurs anciens
  const script = document.createElement('script');
  script.src = 'https://cdn.jsdelivr.net/npm/lazysizes@5.3.2/lazysizes.min.js';
  document.body.appendChild(script);
}

// ============================================================
// 3D CARD TILT EFFECT - Premium
// ============================================================
const projectCards = document.querySelectorAll('.project-card');
const serviceCards = document.querySelectorAll('.service-card');

function setup3DTilt(cards, maxTilt = 8) {
  cards.forEach(card => {
    card.addEventListener('mousemove', (e) => {
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left; // Position X dans la carte
      const y = e.clientY - rect.top;  // Position Y dans la carte
      
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      
      // Calcul de l'inclinaison en degrés (-maxTilt à +maxTilt)
      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;
      
      // Application de la transformation 3D
      card.style.transform = `
        perspective(1000px)
        rotateX(${rotateX}deg)
        rotateY(${rotateY}deg)
        translateY(-8px)
        scale(1.02)
      `;
      
      // Ajout d'un highlight suivant le curseur
      const glowX = (x / rect.width) * 100;
      const glowY = (y / rect.height) * 100;
      card.style.setProperty('--glow-x', `${glowX}%`);
      card.style.setProperty('--glow-y', `${glowY}%`);
    });
    
    card.addEventListener('mouseleave', () => {
      // Reset à la position normale avec transition smooth
      card.style.transform = 'perspective(1000px) rotateX(0) rotateY(0) translateY(0) scale(1)';
    });
  });
}

// Activer le 3D tilt sur les cartes
setup3DTilt(projectCards, 6); // Tilt de 6° pour les projets
setup3DTilt(serviceCards, 4); // Tilt de 4° pour les services (plus subtil)

// ============================================================
// SMOOTH PARALLAX SCROLLING
// ============================================================
let ticking = false;
let scrollY = window.pageYOffset;

const parallaxElements = [
  { selector: '.hero', speed: 0.08 },      // Réduit de 0.3 → 0.08 (très subtil)
  { selector: '.highlights', speed: 0.05 }, // Réduit de 0.15 → 0.05 (ultra subtil)
  { selector: '.about-photo img', speed: 0.12 }, // Réduit de 0.5 → 0.12 (subtil)
];

function updateParallax() {
  parallaxElements.forEach(({ selector, speed }) => {
    const elements = document.querySelectorAll(selector);
    elements.forEach(el => {
      const offset = scrollY * speed;
      el.style.transform = `translateY(${offset}px)`;
    });
  });
  ticking = false;
}

window.addEventListener('scroll', () => {
  scrollY = window.pageYOffset;
  
  if (!ticking) {
    requestAnimationFrame(updateParallax);
    ticking = true;
  }
});

// ============================================================
// MAGNETIC BUTTONS - Attraction au curseur
// ============================================================
const magneticButtons = document.querySelectorAll('.btn, .filter-btn');

magneticButtons.forEach(btn => {
  btn.addEventListener('mousemove', (e) => {
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Attraction magnétique (max 8px de déplacement)
    const distance = Math.sqrt(x * x + y * y);
    const strength = Math.min(distance / 20, 1); // Limiter la force
    
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  });
  
  btn.addEventListener('mouseleave', () => {
    btn.style.transform = 'translate(0, 0)';
  });
});

// ============================================================
// CURSOR GLOW TRAIL - Premium effect
// ============================================================
const cursorGlow = document.createElement('div');
cursorGlow.className = 'cursor-glow';
cursorGlow.style.cssText = `
  position: fixed;
  width: 400px;
  height: 400px;
  background: radial-gradient(circle, hsla(192, 91%, 42%, 0.15) 0%, transparent 70%);
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: screen;
  transition: opacity 0.3s ease;
  opacity: 0;
`;
document.body.appendChild(cursorGlow);

let cursorX = 0;
let cursorY = 0;
let glowX = 0;
let glowY = 0;

document.addEventListener('mousemove', (e) => {
  cursorX = e.clientX;
  cursorY = e.clientY;
  cursorGlow.style.opacity = '1';
});

document.addEventListener('mouseleave', () => {
  cursorGlow.style.opacity = '0';
});

function animateGlow() {
  // Smooth follow avec lerp (linear interpolation)
  glowX += (cursorX - glowX) * 0.15;
  glowY += (cursorY - glowY) * 0.15;
  
  cursorGlow.style.transform = `translate(${glowX - 200}px, ${glowY - 200}px)`;
  requestAnimationFrame(animateGlow);
}

animateGlow();

// ============================================================
// TEXT REVEAL ON SCROLL - Letter by letter
// ============================================================
const revealTexts = document.querySelectorAll('[data-text-reveal]');

revealTexts.forEach(text => {
  const originalText = text.textContent;
  text.innerHTML = originalText
    .split('')
    .map((char, i) => `<span style="animation-delay: ${i * 0.03}s">${char === ' ' ? '&nbsp;' : char}</span>`)
    .join('');
});

// Activer l'animation au scroll
const textObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('text-revealed');
      textObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

revealTexts.forEach(text => textObserver.observe(text));

console.log('🎨 Premium Animations Loaded - by SA');

