// quanta-accordion.js
;(function() {
  'use strict';

  document.addEventListener('DOMContentLoaded', initQuantaAccordions);

  function initQuantaAccordions() {
    // Find every accordion container
    document.querySelectorAll('.quanta-accordion').forEach(container => {
      // For each header inside
      container.querySelectorAll('.quanta-accordion-header').forEach(header => {
        // 1) Make it keyboard‐accessible as a button
        header.setAttribute('role', 'button');
        if (!header.hasAttribute('tabindex')) header.setAttribute('tabindex', '0');

        // 2) Initialize aria-expanded
        if (!header.hasAttribute('aria-expanded')) {
          header.setAttribute('aria-expanded', 'false');
        }

        // 3) Wire up click & key events
        header.addEventListener('click', () => toggle(header));
        header.addEventListener('keydown', e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggle(header);
          }
        });
      });
    });
  }

  function toggle(header) {
    const isOpen = header.getAttribute('aria-expanded') === 'true';
    let content = null;

    // A) If they used aria-controls → find that element
    const targetId = header.getAttribute('aria-controls');
    if (targetId) {
      content = document.getElementById(targetId);
    }

    // B) Otherwise, assume next sibling
    if (!content) {
      const next = header.nextElementSibling;
      if (next && next.classList.contains('quanta-accordion-content')) {
        content = next;
      }
    }

    if (!content) return; // nothing to toggle

    // Toggle state
    header.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
    header.classList.toggle('quanta-active', !isOpen);
    content.classList.toggle('open', !isOpen);

    // For smooth collapse, set explicit max-height if closing
    if (isOpen) {
      // closing: remove explicit height after transition
      content.style.maxHeight = `${content.scrollHeight}px`;
      // force repaint
      void content.offsetHeight;
      content.style.maxHeight = '0';
    } else {
      // opening: set to scrollHeight
      content.style.maxHeight = `${content.scrollHeight}px`;
      // when transition ends, remove inline max-height
      content.addEventListener('transitionend', function te() {
        if (content.classList.contains('open')) {
          content.style.maxHeight = '';
        }
        content.removeEventListener('transitionend', te);
      });
    }
  }

  // Expose if you need to re-init manually
  window.QuantaAccordion = {
    init: initQuantaAccordions,
    toggle
  };
})();

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

// quanta-carousel.js
;(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', initQuantaCarousels);

  function initQuantaCarousels() {
    document.querySelectorAll('.quanta-carousel').forEach(carousel => {
      setupCarousel(carousel);
    });
  }

  function setupCarousel(carousel) {
    const items = Array.from(carousel.querySelectorAll('.quanta-carousel-item'));
    if (!items.length) return;

    let current = items.findIndex(item => item.classList.contains('active'));
    if (current < 0) current = 0;

    // show initial
    update();

    // controls
    const prevBtn = carousel.querySelector('.quanta-carousel-prev');
    const nextBtn = carousel.querySelector('.quanta-carousel-next');
    if (prevBtn) prevBtn.addEventListener('click', () => { go(-1); });
    if (nextBtn) nextBtn.addEventListener('click', () => { go(1); });

    // indicators
    const indicatorsContainer = carousel.querySelector('.quanta-carousel-indicators');
    let indicators = [];
    if (indicatorsContainer) {
      indicators = Array.from(indicatorsContainer.children)
        .filter(el => el.classList.contains('quanta-carousel-indicator'));
      indicators.forEach((dot, i) => {
        dot.addEventListener('click', () => {
          current = i;
          update();
        });
      });
    }

    function go(direction) {
      current = (current + direction + items.length) % items.length;
      update();
    }

    function update() {
      items.forEach((item, i) => {
        item.classList.toggle('active', i === current);
      });
      indicators.forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
      });
    }
  }

  // Expose API if needed
  window.QuantaCarousel = {
    init: initQuantaCarousels
  };
})();

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

// quanta-datepicker.js
;(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', initQuantaDatepickers);

  function initQuantaDatepickers() {
    document.querySelectorAll('.quanta-datepicker').forEach(picker => {
      setupPicker(picker);
    });
  }

  function setupPicker(picker) {
    const input       = picker.querySelector('input');
    const popup       = picker.querySelector('.quanta-datepicker-popup');
    const calendarEl  = picker.querySelector('.quanta-calendar');
    const navPrev     = picker.querySelector('.quanta-navigation .prev');
    const navNext     = picker.querySelector('.quanta-navigation .next');

    if (!input || !popup || !calendarEl || !navPrev || !navNext) {
      console.warn('Quanta Datepicker missing markup in', picker);
      return;
    }

    // state
    let viewDate = new Date();
    let selectedDate = null;

    // show/hide popup
    function togglePopup(show) {
      picker.classList.toggle('active', show);
      if (show) renderCalendar();
    }

    input.addEventListener('focus', () => togglePopup(true));
    input.addEventListener('click', () => togglePopup(true));
    document.addEventListener('click', e => {
      if (!picker.contains(e.target)) togglePopup(false);
    });

    // nav buttons
    navPrev.addEventListener('click', () => {
      viewDate.setMonth(viewDate.getMonth() - 1);
      renderCalendar();
    });
    navNext.addEventListener('click', () => {
      viewDate.setMonth(viewDate.getMonth() + 1);
      renderCalendar();
    });

    // build month/year header
    function renderCalendar() {
      // clear
      calendarEl.innerHTML = '';
      // month start
      const year = viewDate.getFullYear();
      const month = viewDate.getMonth();
      const firstDay = new Date(year, month, 1).getDay(); // 0=Sun
      const daysInMonth = new Date(year, month+1, 0).getDate();
      // pad blank days
      for (let i=0; i<firstDay; i++) {
        const blank = document.createElement('div');
        blank.className = 'quanta-day disabled';
        calendarEl.appendChild(blank);
      }
      // days
      for (let d=1; d<=daysInMonth; d++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'quanta-day';
        dayEl.textContent = d;
        const thisDate = new Date(year, month, d);

        // mark selected
        if (selectedDate &&
            selectedDate.getFullYear() === year &&
            selectedDate.getMonth() === month &&
            selectedDate.getDate() === d) {
          dayEl.classList.add('selected');
        }

        dayEl.addEventListener('click', () => {
          selectedDate = thisDate;
          input.value = formatDate(selectedDate);
          togglePopup(false);
        });

        calendarEl.appendChild(dayEl);
      }
    }

    // format date as YYYY-MM-DD
    function formatDate(d) {
      const mm = String(d.getMonth()+1).padStart(2,'0');
      const dd = String(d.getDate()).padStart(2,'0');
      return `${d.getFullYear()}-${mm}-${dd}`;
    }
  }

  // Expose if you need manual init
  window.QuantaDatepicker = {
    init: initQuantaDatepickers
  };
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

// quanta-file-upload.js
;(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initQuantaFileUploads();
  });

  function initQuantaFileUploads() {
    // 1) Traditional uploads (.quanta-file-upload)
    document.querySelectorAll('.quanta-file-upload').forEach(wrapper => {
      const input = wrapper.querySelector('input[type="file"]');
      const label = wrapper.querySelector('span') || document.createElement('span');

      // ensure label exists
      if (!wrapper.contains(label)) {
        wrapper.appendChild(label);
      }

      // click anywhere triggers file picker
      wrapper.addEventListener('click', () => input.click());

      // reflect chosen file(s)
      input.addEventListener('change', () => {
        const names = Array.from(input.files).map(f => f.name).join(', ') || 'No file chosen';
        label.textContent = names;
      });
    });

    // 2) Modern drag-and-drop uploads (.quanta-file-upload-modern)
    document.querySelectorAll('.quanta-file-upload-modern').forEach(wrapper => {
      const input = wrapper.querySelector('input[type="file"]');
      const text  = wrapper.querySelector('.quanta-file-upload-text');
      const icon  = wrapper.querySelector('.quanta-file-upload-icon');

      // click opens picker
      wrapper.addEventListener('click', () => input.click());

      // highlight on drag-over
      ['dragenter','dragover'].forEach(evt => {
        wrapper.addEventListener(evt, e => {
          e.preventDefault();
          wrapper.classList.add('drag-over');
        });
      });
      ['dragleave','drop'].forEach(evt => {
        wrapper.addEventListener(evt, e => {
          e.preventDefault();
          wrapper.classList.remove('drag-over');
        });
      });

      // handle drop
      wrapper.addEventListener('drop', e => {
        input.files = e.dataTransfer.files;
        updateModernLabel();
      });

      // handle manual selection
      input.addEventListener('change', updateModernLabel);

      function updateModernLabel() {
        const files = Array.from(input.files);
        if (!files.length) {
          text.textContent = 'Drag & drop or click to upload';
        } else if (files.length === 1) {
          text.textContent = files[0].name;
        } else {
          text.textContent = files.length + ' files selected';
        }
        // Optionally: hide the icon
        if (icon) icon.style.display = files.length ? 'none' : '';
      }

      // init label
      updateModernLabel();
    });
  }

  // expose for manual init if you dynamically inject
  window.QuantaFileUpload = {
    init: initQuantaFileUploads
  };
})();


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

// quanta-megamenu.js
;(function(){
  'use strict';

  document.addEventListener('DOMContentLoaded', initQuantaMegaMenus);

  function initQuantaMegaMenus() {
    // Handle click‐based menus
    document.querySelectorAll('.quanta-megamenu-click').forEach(menu => {
      const toggle = menu.querySelector('.quanta-megamenu-toggle');
      const content = menu.querySelector('.quanta-megamenu-content');
      if (!toggle || !content) return;

      // Ensure ARIA attributes exist
      const cid = content.id || `qm-${Math.random().toString(36).slice(2,6)}`;
      content.id = cid;
      toggle.setAttribute('aria-controls', cid);
      if (!toggle.hasAttribute('aria-expanded')) {
        toggle.setAttribute('aria-expanded','false');
      }
      toggle.setAttribute('aria-haspopup','true');

      // Click toggles
      toggle.addEventListener('click', e => {
        e.stopPropagation();
        const isOpen = toggle.getAttribute('aria-expanded') === 'true';
        toggle.setAttribute('aria-expanded', isOpen ? 'false' : 'true');
        menu.classList.toggle('show', !isOpen);
      });

      // Close on outside click
      document.addEventListener('click', e => {
        if (!menu.contains(e.target)) {
          menu.classList.remove('show');
          toggle.setAttribute('aria-expanded','false');
        }
      });

      // Keyboard support
      toggle.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggle.click();
        }
      });
      document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          menu.classList.remove('show');
          toggle.setAttribute('aria-expanded','false');
          toggle.focus();
        }
      });
    });

    // Hover‐based menus work via CSS :hover
  }

  // Expose API if needed
  window.QuantaMegaMenu = {
    init: initQuantaMegaMenus
  };
})();

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
;(function(){
  'use strict';

  // Ensure container exists
  function getContainer() {
    let container = document.querySelector('.quanta-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.className = 'quanta-toast-container';
      document.body.appendChild(container);
    }
    return container;
  }

  // Show a toast
  function show({ message = '', type = 'info', duration = 4000 } = {}) {
    const container = getContainer();
    // Create toast element
    const toast = document.createElement('div');
    toast.className = `quanta-toast quanta-${type}`;
    
    // Message
    const msg = document.createElement('div');
    msg.className = 'quanta-toast-message';
    msg.textContent = message;
    toast.appendChild(msg);

    // Close button
    const btn = document.createElement('button');
    btn.className = 'quanta-toast-close';
    btn.setAttribute('aria-label', 'Close notification');
    btn.innerHTML = '&times;';
    toast.appendChild(btn);

    // Append & auto dismiss
    container.appendChild(toast);
    // Manual close
    btn.addEventListener('click', () => dismiss(toast));
    // Auto-dismiss
    setTimeout(() => dismiss(toast), duration);
  }

  // Dismiss logic with animation
  function dismiss(toast) {
    toast.style.animation = 'quanta-fade-out 0.4s ease forwards';
    toast.addEventListener('animationend', () => {
      toast.remove();
    }, { once: true });
  }

  // Expose API
  window.QuantaToast = { show, dismiss };

  // Optional: auto-initialize container on DOMContentLoaded
  document.addEventListener('DOMContentLoaded', getContainer);
})();

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

// quanta-popovers.js
;(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', initQuantaPopovers);

  function initQuantaPopovers() {
    // Find all triggers
    document.querySelectorAll('[data-quanta-popover]').forEach(trigger => {
      const popoverId = trigger.getAttribute('data-quanta-popover');
      const popover = document.getElementById(popoverId);
      if (!popover) return;

      // Ensure it's absolutely positioned and hidden initially
      popover.style.position = 'absolute';
      popover.style.display = 'none';
      popover.style.opacity = '0';

      // Show on click
      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        togglePopover(popover, trigger);
      });

      // Keyboard: Enter or Space
      trigger.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          togglePopover(popover, trigger);
        }
      });
    });

    // Click outside closes
    document.addEventListener('click', e => {
      document.querySelectorAll('.quanta-popover.show').forEach(p => {
        if (!p.contains(e.target)) hidePopover(p);
      });
    });

    // Escape closes
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        document.querySelectorAll('.quanta-popover.show').forEach(hidePopover);
      }
    });
  }

  function togglePopover(popover, trigger) {
    const isOpen = popover.classList.contains('show');
    if (isOpen) {
      hidePopover(popover);
    } else {
      showPopover(popover, trigger);
    }
  }

  function showPopover(popover, trigger) {
    // Close any open popovers
    document.querySelectorAll('.quanta-popover.show').forEach(hidePopover);

    const rect = trigger.getBoundingClientRect();
    const placement = popover.dataset.placement || 'bottom';

    // Reset styles
    popover.style.display = 'block';
    popover.style.opacity = '1';
    popover.style.pointerEvents = 'auto';

    // Position
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

    const top = {
      top: rect.top + scrollTop - popover.offsetHeight - 8,
      left: rect.left + scrollLeft + rect.width / 2 - popover.offsetWidth / 2,
    };
    const bottom = {
      top: rect.bottom + scrollTop + 8,
      left: rect.left + scrollLeft + rect.width / 2 - popover.offsetWidth / 2,
    };
    const left = {
      top: rect.top + scrollTop + rect.height / 2 - popover.offsetHeight / 2,
      left: rect.left + scrollLeft - popover.offsetWidth - 8,
    };
    const right = {
      top: rect.top + scrollTop + rect.height / 2 - popover.offsetHeight / 2,
      left: rect.right + scrollLeft + 8,
    };

    let pos = bottom; // default
    if (placement === 'top') pos = top;
    if (placement === 'left') pos = left;
    if (placement === 'right') pos = right;

    popover.style.top = `${pos.top}px`;
    popover.style.left = `${pos.left}px`;

    popover.classList.add('show', 'quanta-popover-animated');
  }

  function hidePopover(popover) {
    popover.classList.remove('show', 'quanta-popover-animated');
    popover.style.display = 'none';
    popover.style.opacity = '0';
    popover.style.pointerEvents = 'none';
  }

  // Optional external access
  window.QuantaPopover = {
    init: initQuantaPopovers,
    show: showPopover,
    hide: hidePopover,
    toggle: togglePopover
  };
})();

;(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    initQuantaProgressBars();
  });

  function initQuantaProgressBars() {
    document.querySelectorAll('.quanta-progress-bar').forEach(bar => {
      const inner = bar.querySelector('.quanta-progress-bar-inner');
      const text = bar.querySelector('.quanta-progress-bar-text');
      const value = parseFloat(bar.dataset.progress || '0'); // Accepts 0 to 100

      setProgress(inner, text, value);
    });
  }

  function setProgress(inner, textEl, value) {
    const clamped = Math.min(100, Math.max(0, value));
    inner.style.width = clamped + '%';
    if (textEl) {
      textEl.textContent = clamped + '%';
    }
  }

  // Optional: API for external usage
  window.QuantaProgressBar = {
    set: (selector, value) => {
      const bar = document.querySelector(selector);
      if (!bar) return;
      const inner = bar.querySelector('.quanta-progress-bar-inner');
      const text = bar.querySelector('.quanta-progress-bar-text');
      setProgress(inner, text, value);
    },

    animateTo: (selector, value, duration = 1000) => {
      const bar = document.querySelector(selector);
      if (!bar) return;
      const inner = bar.querySelector('.quanta-progress-bar-inner');
      const text = bar.querySelector('.quanta-progress-bar-text');
      const current = parseFloat(inner.style.width) || 0;
      const target = Math.min(100, Math.max(0, value));
      const stepTime = 10;
      const stepCount = duration / stepTime;
      const increment = (target - current) / stepCount;

      let progress = current;
      const interval = setInterval(() => {
        progress += increment;
        if ((increment > 0 && progress >= target) || (increment < 0 && progress <= target)) {
          progress = target;
          clearInterval(interval);
        }
        setProgress(inner, text, progress);
      }, stepTime);
    }
  };
})();

;(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.quanta-range-slider').forEach(initQuantaRangeSlider);
  });

  function initQuantaRangeSlider(slider) {
    const thumb = slider.querySelector('.quanta-thumb');
    const valueDisplay = slider.querySelector('.quanta-value');
    const track = slider.querySelector('.quanta-track');

    const updatePosition = (x, skipEmit = false) => {
      const rect = slider.getBoundingClientRect();
      const percent = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
      const value = Math.round(percent * 100);
      thumb.style.left = `calc(${value}% - ${thumb.offsetWidth / 2}px)`;
      valueDisplay.textContent = `${value}%`;
      if (!skipEmit) slider.dispatchEvent(new CustomEvent('quanta:change', { detail: value }));
    };

    const onMove = e => {
      if (!slider.classList.contains('dragging')) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
    };

    const onUp = () => {
      slider.classList.remove('dragging');
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchend', onUp);
    };

    const onDown = e => {
      slider.classList.add('dragging');
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      updatePosition(clientX);
      document.addEventListener('mousemove', onMove);
      document.addEventListener('touchmove', onMove);
      document.addEventListener('mouseup', onUp);
      document.addEventListener('touchend', onUp);
    };

    // Init thumb position
    updatePosition(slider.getBoundingClientRect().left, true);

    thumb.addEventListener('mousedown', onDown);
    thumb.addEventListener('touchstart', onDown, { passive: true });
  }

  // Optional global API
  window.QuantaRangeSlider = {
    set: (selector, value) => {
      const slider = document.querySelector(selector);
      const thumb = slider.querySelector('.quanta-thumb');
      const valueDisplay = slider.querySelector('.quanta-value');
      const percent = Math.max(0, Math.min(100, value));
      thumb.style.left = `calc(${percent}% - ${thumb.offsetWidth / 2}px)`;
      valueDisplay.textContent = `${percent}%`;
    }
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.quanta-sidebar');
  const toggleBtn = document.querySelector('.quanta-sidebar-toggle');
  const collapseBtn = document.querySelector('.quanta-sidebar-collapse'); // Optional collapse button

  // Mobile toggle
  if (sidebar && toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('show');
      const isExpanded = sidebar.classList.contains('show');
      sidebar.setAttribute('aria-expanded', isExpanded);
    });
  }

  // Load collapse state from localStorage
  if (sidebar && collapseBtn) {
    const isCollapsed = localStorage.getItem('quanta-sidebar-collapsed') === 'true';
    if (isCollapsed) {
      sidebar.classList.add('collapsed');
    }

    collapseBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const collapsed = sidebar.classList.contains('collapsed');
      localStorage.setItem('quanta-sidebar-collapsed', collapsed);
    });
  }
});

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

const userCard = document.querySelector('.user-card');
const skeletons = userCard.querySelectorAll('.quanta-skeleton');

// Show skeletons
skeletons.forEach(s => s.style.display = 'block');

// Fetch content
fetch('/api/user')
  .then(res => res.json())
  .then(data => {
    userCard.innerHTML = `
      <img src="${data.avatar}" class="avatar" />
      <h3>${data.name}</h3>
      <p>${data.role}</p>
    `;
  });

document.addEventListener('DOMContentLoaded', () => {
  // Optional: Automatically hide spinners after a delay
  const autoHideAfter = 2000; // in ms

  // Circle Spinners
  const spinners = document.querySelectorAll('.quanta-spinner');
  spinners.forEach(spinner => {
    if (spinner.dataset.autohide !== 'false') {
      setTimeout(() => {
        spinner.style.display = 'none';
      }, autoHideAfter);
    }
  });

  // Bar Spinners (reset animation if needed)
  const bars = document.querySelectorAll('.quanta-spinner-bar .quanta-bar');
  bars.forEach(bar => {
    // Optional: Reset animation every cycle
    bar.addEventListener('animationiteration', () => {
      bar.style.animation = 'none';
      bar.offsetHeight; // Trigger reflow
      bar.style.animation = '';
    });
  });
});

/**
 * Helper: Show spinner manually
 * @param {string} selector - e.g. ".quanta-spinner.lg"
 */
function showSpinner(selector) {
  const el = document.querySelector(selector);
  if (el) el.style.display = 'inline-block';
}

/**
 * Helper: Hide spinner manually
 * @param {string} selector
 */
function hideSpinner(selector) {
  const el = document.querySelector(selector);
  if (el) el.style.display = 'none';
}

/**
 * Helper: Start a bar animation from 0 again
 * @param {string} selector
 */
function resetBarAnimation(selector) {
  const el = document.querySelector(selector);
  if (el) {
    el.style.animation = 'none';
    el.offsetHeight; // Force reflow
    el.style.animation = 'loading 2s infinite';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // Auto animate all stat values on load
  const statValues = document.querySelectorAll('.quanta-stat-value');
  statValues.forEach(el => {
    const finalValue = parseInt(el.textContent.replace(/,/g, ''), 10);
    if (!isNaN(finalValue)) {
      animateStat(el, finalValue);
    }
  });

  // OPTIONAL: Auto refresh stats every 10s (for demo purposes)
  // remove this block if not needed
  setInterval(() => {
    document.querySelectorAll('.quanta-stat-value').forEach(el => {
      const newValue = getRandomInt(1000, 9999);
      animateStat(el, newValue);
    });
  }, 10000);
});

/**
 * Animate a stat number from 0 to value
 * @param {HTMLElement} el
 * @param {number} end
 * @param {number} duration
 */
function animateStat(el, end, duration = 1000) {
  let start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const progress = Math.min((currentTime - startTime) / duration, 1);
    const current = Math.floor(progress * end);
    el.textContent = formatNumber(current);

    if (progress < 1) {
      requestAnimationFrame(update);
    }
  }

  requestAnimationFrame(update);
}

/**
 * Format numbers with commas
 */
function formatNumber(num) {
  return num.toLocaleString('en-US');
}

/**
 * Random int for demo updates
 */
function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


document.addEventListener('DOMContentLoaded', () => {
  const steppers = document.querySelectorAll('.quanta-stepper');

  steppers.forEach(stepper => {
    const steps = stepper.querySelectorAll('.quanta-step');
    let currentStep = 0;

    // Initialize steps
    updateSteps(steps, currentStep);

    // Optional: next/prev buttons (if using)
    const nextBtn = stepper.querySelector('[data-step-next]');
    const prevBtn = stepper.querySelector('[data-step-prev]');

    nextBtn?.addEventListener('click', () => {
      if (currentStep < steps.length - 1) {
        currentStep++;
        updateSteps(steps, currentStep);
      }
    });

    prevBtn?.addEventListener('click', () => {
      if (currentStep > 0) {
        currentStep--;
        updateSteps(steps, currentStep);
      }
    });
  });
});

/**
 * Update stepper UI
 */
function updateSteps(steps, activeIndex) {
  steps.forEach((step, index) => {
    step.classList.remove('active', 'completed');

    if (index < activeIndex) {
      step.classList.add('completed');
    } else if (index === activeIndex) {
      step.classList.add('active');
    }
  });
}

// Vanilla JS sticky header scroll behavior
document.addEventListener('DOMContentLoaded', () => {
  const stickyTop = document.querySelector('.quanta-sticky-top');
  if (!stickyTop) return;

  let lastScrollY = window.scrollY;
  window.addEventListener('scroll', () => {
    const currentScrollY = window.scrollY;

    if (currentScrollY > lastScrollY) {
      // Scrolling down — hide header by moving it up
      stickyTop.style.top = '-60px'; // Adjust height as needed
    } else {
      // Scrolling up — show header
      stickyTop.style.top = '0';
    }
    lastScrollY = currentScrollY;
  });
});


document.addEventListener('DOMContentLoaded', () => {
  const tabs = document.querySelectorAll('.quanta-tabs [role="tab"]');
  const panels = document.querySelectorAll('.quanta-tab-panel');

  function activateTab(tab) {
    // Deactivate all tabs
    tabs.forEach(t => {
      t.classList.remove('active');
      t.setAttribute('aria-selected', 'false');
      t.setAttribute('tabindex', '-1');
    });

    // Hide all panels
    panels.forEach(panel => {
      panel.classList.remove('active');
      panel.setAttribute('hidden', '');
    });

    // Activate the clicked tab
    tab.classList.add('active');
    tab.setAttribute('aria-selected', 'true');
    tab.removeAttribute('tabindex');
    tab.focus();

    // Show the associated panel
    const panelId = tab.getAttribute('aria-controls');
    const panel = document.getElementById(panelId);
    panel.classList.add('active');
    panel.removeAttribute('hidden');
  }

  function handleKeyDown(e) {
    const key = e.key;
    const currentTab = e.target;
    let newIndex;

    const tabsArray = Array.from(tabs);
    const currentIndex = tabsArray.indexOf(currentTab);

    switch (key) {
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newIndex = (currentIndex + 1) % tabs.length;
        tabs[newIndex].focus();
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        tabs[newIndex].focus();
        break;
      case 'Home':
        e.preventDefault();
        tabs[0].focus();
        break;
      case 'End':
        e.preventDefault();
        tabs[tabs.length - 1].focus();
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        activateTab(currentTab);
        break;
    }
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => activateTab(tab));
    tab.addEventListener('keydown', handleKeyDown);
  });
});

const target = document.querySelector('.tooltip-target');
const tooltip = document.createElement('div');
tooltip.className = 'quanta-tooltip';
tooltip.textContent = 'Tooltip text here';
document.body.appendChild(tooltip);

function positionTooltip() {
  const rect = target.getBoundingClientRect();
  tooltip.style.top = rect.top - tooltip.offsetHeight - 8 + window.scrollY + 'px';
  tooltip.style.left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2 + window.scrollX + 'px';
}

target.addEventListener('mouseenter', () => {
  positionTooltip();
  tooltip.classList.add('show');
});
target.addEventListener('mouseleave', () => {
  tooltip.classList.remove('show');
});

