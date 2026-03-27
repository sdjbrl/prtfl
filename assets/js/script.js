'use strict';



// element toggle function
const elementToggleFunc = function (elem) { elem.classList.toggle("active"); }

// normalize text for navigation comparisons (strip accents, lowercase, trim)
const normalizeText = function (str) {
  if (!str) return '';
  return str.trim().toLowerCase().normalize('NFD').replace(/[[\u0300-\u036f]]/g, '').replace(/\s+/g, ' ');
} 



// sidebar variables
const sidebar = document.querySelector("[data-sidebar]");
const sidebarBtn = document.querySelector("[data-sidebar-btn]");

// sidebar toggle functionality for mobile
sidebarBtn.addEventListener("click", function () { elementToggleFunc(sidebar); });



// testimonials variables
const testimonialsItem = document.querySelectorAll("[data-testimonials-item]");
const modalContainer = document.querySelector("[data-modal-container]");
const modalCloseBtn = document.querySelector("[data-modal-close-btn]");
const overlay = document.querySelector("[data-overlay]");

// modal variable
const modalImg = document.querySelector("[data-modal-img]");
const modalTitle = document.querySelector("[data-modal-title]");
const modalText = document.querySelector("[data-modal-text]");

// modal toggle function
const testimonialsModalFunc = function () {
  modalContainer.classList.toggle("active");
  overlay.classList.toggle("active");
}

// add click event to all modal items
for (let i = 0; i < testimonialsItem.length; i++) {

  testimonialsItem[i].addEventListener("click", function () {

    modalImg.src = this.querySelector("[data-testimonials-avatar]").src;
    modalImg.alt = this.querySelector("[data-testimonials-avatar]").alt;
    modalTitle.innerHTML = this.querySelector("[data-testimonials-title]").innerHTML;
    modalText.innerHTML = this.querySelector("[data-testimonials-text]").innerHTML;

    testimonialsModalFunc();

  });

}

// add click event to modal close button
modalCloseBtn.addEventListener("click", testimonialsModalFunc);
overlay.addEventListener("click", testimonialsModalFunc);



// custom select variables
const select = document.querySelector("[data-select]");
const selectItems = document.querySelectorAll("[data-select-item]");
const selectValue = document.querySelector("[data-selecct-value]");
const filterBtn = document.querySelectorAll("[data-filter-btn]");

select.addEventListener("click", function () { elementToggleFunc(this); });

// add event in all select items
for (let i = 0; i < selectItems.length; i++) {
  selectItems[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    elementToggleFunc(select);
    filterFunc(selectedValue);

  });
}

// filter variables
const filterItems = document.querySelectorAll("[data-filter-item]");

const filterFunc = function (selectedValue) {

  for (let i = 0; i < filterItems.length; i++) {

    if (selectedValue === "all" || selectedValue === "tout") {
      filterItems[i].classList.add("active");
    } else if (selectedValue === filterItems[i].dataset.category.toLowerCase()) {
      filterItems[i].classList.add("active");
    } else {
      filterItems[i].classList.remove("active");
    }

  }

}

// Retour button in Merci page: navigate back to contact
const retourButton = document.querySelector('.retour-btn');
if (retourButton) {
  retourButton.addEventListener('click', function () {
    for (let i = 0; i < pages.length; i++) {
      if (pages[i].dataset.page === 'contact') {
        pages[i].classList.add('active');
      } else {
        pages[i].classList.remove('active');
      }
    }

    for (let i = 0; i < navigationLinks.length; i++) {
      navigationLinks[i].classList.remove('active');
      if (normalizeText(navigationLinks[i].innerText) === normalizeText('Contact')) {
        navigationLinks[i].classList.add('active');
      }
    }

    window.scrollTo(0, 0);
  });
}

// PDF drawer toggle handlers
const pdfDrawer = document.querySelector('[data-pdf-drawer]');
const pdfToggle = document.querySelector('[data-pdf-toggle]');
const pdfFrame = document.querySelector('[data-pdf-frame]');
const pdfClose = document.querySelector('[data-pdf-close]');

if (pdfToggle && pdfFrame) {
  pdfToggle.addEventListener('click', function () {
    const isHidden = pdfFrame.hasAttribute('hidden');
    if (isHidden) {
      pdfFrame.removeAttribute('hidden');
    } else {
      pdfFrame.setAttribute('hidden', '');
    }
  });
}

if (pdfClose && pdfFrame) {
  pdfClose.addEventListener('click', function () {
    pdfFrame.setAttribute('hidden', '');
  });
}

// add event in all filter button items for large screen
let lastClickedBtn = filterBtn[0];

for (let i = 0; i < filterBtn.length; i++) {

  filterBtn[i].addEventListener("click", function () {

    let selectedValue = this.innerText.toLowerCase();
    selectValue.innerText = this.innerText;
    filterFunc(selectedValue);

    lastClickedBtn.classList.remove("active");
    this.classList.add("active");
    lastClickedBtn = this;

  });

}



// contact form variables
const form = document.querySelector("[data-form]");
const formInputs = document.querySelectorAll("[data-form-input]");
const formBtn = document.querySelector("[data-form-btn]");

// add event to all form input field
for (let i = 0; i < formInputs.length; i++) {
  formInputs[i].addEventListener("input", function () {

    // check form validation
    if (form.checkValidity()) {
      formBtn.removeAttribute("disabled");
    } else {
      formBtn.setAttribute("disabled", "");
    }

  });
}

// handle form submission via Formspree (replace the form action with your Formspree ID)
form.addEventListener("submit", async function (e) {
  e.preventDefault();

  // prevent double submissions
  formBtn.setAttribute("disabled", "");

  const formData = new FormData(form);

  try {
    const resp = await fetch(form.action, {
      method: "POST",
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });

    if (resp.ok) {
      // Navigate to the 'merci' page
      for (let i = 0; i < pages.length; i++) {
        if (pages[i].dataset.page === "merci") {
          pages[i].classList.add("active");
        } else {
          pages[i].classList.remove("active");
        }
      }

      // clear active state on navbar links
      for (let i = 0; i < navigationLinks.length; i++) {
        navigationLinks[i].classList.remove("active");
      }

      window.scrollTo(0, 0);

      form.reset();
      formBtn.setAttribute("disabled", "");

    } else {
      const data = await resp.json().catch(() => null);
      if (data && data.errors) {
        alert("Erreur : " + data.errors.map(err => err.message).join(", "));
      } else {
        alert("Une erreur est survenue lors de l'envoi. Réessayez plus tard.");
      }
    }
  } catch (err) {
    console.error(err);
    alert("Erreur réseau : impossible d'envoyer le message.");
  }
});



// page navigation variables
const navigationLinks = document.querySelectorAll("[data-nav-link]");
const pages = document.querySelectorAll("[data-page]");

// add event to all nav link
for (let i = 0; i < navigationLinks.length; i++) {
  navigationLinks[i].addEventListener("click", function () {

    const clicked = normalizeText(this.innerText);

    for (let j = 0; j < pages.length; j++) {
      if (clicked === normalizeText(pages[j].dataset.page)) {
        pages[j].classList.add("active");
        navigationLinks[i].classList.add("active");
        window.scrollTo(0, 0);
      } else {
        pages[j].classList.remove("active");
        navigationLinks[i].classList.remove("active");
      }
    }

  });
}



// ============================================================
// PROJECT DETAIL PAGE
// ============================================================

function openProjectDetailPage(li) {
  const img = li.querySelector('.project-img img');
  const pdImg = document.querySelector('[data-pd-img]');
  const pdLink = document.querySelector('[data-pd-link]');

  pdImg.src = img ? img.src : '';
  pdImg.alt = img ? img.alt : '';
  document.querySelector('[data-pd-title]').textContent = li.querySelector('.project-title').textContent;
  document.querySelector('[data-pd-category]').textContent = li.querySelector('.project-category').textContent;
  document.querySelector('[data-pd-dates]').textContent = li.dataset.projectDates || '';
  document.querySelector('[data-pd-context]').textContent = li.dataset.projectContext || '';
  document.querySelector('[data-pd-methods]').textContent = li.dataset.projectMethods || '';

  const link = li.dataset.projectLink;
  if (link) {
    pdLink.href = link;
    pdLink.querySelector('span').textContent = li.dataset.projectLinkLabel || 'Voir le projet';
    pdLink.classList.remove('hidden');
  } else {
    pdLink.classList.add('hidden');
  }

  for (let i = 0; i < pages.length; i++) {
    pages[i].classList.toggle('active', pages[i].dataset.page === 'project-detail');
  }
  for (let i = 0; i < navigationLinks.length; i++) {
    navigationLinks[i].classList.toggle('active', normalizeText(navigationLinks[i].innerText) === 'portfolio');
  }
  window.scrollTo(0, 0);
}

// Attach click to static project items
document.querySelectorAll('[data-project-item]').forEach(function(a) {
  a.addEventListener('click', function(e) {
    e.preventDefault();
    openProjectDetailPage(a.closest('[data-filter-item]'));
  });
});

// Back to portfolio button
const backPortfolioBtn = document.querySelector('[data-back-portfolio]');
if (backPortfolioBtn) {
  backPortfolioBtn.addEventListener('click', function() {
    for (let i = 0; i < pages.length; i++) {
      pages[i].classList.toggle('active', pages[i].dataset.page === 'portfolio');
    }
    window.scrollTo(0, 0);
  });
}



// ============================================================
// ADD / DELETE PROJECT (localStorage)
// ============================================================

const PROJECTS_KEY = 'portfolio_projects_v1';

function getStoredProjects() {
  try { return JSON.parse(localStorage.getItem(PROJECTS_KEY)) || []; }
  catch (e) { return []; }
}

function saveStoredProjects(list) {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(list));
}

function createProjectCard(p) {
  const li = document.createElement('li');
  li.className = 'project-item active';
  li.setAttribute('data-filter-item', '');
  li.dataset.category = p.category.toLowerCase();
  li.dataset.projectDates = p.dates;
  li.dataset.projectContext = p.context;
  li.dataset.projectLink = p.link || '';
  li.dataset.projectLinkLabel = p.linkLabel || '';
  li.dataset.projectMethods = p.methods;
  li.dataset.projectStoredId = p.id;

  const imgSrc = p.image || './assets/images/project-1.jpg';
  li.innerHTML =
    '<a href="#" data-project-item>' +
      '<figure class="project-img">' +
        '<div class="project-item-icon-box"><ion-icon name="eye-outline"></ion-icon></div>' +
        '<img src="' + imgSrc + '" alt="' + p.title + '" loading="lazy">' +
      '</figure>' +
      '<h3 class="project-title">' + p.title + '</h3>' +
      '<p class="project-category">' + p.category + '</p>' +
    '</a>' +
    '<button class="project-delete-btn" title="Supprimer ce projet">' +
      '<ion-icon name="trash-outline"></ion-icon>' +
    '</button>';

  li.querySelector('[data-project-item]').addEventListener('click', function(e) {
    e.preventDefault();
    openProjectDetailPage(li);
  });

  li.querySelector('.project-delete-btn').addEventListener('click', function(e) {
    e.stopPropagation();
    if (!confirm('Supprimer ce projet ?')) return;
    const list = getStoredProjects().filter(function(x) { return x.id !== p.id; });
    saveStoredProjects(list);
    li.remove();
  });

  return li;
}

function renderStoredProjects() {
  const projectList = document.getElementById('project-list');
  if (!projectList) return;
  getStoredProjects().forEach(function(p) {
    projectList.appendChild(createProjectCard(p));
  });
}

renderStoredProjects();

// Add project form
const addProjectOverlay = document.querySelector('[data-add-project-overlay]');
const addProjectForm = document.getElementById('add-project-form');
const addProjectBtn = document.querySelector('[data-add-project-btn]');
const addProjectCloseBtn = document.querySelector('[data-add-project-close]');
const addProjectCancelBtn = document.querySelector('[data-add-project-cancel]');
const imageInput = document.getElementById('project-image-input');
const imgPreview = document.getElementById('img-preview');

function openAddForm() {
  addProjectOverlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeAddForm() {
  addProjectOverlay.classList.remove('active');
  document.body.style.overflow = '';
  addProjectForm.reset();
  if (imgPreview) { imgPreview.src = ''; imgPreview.style.display = 'none'; }
}

if (addProjectBtn) addProjectBtn.addEventListener('click', openAddForm);
if (addProjectCloseBtn) addProjectCloseBtn.addEventListener('click', closeAddForm);
if (addProjectCancelBtn) addProjectCancelBtn.addEventListener('click', closeAddForm);
if (addProjectOverlay) {
  addProjectOverlay.addEventListener('click', function(e) {
    if (e.target === addProjectOverlay) closeAddForm();
  });
}

if (imageInput && imgPreview) {
  imageInput.addEventListener('change', function() {
    const file = this.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
      imgPreview.src = e.target.result;
      imgPreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
  });
}

if (addProjectForm) {
  addProjectForm.addEventListener('submit', function(e) {
    e.preventDefault();
    const data = new FormData(addProjectForm);
    const file = imageInput && imageInput.files[0];

    function finalize(imageSrc) {
      const project = {
        id: Date.now().toString(),
        title: data.get('title').trim(),
        category: data.get('category'),
        image: imageSrc,
        dates: data.get('dates').trim(),
        context: data.get('context').trim(),
        link: (data.get('link') || '').trim(),
        linkLabel: (data.get('linkLabel') || '').trim(),
        methods: data.get('methods').trim()
      };
      const list = getStoredProjects();
      list.push(project);
      saveStoredProjects(list);
      const projectList = document.getElementById('project-list');
      if (projectList) projectList.appendChild(createProjectCard(project));
      closeAddForm();
    }

    if (file) {
      const reader = new FileReader();
      reader.onload = function(ev) { finalize(ev.target.result); };
      reader.readAsDataURL(file);
    } else {
      finalize('');
    }
  });
}