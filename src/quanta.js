document.addEventListener('DOMContentLoaded', () => {
  const headers = document.querySelectorAll('.quanta-accordion-header');

  headers.forEach(header => {
    header.addEventListener('click', () => {
      const parentAccordion = header.closest('.quanta-accordion');
      const isSingleOpen = parentAccordion.classList.contains('single-open');
      const expanded = header.getAttribute('aria-expanded') === 'true';
      const content = header.nextElementSibling;

      if (isSingleOpen) {
        // Close all other items
        const allHeaders = parentAccordion.querySelectorAll('.quanta-accordion-header');
        const allContents = parentAccordion.querySelectorAll('.quanta-accordion-content');
        allHeaders.forEach(h => h.setAttribute('aria-expanded', 'false'));
        allContents.forEach(c => c.setAttribute('aria-hidden', 'true'));
      }

      // Toggle clicked one
      header.setAttribute('aria-expanded', !expanded);
      content.setAttribute('aria-hidden', expanded);
    });
  });
});

document.querySelectorAll('.quanta-avatar').forEach(el => {
  const name = el.dataset.name;
  const hasImage = el.querySelector('img');
  const alreadyHasInitial = el.querySelector('.avatar-initial');

  if (!hasImage && name && !alreadyHasInitial) {
    const initials = name
      .trim()
      .split(/\s+/)
      .map(n => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();

    const span = document.createElement('span');
    span.className = 'avatar-initial';
    span.textContent = initials;
    el.prepend(span); // preserves any other children like badges
  }
});


// quanta-alerts.js
;(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', initQuantaAlerts);

  function initQuantaAlerts() {
    // Find all alerts
    document.querySelectorAll('.quanta-alert').forEach(alert => {
      // Look for any child with aria-label="close" (case-insensitive)
      const ariaCloses = Array.from(alert.querySelectorAll('[aria-label]'))
        .filter(el => el.getAttribute('aria-label').toLowerCase() === 'close');

      // Also allow a utility class
      const classCloses = Array.from(alert.getElementsByClassName('quanta-alert-close'));

      // Merge both, avoiding duplicates
      const closers = [...new Set([...ariaCloses, ...classCloses])];

      closers.forEach(btn => {
        // Make sure it’s focusable
        if (!btn.hasAttribute('tabindex')) {
          btn.setAttribute('tabindex', '0');
        }
        btn.style.cursor = 'pointer';

        // Click handler
        btn.addEventListener('click', () => removeAlert(alert));

        // Keyboard handler
        btn.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            removeAlert(alert);
          }
        });
      });
    });
  }

  function removeAlert(alert) {
    // Optional: fade out before removing
    alert.style.transition = 'opacity 0.2s ease';
    alert.style.opacity = '0';
    alert.addEventListener('transitionend', () => {
      alert.remove();
    }, { once: true });
  }

  // Expose if you need to re-init dynamically
  window.QuantaAlerts = {
    init: initQuantaAlerts,
    remove: removeAlert
  };
})();

document.querySelectorAll('.quanta-custom-select-wrapper').forEach(wrapper => {
  const nativeSelect = wrapper.querySelector('select');
  const customSelect = wrapper.querySelector('.quanta-custom-select');
  const selectedDisplay = wrapper.querySelector('.quanta-custom-selected');
  const optionsContainer = wrapper.querySelector('.quanta-custom-options');

  // Clear existing options
  optionsContainer.innerHTML = '';

  // Build custom options
  nativeSelect.querySelectorAll('option').forEach(opt => {
    const customOption = document.createElement('div');
    customOption.className = 'quanta-custom-option';
    customOption.textContent = opt.textContent;
    customOption.dataset.value = opt.value;

    if (opt.selected) {
      customOption.classList.add('selected');
      selectedDisplay.textContent = opt.textContent;
    }

    customOption.addEventListener('click', () => {
      nativeSelect.value = customOption.dataset.value;
      selectedDisplay.textContent = customOption.textContent;
      wrapper.querySelectorAll('.quanta-custom-option').forEach(opt => opt.classList.remove('selected'));
      customOption.classList.add('selected');
      optionsContainer.style.display = 'none';

      nativeSelect.dispatchEvent(new Event('change'));
    });

    optionsContainer.appendChild(customOption);
  });

  // Toggle logic
  customSelect.addEventListener('click', (e) => {
    e.stopPropagation();

    // Close all open custom selects
    document.querySelectorAll('.quanta-custom-options').forEach(opt => {
      if (opt !== optionsContainer) opt.style.display = 'none';
    });

    // Toggle current one
    optionsContainer.style.display = (optionsContainer.style.display === 'block') ? 'none' : 'block';
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!wrapper.contains(e.target)) {
      optionsContainer.style.display = 'none';
    }
  });
});

document.querySelectorAll('.quanta-carousel').forEach(carousel => {
  const track = carousel.querySelector('.quanta-carousel-track');
  const items = Array.from(carousel.querySelectorAll('.quanta-carousel-item'));
  const indicatorsWrapper = carousel.querySelector('.quanta-carousel-indicators');
  const prevBtn = carousel.querySelector('.quanta-carousel-prev');
  const nextBtn = carousel.querySelector('.quanta-carousel-next');

  const indicatorType = carousel.dataset.indicatorType || 'circle';
  const autoplayEnabled = carousel.dataset.autoplayEnabled === "true";
  const autoplayTime = parseInt(carousel.dataset.autoplay) || 5000;
  const controlsEnabled = carousel.dataset.controls !== "false";

  let currentIndex = 0;
  let autoplayInterval = null;
  let isDragging = false, startX = 0;

  // Show/hide controls
  if (!controlsEnabled) {
    prevBtn?.remove();
    nextBtn?.remove();
  }

  // Setup indicators
  function createIndicators() {
    if (!indicatorsWrapper) return;
    indicatorsWrapper.innerHTML = '';
    items.forEach((item, i) => {
      const dot = document.createElement('div');
      dot.className = `quanta-carousel-indicator indicator-${indicatorType}` + (i === 0 ? ' active' : '');
      if (indicatorType === 'img') {
        const img = item.querySelector('img')?.cloneNode();
        img && dot.appendChild(img);
      }
      dot.addEventListener('click', () => goToSlide(i));
      indicatorsWrapper.appendChild(dot);
    });
  }

  // Slide switching
  function goToSlide(index) {
    if (index < 0) index = items.length - 1;
    if (index >= items.length) index = 0;

    items.forEach((item, i) => {
      item.classList.toggle('active', i === index);
    });

    indicatorsWrapper?.querySelectorAll('.quanta-carousel-indicator').forEach((el, i) => {
      el.classList.toggle('active', i === index);
    });

    if (carousel.classList.contains('carousel-animate-slide')) {
      track.style.transform = `translateX(-${index * 100}%)`;
    }

    currentIndex = index;
  }

  // Autoplay
  function startAutoplay() {
    if (autoplayEnabled) {
      autoplayInterval = setInterval(() => goToSlide(currentIndex + 1), autoplayTime);
    }
  }

  function stopAutoplay() {
    clearInterval(autoplayInterval);
  }

  // Drag/swipe support
  carousel.addEventListener('touchstart', e => {
    isDragging = true;
    startX = e.touches[0].clientX;
  });

  carousel.addEventListener('touchmove', e => {
    if (!isDragging) return;
    const delta = e.touches[0].clientX - startX;
    if (Math.abs(delta) > 50) {
      isDragging = false;
      delta < 0 ? goToSlide(currentIndex + 1) : goToSlide(currentIndex - 1);
      stopAutoplay();
      startAutoplay();
    }
  });

  carousel.addEventListener('touchend', () => isDragging = false);

  // Hover pause
  carousel.addEventListener('mouseenter', stopAutoplay);
  carousel.addEventListener('mouseleave', startAutoplay);

  // Button control
  prevBtn?.addEventListener('click', () => {
    goToSlide(currentIndex - 1);
    stopAutoplay();
    startAutoplay();
  });

  nextBtn?.addEventListener('click', () => {
    goToSlide(currentIndex + 1);
    stopAutoplay();
    startAutoplay();
  });

  createIndicators();
  goToSlide(0);
  startAutoplay();
});

function updateCharCount(textarea) {
  const max = textarea.getAttribute('maxlength');
  const current = textarea.value.length;
  
  const wrapper = textarea.closest('.quanta-textarea-wrapper'); // use a scoped wrapper
  const counter = wrapper?.querySelector('.quanta-char-count span');
  
  if (counter) counter.textContent = current;
}

document.querySelectorAll('.quanta-textarea').forEach(el => {
  updateCharCount(el);
  el.addEventListener('input', () => updateCharCount(el)); // make sure it updates on input too
});

function initQuantaRating(id, onChange) {
  const container = document.getElementById(id);
  const starsCount = parseInt(container.dataset.stars) || 5;
  let selected = parseInt(container.dataset.selected) || 0;

  container.innerHTML = '';
  const stars = [];

  for (let i = 1; i <= starsCount; i++) {
    const span = document.createElement('span');
    span.classList.add('quanta-rating-star');
    span.innerHTML = '★';
    if (i <= selected) span.classList.add('filled');
    container.appendChild(span);
    stars.push(span);

    span.addEventListener('mouseenter', () => updateStars(i));
    span.addEventListener('mouseleave', () => updateStars(selected));
    span.addEventListener('click', () => {
      selected = i;
      container.dataset.selected = selected;
      updateStars(selected);
      if (typeof onChange === 'function') onChange(selected);
    });
  }

  function updateStars(count) {
    stars.forEach((star, i) => {
      star.classList.toggle('filled', i < count);
    });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initQuantaRating('ratingStars', rating => console.log('Selected:', rating));
});


function setTheme(mode) {
  document.documentElement.setAttribute('data-theme', mode);
  localStorage.setItem('quanta-theme', mode);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

document.addEventListener('DOMContentLoaded', () => {
  const stored = localStorage.getItem('quanta-theme');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const initialTheme = stored || (prefersDark ? 'dark' : 'light');
  setTheme(initialTheme);

  document.querySelectorAll('.quanta-theme-toggle').forEach(el => {
    el.addEventListener('click', toggleTheme);
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".quanta-scrollspy-section");
  const navLinks = document.querySelectorAll(".quanta-scrollspy-link");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute("id");
        const link = document.querySelector(`.quanta-scrollspy-link[href="#${id}"]`);
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.remove("active"));
          link?.classList.add("active");
        }
      });
    },
    {
      rootMargin: "0px 0px -60% 0px", // Triggers before the section fully hits top
      threshold: 0.3
    }
  );

  sections.forEach(section => observer.observe(section));
});

document.addEventListener("DOMContentLoaded", () => {
  const sections = document.querySelectorAll(".quanta-scrollspy-section");
  const navLinks = document.querySelectorAll(".quanta-scrollspy-link");

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        const id = entry.target.getAttribute("id");
        const link = document.querySelector(`.quanta-scrollspy-link[href="#${id}"]`);
        if (entry.isIntersecting) {
          navLinks.forEach(l => l.classList.remove("active"));
          link?.classList.add("active");
        }
      });
    },
    {
      rootMargin: "0px 0px -60% 0px", // Triggers before the section fully hits top
      threshold: 0.3
    }
  );

  sections.forEach(section => observer.observe(section));
});

document.addEventListener("DOMContentLoaded", () => {
  const lazyElements = document.querySelectorAll('.lazy-load');

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('show');
        observer.unobserve(entry.target); // only run once
      }
    });
  }, {
    threshold: 0.15
  });

  lazyElements.forEach(el => observer.observe(el));
});

document.querySelectorAll('[data-toggle="drawer"]').forEach(btn => {
  btn.addEventListener('click', () => {
    const drawer = document.querySelector(btn.dataset.target);
    const overlay = document.getElementById('drawerOverlay');

    const isActive = drawer.classList.contains('active');
    drawer.classList.toggle('active');
    overlay.classList.toggle('active', !isActive);
  });
});

document.getElementById('drawerOverlay')?.addEventListener('click', () => {
  document.querySelectorAll('.quanta-drawer.active').forEach(d => d.classList.remove('active'));
  document.getElementById('drawerOverlay').classList.remove('active');
});


// quanta-chips.js
;(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', initQuantaChips);

  function initQuantaChips() {
    // 1) Wire up close buttons on existing chips
    document.querySelectorAll('.quanta-chip').forEach(chip => {
      const closer = chip.querySelector('.quanta-chip-close');
      if (closer) {
        closer.style.cursor = 'pointer';
        closer.addEventListener('click', () => chip.remove());
      }
    });

    // 2) Handle chip-input fields
    document.querySelectorAll('.quanta-chip-input').forEach(input => {
      // ensure it’s inside a container that holds chips
      const container = input.closest('[data-quanta-chip-container]');
      if (!container) return;

      // when user hits Enter: create a chip
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter' && input.value.trim()) {
          e.preventDefault();
          createChip(container, input.value.trim());
          input.value = '';
        }
        // optional: backspace on empty removes last chip
        if (e.key === 'Backspace' && !input.value) {
          const chips = container.querySelectorAll('.quanta-chip');
          if (chips.length) chips[chips.length - 1].remove();
        }
      });
    });
  }

  function createChip(container, text) {
    const chip = document.createElement('span');
    chip.className = 'quanta-chip';
    // inner text
    const span = document.createElement('span');
    span.textContent = text;
    chip.append(span);
    // close button
    const closer = document.createElement('span');
    closer.className = 'quanta-chip-close';
    closer.textContent = '×';
    closer.style.cursor = 'pointer';
    closer.addEventListener('click', () => chip.remove());
    chip.append(closer);

    // insert before the input (so input stays at end)
    const input = container.querySelector('.quanta-chip-input');
    container.insertBefore(chip, input);
  }

  // expose for manual use
  window.QuantaChips = {
    init: initQuantaChips,
    create: createChip
  };
})();

;(function(){
  const fmt = d => d.toISOString().slice(0,10);
  function daysInMonth(y,m){return new Date(y,m+1,0).getDate();}
  function el(t,c='',txt=''){const d=document.createElement(t); if(c)d.className=c; if(txt)d.textContent=txt; return d;}

  document.querySelectorAll('.quanta-datepicker').forEach(dp => {
    const input = dp.querySelector('input');
    const popup = el('div', 'quanta-datepicker-popup');
    const header = el('div', 'quanta-datepicker-header');
    const weekdays = el('div', 'quanta-weekdays');
    const calendar = el('div', 'quanta-calendar');

    // SVG buttons
    const leftBtn = el('button', 'quanta-nav-btn');
    leftBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="size-4" viewBox="0 0 24 24">
        <path fill-rule="evenodd" d="M7.72 12.53a.75.75 0 0 1 0-1.06l7.5-7.5a.75.75 0 1 1 1.06 1.06L9.31 12l6.97 6.97a.75.75 0 1 1-1.06 1.06l-7.5-7.5Z" clip-rule="evenodd" />
      </svg>`;

    const rightBtn = el('button', 'quanta-nav-btn');
    rightBtn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="size-4" viewBox="0 0 24 24">
        <path fill-rule="evenodd" d="M16.28 11.47a.75.75 0 0 1 0 1.06l-7.5 7.5a.75.75 0 0 1-1.06-1.06L14.69 12 7.72 5.03a.75.75 0 0 1 1.06-1.06l7.5 7.5Z" clip-rule="evenodd" />
      </svg>`;

    const display = el('span', 'quanta-month-display');
    header.append(leftBtn, display, rightBtn);

    popup.append(header, weekdays, calendar);
    dp.append(popup);

    // Month & Year Grids
    const gridWrapper = el('div', 'quanta-grid-popup');
    const monthGrid = el('div', 'quanta-month-grid');
    const yearGrid = el('div', 'quanta-year-grid');
    gridWrapper.append(monthGrid, yearGrid);
    dp.append(gridWrapper);

    const today = new Date();
    let vy = today.getFullYear(), vm = today.getMonth(), selected = null;

    function renderGrid(){
      monthGrid.innerHTML = '';
      for(let i = 0; i < 12; i++){
        const m = el('div', '', new Date(0, i).toLocaleString('default', {month: 'short'}));
        m.dataset.m = i;
        if(i === vm) m.classList.add('selected');
        monthGrid.append(m);
      }

      yearGrid.innerHTML = '';
      for(let y = vy - 7; y <= vy + 7; y++){
        const yv = el('div', '', ''+y);
        yv.dataset.y = y;
        if(y === vy) yv.classList.add('selected');
        yearGrid.append(yv);
      }
    }

    function renderCalendar(){
      display.textContent = new Date(vy, vm).toLocaleString('default', {month: 'long', year: 'numeric'});

      weekdays.innerHTML = '';
      ['Su','Mo','Tu','We','Th','Fr','Sa'].forEach(d => weekdays.append(el('div', '', d)));

      calendar.innerHTML = '';
      const firstDay = new Date(vy, vm, 1).getDay();
      for(let i = 0; i < firstDay; i++) calendar.append(el('div', 'quanta-day disabled'));

      const days = daysInMonth(vy, vm);
      for(let d = 1; d <= days; d++){
        const dayEl = el('div', 'quanta-day', d);
        if(vy === today.getFullYear() && vm === today.getMonth() && d === today.getDate())
          dayEl.classList.add('today');

        if(selected && vy === selected.getFullYear() && vm === selected.getMonth() && d === selected.getDate())
          dayEl.classList.add('selected');

        dayEl.addEventListener('click', () => {
          selected = new Date(vy, vm, d);
          input.value = fmt(selected);
          dp.classList.remove('active');
          gridWrapper.style.display = 'none';
          renderCalendar();
        });

        calendar.append(dayEl);
      }
    }

    // Init
    renderGrid();
    renderCalendar();

    // Button events
    leftBtn.addEventListener('click', () => {
      vm--; if(vm < 0){ vm = 11; vy--; }
      renderCalendar();
    });
    rightBtn.addEventListener('click', () => {
      vm++; if(vm > 11){ vm = 0; vy++; }
      renderCalendar();
    });

    // Click month/year to show selector
    display.addEventListener('click', () => {
      gridWrapper.style.display = gridWrapper.style.display === 'grid' ? 'none' : 'grid';
    });

    monthGrid.addEventListener('click', e => {
      if(!e.target.dataset.m) return;
      vm = +e.target.dataset.m;
      gridWrapper.style.display = 'none';
      renderCalendar();
    });

    yearGrid.addEventListener('click', e => {
      if(!e.target.dataset.y) return;
      vy = +e.target.dataset.y;
      gridWrapper.style.display = 'none';
      renderCalendar();
    });

    // Toggle popup
    input.addEventListener('focus', () => dp.classList.add('active'));
    document.addEventListener('click', e => {
      if(!dp.contains(e.target)){
        dp.classList.remove('active');
        gridWrapper.style.display = 'none';
      }
    });
  });
})();

// quanta-dropdown.js
;(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', initQuantaDropdowns);

  function initQuantaDropdowns() {
    // Set up click-based dropdowns
    document.querySelectorAll('.quanta-dropdown-click').forEach(drop => {
      const toggle = drop.querySelector('.quanta-dropdown-toggle');
      const menu   = drop.querySelector('.quanta-dropdown-menu');
      if (!toggle || !menu) return;

      // Toggle open/close on click
      toggle.addEventListener('click', e => {
        e.stopPropagation();
        drop.classList.toggle('show');
      });

      // Close when clicking outside
      document.addEventListener('click', e => {
        if (!drop.contains(e.target)) {
          drop.classList.remove('show');
        }
      });

      // Keyboard support: open with Enter/Space, close with Esc
      toggle.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          drop.classList.toggle('show');
        }
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          drop.classList.remove('show');
        }
      });
    });

    // Hover-based dropdowns need no JS; CSS handles .quanta-dropdown-hover
  }

  // Expose if you need to re-init dynamically
  window.QuantaDropdown = {
    init: initQuantaDropdowns
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  function setupUpload(selector, options = {}) {
    const {
      previewId = '',
      type = 'list', // list | thumb | box | box-image
      layout = 'col',
      single = false
    } = options;

    const wrapper = document.querySelector(selector);
    if (!wrapper) return;

    const input = wrapper.querySelector('input[type="file"]');
    const preview = previewId ? document.getElementById(previewId) : null;
    if (!input) return;

    // Enable drag-and-drop
    wrapper.addEventListener('dragover', e => {
      e.preventDefault();
      wrapper.classList.add('dragover');
    });

    wrapper.addEventListener('dragleave', () => {
      wrapper.classList.remove('dragover');
    });

    wrapper.addEventListener('drop', e => {
      e.preventDefault();
      wrapper.classList.remove('dragover');
      input.files = e.dataTransfer.files;
      handleFiles();
    });

    input.addEventListener('change', handleFiles);

    // box-image type (clickable img placeholder)
    if (type === 'box-image') {
      const img = wrapper.querySelector('img');
      if (img) {
        img.addEventListener('click', () => input.click());
      }
    }

    function handleFiles() {
      let files = Array.from(input.files);
      if (single && files.length > 1) files = [files[0]];

      if (type !== 'box' && type !== 'box-image' && preview) {
        preview.innerHTML = '';
        preview.className = 'quanta-file-preview ' + (layout === 'row'
          ? 'd-flex flex-row gap-2'
          : 'd-flex flex-col gap-2');
      }

      files.forEach((file, idx) => {
        if (type === 'thumb') {
          const thumb = document.createElement('div');
          thumb.className = 'quanta-file-thumbnail';

          const reader = new FileReader();
          reader.onload = e => {
            thumb.style.backgroundImage = `url('${e.target.result}')`;
          };
          reader.readAsDataURL(file);

          const remove = createRemoveBtn(idx);
          thumb.appendChild(remove);
          preview.appendChild(thumb);
        }

        else if (type === 'list') {
          const item = document.createElement('div');
          item.className = 'quanta-file-item';
          item.textContent = file.name;

          const remove = createRemoveBtn(idx);
          item.appendChild(remove);
          preview.appendChild(item);
        }

        else if (type === 'box') {
          const previewBox = document.getElementById('previewBox');
          const img = preview?.querySelector('img');
          if (img) {
            const reader = new FileReader();
            reader.onload = e => {
              previewBox.style.display = 'block';
              img.src = e.target.result;
            };
            reader.readAsDataURL(file);
          }
        }

        else if (type === 'box-image') {
          const img = wrapper.querySelector('img');
          if (img) {
            const reader = new FileReader();
            reader.onload = e => img.src = e.target.result;
            reader.readAsDataURL(file);
          }
        }
      });

      function createRemoveBtn(index) {
        const rm = document.createElement('span');
        rm.className = 'quanta-file-remove';
        rm.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" class="size-4" viewBox="0 0 24 24">
          <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25Zm-1.72 6.97a.75.75 0 1 0-1.06 1.06L10.94 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06L12 13.06l1.72 1.72a.75.75 0 1 0 1.06-1.06L13.06 12l1.72-1.72a.75.75 0 1 0-1.06-1.06L12 10.94l-1.72-1.72Z" clip-rule="evenodd"/>
        </svg>`;

        rm.onclick = () => {
          const dt = new DataTransfer();
          const newFiles = files.filter((_, i) => i !== index);
          newFiles.forEach(f => dt.items.add(f));
          input.files = dt.files;
          handleFiles();
        };

        return rm;
      }
    }
  }

  // 🟢 Initialize Uploaders
  setupUpload('#classicBox', {
    previewId: 'previewClassic',
    type: 'list',
    layout: 'row',
    single: true
  });

  setupUpload('#dropList', {
    previewId: 'previewList',
    type: 'list',
    layout: 'col',
    single: false
  });

  setupUpload('#dropThumb', {
    previewId: 'previewThumbs',
    type: 'thumb',
    layout: 'row',
    single: false
  });

  setupUpload('#boxThumb', {
    previewId: 'previewBox',
    type: 'box',
    layout: 'row',
    single: true
  });

  setupUpload('#boxImage', {
    type: 'box-image',
    layout: 'row',
    single: true
  });
});

function openModal(id) {
  document.getElementById(id).classList.add("active");
  document.getElementById(`${id}-backdrop`).classList.add("active");
}

function closeModal(id) {
  document.getElementById(id).classList.remove("active");
  document.getElementById(`${id}-backdrop`).classList.remove("active");
}

// Optional: Escape key closes modal
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    document.querySelectorAll(".quanta-modal.active").forEach(modal => {
      modal.classList.remove("active");
      const id = modal.id;
      document.getElementById(`${id}-backdrop`)?.classList.remove("active");
    });
  }
});

function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  sidebar.classList.toggle('show');
}

// quanta-gallery.js
;(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', initQuantaGallery);

  function initQuantaGallery() {
    // Create a singleton lightbox container if none in DOM
    let lightbox = document.querySelector('.quanta-lightbox');
    if (!lightbox) {
      lightbox = document.createElement('div');
      lightbox.className = 'quanta-lightbox';
      lightbox.innerHTML = `
        <span class="quanta-lightbox-close" role="button" aria-label="Close">&times;</span>
        <img src="" alt="">
      `;
      document.body.appendChild(lightbox);
    }
    const lightboxImg   = lightbox.querySelector('img');
    const lightboxClose = lightbox.querySelector('.quanta-lightbox-close');

    // Click on overlay (outside image) closes
    lightbox.addEventListener('click', e => {
      if (e.target === lightbox || e.target === lightboxClose) {
        hideLightbox();
      }
    });

    // Escape key closes
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        hideLightbox();
      }
    });

    // Wire up each gallery item
    document.querySelectorAll('.quanta-gallery-item img').forEach(img => {
      img.style.cursor = 'pointer';
      img.addEventListener('click', () => {
        showLightbox(img);
      });
    });

    function showLightbox(srcImg) {
      lightboxImg.src = srcImg.src;
      lightboxImg.alt = srcImg.alt || '';
      lightbox.classList.add('active');
    }

    function hideLightbox() {
      lightbox.classList.remove('active');
      lightboxImg.src = '';
    }
  }

  // Expose if needed
  window.QuantaGallery = { init: initQuantaGallery };
})();

document.addEventListener("DOMContentLoaded", () => {
  const megamenus = document.querySelectorAll(".quanta-megamenu");

  megamenus.forEach(menu => {
    const trigger = menu.querySelector(".quanta-megamenu-toggle");
    const content = menu.querySelector(".quanta-megamenu-content");

    if (!trigger || !content) return;

    // Toggle on click
    trigger.addEventListener("click", (e) => {
      e.preventDefault();
      // Close other megamenus
      megamenus.forEach(m => {
        if (m !== menu) m.classList.remove("show");
      });
      menu.classList.toggle("show");
    });

    // Close on outside click
    document.addEventListener("click", (e) => {
      if (!menu.contains(e.target)) {
        menu.classList.remove("show");
      }
    });

    // Optional: Hover support for desktops
    if (window.innerWidth >= 1024) {
      menu.addEventListener("mouseenter", () => menu.classList.add("show"));
      menu.addEventListener("mouseleave", () => menu.classList.remove("show"));
    }
  });
});

// quanta-navbar.js
;(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', initQuantaNavbar);

  function initQuantaNavbar() {
    document.querySelectorAll('.quanta-navbar').forEach(navbar => {
      const toggleBtn = navbar.querySelector('.quanta-navbar-toggle');
      const navMenu   = navbar.querySelector('.quanta-nav');

      // If no toggle button or nav menu, skip
      if (!toggleBtn || !navMenu) return;

      // Ensure ARIA attributes
      if (!toggleBtn.hasAttribute('aria-expanded')) {
        toggleBtn.setAttribute('aria-expanded', 'false');
      }
      const menuId = navMenu.id || `qn-${Math.random().toString(36).slice(2,6)}`;
      navMenu.id = menuId;
      toggleBtn.setAttribute('aria-controls', menuId);

      // Click toggles menu
      toggleBtn.addEventListener('click', () => {
        const isOpen = toggleBtn.getAttribute('aria-expanded') === 'true';
        toggleBtn.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        navbar.classList.toggle('open', !isOpen);
      });

      // Close menu on outside click
      document.addEventListener('click', e => {
        if (!navbar.contains(e.target)) {
          navbar.classList.remove('open');
          toggleBtn.setAttribute('aria-expanded', 'false');
        }
      });

      // Keyboard support: Enter/Space toggles
      toggleBtn.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleBtn.click();
        }
      });
    });
  }

  // Expose API
  window.QuantaNavbar = { init: initQuantaNavbar };
})();

// quanta-notifications.js
document.showToast = function ({
  title = '',
  message = '',
  type = 'primary',
  icon = '',
  timeout = 5000,
  position = 'top-right',
  showProgress = true,
} = {}) {
  const containerSelector = `.quanta-toast-container.${position}`;
  let container = document.querySelector(containerSelector);

  // Create container if it doesn't exist
  if (!container) {
    container = document.createElement('div');
    container.className = `quanta-toast-container ${position}`;
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `quanta-toast quanta-${type}`;

  toast.innerHTML = `
    ${icon ? `<div class="quanta-toast-icon">${icon}</div>` : ''}
    <div class="quanta-toast-body">
      ${title ? `<div class="quanta-toast-title">${title}</div>` : ''}
      <div class="quanta-toast-message">${message}</div>
    </div>
    <button class="quanta-toast-close" aria-label="Close">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-6">
        <path fill-rule="evenodd" d="M5.47 5.47a.75.75 0 0 1 1.06 0L12 10.94l5.47-5.47a.75.75 0 1 1 1.06 1.06L13.06 12l5.47 5.47a.75.75 0 1 1-1.06 1.06L12 13.06l-5.47 5.47a.75.75 0 0 1-1.06-1.06L10.94 12 5.47 6.53a.75.75 0 0 1 0-1.06Z" clip-rule="evenodd" />
      </svg>
    </button>
    ${showProgress ? `<div class="quanta-toast-progress" style="animation-duration: ${timeout}ms;"></div>` : ''}
  `;

  // Manual close
  toast.querySelector('.quanta-toast-close').addEventListener('click', () => dismissToast(toast));

  // Auto dismiss
  const autoDismiss = setTimeout(() => dismissToast(toast), timeout);

  function dismissToast(el) {
    el.style.animation = 'quanta-slide-out 0.3s ease forwards';
    clearTimeout(autoDismiss);
    el.addEventListener('animationend', () => el.remove());
  }

  container.appendChild(toast);
};

document.querySelectorAll('.quanta-toast-close').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const toast = e.target.closest('.quanta-toast');
    toast.style.animation = 'quanta-slide-out 0.3s ease forwards';
    toast.addEventListener('animationend', () => toast.remove());
  });
});


// quanta-pagination.js
;(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', initQuantaPagination);

  function initQuantaPagination() {
    document.querySelectorAll('.quanta-pagination').forEach(pagination => {
      pagination.addEventListener('click', e => {
        const target = e.target.closest('.quanta-pagination-link');
        if (!target || target.classList.contains('disabled') || target.classList.contains('active')) return;

        e.preventDefault();

        // Handle built-in types (first, prev, next, last)
        const type = target.dataset.type;
        const items = pagination.querySelectorAll('.quanta-pagination-link:not(.disabled):not([data-type])');
        const current = pagination.querySelector('.quanta-pagination-link.active');
        let newIndex = Array.from(items).indexOf(current);

        switch (type) {
          case 'first': newIndex = 0; break;
          case 'last': newIndex = items.length - 1; break;
          case 'prev': if (newIndex > 0) newIndex--; break;
          case 'next': if (newIndex < items.length - 1) newIndex++; break;
          default:
            // Regular numbered pagination
            newIndex = Array.from(items).indexOf(target);
        }

        if (newIndex === -1 || newIndex >= items.length) return;

        // Update active state
        items.forEach(link => link.classList.remove('active'));
        items[newIndex].classList.add('active');

        // Optional: trigger custom event
        pagination.dispatchEvent(new CustomEvent('quanta:pagechange', {
          detail: { page: newIndex + 1 } // 1-based index
        }));
      });
    });
  }

  // Optional: programmatic activation
  function setPage(paginationEl, pageIndex) {
    const items = paginationEl.querySelectorAll('.quanta-pagination-link:not(.disabled):not([data-type])');
    items.forEach(link => link.classList.remove('active'));
    if (items[pageIndex - 1]) {
      items[pageIndex - 1].classList.add('active');
    }
  }

  // Export
  window.QuantaPagination = {
    init: initQuantaPagination,
    setPage
  };
})();

function setupPopoverTriggers() {
  const triggers = document.querySelectorAll('[data-popover-target]');

  triggers.forEach(trigger => {
    const targetId = trigger.getAttribute('data-popover-target');
    const popover = document.getElementById(targetId);
    let timeout;

    if (!popover) return; // Skip if target doesn't exist

    const show = () => {
      clearTimeout(timeout);
      closeAllPopoversExcept(popover);
      popover.setAttribute('data-show', 'true');
    };

    const hide = () => {
      timeout = setTimeout(() => {
        popover.setAttribute('data-show', 'false');
      }, 150);
    };

    // Hover listeners for button
    trigger.addEventListener('mouseenter', show);
    trigger.addEventListener('mouseleave', hide);

    // Hover listeners for popover itself
    popover.addEventListener('mouseenter', () => clearTimeout(timeout));
    popover.addEventListener('mouseleave', hide);

    // Click toggle support
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isVisible = popover.getAttribute('data-show') === 'true';
      if (!isVisible) {
        closeAllPopoversExcept(popover);
        popover.setAttribute('data-show', 'true');
      } else {
        popover.setAttribute('data-show', 'false');
      }
    });
  });

  // Hide all popovers when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.quanta-popover') && !e.target.closest('[data-popover-target]')) {
      closeAllPopovers();
    }
  });
}

function closeAllPopovers() {
  document.querySelectorAll('.quanta-popover[data-show="true"]').forEach(p => {
    p.setAttribute('data-show', 'false');
  });
}

function closeAllPopoversExcept(current) {
  document.querySelectorAll('.quanta-popover[data-show="true"]').forEach(p => {
    if (p !== current) p.setAttribute('data-show', 'false');
  });
}

setupPopoverTriggers();

document.querySelectorAll('.quanta-progress-bar').forEach(bar => {
  const inner = bar.querySelector('.quanta-progress-bar-inner');
  const label = bar.querySelector('.quanta-progress-label');
  const progress = parseInt(bar.dataset.progress || 0, 10);

  if (inner) {
    inner.style.width = progress + '%';

    // Add smooth animation if not already striped or animated
    if (!bar.classList.contains('quanta-progress-animated')) {
      inner.style.transition = 'width 0.6s ease-in-out';
    }

    // If there's a label, set it
    if (label) {
      label.textContent = progress + '%';
    }
  }
});


function updateQuantaRange(rangeInput) {
  const wrapper = rangeInput.closest('.quanta-range-wrapper');
  const fill = wrapper.querySelector('[data-range-fill]');
  const output = wrapper.querySelector('[data-range-output]');
  const min = parseFloat(rangeInput.min) || 0;
  const max = parseFloat(rangeInput.max) || 100;
  const value = parseFloat(rangeInput.value);

  const percent = ((value - min) / (max - min)) * 100;

  // Set width of fill
  fill.style.width = percent + "%";

  // Update value bubble position
  const thumbWidth = rangeInput.offsetWidth;
  const bubble = output;
  bubble.style.left = `calc(${percent}% - ${bubble.offsetWidth / 2}px)`;
  bubble.textContent = value;
}

// On load
document.querySelectorAll('.quanta-range').forEach(input => {
  updateQuantaRange(input);
  input.addEventListener('input', () => updateQuantaRange(input));
});

// src/components/tooltip.js
(() => {
  // create tooltip element
  function makeTooltip(text) {
    const tip = document.createElement('div');
    tip.className = 'quanta-tooltip';
    tip.textContent = text;
    document.body.appendChild(tip);
    return tip;
  }

  // position tooltip above or below as needed
  function positionTooltip(el, tip) {
    const rect = el.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    // default above
    let top = rect.top - tipRect.height - 8 + window.scrollY;
    let left = rect.left + (rect.width - tipRect.width)/2 + window.scrollX;

    // if no room above, place below
    if (top < window.scrollY + 4) {
      top = rect.bottom + 8 + window.scrollY;
      tip.style.transform = 'translateY(0)';
      tip.style.setProperty('--quanta-tooltip-arrow-top', '-6px');
      tip.style.setProperty('--quanta-tooltip-arrow-rotate', '180deg');
    } else {
      tip.style.removeProperty('--quanta-tooltip-arrow-top');
      tip.style.removeProperty('--quanta-tooltip-arrow-rotate');
      tip.style.transform = 'translateY(-6px)';
    }

    tip.style.left = `${Math.max(4, left)}px`;
    tip.style.top  = `${top}px`;
  }

  document.querySelectorAll('[data-tooltip]').forEach(trigger => {
    let tooltipEl = null;

    trigger.addEventListener('mouseenter', () => {
      const text = trigger.getAttribute('data-tooltip');
      if (!text) return;
      tooltipEl = makeTooltip(text);
      positionTooltip(trigger, tooltipEl);
      requestAnimationFrame(() => tooltipEl.classList.add('show'));
    });

    trigger.addEventListener('mouseleave', () => {
      if (!tooltipEl) return;
      tooltipEl.classList.remove('show');
      tooltipEl.addEventListener('transitionend', () => {
        tooltipEl.remove();
      }, { once: true });
      tooltipEl = null;
    });
  });
})();

document.addEventListener('DOMContentLoaded', () => {
  // Simulate loading delay (optional)
  const delay = 1500;

  // Grab all skeleton elements
  const skeletons = document.querySelectorAll('.quanta-skeleton');

  setTimeout(() => {
    skeletons.forEach(el => {
      // Remove skeleton-related classes
      el.classList.remove('quanta-skeleton');
      el.classList.remove('quanta-skeleton-text');
      el.classList.remove('quanta-skeleton-circle');

      // Insert real content if data-content attribute is set
      if (el.dataset.content) {
        el.textContent = el.dataset.content;
      }
    });
  }, delay);
});

// quanta-spinner.js
document.QuantaSpinner = {
  show: function(selector = 'body', type = 'quanta-spinner md') {
    const target = document.querySelector(selector);
    if (!target) return;

    const wrapper = document.createElement('div');
    wrapper.className = 'quanta-spinner-wrapper';
    wrapper.style.display = 'flex';
    wrapper.style.justifyContent = 'center';
    wrapper.style.alignItems = 'center';
    wrapper.style.width = '100%';
    wrapper.style.height = '100%';
    wrapper.innerHTML = `<div class="${type}" role="status" aria-label="Loading..."></div>`;
    
    target.appendChild(wrapper);
    return wrapper; // for later removal
  },

  hide: function(spinnerElement) {
    if (spinnerElement && spinnerElement.remove) {
      spinnerElement.remove();
    }
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const counters = document.querySelectorAll(".quanta-stat-value");

  counters.forEach(counter => {
    const target = +counter.getAttribute("data-count");
    const duration = 1200; // total duration in ms
    const stepTime = 30; // how fast to update (ms)
    const steps = Math.ceil(duration / stepTime);
    const increment = Math.ceil(target / steps);
    let current = 0;

    const update = () => {
      current += increment;
      if (current >= target) {
        counter.textContent = target.toLocaleString();
      } else {
        counter.textContent = current.toLocaleString();
        setTimeout(update, stepTime);
      }
    };

    update();
  });
});

let currentStep = 0;

function updateStepper() {
  const steps = document.querySelectorAll('.quanta-stepper .quanta-step');
  steps.forEach((step, index) => {
    step.classList.remove('active', 'completed');
    if (index < currentStep) {
      step.classList.add('completed');
    } else if (index === currentStep) {
      step.classList.add('active');
    }
  });
}

function nextStep() {
  const steps = document.querySelectorAll('.quanta-stepper .quanta-step');
  if (currentStep < steps.length - 1) {
    currentStep++;
    updateStepper();
  }
}

function prevStep() {
  if (currentStep > 0) {
    currentStep--;
    updateStepper();
  }
}

// Optional: Auto-init on page load
document.addEventListener('DOMContentLoaded', updateStepper);

// Vanilla JS sticky header scroll behavior
document.addEventListener("DOMContentLoaded", function () {
  const stickyHeader = document.querySelector(".quanta-sticky-transition");

  if (!stickyHeader) return;

  let lastScroll = 0;

  window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;

    if (currentScroll > lastScroll) {
      // Scrolling down
      stickyHeader.style.top = "-60px";
    } else {
      // Scrolling up
      stickyHeader.style.top = "0";
    }

    lastScroll = currentScroll;
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const tabs = document.querySelectorAll(".quanta-tab");
  const panels = document.querySelectorAll(".quanta-tab-panel");

  tabs.forEach((tab, index) => {
    tab.addEventListener("click", () => {
      // Remove active state from all
      tabs.forEach(t => t.classList.remove("active"));
      panels.forEach(p => p.classList.remove("active"));

      // Add active to clicked tab and its panel
      tab.classList.add("active");
      if (panels[index]) {
        panels[index].classList.add("active");
      }
    });
  });
});


(() => {
  // Utility: create tooltip element
  function makeTooltip(text) {
    const tip = document.createElement('div');
    tip.className = 'quanta-tooltip';
    tip.textContent = text;
    document.body.appendChild(tip);
    return tip;
  }

  // Position the tooltip relative to the wrapper
  function positionTooltip(wrapper, tooltip) {
    const wrapRect = wrapper.getBoundingClientRect();
    const tipRect  = tooltip.getBoundingClientRect();

    // center horizontally, place above with 8px gap
    const left = wrapRect.left + (wrapRect.width - tipRect.width) / 2;
    const top  = wrapRect.top  - tipRect.height - 8;

    tooltip.style.left = `${Math.max(4, left)}px`; // prevent overflow left
    tooltip.style.top  = `${top < 4 ? wrapRect.bottom + 8 : top}px`;
  }

  document.querySelectorAll('[data-tooltip]').forEach(el => {
    let tooltipEl = null;

    el.addEventListener('mouseenter', () => {
      // wrapper must be position: relative or body fallback
      const wrapper = el.parentElement || document.body;
      const txt = el.getAttribute('data-tooltip');
      if (!txt) return;

      tooltipEl = makeTooltip(txt);
      positionTooltip(wrapper, tooltipEl);

      // trigger fade in
      requestAnimationFrame(() => tooltipEl.classList.add('show'));
    });

    el.addEventListener('mouseleave', () => {
      if (!tooltipEl) return;
      tooltipEl.classList.remove('show');
      tooltipEl.addEventListener('transitionend', () => {
        tooltipEl.remove();
      }, { once: true });
      tooltipEl = null;
    });
  });
})();

// src/components/tooltip.js
(() => {
  // create tooltip element
  function makeTooltip(text) {
    const tip = document.createElement('div');
    tip.className = 'quanta-tooltip';
    tip.textContent = text;
    document.body.appendChild(tip);
    return tip;
  }

  // position tooltip above or below as needed
  function positionTooltip(el, tip) {
    const rect = el.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    // default above
    let top = rect.top - tipRect.height - 8 + window.scrollY;
    let left = rect.left + (rect.width - tipRect.width)/2 + window.scrollX;

    // if no room above, place below
    if (top < window.scrollY + 4) {
      top = rect.bottom + 8 + window.scrollY;
      tip.style.transform = 'translateY(0)';
      tip.style.setProperty('--quanta-tooltip-arrow-top', '-6px');
      tip.style.setProperty('--quanta-tooltip-arrow-rotate', '180deg');
    } else {
      tip.style.removeProperty('--quanta-tooltip-arrow-top');
      tip.style.removeProperty('--quanta-tooltip-arrow-rotate');
      tip.style.transform = 'translateY(-6px)';
    }

    tip.style.left = `${Math.max(4, left)}px`;
    tip.style.top  = `${top}px`;
  }

  document.querySelectorAll('[data-tooltip]').forEach(trigger => {
    let tooltipEl = null;

    trigger.addEventListener('mouseenter', () => {
      const text = trigger.getAttribute('data-tooltip');
      if (!text) return;
      tooltipEl = makeTooltip(text);
      positionTooltip(trigger, tooltipEl);
      requestAnimationFrame(() => tooltipEl.classList.add('show'));
    });

    trigger.addEventListener('mouseleave', () => {
      if (!tooltipEl) return;
      tooltipEl.classList.remove('show');
      tooltipEl.addEventListener('transitionend', () => {
        tooltipEl.remove();
      }, { once: true });
      tooltipEl = null;
    });
  });
})();

