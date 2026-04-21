/* ============================================================
   KIT — Kolkata Institute of Technology
   script.js  —  Full frontend logic + API integration
   ============================================================ */

const API = 'https://kit-backend.vercel.app';

// ── State ────────────────────────────────────────────────────
let currentPage = 'home';
let currentUser = null;   // 'student' | 'faculty' | 'admin'

const facilitySubPages = {
  canteen:'canteen-tab', transport:'transport-tab',
  hostel:'hostel-tab',   library:'library-tab'
};

// ── DOM Ready ─────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initNav();
  initDashboardNav();
  initProgramTabs();
  initFacilityTabs();
  setDate();
  checkScrollShadow();
  restoreSession();
});

// ── Date ──────────────────────────────────────────────────────
function setDate() {
  const str = new Date().toLocaleDateString('en-IN',
    { weekday:'long', year:'numeric', month:'long', day:'numeric' });
  ['dashDate','fdashDate','adashDate'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = str;
  });
}

// ── Session restore on page reload ───────────────────────────
function restoreSession() {
  const token = localStorage.getItem('kit_token');
  const raw   = localStorage.getItem('kit_user');
  if (!token || !raw) return;
  try {
    const user  = JSON.parse(raw);
    currentUser = user.role;
  } catch {
    localStorage.removeItem('kit_token');
    localStorage.removeItem('kit_user');
  }
}

// ── Authenticated fetch ───────────────────────────────────────
async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('kit_token');
  if (!token) {
    showToast('Session expired. Please log in again.');
    handleLogout();
    return null;
  }
  try {
    const res  = await fetch(API + path, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
        ...(options.headers || {}),
      },
    });
    const data = await res.json();
    if (res.status === 401) { handleLogout(); return null; }
    return { ok: res.ok, status: res.status, data };
  } catch {
    showToast('Network error. Check your connection.');
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION
// ═══════════════════════════════════════════════════════════════

function navigateTo(page) {
  if (page === 'login') return;

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

  if (page === 'student-dashboard' && currentUser !== 'student') { _showPage('student-login'); return; }
  if (page === 'faculty-dashboard' && currentUser !== 'faculty') { _showPage('faculty-login'); return; }
  if (page === 'admin-dashboard'   && currentUser !== 'admin')   { _showPage('admin-login');   return; }

  _showPage(page);
}

function _showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) { el.classList.add('active'); currentPage = page; window.scrollTo({ top:0, behavior:'smooth' }); }
  document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
  const match = document.querySelector('.nav-link[data-page="' + page.split('-')[0] + '"]');
  if (match) match.classList.add('active');
  document.getElementById('mainNav')?.classList.remove('open');
}

function initNav() {
  document.querySelectorAll('[data-page]').forEach(el => {
    el.addEventListener('click', e => { e.preventDefault(); navigateTo(el.dataset.page); });
  });
  const ham = document.getElementById('hamburger');
  const nav = document.getElementById('mainNav');
  if (ham) ham.addEventListener('click', () => nav?.classList.toggle('open'));
  document.addEventListener('click', e => { if (!e.target.closest('.topbar')) nav?.classList.remove('open'); });
}

function initDashboardNav() {
  [
    ['.student-sidebar .sb-link[data-dash]','#page-student-dashboard .dash-panel','.student-sidebar .sb-link'],
    ['.faculty-sidebar .sb-link[data-dash]','#page-faculty-dashboard .dash-panel','.faculty-sidebar .sb-link'],
    ['.admin-sidebar .sb-link[data-dash]',  '#page-admin-dashboard .dash-panel',  '.admin-sidebar .sb-link'],
  ].forEach(([links, panels, all]) => {
    document.querySelectorAll(links).forEach(link => {
      link.addEventListener('click', e => {
        e.preventDefault();
        document.querySelectorAll(all).forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        document.querySelectorAll(panels).forEach(p => p.classList.remove('active'));
        document.getElementById(link.dataset.dash)?.classList.add('active');
      });
    });
  });
}

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

// ═══════════════════════════════════════════════════════════════
// AUTH — LOGIN / LOGOUT
// ═══════════════════════════════════════════════════════════════

async function handleLogin(e, role) {
  e.preventDefault();
  const form       = e.target;
  const textInputs = [...form.querySelectorAll('input[type="text"]')];
  const pwdInput   = form.querySelector('input[type="password"]');

  if (!textInputs[0] || !pwdInput) { showToast('Form error. Please refresh.'); return; }

  const id       = textInputs[0].value.trim();
  const password = pwdInput.value;
  const securityCode = role === 'admin' ? (textInputs[1]?.value?.trim() || '') : undefined;

  if (!id || !password) { showToast('Please enter your ID and password.'); return; }

  const btn = form.querySelector('button[type="submit"]');
  if (btn) { btn.disabled = true; btn.textContent = 'Logging in...'; }
  showToast('Logging in...');

  try {
    const res  = await fetch(API + '/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, password, role, securityCode }),
    });
    const data = await res.json();

    if (!res.ok) {
      showToast(data.error || 'Login failed.');
      if (btn) { btn.disabled = false; btn.textContent = 'Login to Portal'; }
      return;
    }

    // Attach role to user object so it's always available
    const userWithRole = { ...data.user, role };
    localStorage.setItem('kit_token', data.token);
    localStorage.setItem('kit_user',  JSON.stringify(userWithRole));
    currentUser = role;

    showToast('Welcome, ' + data.user.name + '!');
    setTimeout(() => {
      const dash = { student:'student-dashboard', faculty:'faculty-dashboard', admin:'admin-dashboard' };
      _showPage(dash[role]);   // bypass auth guard — we just logged in
      populateDashboard(role, userWithRole);
    }, 500);

  } catch {
    showToast('Connection error. Is the backend reachable?');
    if (btn) { btn.disabled = false; btn.textContent = 'Login to Portal'; }
  }
}

function handleLogout() {
  currentUser = null;
  localStorage.removeItem('kit_token');
  localStorage.removeItem('kit_user');
  showToast('Logged out securely.');
  setTimeout(() => navigateTo('home'), 400);
}

// ── Populate dashboard after login ───────────────────────────
function populateDashboard(role, user) {
  if (role === 'student') {
    // Sidebar
    const els = document.querySelectorAll('.student-sidebar .profile-detail');
    const nm  = document.querySelector('.student-sidebar .profile-name');
    if (nm)    nm.textContent   = user.name || 'Student';
    if (els[0]) els[0].textContent = 'Roll: ' + (user.rollNo || user.id || '');
    if (els[1]) els[1].textContent = (user.department || '') + ' · Sem ' + (user.semester || '');

    // Profile form
    const inp = document.querySelectorAll('#dash-profile input');
    if (inp[0]) inp[0].value = user.name        || '';
    if (inp[1]) inp[1].value = user.rollNo || user.id || '';
    if (inp[2]) inp[2].value = user.department   || '';
    if (inp[3]) inp[3].value = user.semester     || '';
    if (inp[4]) inp[4].value = user.mobile       || '';
    const em = document.querySelector('#dash-profile input[type="email"]');
    if (em)  em.value = user.email || '';
    const addr = document.querySelector('#dash-profile textarea');
    if (addr) addr.value = user.address || '';

    // Load all student data
    loadStudentNotices();
    loadStudentFees();
    loadStudentAttendance(user.semester || 5);
    loadStudentMarks(user.semester || 5);
    loadStudentAssignments(user.semester || 5, user.department || 'CSE');
    loadStudentMaterials(user.semester || 5, user.department || 'CSE');
  }

  if (role === 'faculty') {
    const nm  = document.querySelector('.faculty-sidebar .profile-name');
    const els = document.querySelectorAll('.faculty-sidebar .profile-detail');
    if (nm)    nm.textContent    = user.name || 'Faculty';
    if (els[0]) els[0].textContent = 'ID: ' + (user.facultyId || user.id || '');
    if (els[1]) els[1].textContent = 'Dept: ' + (user.department || '');

    // Pre-load faculty lists
    loadFacultyAssignments();
    loadFacultyMaterials();
  }

  if (role === 'admin') {
    loadAdminOverview();
    loadAdminAccounts();
  }
}

// ═══════════════════════════════════════════════════════════════
// STUDENT FEATURES
// ═══════════════════════════════════════════════════════════════

// ── Notices ───────────────────────────────────────────────────
async function loadStudentNotices() {
  const r = await apiFetch('/api/student/notices');
  if (!r?.ok) return;
  const list = document.querySelector('#dash-overview .mini-notices');
  if (!list) return;
  const items = r.data.notices || [];
  if (!items.length) return;
  const colors = { urgent:'red', important:'orange', normal:'blue' };
  list.innerHTML = items.slice(0,4).map(n =>
    `<div class="mn-item"><span class="mn-dot ${colors[n.priority]||'blue'}"></span><p>${n.title}</p></div>`
  ).join('');
}

// ── Attendance ────────────────────────────────────────────────
async function loadStudentAttendance(semester) {
  const r = await apiFetch('/api/student/attendance?semester=' + (semester || 5));
  if (!r?.ok) return;
  const summary = r.data.summary || [];
  const grid = document.querySelector('#dash-attendance .att-grid');
  if (!grid || !summary.length) return;

  grid.innerHTML = summary.map(s => {
    const pct = s.percentage;
    const cls = pct >= 75 ? '' : pct >= 65 ? ' warn' : ' danger';
    return `
      <div class="att-subject">
        <div class="att-bar-wrap">
          <div class="att-bar${cls}" style="width:${pct}%">${pct}%</div>
        </div>
        <span>${s.subject}</span>
      </div>`;
  }).join('');
}

// ── Marks ─────────────────────────────────────────────────────
async function loadStudentMarks(semester) {
  const sem = semester || 5;
  const r   = await apiFetch('/api/student/marks?semester=' + sem);
  if (!r?.ok) return;

  const semData  = r.data.marks?.[sem] || {};
  const subjects = semData.subjects    || {};
  const entries  = Object.entries(subjects);
  if (!entries.length) return;

  const tbody = document.querySelector('#marks-table-' + sem + ' tbody');
  if (tbody) {
    tbody.innerHTML = entries.map(([subj, d]) => {
      const gc = (!d.grade || d.grade === 'F') ? '' : (d.grade.startsWith('A') ? 'grade-a' : 'grade-b');
      return `<tr>
        <td>${subj}</td>
        <td>${d.assignmentAvg ?? '—'}</td>
        <td>${d.internalAvg  ?? '—'}</td>
        <td>${d.midSem       ?? '—'}</td>
        <td>${d.semesterExam ?? '—'}</td>
        <td>${d.total        ?? '—'}</td>
        <td class="${gc}">${d.grade ?? '—'}</td>
      </tr>`;
    }).join('');
  }

  // SGPA for this semester
  const sgpaEl = document.querySelector('#sem-block-' + sem + ' .cgpa-display');
  if (sgpaEl) {
    sgpaEl.innerHTML = semData.sgpa !== null && semData.sgpa !== undefined
      ? `Sem ${sem} SGPA: <strong>${semData.sgpa} / 10.0</strong>`
      : `Sem ${sem} SGPA: <strong style="color:var(--warning)">Pending semester results</strong>`;
  }

  // Overall CGPA
  if (r.data.cgpa !== null) {
    const cgpaEl = document.querySelector('#cgpaOverallBox .cgpa-total-row .cgpa-val');
    if (cgpaEl) cgpaEl.innerHTML = '<strong>' + r.data.cgpa + ' / 10.0</strong>';
  }
}

// ── Assignments (student view) ────────────────────────────────
async function loadStudentAssignments(semester, dept) {
  const sem = semester || 5;
  const r   = await apiFetch('/api/student/assignments?semester=' + sem);
  if (!r?.ok) return;

  const list  = document.querySelector('#dash-assignments .assignment-list');
  if (!list) return;

  const items = r.data.assignments || [];
  if (!items.length) {
    list.innerHTML = `<div style="color:var(--text-light);padding:1rem;font-size:0.9rem;">
      No assignments posted yet for Semester ${sem}.</div>`;
    return;
  }

  const now = new Date();
  list.innerHTML = items.map(a => {
    const past = new Date(a.dueDate) < now;
    const cls  = past ? 'graded' : 'pending';
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
          <span class="badge ${past ? 'graded' : 'pending'}">${past ? 'Closed' : 'Open'}</span>
        </div>
      </div>`;
  }).join('');
}

// ── Materials (student view) ──────────────────────────────────
async function loadStudentMaterials(semester, dept) {
  const sem = semester || 5;
  const r   = await apiFetch('/api/student/materials?semester=' + sem);
  if (!r?.ok) return;

  const grid  = document.querySelector('#dash-materials .material-grid');
  if (!grid) return;

  const items = r.data.materials || [];
  if (!items.length) {
    grid.innerHTML = `<div style="color:var(--text-light);padding:1rem;font-size:0.9rem;">
      No materials uploaded yet for Semester ${sem}.</div>`;
    return;
  }

  const icons = { notes:'fa-file-pdf', slides:'fa-file-powerpoint', video:'fa-file-video',
                  reference:'fa-book', assignment:'fa-tasks', other:'fa-file' };
  grid.innerHTML = items.map(m => `
    <div class="mat-card">
      <i class="fa ${icons[m.type]||'fa-file'}"></i>
      <div>
        <h5>${m.title}</h5>
        <p>${m.uploadedByName || ''} · ${m.uploadedAt?.slice(0,10)||''}</p>
      </div>
      ${m.fileUrl
        ? `<a href="${m.fileUrl}" target="_blank" class="btn-sm"><i class="fa fa-external-link-alt"></i></a>`
        : `<button class="btn-sm" title="No link available" disabled><i class="fa fa-download"></i></button>`}
    </div>`).join('');
}

// ── Fees (student view + QR pay) ─────────────────────────────
async function loadStudentFees() {
  const r = await apiFetch('/api/student/fees');
  if (!r?.ok) return;

  const card  = document.querySelector('#dash-fee .fee-status-card');
  if (!card) return;

  const fees  = r.data.fees || [];
  if (!fees.length) {
    card.innerHTML = '<div class="fsc-row"><span>No fee records found.</span></div>';
    return;
  }

  card.innerHTML = fees.map(fee => {
    const paid    = fee.status === 'paid';
    const pending = fee.status === 'pending_verification';
    return `
      <div class="fsc-row${paid ? '' : ' fsc-pending-row'}">
        <div class="fsc-left">
          <span class="fsc-label">${fee.feeName}</span>
          <span class="fsc-amount${paid ? '' : ' fsc-due'}">
            ₹${Number(fee.amount).toLocaleString('en-IN')}
            ${paid ? '' : ' — ' + (pending ? 'Pending Verification' : 'Due')}
          </span>
        </div>
        ${paid    ? '<span class="paid">✔ Paid</span>'
          : pending ? '<span style="color:var(--warning);font-weight:600;">⏳ Verifying</span>'
          : `<button class="btn-pay-now" onclick="openQR('${fee.feeName}',${fee.amount},'${fee.id}')">
               <i class="fa fa-qrcode"></i> Pay Now
             </button>`}
      </div>`;
  }).join('');

  // Payment history
  const paidFees = fees.filter(f => f.status === 'paid');
  const histBody = document.querySelector('#dash-fee .payment-history table tbody');
  if (histBody && paidFees.length) {
    histBody.innerHTML = paidFees.map(f => `
      <tr>
        <td>${f.paidOn?.slice(0,10) || f.updatedAt?.slice(0,10) || '—'}</td>
        <td>${f.feeName}</td>
        <td>₹${Number(f.amount).toLocaleString('en-IN')}</td>
        <td class="paid">Paid</td>
      </tr>`).join('');
  }
}

// ── Update Profile (student) ──────────────────────────────────
async function updateStudentProfile() {
  const inp   = document.querySelectorAll('#dash-profile input');
  const email = document.querySelector('#dash-profile input[type="email"]');
  const addr  = document.querySelector('#dash-profile textarea');

  const updates = {};
  if (inp[4]?.value)  updates.mobile  = inp[4].value.trim();
  if (email?.value)   updates.email   = email.value.trim();
  if (addr?.value)    updates.address = addr.value.trim();

  if (!Object.keys(updates).length) { showToast('Nothing to update.'); return; }

  const r = await apiFetch('/api/student/profile', {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
  showToast(r?.ok ? '✔ Profile updated!' : (r?.data?.error || 'Update failed.'));

  // Update localStorage
  if (r?.ok) {
    const user = JSON.parse(localStorage.getItem('kit_user') || '{}');
    Object.assign(user, updates);
    localStorage.setItem('kit_user', JSON.stringify(user));
  }
}

// ═══════════════════════════════════════════════════════════════
// FACULTY FEATURES
// ═══════════════════════════════════════════════════════════════

// Helper: get logged-in faculty's department from localStorage
function getFacultyDept() {
  const u = JSON.parse(localStorage.getItem('kit_user') || '{}');
  return u.department || 'CSE';
}

// ── Mark Attendance ───────────────────────────────────────────
async function saveFacultyAttendance() {
  const courseEl = document.querySelector('#fdash-attendance select');
  const dateEl   = document.querySelector('#fdash-attendance input[type="date"]');
  if (!dateEl?.value) { showToast('Please select a date.'); return; }

  const courseText = courseEl?.options[courseEl.selectedIndex]?.text || '';
  const subject    = courseText.split('—')[0].trim() || courseText;
  const deptMatch  = courseText.match(/\b(CSE|EE|ME|CE|BT)\b/);
  const department = deptMatch ? deptMatch[1] : getFacultyDept();
  const semMatch   = courseText.match(/\b(\d)\b/);
  const semester   = semMatch ? parseInt(semMatch[1]) : 5;

  const records = [];
  document.querySelectorAll('#fdash-attendance .att-table tbody tr').forEach(row => {
    const rollNo      = row.children[0]?.textContent?.trim();
    const studentName = row.children[1]?.textContent?.trim();
    if (!rollNo || rollNo === 'Roll No.') return;
    const checked = row.querySelector('input[type="radio"]:checked');
    records.push({ rollNo, studentName, status: checked?.value || 'P' });
  });

  if (!records.length) { showToast('No student rows found.'); return; }

  const r = await apiFetch('/api/faculty/attendance', {
    method: 'POST',
    body: JSON.stringify({ subject, semester, department, date: dateEl.value, records }),
  });
  showToast(r?.ok ? `✔ Attendance saved for ${records.length} students!` : (r?.data?.error || 'Failed to save.'));
}

// ── Upload Marks ──────────────────────────────────────────────
async function saveFacultyMarks() {
  const user      = JSON.parse(localStorage.getItem('kit_user') || '{}');
  const courseEl  = document.getElementById('fMarksCourse');
  const semEl     = document.getElementById('fMarksSem');
  const typeEl    = document.getElementById('fMarksType');
  const labelEl   = document.getElementById('fMarksExamLabel');
  const maxEl     = document.getElementById('fMarksMax');

  const courseText = courseEl?.options[courseEl?.selectedIndex]?.text || '';
  // "Machine Learning — CSE 5A"  → subject = "Machine Learning"
  const subject    = courseText.split('—')[0].trim() || 'Unknown';
  const deptMatch  = courseText.match(/\b(CSE|EE|ME|CE|BT)\b/);
  const department = deptMatch ? deptMatch[1] : (user.department || getFacultyDept());

  const typeMap = { assign:'assignment', internal:'internal', midsem:'midsem', semester:'semester' };
  const type    = typeMap[typeEl?.value] || 'assignment';
  const label   = labelEl?.value?.trim() || (typeEl?.options[typeEl?.selectedIndex]?.text || 'Exam');
  const maxMarks = parseFloat(maxEl?.value) || 10;
  const semester = parseInt(semEl?.value) || 5;

  if (!label) { showToast('Please enter a label (e.g. Assignment 1).'); return; }

  const records = [];
  document.querySelectorAll('#fMarksBody tr[data-roll]').forEach(row => {
    const inp = row.querySelector('.marks-input');
    if (!inp) return;
    records.push({
      rollNo:      row.dataset.roll || '',
      studentName: row.dataset.name || '',
      obtained:    parseFloat(inp.value) || 0,
    });
  });

  if (!records.length) { showToast('No student records to save.'); return; }

  const r = await apiFetch('/api/faculty/marks', {
    method: 'POST',
    body: JSON.stringify({ subject, semester, department, type, label, maxMarks, records }),
  });
  showToast(r?.ok ? '✔ Marks saved!' : (r?.data?.error || 'Failed to save marks.'));
}

function resetFacultyMarks() {
  document.querySelectorAll('#fMarksBody .marks-input').forEach(i => i.value = '');
  updateEffective();
}

// ── Create Assignment ─────────────────────────────────────────
async function createAssignment() {
  const user     = JSON.parse(localStorage.getItem('kit_user') || '{}');
  const course   = document.getElementById('asgn-course');
  const semEl    = document.getElementById('asgn-sem');
  const titleEl  = document.getElementById('asgn-title');
  const descEl   = document.getElementById('asgn-desc');
  const dueEl    = document.getElementById('asgn-due');
  const marksEl  = document.getElementById('asgn-marks');

  if (!titleEl?.value?.trim()) { showToast('Please enter assignment title.'); return; }
  if (!dueEl?.value)           { showToast('Please select a due date.');      return; }

  const courseText = course?.options[course.selectedIndex]?.text || '';
  // "Machine Learning (CSE)"
  const subMatch   = courseText.match(/^(.+?)\s*\((\w+)\)$/);
  const subject    = subMatch ? subMatch[1].trim() : courseText;
  const dept       = subMatch ? subMatch[2] : (user.department || getFacultyDept());

  const r = await apiFetch('/api/faculty/assignments', {
    method: 'POST',
    body: JSON.stringify({
      title:       titleEl.value.trim(),
      subject,
      semester:    parseInt(semEl?.value) || 5,
      department:  dept,
      description: descEl?.value?.trim() || '',
      dueDate:     dueEl.value,
      maxMarks:    parseFloat(marksEl?.value) || 10,
    }),
  });

  if (r?.ok) {
    showToast('✔ Assignment created!');
    titleEl.value = '';
    if (descEl) descEl.value = '';
    dueEl.value = '';
    loadFacultyAssignments();
  } else {
    showToast(r?.data?.error || 'Failed to create assignment.');
  }
}

async function loadFacultyAssignments() {
  const r = await apiFetch('/api/faculty/assignments');
  if (!r?.ok) return;

  const list  = document.getElementById('facultyAssignmentList');
  if (!list) return;

  const items = r.data.assignments || [];
  if (!items.length) {
    list.innerHTML = '<p style="color:var(--text-light);font-size:0.88rem;padding:0.5rem 0;">No assignments created yet.</p>';
    return;
  }
  const now = new Date();
  list.innerHTML = items.map(a => `
    <div class="asgn-card ${new Date(a.dueDate) < now ? 'graded' : 'pending'}" style="margin-bottom:0.8rem;">
      <div class="asgn-info">
        <h5>${a.subject} — ${a.title}</h5>
        <p>${a.description || ''}</p>
        <span class="asgn-due">
          <i class="fa fa-clock"></i> Due: ${a.dueDate}
          &nbsp;|&nbsp; Max: ${a.maxMarks} marks &nbsp;|&nbsp; Sem ${a.semester} &nbsp;|&nbsp; Dept: ${a.department}
        </span>
      </div>
      <div class="asgn-action">
        <span class="badge submitted">Active</span>
        <button class="btn-sm danger" onclick="deleteAssignment('${a.id}')">Delete</button>
      </div>
    </div>`).join('');
}

async function deleteAssignment(id) {
  if (!confirm('Delete this assignment?')) return;
  const r = await apiFetch('/api/faculty/assignments/' + id, { method:'DELETE' });
  showToast(r?.ok ? 'Assignment deleted.' : 'Failed to delete.');
  if (r?.ok) loadFacultyAssignments();
}

// ── Upload Material ───────────────────────────────────────────
async function uploadMaterial() {
  const user      = JSON.parse(localStorage.getItem('kit_user') || '{}');
  const titleEl   = document.getElementById('mat-title');
  const subjectEl = document.getElementById('mat-subject');
  const typeEl    = document.getElementById('mat-type');
  const linkEl    = document.getElementById('mat-link');
  const descEl    = document.getElementById('mat-desc');
  const semEl     = document.getElementById('mat-sem');

  if (!titleEl?.value?.trim()) { showToast('Please enter a material title.'); return; }

  const courseText = subjectEl?.options[subjectEl.selectedIndex]?.text || '';
  const subMatch   = courseText.match(/^(.+?)\s*\((\w+)\)$/);
  const subject    = subMatch ? subMatch[1].trim() : courseText;
  const dept       = subMatch ? subMatch[2] : (user.department || getFacultyDept());

  const typeMap = { 'Lecture Notes':'notes', 'Slides':'slides', 'Assignment':'assignment',
                    'Reference Book':'reference', 'Video':'video' };
  const rawType = typeEl?.options[typeEl?.selectedIndex]?.text || 'Lecture Notes';

  const r = await apiFetch('/api/faculty/materials', {
    method: 'POST',
    body: JSON.stringify({
      title:       titleEl.value.trim(),
      subject,
      semester:    parseInt(semEl?.value) || 5,
      department:  dept,
      type:        typeMap[rawType] || 'notes',
      fileUrl:     linkEl?.value?.trim() || '',
      description: descEl?.value?.trim() || '',
      fileName:    titleEl.value.trim(),
    }),
  });

  if (r?.ok) {
    showToast('✔ Material uploaded!');
    titleEl.value = '';
    if (linkEl) linkEl.value = '';
    if (descEl) descEl.value = '';
    loadFacultyMaterials();
  } else {
    showToast(r?.data?.error || 'Failed to upload.');
  }
}

async function loadFacultyMaterials() {
  const r = await apiFetch('/api/faculty/materials');
  if (!r?.ok) return;

  const list  = document.getElementById('facultyMaterialList');
  if (!list) return;

  const items = r.data.materials || [];
  if (!items.length) {
    list.innerHTML = '<p style="color:var(--text-light);font-size:0.88rem;padding:0.5rem 0;">No materials uploaded yet.</p>';
    return;
  }
  const icons = { notes:'fa-file-pdf', slides:'fa-file-powerpoint', video:'fa-file-video',
                  reference:'fa-book', assignment:'fa-tasks', other:'fa-file' };
  list.innerHTML = items.map(m => `
    <div class="mat-card">
      <i class="fa ${icons[m.type]||'fa-file'}"></i>
      <div>
        <h5>${m.title}</h5>
        <p>${m.subject} · Sem ${m.semester} · Dept ${m.department}</p>
        ${m.fileUrl ? `<a href="${m.fileUrl}" target="_blank" style="font-size:0.78rem;color:var(--navy-light)">Open Link ↗</a>` : ''}
      </div>
      <button class="btn-sm danger" onclick="deleteMaterial('${m.id}')"><i class="fa fa-trash"></i></button>
    </div>`).join('');
}

async function deleteMaterial(id) {
  if (!confirm('Delete this material?')) return;
  const r = await apiFetch('/api/faculty/materials/' + id, { method:'DELETE' });
  showToast(r?.ok ? 'Material deleted.' : 'Failed.');
  if (r?.ok) loadFacultyMaterials();
}

// ── Marks type hint ───────────────────────────────────────────
function toggleMarksType() {
  const type   = document.getElementById('fMarksType')?.value;
  const maxEl  = document.getElementById('fMarksMax');
  const hint   = document.getElementById('marksTypeHintText');
  const header = document.getElementById('marksColHeader');
  const map    = {
    assign:   ['Assignments: averaged to /10 per student.', 10, 'Marks (this assignment)'],
    internal: ['Internals: averaged to /10 per student.',   10, 'Marks (this internal)'],
    midsem:   ['Mid-Semester: max 20.',                     20, 'Mid-Sem Marks (/20)'],
    semester: ['Semester exam: max 60. Triggers SGPA.',     60, 'Semester Marks (/60)'],
  };
  if (map[type]) {
    if (hint)   hint.textContent   = map[type][0];
    if (maxEl)  maxEl.value        = map[type][1];
    if (header) header.textContent = map[type][2];
    document.querySelectorAll('.marks-max-cell').forEach(c => c.textContent = map[type][1]);
    document.querySelectorAll('.marks-input').forEach(i => { i.max = map[type][1]; });
  }
  updateEffective();
}

document.addEventListener('input', e => {
  if (e.target.classList.contains('marks-input')) updateEffective();
});

function updateEffective() {
  const max   = parseFloat(document.getElementById('fMarksMax')?.value) || 10;
  const type  = document.getElementById('fMarksType')?.value;
  const inputs = [...document.querySelectorAll('#fMarksBody .marks-input')];
  const vals   = inputs.map(i => parseFloat(i.value) || 0);

  inputs.forEach((inp, idx) => {
    const cell = inp.closest('tr')?.querySelector('.marks-eff-cell');
    if (!cell) return;
    const v = vals[idx];
    if (type === 'assign' || type === 'internal') {
      const eff = max > 0 ? ((v / max) * 10).toFixed(1) : '0.0';
      cell.textContent = v + '/' + max + ' → ' + eff + '/10';
    } else {
      cell.textContent = v + '/' + max;
    }
  });

  if (vals.length) {
    const avg = vals.reduce((a,b)=>a+b,0)/vals.length;
    const hi  = Math.max(...vals);
    const lo  = Math.min(...vals);
    const fmt = v => (type === 'assign' || type === 'internal')
      ? ((max>0?((v/max)*10):0).toFixed(1)) + '/10' : v + '/' + max;
    const g = id => document.getElementById(id);
    if (g('classAvgVal'))  g('classAvgVal').textContent  = fmt(parseFloat(avg.toFixed(2)));
    if (g('classHighVal')) g('classHighVal').textContent = fmt(hi);
    if (g('classLowVal'))  g('classLowVal').textContent  = fmt(lo);
  }
}

// ── Semester tab switch (marks panel) ─────────────────────────
function switchSem(n) {
  document.querySelectorAll('.sem-tab').forEach((t,i) => t.classList.toggle('active', i+1===n));
  for (let i = 1; i <= 8; i++) {
    const b = document.getElementById('sem-block-'+i);
    if (b) b.style.display = i===n ? '' : 'none';
  }
  // Load marks for switched semester
  const user = JSON.parse(localStorage.getItem('kit_user') || '{}');
  if (user.role === 'student') loadStudentMarks(n);
}

// ═══════════════════════════════════════════════════════════════
// ADMIN FEATURES
// ═══════════════════════════════════════════════════════════════

// ── Overview ──────────────────────────────────────────────────
async function loadAdminOverview() {
  const r = await apiFetch('/api/admin/overview');
  if (!r?.ok) return;
  const t = r.data.totals || {};
  const cards = document.querySelectorAll('#adash-overview .sc-num');
  if (cards[0]) cards[0].textContent = (t.students  || 0).toLocaleString('en-IN');
  if (cards[1]) cards[1].textContent = (t.faculty   || 0).toLocaleString('en-IN');
  if (cards[2]) cards[2].textContent = t.departments || 5;
  if (cards[3]) cards[3].textContent = t.pendingPayments || 0;

  // Dept enrollment table
  const tbody = document.querySelector('#adash-overview .dash-widget table tbody');
  if (tbody && r.data.departmentEnrollment) {
    const dept = r.data.departmentEnrollment;
    tbody.innerHTML = Object.entries(dept).map(([d,n]) =>
      `<tr><td>${d}</td><td>${n}</td><td>—</td></tr>`).join('');
  }
}

// ── Load Accounts into table ──────────────────────────────────
async function loadAdminAccounts() {
  const [studR, facR] = await Promise.all([
    apiFetch('/api/admin/students'),
    apiFetch('/api/admin/faculty'),
  ]);

  const students = studR?.ok ? studR.data.students || [] : [];
  const faculty  = facR?.ok  ? facR.data.faculty   || [] : [];
  const all      = [
    ...students.map(s => ({ ...s, _role:'Student' })),
    ...faculty.map(f  => ({ ...f, _role:'Faculty'  })),
  ];

  const tbody = document.getElementById('adminTableBody');
  if (!tbody) return;

  tbody.innerHTML = all.map(u => {
    const uid  = (u.rollNo || u.facultyId || u.id || '').toUpperCase();
    const year = u.year ? 'Year '+u.year : '—';
    const statusClass = u.status === 'active' ? 'submitted' : 'pending';
    const statusText  = u.status === 'active' ? 'Active' : 'Inactive';
    return `
      <tr data-role="${u._role}" data-dept="${u.department||''}" 
          data-name="${(u.name||'').toLowerCase()}" data-id="${uid.toLowerCase()}"
          data-year="${u.year||''}">
        <td>${uid}</td>
        <td>${u.name||''}</td>
        <td>${u._role}</td>
        <td>${u.department||'—'}</td>
        <td>${year}</td>
        <td><span class="badge ${statusClass}">${statusText}</span></td>
        <td>
          <button class="btn-sm" onclick="openEditModal('${uid}','${u._role}')">Edit</button>
          <button class="btn-sm danger" onclick="deleteAccount('${uid}','${u._role}')">Delete</button>
        </td>
      </tr>`;
  }).join('');

  const countEl = document.getElementById('adminResultCount');
  if (countEl) countEl.textContent = 'Showing ' + all.length + ' record(s)';
}

// ── Create Account ────────────────────────────────────────────
function openCreateAccountModal() {
  const existing = document.getElementById('adminCreateModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'adminCreateModal';
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9100;
    display:flex;align-items:center;justify-content:center;`;

  modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:2rem;width:92%;max-width:480px;
                box-shadow:0 24px 80px rgba(0,0,0,0.3);position:relative;max-height:90vh;overflow-y:auto;">
      <button onclick="document.getElementById('adminCreateModal').remove()"
        style="position:absolute;top:1rem;right:1rem;background:var(--off-white);border:1px solid var(--border);
               width:32px;height:32px;border-radius:50%;cursor:pointer;">✕</button>
      <h3 style="font-family:var(--font-display);color:var(--navy-dark);margin-bottom:1.4rem;">
        Create New Account
      </h3>

      <div class="form-group" style="margin-bottom:0.9rem;">
        <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Role</label>
        <select id="create-role" onchange="toggleCreateFields()" 
          style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);">
          <option value="student">Student</option>
          <option value="faculty">Faculty</option>
        </select>
      </div>
      <div class="form-group" style="margin-bottom:0.9rem;">
        <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">
          <span id="create-id-label">Roll Number</span>
        </label>
        <input id="create-id" type="text" placeholder="e.g. KIT2024CSE001"
          style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);"/>
      </div>
      <div class="form-group" style="margin-bottom:0.9rem;">
        <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Full Name</label>
        <input id="create-name" type="text" placeholder="Full name"
          style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);"/>
      </div>
      <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin-bottom:0.9rem;">
        <div>
          <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Department</label>
          <select id="create-dept"
            style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);">
            <option>CSE</option><option>EE</option><option>ME</option><option>CE</option><option>BT</option>
          </select>
        </div>
        <div id="create-year-wrap">
          <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Year</label>
          <select id="create-year"
            style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);">
            <option value="1">Year 1</option><option value="2">Year 2</option>
            <option value="3">Year 3</option><option value="4">Year 4</option>
          </select>
        </div>
      </div>
      <div id="create-sem-wrap" style="margin-bottom:0.9rem;">
        <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Semester</label>
        <select id="create-sem"
          style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);">
          ${[1,2,3,4,5,6,7,8].map(s=>`<option value="${s}">Sem ${s}</option>`).join('')}
        </select>
      </div>
      <div id="create-desig-wrap" style="margin-bottom:0.9rem;display:none;">
        <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Designation</label>
        <input id="create-desig" type="text" placeholder="e.g. Assistant Professor"
          style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);"/>
      </div>
      <div class="form-row" style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin-bottom:0.9rem;">
        <div>
          <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Email</label>
          <input id="create-email" type="email" placeholder="email@kit.edu.in"
            style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);"/>
        </div>
        <div>
          <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Mobile</label>
          <input id="create-mobile" type="text" placeholder="+91XXXXXXXXXX"
            style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);"/>
        </div>
      </div>
      <div class="form-group" style="margin-bottom:1.2rem;">
        <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Password</label>
        <input id="create-password" type="password" placeholder="Min 8 characters"
          style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);"/>
      </div>
      <button onclick="submitCreateAccount()"
        style="width:100%;background:var(--navy);color:white;border:none;padding:0.75rem;
               border-radius:8px;font-size:0.95rem;font-weight:600;cursor:pointer;font-family:var(--font-body);">
        <i class="fa fa-plus"></i> Create Account
      </button>
    </div>`;

  document.body.appendChild(modal);
}

function toggleCreateFields() {
  const role = document.getElementById('create-role')?.value;
  const yearWrap  = document.getElementById('create-year-wrap');
  const semWrap   = document.getElementById('create-sem-wrap');
  const desigWrap = document.getElementById('create-desig-wrap');
  const idLabel   = document.getElementById('create-id-label');
  if (role === 'faculty') {
    yearWrap.style.display  = 'none';
    semWrap.style.display   = 'none';
    desigWrap.style.display = 'block';
    idLabel.textContent     = 'Faculty ID';
    document.getElementById('create-id').placeholder = 'e.g. KIT-FAC-0099';
  } else {
    yearWrap.style.display  = '';
    semWrap.style.display   = 'block';
    desigWrap.style.display = 'none';
    idLabel.textContent     = 'Roll Number';
    document.getElementById('create-id').placeholder = 'e.g. KIT2024CSE001';
  }
}

async function submitCreateAccount() {
  const role     = document.getElementById('create-role')?.value;
  const id       = document.getElementById('create-id')?.value?.trim().toUpperCase();
  const name     = document.getElementById('create-name')?.value?.trim();
  const dept     = document.getElementById('create-dept')?.value;
  const year     = parseInt(document.getElementById('create-year')?.value) || undefined;
  const semester = parseInt(document.getElementById('create-sem')?.value)  || undefined;
  const desig    = document.getElementById('create-desig')?.value?.trim();
  const email    = document.getElementById('create-email')?.value?.trim();
  const mobile   = document.getElementById('create-mobile')?.value?.trim();
  const password = document.getElementById('create-password')?.value;

  if (!id)       { showToast('Please enter an ID.');          return; }
  if (!name)     { showToast('Please enter a name.');         return; }
  if (!password || password.length < 8) { showToast('Password must be at least 8 characters.'); return; }

  let endpoint, payload;
  if (role === 'student') {
    endpoint = '/api/admin/students';
    payload  = { rollNo: id, name, department: dept, year, semester, email, mobile, password, status:'active' };
  } else {
    endpoint = '/api/admin/faculty';
    payload  = { facultyId: id, name, department: dept, designation: desig||'Faculty', email, mobile, password, status:'active' };
  }

  const r = await apiFetch(endpoint, { method:'POST', body: JSON.stringify(payload) });

  if (r?.ok) {
    showToast('✔ Account created: ' + id);
    document.getElementById('adminCreateModal')?.remove();
    loadAdminAccounts();  // refresh table
  } else {
    showToast(r?.data?.error || 'Failed to create account.');
  }
}

// ── Edit Account ──────────────────────────────────────────────
function openEditModal(id, role) {
  const existing = document.getElementById('adminEditModal');
  if (existing) existing.remove();

  const row  = document.querySelector(`#adminTableBody tr[data-id="${id.toLowerCase()}"]`);
  const name = row?.children[1]?.textContent || '';
  const dept = row?.dataset.dept || '';
  const year = row?.dataset.year || '';
  const statusBadge = row?.children[5]?.querySelector('.badge')?.textContent?.trim()?.toLowerCase();
  const status = statusBadge === 'active' ? 'active' : 'inactive';

  const modal = document.createElement('div');
  modal.id    = 'adminEditModal';
  modal.style.cssText = `position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:9100;
    display:flex;align-items:center;justify-content:center;`;

  modal.innerHTML = `
    <div style="background:white;border-radius:16px;padding:2rem;width:92%;max-width:440px;
                box-shadow:0 24px 80px rgba(0,0,0,0.3);position:relative;max-height:90vh;overflow-y:auto;">
      <button onclick="document.getElementById('adminEditModal').remove()"
        style="position:absolute;top:1rem;right:1rem;background:var(--off-white);border:1px solid var(--border);
               width:32px;height:32px;border-radius:50%;cursor:pointer;">✕</button>
      <h3 style="font-family:var(--font-display);color:var(--navy-dark);margin-bottom:1.4rem;">
        Edit — ${id}
      </h3>
      <div style="display:flex;flex-direction:column;gap:0.8rem;">
        <div>
          <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Full Name</label>
          <input id="edit-name" value="${name}"
            style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);"/>
        </div>
        <div>
          <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Department</label>
          <select id="edit-dept"
            style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);">
            ${['CSE','EE','ME','CE','BT'].map(d=>`<option ${d===dept?'selected':''}>${d}</option>`).join('')}
          </select>
        </div>
        ${role==='Student'?`
        <div>
          <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Year</label>
          <select id="edit-year"
            style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);">
            ${[1,2,3,4].map(y=>`<option value="${y}" ${String(y)===year?'selected':''}>Year ${y}</option>`).join('')}
          </select>
        </div>`:''}
        <div>
          <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">Status</label>
          <select id="edit-status"
            style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);">
            <option value="active"   ${status==='active'?'selected':''}>Active</option>
            <option value="inactive" ${status==='inactive'?'selected':''}>Inactive</option>
          </select>
        </div>
        <div>
          <label style="font-size:0.82rem;font-weight:700;display:block;margin-bottom:0.3rem;">
            New Password <span style="font-weight:400;color:var(--text-light)">(leave blank to keep)</span>
          </label>
          <input id="edit-password" type="password" placeholder="Min 8 characters"
            style="width:100%;padding:0.6rem;border:1px solid var(--border);border-radius:8px;font-family:var(--font-body);"/>
        </div>
        <div style="display:flex;gap:0.8rem;margin-top:0.4rem;">
          <button onclick="saveEditAccount('${id}','${role}')"
            style="flex:1;background:var(--navy);color:white;border:none;padding:0.7rem;
                   border-radius:8px;font-weight:600;cursor:pointer;font-family:var(--font-body);">Save</button>
          <button onclick="document.getElementById('adminEditModal').remove()"
            style="flex:1;background:var(--off-white);color:var(--text-mid);border:1px solid var(--border);
                   padding:0.7rem;border-radius:8px;cursor:pointer;font-family:var(--font-body);">Cancel</button>
        </div>
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

  if (password && password.length > 0 && password.length < 8) {
    showToast('Password must be at least 8 characters.'); return;
  }

  const updates = { name, department: dept, status };
  if (year)     updates.year = parseInt(year);
  if (password) updates.password = password;

  const ep = role === 'Faculty' ? '/api/admin/faculty/' + id : '/api/admin/students/' + id;
  const r  = await apiFetch(ep, { method:'PATCH', body: JSON.stringify(updates) });

  if (r?.ok) {
    showToast('✔ Account updated!');
    document.getElementById('adminEditModal')?.remove();
    loadAdminAccounts();
  } else {
    showToast(r?.data?.error || 'Update failed.');
  }
}

async function deleteAccount(id, role) {
  if (!confirm('Delete ' + id + '? This cannot be undone.')) return;
  const ep = role === 'Faculty' ? '/api/admin/faculty/' + id : '/api/admin/students/' + id;
  const r  = await apiFetch(ep, { method:'DELETE' });
  if (r?.ok) {
    showToast('Account deleted.');
    loadAdminAccounts();
  } else {
    showToast(r?.data?.error || 'Delete failed.');
  }
}

// ── Admin: Change Password for any user ───────────────────────
async function adminResetPassword(userId, role) {
  const newPwd = prompt('Enter new password for ' + userId + ' (min 8 chars):');
  if (!newPwd || newPwd.length < 8) { showToast('Password must be at least 8 chars.'); return; }
  const roleMap = { Student:'student', Faculty:'faculty', Admin:'admin' };
  const r = await apiFetch('/api/admin/reset-password', {
    method: 'POST',
    body: JSON.stringify({ userId, role: roleMap[role]||role.toLowerCase(), newPassword: newPwd }),
  });
  showToast(r?.ok ? '✔ Password reset for ' + userId : (r?.data?.error || 'Reset failed.'));
}

// ── Post Notice ───────────────────────────────────────────────
async function postNotice() {
  const titleEl   = document.querySelector('#adash-notices input[placeholder="Notice title..."]');
  const selects   = document.querySelectorAll('#adash-notices select');
  const contentEl = document.querySelector('#adash-notices textarea');

  if (!titleEl?.value?.trim())   { showToast('Please enter a title.'); return; }
  if (!contentEl?.value?.trim()) { showToast('Please enter content.'); return; }

  const audMap = { 'All Users':'all','Students Only':'students','Faculty Only':'faculty','Specific Department':'department' };
  const priMap = { 'Normal':'normal','Important':'important','Urgent':'urgent' };

  const r = await apiFetch('/api/admin/notices', {
    method: 'POST',
    body: JSON.stringify({
      title:    titleEl.value.trim(),
      content:  contentEl.value.trim(),
      audience: audMap[selects[0]?.options[selects[0].selectedIndex]?.text] || 'all',
      priority: priMap[selects[1]?.options[selects[1].selectedIndex]?.text] || 'normal',
      active:   true,
    }),
  });
  if (r?.ok) {
    showToast('✔ Notice published!');
    titleEl.value   = '';
    contentEl.value = '';
  } else {
    showToast(r?.data?.error || 'Failed to post notice.');
  }
}

// ── System Settings ───────────────────────────────────────────
async function saveSystemSettings() {
  const get = id => document.getElementById(id)?.checked ?? true;
  const r = await apiFetch('/api/admin/settings', {
    method: 'PUT',
    body: JSON.stringify({
      studentPortalAccess:  get('tog1'),
      facultyPortalAccess:  get('tog2'),
      onlineFeePayment:     get('tog3'),
      assignmentSubmission: get('tog4'),
      maintenanceMode:      get('tog5'),
      emailNotifications:   get('tog6'),
    }),
  });
  showToast(r?.ok ? '✔ Settings saved!' : (r?.data?.error || 'Failed to save.'));
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
      (!search || (row.dataset.name||'').includes(search) || (row.dataset.id||'').includes(search)) &&
      (!role   || (row.dataset.role||'').toLowerCase() === role) &&
      (!dept   || (row.dataset.dept||'').toLowerCase() === dept) &&
      (!year   || row.dataset.year === year);
    row.style.display = ok ? '' : 'none';
    if (ok) visible++;
  });
  const no = document.getElementById('adminNoResults');
  const tb = document.getElementById('adminTable');
  const ce = document.getElementById('adminResultCount');
  if (no) no.style.display = visible===0 ? 'block' : 'none';
  if (tb) tb.style.display = visible===0 ? 'none'  : '';
  if (ce) ce.textContent   = visible > 0 ? 'Showing '+visible+' record(s)' : '';
}

// ═══════════════════════════════════════════════════════════════
// QR PAYMENT MODAL
// ═══════════════════════════════════════════════════════════════

function openQR(feeName, amount, feeId) {
  const modal = document.getElementById('qrModal');
  if (!modal) return;
  document.getElementById('qrTitle').textContent  = 'Pay — ' + feeName;
  document.getElementById('qrAmount').textContent = '₹' + Number(amount).toLocaleString('en-IN');
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
    .then(() => showToast('UPI ID copied!'))
    .catch(() => showToast('UPI ID: kit.fees@sbi'));
}

// ═══════════════════════════════════════════════════════════════
// MISC HELPERS
// ═══════════════════════════════════════════════════════════════

function toggleSyllabus(dept) {
  const panel = document.getElementById('syl-' + dept);
  if (!panel) return;
  const open = panel.classList.contains('active');
  document.querySelectorAll('.syllabus-panel').forEach(p => p.classList.remove('active'));
  if (!open) { panel.classList.add('active'); panel.scrollIntoView({ behavior:'smooth', block:'nearest' }); }
}

function togglePwd(id) {
  const el = document.getElementById(id);
  if (el) el.type = el.type === 'password' ? 'text' : 'password';
}

async function handleContactForm(e) {
  e.preventDefault();
  const form = e.target;
  const r = await fetch(API + '/api/public/contact', {
    method: 'POST',
    headers: { 'Content-Type':'application/json' },
    body: JSON.stringify({
      name:    form.querySelector('input[placeholder*="name"]')?.value || '',
      email:   form.querySelector('input[type="email"]')?.value || '',
      subject: form.querySelector('input[placeholder*="regarding"]')?.value || '',
      message: form.querySelector('textarea')?.value || '',
    }),
  });
  const data = await r.json();
  showToast(r.ok ? 'Message sent! We\'ll reply within 24 hours.' : (data.error || 'Failed to send.'));
  if (r.ok) form.reset();
}

function showToast(msg, ms = 3500) {
  const t = document.getElementById('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}

function checkScrollShadow() {
  window.addEventListener('scroll', () => {
    const bar = document.getElementById('topbar');
    if (bar) bar.style.boxShadow = window.scrollY > 10
      ? '0 4px 24px rgba(26,60,110,0.18)'
      : '0 2px 16px rgba(26,60,110,0.10)';
  });
}

// ═══════════════════════════════════════════════════════════════
// PDF / FILE UPLOAD — Firebase Storage via signed URL
// ═══════════════════════════════════════════════════════════════

let selectedFile  = null;   // the File object chosen by user
let uploadedFileUrl = '';   // URL after successful upload

function handleFileSelect(input) {
  const file = input.files[0];
  if (!file) return;

  const maxMB = 10;
  if (file.size > maxMB * 1024 * 1024) {
    showToast('File is too large. Maximum size is ' + maxMB + ' MB.');
    input.value = '';
    return;
  }

  selectedFile = file;
  uploadedFileUrl = '';  // reset previous upload

  const label = document.getElementById('mat-file-label');
  if (label) label.textContent = '📎 ' + file.name + ' (' + (file.size / 1024).toFixed(1) + ' KB)';

  // Auto-fill title if empty
  const titleEl = document.getElementById('mat-title');
  if (titleEl && !titleEl.value) {
    titleEl.value = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
  }
}

// Drag and drop support
document.addEventListener('DOMContentLoaded', () => {
  const zone = document.getElementById('mat-upload-zone');
  if (!zone) return;

  zone.addEventListener('dragover', e => {
    e.preventDefault();
    zone.style.borderColor = 'var(--navy)';
    zone.style.background  = 'var(--sky)';
  });

  zone.addEventListener('dragleave', () => {
    zone.style.borderColor = '';
    zone.style.background  = '';
  });

  zone.addEventListener('drop', e => {
    e.preventDefault();
    zone.style.borderColor = '';
    zone.style.background  = '';
    const file = e.dataTransfer.files[0];
    if (!file) return;
    const input = document.getElementById('mat-file');
    if (input) {
      // Create a DataTransfer to assign to input.files
      const dt = new DataTransfer();
      dt.items.add(file);
      input.files = dt.files;
      handleFileSelect(input);
    }
  });
});

async function uploadMaterial() {
  const user      = JSON.parse(localStorage.getItem('kit_user') || '{}');
  const titleEl   = document.getElementById('mat-title');
  const subjectEl = document.getElementById('mat-subject');
  const typeEl    = document.getElementById('mat-type');
  const linkEl    = document.getElementById('mat-link');
  const descEl    = document.getElementById('mat-desc');
  const semEl     = document.getElementById('mat-sem');
  const btn       = document.getElementById('mat-upload-btn');

  if (!titleEl?.value?.trim()) { showToast('Please enter a title.'); return; }

  // Need either a file or a link
  if (!selectedFile && !linkEl?.value?.trim()) {
    showToast('Please choose a file to upload or paste a link.');
    return;
  }

  if (btn) btn.disabled = true;

  let fileUrl = linkEl?.value?.trim() || '';

  // If a file was selected, upload it first
  if (selectedFile) {
    fileUrl = await uploadFileToStorage(selectedFile);
    if (!fileUrl) {
      if (btn) btn.disabled = false;
      return;
    }
  }

  // Now save the material record to Firestore via the API
  const courseText = subjectEl?.options[subjectEl.selectedIndex]?.text || '';
  const subMatch   = courseText.match(/^(.+?)\s*\((\w+)\)$/);
  const subject    = subMatch ? subMatch[1].trim() : courseText;
  const dept       = subMatch ? subMatch[2] : (user.department || 'CSE');

  const typeMap = {
    'Lecture Notes':'notes', 'Slides':'slides', 'Assignment':'assignment',
    'Reference Book':'reference', 'Video':'video', 'Other':'other'
  };
  const rawType = typeEl?.options[typeEl?.selectedIndex]?.text || 'Lecture Notes';

  const r = await apiFetch('/api/faculty/materials', {
    method: 'POST',
    body: JSON.stringify({
      title:       titleEl.value.trim(),
      subject,
      semester:    parseInt(semEl?.value) || 5,
      department:  dept,
      type:        typeMap[rawType] || 'notes',
      fileUrl,
      description: descEl?.value?.trim() || '',
      fileName:    selectedFile ? selectedFile.name : titleEl.value.trim(),
    }),
  });

  if (r?.ok) {
    showToast('✔ Material uploaded successfully!');
    // Reset form
    titleEl.value = '';
    if (linkEl)  linkEl.value  = '';
    if (descEl)  descEl.value  = '';
    const fileLabel = document.getElementById('mat-file-label');
    if (fileLabel) fileLabel.textContent = 'Click to choose a file or drag and drop here';
    selectedFile    = null;
    uploadedFileUrl = '';
    const fileInput = document.getElementById('mat-file');
    if (fileInput) fileInput.value = '';
    loadFacultyMaterials();
  } else {
    showToast(r?.data?.error || 'Failed to save material record.');
  }

  if (btn) btn.disabled = false;
}

async function uploadFileToStorage(file) {
  const progressWrap = document.getElementById('mat-upload-progress');
  const progressBar  = document.getElementById('mat-progress-bar');
  const progressText = document.getElementById('mat-progress-text');

  if (progressWrap) progressWrap.style.display = 'block';
  if (progressText) progressText.textContent   = 'Getting upload URL...';
  if (progressBar)  progressBar.style.width    = '10%';

  // Step 1: Get a signed upload URL from our backend
  const sigRes = await apiFetch('/api/upload/signed-url', {
    method: 'POST',
    body: JSON.stringify({ fileName: file.name, contentType: file.type || 'application/octet-stream' }),
  });

  if (!sigRes?.ok) {
    showToast(sigRes?.data?.error || 'Failed to get upload URL.');
    if (progressWrap) progressWrap.style.display = 'none';
    return null;
  }

  const { uploadUrl, publicUrl } = sigRes.data;

  if (progressText) progressText.textContent = 'Uploading file...';
  if (progressBar)  progressBar.style.width  = '30%';

  // Step 2: Upload file directly to Firebase Storage using the signed URL
  try {
    const uploadRes = await fetch(uploadUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: file,
    });

    if (!uploadRes.ok) {
      showToast('Upload to storage failed. Try a Google Drive link instead.');
      if (progressWrap) progressWrap.style.display = 'none';
      return null;
    }

    if (progressBar)  progressBar.style.width    = '100%';
    if (progressText) progressText.textContent   = '✔ File uploaded!';
    setTimeout(() => { if (progressWrap) progressWrap.style.display = 'none'; }, 2000);

    return publicUrl;

  } catch (err) {
    showToast('Upload failed: ' + err.message);
    if (progressWrap) progressWrap.style.display = 'none';
    return null;
  }
}
