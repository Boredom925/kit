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
    const nameEl = document.querySelector('.student-sidebar .profile-name');
    const rollEl = document.querySelectorAll('.student-sidebar .profile-detail')[0];
    const deptEl = document.querySelectorAll('.student-sidebar .profile-detail')[1];
    if (nameEl) nameEl.textContent = user.name || 'Student';
    if (rollEl) rollEl.textContent = 'Roll: ' + (user.rollNo || user.id);
    if (deptEl) deptEl.textContent = (user.department || '') + ' · Sem ' + (user.semester || '');

    // Populate profile form
    const pfName  = document.querySelector('#dash-profile input[type=\"text\"]');
    const pfEmail = document.querySelector('#dash-profile input[type=\"email\"]');
    const allInp  = document.querySelectorAll('#dash-profile input');
    if (allInp[0]) allInp[0].value = user.name          || '';
    if (allInp[1]) allInp[1].value = user.rollNo || user.id || '';
    if (allInp[2]) allInp[2].value = user.department    || '';
    if (allInp[3]) allInp[3].value = user.semester      || '';
    if (allInp[4]) allInp[4].value = user.mobile        || '';
    if (pfEmail)   pfEmail.value   = user.email         || '';

    loadStudentFees();
    loadStudentNotices();
    loadStudentAssignments();
    loadStudentMaterials();
    loadStudentMarks(user.semester || 5);
  }

  if (role === 'faculty') {
    const nameEl = document.querySelector('.faculty-sidebar .profile-name');
    const idEl   = document.querySelectorAll('.faculty-sidebar .profile-detail')[0];
    const deptEl = document.querySelectorAll('.faculty-sidebar .profile-detail')[1];
    if (nameEl) nameEl.textContent = user.name || 'Faculty';
    if (idEl)   idEl.textContent   = 'ID: ' + (user.facultyId || user.id);
    if (deptEl) deptEl.textContent = 'Dept: ' + (user.department || '');
    // Pre-load lists
    loadFacultyAssignments();
    loadFacultyMaterials();
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

// ═══════════════════════════════════════════════════════════════
// FACULTY — Create Assignment (real API)
// ═══════════════════════════════════════════════════════════════

async function createAssignment() {
  const form = document.getElementById('assignmentForm');
  if (!form) return;

  const course  = document.getElementById('asgn-course');
  const title   = document.getElementById('asgn-title');
  const desc    = document.getElementById('asgn-desc');
  const due     = document.getElementById('asgn-due');
  const marks   = document.getElementById('asgn-marks');
  const sem     = document.getElementById('asgn-sem');

  // Parse subject and department from course dropdown
  // e.g. "Machine Learning — CSE"
  const courseText = course?.options[course.selectedIndex]?.text || '';
  const [subject, dept] = courseText.includes('—')
    ? courseText.split('—').map(s => s.trim())
    : [courseText, 'CSE'];

  if (!title?.value || !due?.value) {
    showToast('Please fill in title and due date.');
    return;
  }

  const user = JSON.parse(localStorage.getItem('kit_user') || '{}');

  const payload = {
    title:       title.value.trim(),
    subject:     subject || 'General',
    semester:    parseInt(sem?.value) || 5,
    department:  dept || user.department || 'CSE',
    description: desc?.value?.trim() || '',
    dueDate:     due.value,
    maxMarks:    parseFloat(marks?.value) || 10,
  };

  const r = await apiFetch('/api/faculty/assignments', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

  if (r?.ok) {
    showToast('✔ Assignment created successfully!');
    // Clear form
    if (title) title.value = '';
    if (desc)  desc.value  = '';
    if (due)   due.value   = '';
    // Refresh list
    loadFacultyAssignments();
  } else {
    showToast(r?.data?.error || 'Failed to create assignment.');
  }
}

// Load and display faculty's assignments
async function loadFacultyAssignments() {
  const user = JSON.parse(localStorage.getItem('kit_user') || '{}');
  const r    = await apiFetch('/api/faculty/assignments?department=' + (user.department || 'CSE'));
  if (!r?.ok) return;

  const list = document.getElementById('facultyAssignmentList');
  if (!list) return;

  const items = r.data.assignments || [];
  if (items.length === 0) {
    list.innerHTML = '<p style="color:var(--text-light);font-size:0.88rem;">No assignments created yet.</p>';
    return;
  }

  list.innerHTML = items.map(a => `
    <div class="asgn-card" style="margin-bottom:0.8rem;">
      <div class="asgn-info">
        <h5>${a.subject} — ${a.title}</h5>
        <p>${a.description || ''}</p>
        <span class="asgn-due"><i class="fa fa-clock"></i> Due: ${a.dueDate} &nbsp;|&nbsp; Max: ${a.maxMarks} marks &nbsp;|&nbsp; Sem ${a.semester}</span>
      </div>
      <div class="asgn-action">
        <span class="badge submitted">Active</span>
        <button class="btn-sm danger" onclick="deleteAssignment('${a.id}')">Delete</button>
      </div>
    </div>`).join('');
}

async function deleteAssignment(id) {
  if (!confirm('Delete this assignment?')) return;
  const r = await apiFetch('/api/faculty/assignments/' + id, { method: 'DELETE' });
  showToast(r?.ok ? 'Assignment deleted.' : 'Failed to delete.');
  if (r?.ok) loadFacultyAssignments();
}

// ═══════════════════════════════════════════════════════════════
// FACULTY — Upload Material (real API)
// ═══════════════════════════════════════════════════════════════

async function uploadMaterial() {
  const titleEl   = document.getElementById('mat-title');
  const subjectEl = document.getElementById('mat-subject');
  const typeEl    = document.getElementById('mat-type');
  const linkEl    = document.getElementById('mat-link');
  const descEl    = document.getElementById('mat-desc');
  const semEl     = document.getElementById('mat-sem');

  if (!titleEl?.value) { showToast('Please enter a material title.'); return; }

  const user = JSON.parse(localStorage.getItem('kit_user') || '{}');

  // Parse subject/dept from dropdown  e.g. "Machine Learning (CSE)"
  const subjectText = subjectEl?.options[subjectEl.selectedIndex]?.text || '';
  const subMatch    = subjectText.match(/^(.+?)\s*\((\w+)\)$/);
  const subject     = subMatch ? subMatch[1].trim() : subjectText;
  const dept        = subMatch ? subMatch[2] : (user.department || 'CSE');

  const typeMap = {
    'Lecture Notes': 'notes',
    'Assignment':    'assignment',
    'Reference Book':'reference',
    'Video':         'video',
    'Slides':        'slides',
  };
  const rawType = typeEl?.options[typeEl.selectedIndex]?.text || 'Lecture Notes';

  const payload = {
    title:       titleEl.value.trim(),
    subject:     subject || 'General',
    semester:    parseInt(semEl?.value) || 5,
    department:  dept,
    type:        typeMap[rawType] || 'notes',
    fileUrl:     linkEl?.value?.trim() || '',
    description: descEl?.value?.trim() || '',
    fileName:    titleEl.value.trim(),
  };

  const r = await apiFetch('/api/faculty/materials', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

  if (r?.ok) {
    showToast('✔ Material uploaded successfully!');
    if (titleEl) titleEl.value = '';
    if (linkEl)  linkEl.value  = '';
    if (descEl)  descEl.value  = '';
    loadFacultyMaterials();
  } else {
    showToast(r?.data?.error || 'Failed to upload material.');
  }
}

async function loadFacultyMaterials() {
  const user = JSON.parse(localStorage.getItem('kit_user') || '{}');
  const r    = await apiFetch('/api/faculty/materials?department=' + (user.department || 'CSE'));
  if (!r?.ok) return;

  const list  = document.getElementById('facultyMaterialList');
  if (!list) return;

  const items = r.data.materials || [];
  if (items.length === 0) {
    list.innerHTML = '<p style="color:var(--text-light);font-size:0.88rem;">No materials uploaded yet.</p>';
    return;
  }

  const icons = { notes:'fa-file-pdf', slides:'fa-file-powerpoint', video:'fa-file-video', reference:'fa-book', assignment:'fa-tasks', other:'fa-file' };

  list.innerHTML = items.map(m => `
    <div class="mat-card">
      <i class="fa ${icons[m.type] || 'fa-file'}"></i>
      <div>
        <h5>${m.title}</h5>
        <p>${m.subject} · Sem ${m.semester} · ${m.uploadedByName || ''}</p>
        ${m.fileUrl ? `<a href="${m.fileUrl}" target="_blank" style="font-size:0.78rem;color:var(--navy-light);">Open Link ↗</a>` : ''}
      </div>
      <button class="btn-sm danger" onclick="deleteMaterial('${m.id}')"><i class="fa fa-trash"></i></button>
    </div>`).join('');
}

async function deleteMaterial(id) {
  if (!confirm('Delete this material?')) return;
  const r = await apiFetch('/api/faculty/materials/' + id, { method: 'DELETE' });
  showToast(r?.ok ? 'Material deleted.' : 'Failed to delete.');
  if (r?.ok) loadFacultyMaterials();
}

// ═══════════════════════════════════════════════════════════════
// ADMIN — Edit Account Modal
// ═══════════════════════════════════════════════════════════════

function openEditModal(id, role) {
  // Build a simple inline modal
  const existing = document.getElementById('adminEditModal');
  if (existing) existing.remove();

  // Find row data
  const row    = document.querySelector(`#adminTableBody tr[data-id="${id.toLowerCase()}"]`);
  const name   = row?.children[1]?.textContent || '';
  const dept   = row?.dataset.dept || '';
  const year   = row?.dataset.year || '';
  const status = row?.children[5]?.querySelector('.badge')?.textContent?.trim()?.toLowerCase() || 'active';

  const modal = document.createElement('div');
  modal.id    = 'adminEditModal';
  modal.style.cssText = `
    position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9100;
    display:flex;align-items:center;justify-content:center;`;

  modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:2rem;width:92%;max-width:440px;box-shadow:0 24px 80px rgba(0,0,0,0.3);position:relative;">
      <button onclick="document.getElementById('adminEditModal').remove()"
        style="position:absolute;top:1rem;right:1rem;background:var(--off-white);border:1px solid var(--border);
               width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:1rem;">✕</button>
      <h3 style="font-family:var(--font-display);color:var(--navy-dark);margin-bottom:1.4rem;">
        Edit Account — ${id.toUpperCase()}
      </h3>
      <div class="form-group" style="margin-bottom:0.9rem;">
        <label style="font-size:0.82rem;font-weight:700;color:var(--text-light);">Full Name</label>
        <input id="edit-name" type="text" value="${name}"
          style="width:100%;padding:0.6rem 0.9rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);margin-top:0.3rem;"/>
      </div>
      <div class="form-group" style="margin-bottom:0.9rem;">
        <label style="font-size:0.82rem;font-weight:700;color:var(--text-light);">Department</label>
        <select id="edit-dept"
          style="width:100%;padding:0.6rem 0.9rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);margin-top:0.3rem;">
          ${['CSE','EE','ME','CE','BT'].map(d => `<option ${d===dept?'selected':''}>${d}</option>`).join('')}
        </select>
      </div>
      ${role === 'Student' ? `
      <div class="form-group" style="margin-bottom:0.9rem;">
        <label style="font-size:0.82rem;font-weight:700;color:var(--text-light);">Year</label>
        <select id="edit-year"
          style="width:100%;padding:0.6rem 0.9rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);margin-top:0.3rem;">
          ${[1,2,3,4].map(y => `<option value="${y}" ${String(y)===year?'selected':''}>Year ${y}</option>`).join('')}
        </select>
      </div>` : ''}
      <div class="form-group" style="margin-bottom:0.9rem;">
        <label style="font-size:0.82rem;font-weight:700;color:var(--text-light);">Status</label>
        <select id="edit-status"
          style="width:100%;padding:0.6rem 0.9rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);margin-top:0.3rem;">
          <option value="active"   ${status==='active'  ?'selected':''}>Active</option>
          <option value="inactive" ${status==='inactive'?'selected':''}>Inactive</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:1.2rem;">
        <label style="font-size:0.82rem;font-weight:700;color:var(--text-light);">New Password <span style="font-weight:400;color:var(--text-light)">(leave blank to keep current)</span></label>
        <input id="edit-password" type="password" placeholder="New password (min 8 chars)"
          style="width:100%;padding:0.6rem 0.9rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);margin-top:0.3rem;"/>
      </div>
      <div style="display:flex;gap:0.8rem;">
        <button onclick="saveEditAccount('${id}','${role}')"
          style="flex:1;background:var(--navy);color:white;border:none;padding:0.7rem;border-radius:8px;font-size:0.9rem;font-weight:600;cursor:pointer;font-family:var(--font-body);">
          Save Changes
        </button>
        <button onclick="document.getElementById('adminEditModal').remove()"
          style="flex:1;background:var(--off-white);color:var(--text-mid);border:1px solid var(--border);padding:0.7rem;border-radius:8px;font-size:0.9rem;cursor:pointer;font-family:var(--font-body);">
          Cancel
        </button>
      </div>
    </div>`;

  document.body.appendChild(modal);
}

async function saveEditAccount(id, role) {
  const name     = document.getElementById('edit-name')?.value?.trim();
  const dept     = document.getElementById('edit-dept')?.value;
  const year     = document.getElementById('edit-year')?.value;
  const status   = document.getElementById('edit-status')?.value;
  const password = document.getElementById('edit-password')?.value;

  const updates = { name, department: dept, status };
  if (year)     updates.year = parseInt(year);
  if (password && password.length >= 8) updates.password = password;
  else if (password && password.length > 0) {
    showToast('Password must be at least 8 characters.'); return;
  }

  const endpoint = role === 'Faculty'
    ? `/api/admin/faculty/${id}`
    : `/api/admin/students/${id}`;

  const r = await apiFetch(endpoint, {
    method: 'PATCH',
    body:   JSON.stringify(updates),
  });

  if (r?.ok) {
    showToast('✔ Account updated successfully!');
    document.getElementById('adminEditModal')?.remove();
    // Update the table row live
    const row = document.querySelector(`#adminTableBody tr[data-id="${id.toLowerCase()}"]`);
    if (row) {
      row.children[1].textContent = name;
      row.children[3].textContent = dept;
      if (year && row.children[4]) row.children[4].textContent = 'Year ' + year;
      const badge = row.children[5]?.querySelector('.badge');
      if (badge) {
        badge.textContent = status === 'active' ? 'Active' : 'Inactive';
        badge.className   = 'badge ' + (status === 'active' ? 'submitted' : 'pending');
      }
      // Update data attrs for filter
      row.dataset.dept = dept;
      if (year) row.dataset.year = year;
    }
  } else {
    showToast(r?.data?.error || 'Failed to update account.');
  }
}

async function deleteAccount(id, role) {
  if (!confirm(`Delete account ${id}? This cannot be undone.`)) return;

  const endpoint = role === 'Faculty'
    ? `/api/admin/faculty/${id}`
    : `/api/admin/students/${id}`;

  const r = await apiFetch(endpoint, { method: 'DELETE' });

  if (r?.ok) {
    showToast('Account deleted.');
    const row = document.querySelector(`#adminTableBody tr[data-id="${id.toLowerCase()}"]`);
    if (row) row.remove();
  } else {
    showToast(r?.data?.error || 'Failed to delete.');
  }
}

// ═══════════════════════════════════════════════════════════════
// ADMIN — Post Notice (real API)
// ═══════════════════════════════════════════════════════════════

async function postNotice() {
  const title    = document.querySelector('#adash-notices input[placeholder="Notice title..."]');
  const audience = document.querySelectorAll('#adash-notices select')[0];
  const priority = document.querySelectorAll('#adash-notices select')[1];
  const content  = document.querySelector('#adash-notices textarea');

  if (!title?.value || !content?.value) {
    showToast('Please fill in title and content.');
    return;
  }

  const audMap = {
    'All Users':          'all',
    'Students Only':      'students',
    'Faculty Only':       'faculty',
    'Specific Department':'department',
  };
  const priMap = { 'Normal':'normal', 'Important':'important', 'Urgent':'urgent' };

  const payload = {
    title:    title.value.trim(),
    content:  content.value.trim(),
    audience: audMap[audience?.options[audience.selectedIndex]?.text] || 'all',
    priority: priMap[priority?.options[priority.selectedIndex]?.text] || 'normal',
    active:   true,
  };

  const r = await apiFetch('/api/admin/notices', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

  if (r?.ok) {
    showToast('✔ Notice published!');
    if (title)   title.value   = '';
    if (content) content.value = '';
  } else {
    showToast(r?.data?.error || 'Failed to post notice.');
  }
}

// ═══════════════════════════════════════════════════════════════
// ADMIN — Save System Settings (real API)
// ═══════════════════════════════════════════════════════════════

async function saveSystemSettings() {
  const settings = {
    studentPortalAccess:  document.getElementById('tog1')?.checked ?? true,
    facultyPortalAccess:  document.getElementById('tog2')?.checked ?? true,
    onlineFeePayment:     document.getElementById('tog3')?.checked ?? true,
    assignmentSubmission: document.getElementById('tog4')?.checked ?? true,
    maintenanceMode:      document.getElementById('tog5')?.checked ?? false,
    emailNotifications:   document.getElementById('tog6')?.checked ?? true,
  };

  const r = await apiFetch('/api/admin/settings', {
    method: 'PUT',
    body:   JSON.stringify(settings),
  });

  showToast(r?.ok ? '✔ Settings saved!' : (r?.data?.error || 'Failed to save.'));
}

// ═══════════════════════════════════════════════════════════════
// STUDENT — Load marks per department/semester from API
// ═══════════════════════════════════════════════════════════════

async function loadStudentMarks(semester) {
  const sem = semester || 5;
  const r   = await apiFetch(`/api/student/marks?semester=${sem}`);
  if (!r?.ok) return;

  const semData  = r.data.marks?.[sem] || {};
  const subjects = semData.subjects || {};
  const tbody    = document.querySelector(`#marks-table-${sem} tbody`);
  if (!tbody) return;

  const entries = Object.entries(subjects);
  if (entries.length === 0) return;

  tbody.innerHTML = entries.map(([subj, d]) => {
    const gradeClass = d.grade === 'A+' || d.grade === 'A' ? 'grade-a' : 'grade-b';
    return `<tr>
      <td>${subj}</td>
      <td>${d.assignmentAvg ?? '—'}</td>
      <td>${d.internalAvg  ?? '—'}</td>
      <td>${d.midSem       ?? '—'}</td>
      <td>${d.semesterExam ?? '—'}</td>
      <td>${d.total        ?? '—'}</td>
      <td class="${gradeClass}">${d.grade ?? '—'}</td>
    </tr>`;
  }).join('');

  // Update SGPA
  const sgpaEl = document.querySelector(`#sem-block-${sem} .cgpa-display`);
  if (sgpaEl) {
    const sgpa = semData.sgpa;
    sgpaEl.innerHTML = sgpa !== null
      ? `Sem ${sem} SGPA: <strong>${sgpa} / 10.0</strong>`
      : `Sem ${sem} SGPA: <strong style="color:var(--warning)">Pending semester results</strong>`;
  }

  // Update overall CGPA box
  if (r.data.cgpa !== null) {
    const cgpaRows = document.querySelectorAll('#cgpaOverallBox .cgpa-total-row .cgpa-val');
    cgpaRows.forEach(el => {
      el.innerHTML = `<strong>${r.data.cgpa} / 10.0</strong>`;
    });
  }
}

// ═══════════════════════════════════════════════════════════════
// STUDENT — Load assignments filtered by own dept/semester
// ═══════════════════════════════════════════════════════════════

async function loadStudentAssignments() {
  const user = JSON.parse(localStorage.getItem('kit_user') || '{}');
  const sem  = user.semester || 5;
  const r    = await apiFetch(`/api/student/assignments?semester=${sem}`);
  if (!r?.ok) return;

  const list  = document.querySelector('#dash-assignments .assignment-list');
  if (!list) return;

  const items = r.data.assignments || [];
  if (items.length === 0) {
    list.innerHTML = `<div style="color:var(--text-light);padding:1rem;">No assignments yet for Semester ${sem}.</div>`;
    return;
  }

  const now = new Date();
  list.innerHTML = items.map(a => {
    const isPast = new Date(a.dueDate) < now;
    const cls    = isPast ? 'graded' : 'pending';
    return `
      <div class="asgn-card ${cls}">
        <div class="asgn-info">
          <h5>${a.subject} — ${a.title}</h5>
          <p>${a.description || ''}</p>
          <span class="asgn-due">
            <i class="fa fa-clock"></i> Due: ${a.dueDate}
            &nbsp;|&nbsp; Max: ${a.maxMarks} marks
          </span>
        </div>
        <div class="asgn-action">
          <span class="badge ${isPast ? 'graded' : 'pending'}">${isPast ? 'Closed' : 'Pending'}</span>
        </div>
      </div>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════════
// STUDENT — Load materials filtered by own dept/semester
// ═══════════════════════════════════════════════════════════════

async function loadStudentMaterials() {
  const user = JSON.parse(localStorage.getItem('kit_user') || '{}');
  const sem  = user.semester || 5;
  const r    = await apiFetch(`/api/student/materials?semester=${sem}`);
  if (!r?.ok) return;

  const grid = document.querySelector('#dash-materials .material-grid');
  if (!grid) return;

  const items = r.data.materials || [];
  if (items.length === 0) {
    grid.innerHTML = `<div style="color:var(--text-light);padding:1rem;">No materials uploaded yet for Semester ${sem}.</div>`;
    return;
  }

  const icons = { notes:'fa-file-pdf', slides:'fa-file-powerpoint', video:'fa-file-video', reference:'fa-book', assignment:'fa-tasks', other:'fa-file' };

  grid.innerHTML = items.map(m => `
    <div class="mat-card">
      <i class="fa ${icons[m.type] || 'fa-file'}"></i>
      <div>
        <h5>${m.title}</h5>
        <p>${m.uploadedByName || ''} · ${m.uploadedAt?.slice(0,10) || ''}</p>
      </div>
      ${m.fileUrl
        ? `<a href="${m.fileUrl}" target="_blank" class="btn-sm"><i class="fa fa-download"></i></a>`
        : `<button class="btn-sm" disabled><i class="fa fa-download"></i></button>`}
    </div>`).join('');
}

// ═══════════════════════════════════════════════════════════════
// FACULTY — Save Attendance (real API)
// ═══════════════════════════════════════════════════════════════

async function saveFacultyAttendance() {
  const courseEl = document.querySelector('#fdash-attendance select');
  const dateEl   = document.querySelector('#fdash-attendance input[type="date"]');

  if (!dateEl?.value) { showToast('Please select a date.'); return; }

  const courseText = courseEl?.options[courseEl.selectedIndex]?.text || '';
  // e.g. "Machine Learning — CSE 5A"
  const subject    = courseText.split('—')[0].trim() || courseText;

  // Parse dept from course text — look for known dept codes
  const deptMatch  = courseText.match(/\b(CSE|EE|ME|CE|BT)\b/);
  const department = deptMatch ? deptMatch[1] : 'CSE';

  // Parse semester from course text — look for number after dept
  const semMatch = courseText.match(/[A-Z]+\s*(\d)/);
  const semester = semMatch ? parseInt(semMatch[1]) : 5;

  // Collect all attendance radio values
  const records = [];
  document.querySelectorAll('#fdash-attendance .att-table tbody tr').forEach(row => {
    const rollTd = row.children[0];
    const nameTd = row.children[1];
    if (!rollTd || !nameTd) return;

    const rollNo      = rollTd.textContent.trim();
    const studentName = nameTd.textContent.trim();
    if (!rollNo || rollNo === 'Roll No.') return;

    // Find which radio is checked (P / A / L)
    const checked = row.querySelector('input[type="radio"]:checked');
    const status  = checked ? checked.value : 'P';

    records.push({ rollNo, studentName, status });
  });

  if (records.length === 0) { showToast('No student records found.'); return; }

  const payload = {
    subject,
    semester,
    department,
    date:    dateEl.value,
    records,
  };

  const r = await apiFetch('/api/faculty/attendance', {
    method: 'POST',
    body:   JSON.stringify(payload),
  });

  showToast(r?.ok
    ? `✔ Attendance saved for ${records.length} students!`
    : (r?.data?.error || 'Failed to save attendance.'));
}

// ═══════════════════════════════════════════════════════════════
// STUDENT — Update Profile (real API)
// ═══════════════════════════════════════════════════════════════

async function updateStudentProfile() {
  const allInp  = document.querySelectorAll('#dash-profile input');
  const pfEmail = document.querySelector('#dash-profile input[type="email"]');
  const pfAddr  = document.querySelector('#dash-profile textarea');

  const updates = {};
  if (allInp[4]?.value) updates.mobile  = allInp[4].value.trim();
  if (pfEmail?.value)   updates.email   = pfEmail.value.trim();
  if (pfAddr?.value)    updates.address = pfAddr.value.trim();

  if (Object.keys(updates).length === 0) {
    showToast('Nothing to update.');
    return;
  }

  const r = await apiFetch('/api/student/profile', {
    method: 'PATCH',
    body:   JSON.stringify(updates),
  });

  showToast(r?.ok ? '✔ Profile updated!' : (r?.data?.error || 'Failed to update profile.'));
}
