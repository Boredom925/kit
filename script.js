/* ============================================================
   KIT — Kolkata Institute of Technology
   JavaScript · Navigation, dashboards, interactions
   ============================================================ */
const API = 'https://kit-backend.vercel.app';  // Vercel backend URL
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

// ── Auth ──────────────────────────────────────────────────────
async function handleLogin(e, role) {
  e.preventDefault();
  const form    = e.target;
  const id      = form.querySelector('input[type="text"]').value.trim();
  const pwd     = form.querySelector('input[type="password"]').value;
  const secCode = role === 'admin'
    ? (form.querySelector('input[placeholder*="security"]')?.value || '')
    : undefined;

  showToast('Logging in...');

  try {
    const res  = await fetch(`${API}/api/auth/login`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id, password: pwd, role, securityCode: secCode }),
    });
    const data = await res.json();
    if (!res.ok) { showToast(data.error || 'Login failed.'); return; }

    localStorage.setItem('kit_token', data.token);
    localStorage.setItem('kit_user',  JSON.stringify(data.user));
    currentUser = role;

    const dashMap = {
      student: 'student-dashboard',
      faculty: 'faculty-dashboard',
      admin:   'admin-dashboard'
    };
    navigateTo(dashMap[role]);
    showToast('Welcome, ' + data.user.name + '!');
  } catch {
    showToast('Connection error. Please try again.');
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('kit_token');
  localStorage.removeItem('kit_user');
  showToast('You have been logged out securely.');
  setTimeout(() => navigateTo('home'), 400);
}

// ── Syllabus toggle ───────────────────────────────────────────
function toggleSyllabus(dept) {
  const panel  = document.getElementById('syl-' + dept);
  if (!panel) return;
  const isOpen = panel.classList.contains('active');
  document.querySelectorAll('.syllabus-panel').forEach(p => p.classList.remove('active'));
  if (!isOpen) { panel.classList.add('active'); panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

// ── Misc ──────────────────────────────────────────────────────
function togglePwd(id) {
  const el = document.getElementById(id);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

function handleContactForm(e) {
  e.preventDefault();
  showToast('Message sent! We will get back to you within 24 hours.');
  e.target.reset();
}

function showToast(msg, duration = 3000) {
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

  const rows = document.querySelectorAll('#adminTableBody tr');
  let visible = 0;

  rows.forEach(row => {
    const ok =
      (!search || row.dataset.name.includes(search) || row.dataset.id.includes(search)) &&
      (!role   || row.dataset.role.toLowerCase() === role) &&
      (!dept   || row.dataset.dept.toLowerCase() === dept);
    row.style.display = ok ? '' : 'none';
    if (ok) visible++;
  });

  document.getElementById('adminNoResults').style.display = visible === 0 ? 'block' : 'none';
  document.getElementById('adminTable').style.display     = visible === 0 ? 'none'  : '';
  const c = document.getElementById('adminResultCount');
  if (c) c.textContent = visible > 0 ? 'Showing ' + visible + ' record(s)' : '';
}

// ── QR Payment modal ──────────────────────────────────────────
function openQR(feeName, amount) {
  const modal = document.getElementById('qrModal');
  if (!modal) return;
  document.getElementById('qrTitle').textContent  = 'Pay — ' + feeName;
  document.getElementById('qrAmount').textContent = '\u20B9' + amount;
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

// ── Student: switch semester tab in marks panel ───────────────
function switchSem(n) {
  document.querySelectorAll('.sem-tab').forEach((t, i) => {
    t.classList.toggle('active', i + 1 === n);
  });
  for (let i = 1; i <= 8; i++) {
    const b = document.getElementById('sem-block-' + i);
    if (b) b.style.display = i === n ? '' : 'none';
  }
}

// ── Faculty: marks type hint + max auto-set ───────────────────
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

// ── Faculty: live effective & stats update ────────────────────
document.addEventListener('input', e => {
  if (e.target.classList.contains('marks-input')) updateEffective();
});

function updateEffective() {
  const max     = parseFloat(document.getElementById('fMarksMax')?.value) || 10;
  const type    = document.getElementById('fMarksType')?.value;
  const inputs  = [...document.querySelectorAll('#fMarksBody .marks-input')];
  const vals    = inputs.map(i => parseFloat(i.value) || 0);

  inputs.forEach((inp, idx) => {
    const cell = inp.closest('tr')?.querySelector('.marks-eff-cell');
    if (!cell) return;
    const v = vals[idx];
    // For assignment/internal: show "v/max → avg contribution"
    // For midsem/semester: just show v/max
    if (type === 'assign' || type === 'internal') {
      const eff = max > 0 ? ((v / max) * 10).toFixed(1) : '0.0';
      cell.textContent = v + ' / ' + max + '  →  ' + eff + ' / 10';
    } else {
      cell.textContent = v + ' / ' + max;
    }
  });

  // Stats
  if (vals.length) {
    const avg = (vals.reduce((a, b) => a + b, 0) / vals.length);
    const hi  = Math.max(...vals);
    const lo  = Math.min(...vals);
    const fmtEff = v => type === 'assign' || type === 'internal'
      ? (max > 0 ? ((v / max) * 10).toFixed(1) : 0) + ' / 10'
      : v + ' / ' + max;
    const el = id => document.getElementById(id);
    if (el('classAvgVal')) el('classAvgVal').textContent = fmtEff(avg.toFixed(2));
    if (el('classHighVal')) el('classHighVal').textContent = fmtEff(hi);
    if (el('classLowVal'))  el('classLowVal').textContent  = fmtEff(lo);
  }
}

function saveFacultyMarks() {
  const course = document.getElementById('fMarksCourse')?.options[document.getElementById('fMarksCourse').selectedIndex]?.text || 'Course';
  const sem    = document.getElementById('fMarksSem')?.value || '?';
  const type   = document.getElementById('fMarksType')?.options[document.getElementById('fMarksType').selectedIndex]?.text || 'Marks';
  const label  = document.getElementById('fMarksExamLabel')?.value || type;
  showToast('✔ ' + label + ' marks saved for ' + course + ' (Sem ' + sem + ')');
}

function resetFacultyMarks() {
  document.querySelectorAll('#fMarksBody .marks-input').forEach(i => i.value = '');
  updateEffective();
}

// ── Admin: year filter (extend existing filterAdminTable) ─────
// Override filterAdminTable to also handle year
const _origFilterAdmin = filterAdminTable;
filterAdminTable = function () {
  const search     = (document.getElementById('adminSearch')?.value     || '').toLowerCase().trim();
  const role       = (document.getElementById('adminRoleFilter')?.value || '').toLowerCase();
  const dept       = (document.getElementById('adminDeptFilter')?.value || '').toLowerCase();
  const year       = (document.getElementById('adminYearFilter')?.value || '');

  const rows = document.querySelectorAll('#adminTableBody tr');
  let visible = 0;

  rows.forEach(row => {
    const ok =
      (!search || row.dataset.name.includes(search) || row.dataset.id.includes(search)) &&
      (!role   || row.dataset.role.toLowerCase() === role) &&
      (!dept   || row.dataset.dept.toLowerCase() === dept) &&
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
};
