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



