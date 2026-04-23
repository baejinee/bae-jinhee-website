/* =============================================
   BAE JIN-HEE PORTFOLIO - MAIN SCRIPT
   Firebase + White Cube + Security
   ============================================= */

// =============================
// 1. FIREBASE INITIALIZATION
// =============================
const firebaseConfig = {
  apiKey: "AIzaSyDQPo4IxNSSdCpTkn357WOBIGXVZkQskEk",
  authDomain: "baejinhee-portfolio.firebaseapp.com",
  projectId: "baejinhee-portfolio",
  storageBucket: "baejinhee-portfolio.firebasestorage.app",
  messagingSenderId: "607367706259",
  appId: "1:607367706259:web:ba1e11b2150b6970597f66"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// =============================
// 2. GLOBAL VARIABLES
// =============================
let currentLang = 'ko';
let allWorks = [];
let filteredWorks = [];
let currentFilter = 'all';
let currentModalIndex = 0;
let logoClickCount = 0;
let logoClickTimer = null;

// =============================
// 3. LOADING SCREEN
// =============================
window.addEventListener('load', () => {
  const loadingScreen = document.getElementById('loading-screen');
  setTimeout(() => {
    loadingScreen.classList.add('hidden');
    document.body.style.overflow = 'auto';
    initFadeIn();
  }, 800);
});

// =============================
// 4. HEADER SCROLL EFFECT
// =============================
const header = document.querySelector('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

// =============================
// 5. MOBILE MENU
// =============================
const menuToggle = document.querySelector('.menu-toggle');
const nav = document.querySelector('nav');

if (menuToggle) {
  menuToggle.addEventListener('click', () => {
    menuToggle.classList.toggle('active');
    nav.classList.toggle('open');
  });

  // Close menu when clicking nav links
  nav.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      menuToggle.classList.remove('active');
      nav.classList.remove('open');
    });
  });
}

// =============================
// 6. SMOOTH SCROLL
// =============================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      const headerHeight = header.offsetHeight;
      const targetPosition = target.offsetTop - headerHeight - 20;
      window.scrollTo({
        top: targetPosition,
        behavior: 'smooth'
      });
    }
  });
});

// =============================
// 7. FADE-IN ANIMATION
// =============================
function initFadeIn() {
  const fadeElements = document.querySelectorAll('.fade-in');

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add('visible');
        }, index * 100);
        observer.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  });

  fadeElements.forEach(el => observer.observe(el));
}

// =============================
// 8. LANGUAGE TOGGLE
// =============================
const langToggle = document.querySelector('.lang-toggle');

if (langToggle) {
  langToggle.addEventListener('click', () => {
    currentLang = currentLang === 'ko' ? 'en' : 'ko';
    langToggle.textContent = currentLang === 'ko' ? 'EN' : 'KR';
    updateLanguage();
  });
}

function updateLanguage() {
  // Toggle text elements
  document.querySelectorAll('[data-ko]').forEach(el => {
    if (currentLang === 'ko') {
      el.textContent = el.getAttribute('data-ko');
    } else {
      el.textContent = el.getAttribute('data-en');
    }
  });

  // Toggle HTML elements (for multi-line content)
  document.querySelectorAll('[data-ko-html]').forEach(el => {
    if (currentLang === 'ko') {
      el.innerHTML = el.getAttribute('data-ko-html');
    } else {
      el.innerHTML = el.getAttribute('data-en-html');
    }
  });

  // Re-render works with new language
  renderWorks();
}
// =============================
// 9. FIREBASE - LOAD WORKS
// =============================
async function loadWorks() {
  try {
    const worksGrid = document.querySelector('.works-grid');
    if (!worksGrid) return;

    // Show loading state
    worksGrid.innerHTML = '<div class="works-empty">Loading...</div>';

    const snapshot = await db.collection('works')
      .orderBy('order', 'asc')
      .get();

    allWorks = [];
    snapshot.forEach(doc => {
      allWorks.push({ id: doc.id, ...doc.data() });
    });

    // If no works yet, show empty state
    if (allWorks.length === 0) {
      worksGrid.innerHTML = `
        <div class="works-empty">
          ${currentLang === 'ko' ? '준비 중입니다' : 'Coming Soon'}
        </div>
      `;
      return;
    }

    filteredWorks = [...allWorks];
    renderWorks();
    buildCategoryFilters();

  } catch (error) {
    console.error('Error loading works:', error);
    const worksGrid = document.querySelector('.works-grid');
    if (worksGrid) {
      worksGrid.innerHTML = `
        <div class="works-empty">
          ${currentLang === 'ko' ? '작품을 불러올 수 없습니다' : 'Unable to load works'}
        </div>
      `;
    }
  }
}

// =============================
// 10. RENDER WORKS GRID
// =============================
function renderWorks() {
  const worksGrid = document.querySelector('.works-grid');
  if (!worksGrid) return;

  if (filteredWorks.length === 0) {
    worksGrid.innerHTML = `
      <div class="works-empty">
        ${currentLang === 'ko' ? '해당 카테고리에 작품이 없습니다' : 'No works in this category'}
      </div>
    `;
    return;
  }

  worksGrid.innerHTML = filteredWorks.map((work, index) => `
    <div class="work-item fade-in" onclick="openModal(${index})" style="transition-delay: ${index * 0.05}s">
      <img src="${work.imageUrl}" alt="${currentLang === 'ko' ? work.titleKo : work.titleEn}" loading="lazy">
      <div class="work-overlay">
        <div class="work-title">${currentLang === 'ko' ? work.titleKo : work.titleEn}</div>
        <div class="work-year">${work.year || ''}</div>
      </div>
    </div>
  `).join('');

  // Re-initialize fade-in for new elements
  setTimeout(() => initFadeIn(), 100);
}

// =============================
// 11. CATEGORY FILTERS
// =============================
function buildCategoryFilters() {
  const filterContainer = document.querySelector('.category-filter');
  if (!filterContainer) return;

  // Collect unique categories
  const categories = new Set();
  allWorks.forEach(work => {
    if (work.category) {
      categories.add(work.category);
    }
  });

  // Build filter buttons
  let filterHTML = `<button class="active" onclick="filterWorks('all')">
    <span data-ko="전체" data-en="All">${currentLang === 'ko' ? '전체' : 'All'}</span>
  </button>`;

  const categoryLabels = {
    'painting': { ko: '회화', en: 'Painting' },
    'glass': { ko: '유리', en: 'Glass' },
    'installation': { ko: '설치', en: 'Installation' },
    'stained-glass': { ko: '스테인드글라스', en: 'Stained Glass' },
    'mixed-media': { ko: '혼합매체', en: 'Mixed Media' },
    'drawing': { ko: '드로잉', en: 'Drawing' },
    'digital': { ko: '디지털', en: 'Digital' },
    'other': { ko: '기타', en: 'Other' }
  };

  categories.forEach(cat => {
    const label = categoryLabels[cat] || { ko: cat, en: cat };
    filterHTML += `<button onclick="filterWorks('${cat}')">
      <span>${currentLang === 'ko' ? label.ko : label.en}</span>
    </button>`;
  });

  filterContainer.innerHTML = filterHTML;
}

function filterWorks(category) {
  currentFilter = category;

  // Update active state
  document.querySelectorAll('.category-filter button').forEach(btn => {
    btn.classList.remove('active');
  });
  event.currentTarget.classList.add('active');

  // Filter works
  if (category === 'all') {
    filteredWorks = [...allWorks];
  } else {
    filteredWorks = allWorks.filter(work => work.category === category);
  }

  renderWorks();
}

// =============================
// 12. MODAL (ARTWORK VIEWER)
// =============================
const modalOverlay = document.querySelector('.modal-overlay');
const modalImage = document.querySelector('.modal-content img');
const modalTitle = document.querySelector('.modal-title');
const modalDetail = document.querySelector('.modal-detail');

function openModal(index) {
  if (!filteredWorks[index]) return;

  currentModalIndex = index;
  const work = filteredWorks[index];

  if (modalImage) modalImage.src = work.imageUrl;
  if (modalImage) modalImage.alt = currentLang === 'ko' ? work.titleKo : work.titleEn;

  if (modalTitle) {
    modalTitle.textContent = currentLang === 'ko' ? work.titleKo : work.titleEn;
  }

  if (modalDetail) {
    let detailText = '';
    if (work.year) detailText += work.year;
    if (work.material) {
      const mat = currentLang === 'ko' ? (work.materialKo || work.material) : work.material;
      detailText += detailText ? ' · ' + mat : mat;
    }
    if (work.size) detailText += detailText ? ' · ' + work.size : work.size;
    modalDetail.textContent = detailText;
  }

  if (modalOverlay) {
    modalOverlay.style.display = 'flex';
    setTimeout(() => modalOverlay.classList.add('active'), 10);
    document.body.style.overflow = 'hidden';
  }
}

function closeModal() {
  if (modalOverlay) {
    modalOverlay.classList.remove('active');
    setTimeout(() => {
      modalOverlay.style.display = 'none';
      document.body.style.overflow = 'auto';
    }, 400);
  }
}

function prevWork() {
  if (filteredWorks.length === 0) return;
  currentModalIndex = (currentModalIndex - 1 + filteredWorks.length) % filteredWorks.length;
  openModal(currentModalIndex);
}

function nextWork() {
  if (filteredWorks.length === 0) return;
  currentModalIndex = (currentModalIndex + 1) % filteredWorks.length;
  openModal(currentModalIndex);
}

// Modal click outside to close
if (modalOverlay) {
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      closeModal();
    }
  });
}

// Keyboard navigation
document.addEventListener('keydown', (e) => {
  if (!modalOverlay || modalOverlay.style.display !== 'flex') return;

  if (e.key === 'Escape') closeModal();
  if (e.key === 'ArrowLeft') prevWork();
  if (e.key === 'ArrowRight') nextWork();
});
// =============================
// 13. ADMIN ACCESS (5-CLICK LOGO)
// =============================
const logo = document.querySelector('.logo');

if (logo) {
  logo.addEventListener('click', (e) => {
    e.preventDefault();
    logoClickCount++;

    // Reset timer on each click
    clearTimeout(logoClickTimer);
    logoClickTimer = setTimeout(() => {
      logoClickCount = 0;
    }, 2000);

    // 5 clicks within 2 seconds
    if (logoClickCount >= 5) {
      logoClickCount = 0;
      clearTimeout(logoClickTimer);
      openAdminPrompt();
    }
  });
}

function openAdminPrompt() {
  const password = prompt('관리자 비밀번호를 입력하세요:');
  if (password === 'jinhee0228') {
    window.location.href = '/admin.html';
  } else if (password !== null) {
    alert('비밀번호가 올바르지 않습니다.');
  }
}

// =============================
// 14. SECURITY PROTECTIONS
// =============================

// Disable right-click
document.addEventListener('contextmenu', (e) => {
  e.preventDefault();
  return false;
});

// Disable keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // F12
  if (e.key === 'F12') {
    e.preventDefault();
    return false;
  }

  // Ctrl+Shift+I (Inspector)
  if (e.ctrlKey && e.shiftKey && e.key === 'I') {
    e.preventDefault();
    return false;
  }

  // Ctrl+Shift+J (Console)
  if (e.ctrlKey && e.shiftKey && e.key === 'J') {
    e.preventDefault();
    return false;
  }

  // Ctrl+Shift+C (Element picker)
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    return false;
  }

  // Ctrl+U (View source)
  if (e.ctrlKey && e.key === 'u') {
    e.preventDefault();
    return false;
  }

  // Ctrl+S (Save)
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    return false;
  }

  // Ctrl+P (Print)
  if (e.ctrlKey && e.key === 'p') {
    e.preventDefault();
    return false;
  }
});

// Disable drag on images
document.addEventListener('dragstart', (e) => {
  if (e.target.tagName === 'IMG') {
    e.preventDefault();
    return false;
  }
});

// Disable text selection on images
document.querySelectorAll('img').forEach(img => {
  img.style.userSelect = 'none';
  img.style.webkitUserSelect = 'none';
  img.setAttribute('draggable', 'false');
});

// =============================
// 15. TOUCH SUPPORT (MOBILE)
// =============================
let touchStartX = 0;
let touchEndX = 0;

if (modalOverlay) {
  modalOverlay.addEventListener('touchstart', (e) => {
    touchStartX = e.changedTouches[0].screenX;
  }, { passive: true });

  modalOverlay.addEventListener('touchend', (e) => {
    touchEndX = e.changedTouches[0].screenX;
    handleSwipe();
  }, { passive: true });
}

function handleSwipe() {
  const swipeThreshold = 50;
  const diff = touchStartX - touchEndX;

  if (Math.abs(diff) > swipeThreshold) {
    if (diff > 0) {
      nextWork(); // Swipe left → next
    } else {
      prevWork(); // Swipe right → prev
    }
  }
}
// =============================
// 16. IMAGE LAZY LOADING FALLBACK
// =============================
if ('IntersectionObserver' in window) {
  const lazyImages = document.querySelectorAll('img[loading="lazy"]');
  const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const img = entry.target;
        if (img.dataset.src) {
          img.src = img.dataset.src;
          img.removeAttribute('data-src');
        }
        imageObserver.unobserve(img);
      }
    });
  });

  lazyImages.forEach(img => imageObserver.observe(img));
}

// =============================
// 17. SCROLL TO TOP (LOGO CLICK)
// =============================
// Note: Single click scrolls to top, 5 rapid clicks opens admin
// The admin trigger in section 13 handles this with the counter

// =============================
// 18. YEAR AUTO-UPDATE (FOOTER)
// =============================
const footerYear = document.querySelector('.footer-year');
if (footerYear) {
  footerYear.textContent = new Date().getFullYear();
}

// =============================
// 19. PRELOAD CRITICAL IMAGES
// =============================
function preloadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
}

// =============================
// 20. PERFORMANCE: DEBOUNCE
// =============================
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Debounced scroll handler
const debouncedScroll = debounce(() => {
  // Additional scroll-based logic can go here
}, 100);

window.addEventListener('scroll', debouncedScroll, { passive: true });

// =============================
// 21. CONSOLE PROTECTION MESSAGE
// =============================
console.log('%c⚠️ STOP', 'color: red; font-size: 40px; font-weight: bold;');
console.log('%cThis is a browser feature intended for developers.', 'font-size: 14px;');
console.log('%c© Bae Jin-hee. All rights reserved.', 'font-size: 12px; color: gray;');

// =============================
// 22. INITIALIZE
// =============================
document.addEventListener('DOMContentLoaded', () => {
  // Load works from Firebase
  loadWorks();

  // Set initial language display
  const langToggle = document.querySelector('.lang-toggle');
  if (langToggle) {
    langToggle.textContent = 'EN';
  }

  // Scroll to top on page load
  window.scrollTo(0, 0);

  // Add loaded class for CSS animations
  document.body.classList.add('loaded');

  console.log('Portfolio initialized successfully.');
});

// =============================
// 23. SERVICE WORKER (OPTIONAL)
// =============================
// Uncomment below to enable offline caching
/*
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered'))
      .catch(err => console.log('SW failed', err));
  });
}
*/
