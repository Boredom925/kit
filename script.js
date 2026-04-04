/* ============================================================
   KIT — Kolkata Institute of Technology
   JavaScript · Navigation, dashboards, interactions
   ============================================================ */

// ── Backend API URL ───────────────────────────────────────────
const API = 'https://kit-backend.vercel.app';

// ── State ────────────────────────────────────────────────────
let currentPage = 'home';
let currentUser = null;

const facilitySubPages = {
  canteen: 'canteen-tab', transport: 'transport-tab',
  hostel:  'hostel-tab',  library:   'library-tab'
};

// ── DOM ready ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initDashboardNav();
  initProgramTabs();
  initFacilityTabs();
  setDate();
  checkScrollShadow();
  restoreSession(); // re-login from localStorage if token exists
});

// ── Date display ─────────────────────────────────────────────
function setDate() {
  const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const str  = new Date().toLocaleDateString('en-IN', opts);
  ['dashDate', 'fdashDate', 'adashDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = str;
  });
}

// ── Restore session on page reload ───────────────────────────
function restoreSession() {
  const token = localStorage.getItem('kit_token');
  const user  = localStorage.getItem('kit_user');
  if (!token || !user) return;
  try {
    const parsed = JSON.parse(user);
    currentUser  = parsed.role;
  } catch {
    localStorage.removeItem('kit_token');
    localStorage.removeItem('kit_user');
  }
}

// ── Authenticated fetch helper ────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('kit_token');
  try {
    const res  = await fetch(API + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: 'Bearer ' + token } : {}),
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    if (res.status === 401) {
      // Token expired — log out silently
      handleLogout();
      return null;
    }
    return { ok: res.ok, status: res.status, data };
  } catch (err) {
    showToast('Network error. Check your connection.');
    return null;
  }
}

// ── Single navigateTo ─────────────────────────────────────────
function navigateTo(page) {

  // Parent "Login" nav item → do nothing
  if (page === 'login') return;

  // Facility sub-page shortcuts
  if (facilitySubPages[page]) {
    _showPage('facilities');
    setTimeout(() => {
      document.querySelectorAll('.fac-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.fac-content').forEach(c => c.classList.remove('active'));
      document.querySelector('.fac-tab[data-fac="' + facilitySubPages[page] + '"]')?.classList.add('active');
      document.getElementById(facilitySubPages[page])?.classList.add('active');
    }, 80);
    return;
  }

  // Academics shortcuts
  if (page === 'btech') { _showPage('academics'); return; }
  if (page === 'mtech') {
    _showPage('academics');
    setTimeout(() => {
      document.querySelectorAll('.prog-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.prog-content').forEach(c => c.classList.remove('active'));
      document.querySelector('.prog-tab[data-prog="mtech-tab"]')?.classList.add('active');
      document.getElementById('mtech-tab')?.classList.add('active');
    }, 80);
    return;
  }

  // Auth guards
  if (page === 'student-dashboard' && currentUser !== 'student') { _showPage('student-login'); return; }
  if (page === 'faculty-dashboard' && currentUser !== 'faculty') { _showPage('faculty-login'); return; }
  if (page === 'admin-dashboard'   && currentUser !== 'admin')   { _showPage('admin-login');   return; }

  _showPage(page);
}

function _showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById('page-' + page);
  if (target) {
    target.classList.add('active');
    currentPage = page;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const root  = page.split('-')[0];
  const match = document.querySelector('.nav-link[data-page="' + root + '"]');
  if (match) match.classList.add('active');
  document.getElementById('mainNav')?.classList.remove('open');
}

// ── Bind nav links ────────────────────────────────────────────
function initNav() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => {
      e.preventDefault();
      navigateTo(el.dataset.page);
    });
  });

  const hamburger = document.getElementById('hamburger');
  const mainNav   = document.getElementById('mainNav');
  if (hamburger) hamburger.addEventListener('click', () => mainNav?.classList.toggle('open'));
  document.addEventListener('click', e => {
    if (!e.target.closest('.topbar')) mainNav?.classList.remove('open');
  });
}

// ── Dashboard sidebars ────────────────────────────────────────
function initDashboardNav() {
  [
    ['.student-sidebar .sb-link[data-dash]', '#page-student-dashboard .dash-panel', '.student-sidebar .sb-link'],
    ['.faculty-sidebar .sb-link[data-dash]', '#page-faculty-dashboard .dash-panel', '.faculty-sidebar .sb-link'],
    ['.admin-sidebar   .sb-link[data-dash]', '#page-admin-dashboard   .dash-panel', '.admin-sidebar   .sb-link'],
  ].forEach(([links, panels, allLinks]) => {
    document.querySelectorAll(links).forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll(allLinks).forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll(panels).forEach(p => p.classList.remove('active'));
        document.getElementById(link.dataset.dash)?.classList.add('active');
      });
    });
  });
}

// ── Program / facility tabs ───────────────────────────────────
function initProgramTabs() {
  document.querySelectorAll('.prog-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.prog-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.prog-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.prog)?.classList.add('active');
    });
  });
}

function initFacilityTabs() {
  document.querySelectorAll('.fac-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.fac-tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.fac-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(tab.dataset.fac)?.classList.add('active');
    });
  });
}

// ── LOGIN — real API call ─────────────────────────────────────
async function handleLogin(e, role) {
  e.preventDefault();
  const form = e.target;

  // Collect all text inputs in the form (excluding checkbox)
  const textInputs = [...form.querySelectorAll('input[type="text"]')];
  const pwdInput   = form.querySelector('input[type="password"]');

  // First text input is always the ID field
  const idInput = textInputs[0] || null;

  if (!idInput || !pwdInput) {
    showToast('Form error. Please refresh and try again.');
    return;
  }

  const id       = idInput.value.trim();
  const password = pwdInput.value;

  // Admin: security code is the SECOND text input in the admin form
  // It has placeholder "6-digit security code"
  let securityCode = undefined;
  if (role === 'admin') {
    const secInput = textInputs[1] || null;  // second text input
    securityCode   = secInput ? secInput.value.trim() : '';
  }

  if (!id || !password) {
    showToast('Please enter your ID and password.');
    return;
  }

  // Disable button to prevent double-submit
  const btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }

  showToast('Logging in...');

  try {
    const res  = await fetch(API + '/api/auth/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, password, role, securityCode }),
    });

    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Login failed. Check your credentials.');
      if (btn) { btn.disabled = false; btn.textContent = 'Login to Portal'; }
      return;
    }

    // Store token and user info
    localStorage.setItem('kit_token', data.token);
    localStorage.setItem('kit_user',  JSON.stringify(data.user));
    currentUser = role;

    showToast('Welcome, ' + data.user.name + '!');

    // Navigate to correct dashboard
    const dashMap = {
      student: 'student-dashboard',
      faculty: 'faculty-dashboard',
      admin:   'admin-dashboard'
    };

    setTimeout(() => {
      navigateTo(dashMap[role]);
      populateDashboard(role, data.user);
    }, 600);

  } catch (err) {
    showToast('Connection error. Is the backend reachable?');
    if (btn) { btn.disabled = false; btn.textContent = 'Login to Portal'; }
  }
}

// ── Populate dashboard with real user data ────────────────────
function populateDashboard(role, user) {
  if (role === 'student') {
    // Update sidebar profile
    const nameEl   = document.querySelector('.student-sidebar .profile-name');
    const rollEl   = document.querySelectorAll('.student-sidebar .profile-detail')[0];
    const deptEl   = document.querySelectorAll('.student-sidebar .profile-detail')[1];
    if (nameEl) nameEl.textContent = user.name || 'Student';
    if (rollEl) rollEl.textContent = 'Roll: ' + (user.rollNo || user.id);
    if (deptEl) deptEl.textContent = (user.department || '') + ' · Sem ' + (user.semester || '');

    // Load live data
    loadStudentFees();
    loadStudentNotices();
  }

  if (role === 'faculty') {
    const nameEl = document.querySelector('.faculty-sidebar .profile-name');
    const idEl   = document.querySelectorAll('.faculty-sidebar .profile-detail')[0];
    const deptEl = document.querySelectorAll('.faculty-sidebar .profile-detail')[1];
    if (nameEl) nameEl.textContent = user.name || 'Faculty';
    if (idEl)   idEl.textContent   = 'ID: ' + (user.facultyId || user.id);
    if (deptEl) deptEl.textContent = 'Dept: ' + (user.department || '');
  }

  if (role === 'admin') {
    loadAdminOverview();
  }
}

// ── LOGOUT ────────────────────────────────────────────────────
function handleLogout() {
  currentUser = null;
  localStorage.removeItem('kit_token');
  localStorage.removeItem('kit_user');
  showToast('You have been logged out securely.');
  setTimeout(() => navigateTo('home'), 400);
}

// ── Load student fees from backend ───────────────────────────
async function loadStudentFees() {
  const r = await apiFetch('/api/student/fees');
  if (!r?.ok) return;

  const fees     = r.data.fees || [];
  const card     = document.querySelector('#dash-fee .fee-status-card');
  if (!card) return;

  // Clear existing rows
  card.innerHTML = '';

  if (fees.length === 0) {
    card.innerHTML = '<div class="fsc-row"><span>No fee records found.</span></div>';
    return;
  }

  fees.forEach(fee => {
    const isPaid    = fee.status === 'paid';
    const isPending = fee.status === 'pending_verification';
    const row       = document.createElement('div');
    row.className   = 'fsc-row' + (isPaid ? '' : ' fsc-pending-row');
    row.innerHTML   = `
      <div class="fsc-left">
        <span class="fsc-label">${fee.feeName}</span>
        <span class="fsc-amount ${isPaid ? '' : 'fsc-due'}">
          ₹${fee.amount.toLocaleString('en-IN')}${isPaid ? '' : ' — ' + (isPending ? 'Pending Verification' : 'Due')}
        </span>
      </div>
      ${isPaid
        ? '<span class="paid">✔ Paid</span>'
        : isPending
          ? '<span style="color:var(--warning);font-weight:600">⏳ Verifying</span>'
          : `<button class="btn-pay-now" onclick="openQR('${fee.feeName}','${fee.amount}','${fee.id}')">
               <i class="fa fa-qrcode"></i> Pay Now
             </button>`
      }
    `;
    card.appendChild(row);
  });
}

// ── Load student notices ──────────────────────────────────────
async function loadStudentNotices() {
  const r = await apiFetch('/api/student/notices');
  if (!r?.ok) return;

  const notices = r.data.notices || [];
  const list    = document.querySelector('#dash-overview .mini-notices');
  if (!list || notices.length === 0) return;

  list.innerHTML = '';
  notices.slice(0, 4).forEach(n => {
    const colors = { urgent: 'red', important: 'orange', normal: 'blue' };
    const dot    = colors[n.priority] || 'blue';
    list.innerHTML += `
      <div class="mn-item">
        <span class="mn-dot ${dot}"></span>
        <p>${n.title}</p>
      </div>`;
  });
}

// ── Load admin overview stats ─────────────────────────────────
async function loadAdminOverview() {
  const r = await apiFetch('/api/admin/overview');
  if (!r?.ok) return;

  const t = r.data.totals || {};
  const setNum = (selector, val) => {
    const el = document.querySelector(selector);
    if (el) el.textContent = val ?? '—';
  };

  // Update stat cards in admin overview
  const cards = document.querySelectorAll('#adash-overview .sc-num');
  if (cards[0]) cards[0].textContent = (t.students  || 0).toLocaleString('en-IN');
  if (cards[1]) cards[1].textContent = (t.faculty   || 0).toLocaleString('en-IN');
  if (cards[2]) cards[2].textContent = t.departments || 5;
  if (cards[3]) cards[3].textContent = t.pendingPayments || 0;
}

// ── Contact form — real API call ──────────────────────────────
async function handleContactForm(e) {
  e.preventDefault();
  const form = e.target;
  const body = {
    name:       form.querySelector('input[placeholder*="name"], input[placeholder*="Name"]')?.value || '',
    email:      form.querySelector('input[type="email"]')?.value || '',
    subject:    form.querySelector('input[placeholder*="regarding"]')?.value || '',
    department: form.querySelector('select')?.value || '',
    message:    form.querySelector('textarea')?.value || '',
  };

  const r = await apiFetch('/api/public/contact', {
    method: 'POST',
    body:   JSON.stringify(body),
  });

  if (r?.ok) {
    showToast('Message sent! We will get back to you within 24 hours.');
    form.reset();
  } else {
    showToast(r?.data?.error || 'Failed to send. Please try again.');
  }
}

// ── Syllabus toggle ───────────────────────────────────────────
function toggleSyllabus(dept) {
  const panel  = document.getElementById('syl-' + dept);
  if (!panel) return;
  const isOpen = panel.classList.contains('active');
  document.querySelectorAll('.syllabus-panel').forEach(p => p.classList.remove('active'));
  if (!isOpen) { panel.classList.add('active'); panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

// ── Misc helpers ──────────────────────────────────────────────
function togglePwd(id) {
  const el = document.getElementById(id);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

function showToast(msg, duration = 3500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), duration);
}

function checkScrollShadow() {
  window.addEventListener('scroll', () => {
    const bar = document.getElementById('topbar');
    if (bar) bar.style.boxShadow = window.scrollY > 10
      ? '0 4px 24px rgba(26,60,110,0.18)'
      : '0 2px 16px rgba(26,60,110,0.10)';
  });
}

// ── Admin table filter ────────────────────────────────────────
function filterAdminTable() {
  const search = (document.getElementById('adminSearch')?.value     || '').toLowerCase().trim();
  const role   = (document.getElementById('adminRoleFilter')?.value || '').toLowerCase();
  const dept   = (document.getElementById('adminDeptFilter')?.value || '').toLowerCase();
  const year   = (document.getElementById('adminYearFilter')?.value || '');

  const rows = document.querySelectorAll('#adminTableBody tr');
  let visible = 0;

  rows.forEach(row => {
    const ok =
      (!search || (row.dataset.name || '').includes(search) || (row.dataset.id || '').includes(search)) &&
      (!role   || (row.dataset.role || '').toLowerCase() === role) &&
      (!dept   || (row.dataset.dept || '').toLowerCase() === dept) &&
      (!year   || row.dataset.year === year);
    row.style.display = ok ? '' : 'none';
    if (ok) visible++;
  });

  const noResults = document.getElementById('adminNoResults');
  const table     = document.getElementById('adminTable');
  const countEl   = document.getElementById('adminResultCount');
  if (noResults) noResults.style.display = visible === 0 ? 'block' : 'none';
  if (table)     table.style.display     = visible === 0 ? 'none'  : '';
  if (countEl)   countEl.textContent     = visible > 0 ? 'Showing ' + visible + ' record(s)' : '';
}

// ── QR Payment modal ──────────────────────────────────────────
function openQR(feeName, amount, feeId) {
  const modal = document.getElementById('qrModal');
  if (!modal) return;
  document.getElementById('qrTitle').textContent  = 'Pay — ' + feeName;
  document.getElementById('qrAmount').textContent = '₹' + Number(amount).toLocaleString('en-IN');
  // Store fee info for when user submits UPI ref
  modal.dataset.feeName = feeName;
  modal.dataset.amount  = amount;
  modal.dataset.feeId   = feeId || '';
  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeQR(event, force) {
  if (force || (event && event.target === document.getElementById('qrModal'))) {
    document.getElementById('qrModal')?.classList.remove('active');
    document.body.style.overflow = '';
  }
}

function copyUPI() {
  navigator.clipboard?.writeText('kit.fees@sbi')
    .then(()  => showToast('UPI ID copied!'))
    .catch(()  => showToast('UPI ID: kit.fees@sbi'));
}

// ── Student: switch semester tab ──────────────────────────────
function switchSem(n) {
  document.querySelectorAll('.sem-tab').forEach((t, i) => {
    t.classList.toggle('active', i + 1 === n);
  });
  for (let i = 1; i <= 8; i++) {
    const b = document.getElementById('sem-block-' + i);
    if (b) b.style.display = i === n ? '' : 'none';
  }
}

// ── Faculty: marks type hint ──────────────────────────────────
function toggleMarksType() {
  const type   = document.getElementById('fMarksType')?.value;
  const maxEl  = document.getElementById('fMarksMax');
  const hint   = document.getElementById('marksTypeHintText');
  const header = document.getElementById('marksColHeader');
  const hints  = {
    assign:   ['Assignment: any max — all assignments averaged to /10 per student.', 10, 'Marks (this assignment)'],
    internal: ['Internal: any max — all internal tests averaged to /10 per student.', 10, 'Marks (this internal)'],
    midsem:   ['Mid-Semester exam: max 20 marks.', 20, 'Mid-Sem Marks (/20)'],
    semester: ['Semester exam: max 60 marks. Entering this triggers SGPA calculation.', 60, 'Semester Marks (/60)'],
  };
  if (hints[type]) {
    if (hint)   hint.textContent   = hints[type][0];
    if (maxEl)  maxEl.value        = hints[type][1];
    if (header) header.textContent = hints[type][2];
    updateMarksMaxCells(hints[type][1]);
  }
  updateEffective();
}

function updateMarksMaxCells(max) {
  document.querySelectorAll('.marks-max-cell').forEach(c => c.textContent = max);
  document.querySelectorAll('.marks-input').forEach(inp => {
    inp.max = max;
    if (parseFloat(inp.value) > max) inp.value = max;
  });
}

document.addEventListener('input', e => {
  if (e.target.classList.contains('marks-input')) updateEffective();
});

function updateEffective() {
  const max    = parseFloat(document.getElementById('fMarksMax')?.value) || 10;
  const type   = document.getElementById('fMarksType')?.value;
  const inputs = [...document.querySelectorAll('#fMarksBody .marks-input')];
  const vals   = inputs.map(i => parseFloat(i.value) || 0);

  inputs.forEach((inp, idx) => {
    const cell = inp.closest('tr')?.querySelector('.marks-eff-cell');
    if (!cell) return;
    const v = vals[idx];
    if (type === 'assign' || type === 'internal') {
      const eff = max > 0 ? ((v / max) * 10).toFixed(1) : '0.0';
      cell.textContent = v + ' / ' + max + '  →  ' + eff + ' / 10';
    } else {
      cell.textContent = v + ' / ' + max;
    }
  });

  if (vals.length) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    const hi  = Math.max(...vals);
    const lo  = Math.min(...vals);
    const fmt = v => (type === 'assign' || type === 'internal')
      ? (max > 0 ? ((v / max) * 10).toFixed(1) : 0) + ' / 10'
      : v + ' / ' + max;
    const el = id => document.getElementById(id);
    if (el('classAvgVal'))  el('classAvgVal').textContent  = fmt(avg.toFixed(2));
    if (el('classHighVal')) el('classHighVal').textContent = fmt(hi);
    if (el('classLowVal'))  el('classLowVal').textContent  = fmt(lo);
  }
}

// ── Faculty: save marks to backend ───────────────────────────
async function saveFacultyMarks() {
  const course = document.getElementById('fMarksCourse');
  const sem    = document.getElementById('fMarksSem');
  const type   = document.getElementById('fMarksType');
  const label  = document.getElementById('fMarksExamLabel');
  const maxEl  = document.getElementById('fMarksMax');

  const records = [];
  document.querySelectorAll('#fMarksBody tr').forEach(row => {
    const inp = row.querySelector('.marks-input');
    if (!inp) return;
    records.push({
      rollNo:      row.dataset.roll || '',
      studentName: row.dataset.name || '',
      obtained:    parseFloat(inp.value) || 0,
    });
  });

  if (records.length === 0) { showToast('No student records to save.'); return; }

  const typeMap = { assign: 'assignment', internal: 'internal', midsem: 'midsem', semester: 'semester' };

  const payload = {
    subject:    course?.options[course.selectedIndex]?.text?.split(' — ')[0] || 'Unknown',
    semester:   parseInt(sem?.value) || 5,
    department: 'CSE',
    type:       typeMap[type?.value] || 'assignment',
    label:      label?.value || (type?.options[type.selectedIndex]?.text),
    maxMarks:   parseFloat(maxEl?.value) || 10,
    records,
  };

  const r = await apiFetch('/api/faculty/marks', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

  showToast(r?.ok ? '✔ Marks saved successfully!' : (r?.data?.error || 'Failed to save marks.'));
}

function resetFacultyMarks() {
  document.querySelectorAll('#fMarksBody .marks-input').forEach(i => i.value = '');
  updateEffective();
}
