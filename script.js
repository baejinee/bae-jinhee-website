/* ========================================
   FIREBASE CONFIG
   ======================================== */
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

/* ========================================
   GLOBAL STATE
   ======================================== */
let currentLang = 'ko';

/* ========================================
   LOADING SCREEN
   ======================================== */
window.addEventListener('load', () => {
  setTimeout(() => {
    const loader = document.getElementById('loading-screen');
    if (loader) {
      loader.classList.add('hidden');
      setTimeout(() => loader.remove(), 600);
    }
  }, 800);
});

/* ========================================
   HEADER SCROLL
   ======================================== */
window.addEventListener('scroll', () => {
  const header = document.getElementById('header');
  if (window.scrollY > 50) {
    header.classList.add('scrolled');
  } else {
    header.classList.remove('scrolled');
  }
});

/* ========================================
   MOBILE NAV
   ======================================== */
const menuToggle = document.getElementById('menuToggle');
const mobileNav = document.getElementById('mobileNav');

menuToggle?.addEventListener('click', () => {
  mobileNav.classList.toggle('active');
});

document.querySelectorAll('.mobile-nav .nav-link').forEach(link => {
  link.addEventListener('click', () => {
    mobileNav.classList.remove('active');
  });
});

/* ========================================
   FADE IN ON SCROLL
   ======================================== */
const fadeObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
    }
  });
}, { threshold: 0.1 });

document.querySelectorAll('.fade-in').forEach(el => {
  fadeObserver.observe(el);
});

/* ========================================
   LANGUAGE TOGGLE
   ======================================== */
const langToggle = document.getElementById('langToggle');

langToggle?.addEventListener('click', () => {
  currentLang = currentLang === 'ko' ? 'en' : 'ko';
  langToggle.textContent = currentLang === 'ko' ? 'EN' : 'KO';
  updateLanguage(currentLang);
});

function updateLanguage(lang) {
  // data-ko / data-en attributes
  document.querySelectorAll('[data-ko]').forEach(el => {
    if (el.hasAttribute('data-' + lang)) {
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = el.getAttribute('data-' + lang);
      } else {
        el.textContent = el.getAttribute('data-' + lang);
      }
    }
  });

  // lang-ko / lang-en blocks
  document.querySelectorAll('.lang-ko').forEach(el => {
    el.style.display = lang === 'ko' ? '' : 'none';
  });
  document.querySelectorAll('.lang-en').forEach(el => {
    el.style.display = lang === 'en' ? '' : 'none';
  });
}

/* ========================================
   LOAD WORKS FROM FIREBASE
   ======================================== */
async function loadWorks() {
  const grid = document.getElementById('worksGrid');
  if (!grid) return;

  try {
    const snapshot = await db.collection('works')
      .orderBy('order', 'asc')
      .get();

    if (snapshot.empty) {
      grid.innerHTML = '<p style="color:#aaa;font-size:13px;grid-column:1/-1;text-align:center;padding:60px 0;">작품이 준비 중입니다.</p>';
      return;
    }

    const categories = new Set();

    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.category) categories.add(data.category);

      const card = document.createElement('div');
      card.className = 'work-card';
      card.dataset.category = data.category || 'all';
      card.innerHTML = `
        <img src="${data.imageUrl}" alt="${data.title || ''}" loading="lazy" />
        <div class="work-overlay">
          <h4>${data.title || ''}</h4>
          <p>${data.year || ''}</p>
        </div>
      `;
      card.addEventListener('click', () => openModal(data));
      grid.appendChild(card);
    });

    if (categories.size > 0) {
      const filterContainer = document.querySelector('.works-filter');
      categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.dataset.filter = cat;
        btn.textContent = cat;
        filterContainer.appendChild(btn);
      });
      initFilters();
    }
  } catch (error) {
    console.error('Works load error:', error);
  }
}

function initFilters() {
  document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const filter = btn.dataset.filter;
      document.querySelectorAll('.work-card').forEach(card => {
        card.style.display = (filter === 'all' || card.dataset.category === filter) ? '' : 'none';
      });
    });
  });
}

/* ========================================
   MODAL
   ======================================== */
const modal = document.getElementById('workModal');
const modalClose = document.getElementById('modalClose');

function openModal(data) {
  document.getElementById('modalImg').src = data.imageUrl || '';
  document.getElementById('modalTitle').textContent = data.title || '';
  document.getElementById('modalYear').textContent = data.year || '';
  document.getElementById('modalMedium').textContent = data.medium || '';
  document.getElementById('modalSize').textContent = data.size || '';
  document.getElementById('modalDesc').textContent = data.description || '';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

modalClose?.addEventListener('click', closeModal);
modal?.addEventListener('click', (e) => {
  if (e.target === modal) closeModal();
});

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') closeModal();
});

/* ========================================
   CONTACT FORM
   ======================================== */
document.getElementById('contactForm')?.addEventListener('submit', async (e) => {
  e.preventDefault();

  const form = e.target;
  const btn = form.querySelector('.submit-btn');
  const originalText = btn.textContent;

  btn.textContent = currentLang === 'ko' ? '전송 중...' : 'Sending...';
  btn.disabled = true;

  try {
    await db.collection('messages').add({
      name: document.getElementById('contactName').value.trim(),
      email: document.getElementById('contactEmail').value.trim(),
      subject: document.getElementById('contactSubject').value.trim(),
      message: document.getElementById('contactMessage').value.trim(),
      timestamp: firebase.firestore.FieldValue.serverTimestamp(),
      read: false
    });

    form.style.display = 'none';
    document.getElementById('formSuccess').style.display = 'block';

    setTimeout(() => {
      form.reset();
      form.style.display = '';
      document.getElementById('formSuccess').style.display = 'none';
      btn.textContent = originalText;
      btn.disabled = false;
    }, 4000);

  } catch (error) {
    console.error('Message send error:', error);
    alert(currentLang === 'ko'
      ? '전송에 실패했습니다. 이메일로 직접 연락해주세요.'
      : 'Failed to send. Please contact via email.');
    btn.textContent = originalText;
    btn.disabled = false;
  }
});

/* ========================================
   ADMIN ACCESS
   ======================================== */
let clickTimes = [];
document.getElementById('logo')?.addEventListener('click', () => {
  const now = Date.now();
  clickTimes.push(now);
  clickTimes = clickTimes.filter(t => now - t < 2000);
  if (clickTimes.length >= 5) {
    clickTimes = [];
    const pw = prompt('Password:');
    if (pw === 'jinhee0228') {
      window.location.href = '/admin.html';
    }
  }
});

/* ========================================
   SECURITY
   ======================================== */
document.addEventListener('contextmenu', (e) => e.preventDefault());
document.addEventListener('dragstart', (e) => e.preventDefault());
document.addEventListener('keydown', (e) => {
  if (e.key === 'F12') e.preventDefault();
  if (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'i')) e.preventDefault();
  if (e.ctrlKey && e.shiftKey && (e.key === 'J' || e.key === 'j')) e.preventDefault();
  if (e.ctrlKey && (e.key === 'U' || e.key === 'u')) e.preventDefault();
});

/* ========================================
   INIT
   ======================================== */
loadWorks();
