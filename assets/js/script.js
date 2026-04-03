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
let lastY = window.scrollY;

window.addEventListener('scroll', () => {
  const y = window.scrollY;
  navbar.classList.toggle('hidden', y > lastY && y > 80);
  lastY = y;
}, { passive: true });

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
