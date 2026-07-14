// ══════════════════════════════════════════════════════
//  OTP VERIFICATION
// ══════════════════════════════════════════════════════
let pendingOTPUser = null;
let currentOTP = null;

function generateOTP() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function showOTPModal(user) {
  pendingOTPUser = user;
  currentOTP = generateOTP();
  document.getElementById('otp-email-display').textContent = maskEmail(user.email);
  document.getElementById('otp-demo-value').textContent = currentOTP;
  document.getElementById('otp-error').style.display = 'none';
  ['1', '2', '3', '4', '5', '6'].forEach(i => { document.getElementById('otp-box-' + i).value = ''; });
  document.getElementById('otp-modal').style.display = 'flex';
  setTimeout(() => document.getElementById('otp-box-1').focus(), 100);

  // Simulated delivery — wire this up to a real backend/email provider in production
  console.log(`[OTP EMAIL] To: ${user.email} | OTP: ${currentOTP}`);
  if (user.phone) {
    console.log(`[OTP SMS] To: ${user.phone} | OTP: ${currentOTP}`);
  }
}

function maskEmail(email) {
  const [local, domain] = email.split('@');
  const masked = local.slice(0, 2) + '***' + local.slice(-1);
  return masked + '@' + domain;
}

function otpNext(input, idx) {
  input.value = input.value.replace(/\D/g, '').slice(-1);
  if (input.value && idx < 6) {
    document.getElementById('otp-box-' + (idx + 1)).focus();
  }
  if (idx === 6) verifyOTP();
}

function otpBack(event, idx) {
  if (event.key === 'Backspace' && idx > 1 && !document.getElementById('otp-box-' + idx).value) {
    document.getElementById('otp-box-' + (idx - 1)).focus();
  }
}

function verifyOTP() {
  const entered = ['1', '2', '3', '4', '5', '6'].map(i => document.getElementById('otp-box-' + i).value).join('');
  if (entered.length < 6) {
    showOTPError('Please enter all 6 digits.');
    return;
  }
  if (entered !== currentOTP) {
    showOTPError('Incorrect OTP. Please try again.');
    ['1', '2', '3', '4', '5', '6'].forEach(i => { document.getElementById('otp-box-' + i).value = ''; });
    document.getElementById('otp-box-1').focus();
    return;
  }
  document.getElementById('otp-modal').style.display = 'none';
  loginAs(pendingOTPUser);
  pendingOTPUser = null;
  currentOTP = null;
}

function showOTPError(msg) {
  const el = document.getElementById('otp-error');
  el.textContent = msg;
  el.style.display = 'block';
}

function resendOTP() {
  if (!pendingOTPUser) return;
  currentOTP = generateOTP();
  document.getElementById('otp-demo-value').textContent = currentOTP;
  document.getElementById('otp-error').style.display = 'none';
  ['1', '2', '3', '4', '5', '6'].forEach(i => { document.getElementById('otp-box-' + i).value = ''; });
  document.getElementById('otp-box-1').focus();
  alert('New OTP sent! Check the demo banner for the OTP.');
}

function cancelOTP() {
  document.getElementById('otp-modal').style.display = 'none';
  pendingOTPUser = null;
  currentOTP = null;
}

// ══════════════════════════════════════════════════════
//  LOGIN MODE TOGGLE (Email vs OTP)
// ══════════════════════════════════════════════════════
let loginMode = 'email';

function setLoginMode(mode) {
  loginMode = mode;
  document.getElementById('login-email-fields').style.display = mode === 'email' ? 'block' : 'none';
  document.getElementById('login-otp-fields').style.display = mode === 'otp' ? 'block' : 'none';
  document.getElementById('btn-login-email').classList.toggle('active', mode === 'email');
  document.getElementById('btn-login-otp').classList.toggle('active', mode === 'otp');
}

function doOTPLogin() {
  const email = document.getElementById('si-otp-email').value.trim().toLowerCase();
  const errEl = document.getElementById('si-otp-error');
  errEl.style.display = 'none';
  if (!email) return showError(errEl, 'Please enter your registered email address.');
  const users = getAllUsers();
  const user = users.find(u => u.email === email);
  if (!user) return showError(errEl, 'No account found with this email. Please sign up first.');
  document.getElementById('auth-overlay').style.display = 'none';
  showOTPModal(user);
}

// ══════════════════════════════════════════════════════
//  AUTH SYSTEM
// ══════════════════════════════════════════════════════
function getAllUsers() {
  return JSON.parse(localStorage.getItem('ps_users') || '[]');
}
function saveAllUsers(users) {
  localStorage.setItem('ps_users', JSON.stringify(users));
}
function getCurrentUser() {
  const u = localStorage.getItem('ps_current_user');
  return u ? JSON.parse(u) : null;
}
function setCurrentUser(user) {
  localStorage.setItem('ps_current_user', JSON.stringify(user));
}

function showAuthScreen(name) {
  document.querySelectorAll('.auth-screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-' + name).classList.add('active');
}

/* ══════════════════════════════════════════════════════
//  PASSWORD VALIDATION
// ══════════════════════════════════════════════════════ */
const passwordRules = {
  minLength: { test: (pw) => pw.length >= 6, message: 'Minimum 6 characters' },
  hasLetter: { test: (pw) => /[a-zA-Z]/.test(pw), message: 'At least one alphabet letter (a-z, A-Z)' },
  hasNumber: { test: (pw) => /[0-9]/.test(pw), message: 'At least one number (0-9)' },
  hasSpecial: { test: (pw) => /[!@#$%^&*()_+\-=\[\]{}|;:',.<>?\/\\`~]/.test(pw), message: 'At least one special character (!@#$%...)' }
};

function validatePassword(password) {
  const results = {};
  let validCount = 0;
  const totalRules = Object.keys(passwordRules).length;
  for (const [key, rule] of Object.entries(passwordRules)) {
    results[key] = { valid: rule.test(password), message: rule.message };
    if (rule.test(password)) validCount++;
  }
  let strengthLabel = '', strengthClass = '';
  if (password.length > 0) {
    if (validCount === totalRules && password.length >= 8) { strengthLabel = 'Strong'; strengthClass = 'strong'; }
    else if (validCount >= 3) { strengthLabel = 'Good'; strengthClass = 'good'; }
    else if (validCount >= 2) { strengthLabel = 'Fair'; strengthClass = 'fair'; }
    else { strengthLabel = 'Weak'; strengthClass = 'weak'; }
  }
  return {
    rules: results, validCount, totalRules,
    isValid: validCount === totalRules && password.length > 0,
    strengthLabel, strengthClass
  };
}

function initPasswordRequirements() {
  const passInput = document.getElementById('su-pass');
  const reqContainer = document.getElementById('su-pass-requirements');
  if (!passInput || !reqContainer) return;

  reqContainer.innerHTML = `
    <div class="req-title">Password Requirements:</div>
    <ul>
      <li id="req-minLength"><span class="req-icon">○</span> Minimum 6 characters</li>
      <li id="req-hasLetter"><span class="req-icon">○</span> At least one alphabet letter</li>
      <li id="req-hasNumber"><span class="req-icon">○</span> At least one number</li>
      <li id="req-hasSpecial"><span class="req-icon">○</span> At least one special character</li>
    </ul>
    <div class="password-strength-bar">
      <div class="password-strength-fill" id="strength-fill"></div>
    </div>
    <div class="password-strength-text" id="strength-text"></div>
  `;

  passInput.addEventListener('input', function() {
    const pw = this.value;
    const v = validatePassword(pw);
    for (const [key, result] of Object.entries(v.rules)) {
      const li = document.getElementById('req-' + key);
      if (li) {
        const icon = li.querySelector('.req-icon');
        if (pw.length === 0) { li.className = ''; icon.textContent = '○'; }
        else if (result.valid) { li.className = 'valid'; icon.textContent = '✓'; }
        else { li.className = 'invalid'; icon.textContent = '✗'; }
      }
    }
    const fill = document.getElementById('strength-fill');
    const text = document.getElementById('strength-text');
    if (fill && text) {
      fill.className = 'password-strength-fill';
      text.className = 'password-strength-text';
      if (pw.length === 0) { fill.style.width = '0%'; text.textContent = ''; }
      else { fill.classList.add(v.strengthClass); text.classList.add(v.strengthClass); text.textContent = v.strengthLabel; }
    }
    passInput.dataset.valid = v.isValid ? 'true' : 'false';
  });
}

function getPasswordError() {
  const pass = document.getElementById('su-pass');
  if (!pass || pass.value.length === 0) return 'Password is required.';
  const v = validatePassword(pass.value);
  const missing = [];
  for (const [key, result] of Object.entries(v.rules)) {
    if (!result.valid) missing.push(result.message);
  }
  return 'Password requirements not met:\n• ' + missing.join('\n• ');
}


function doSignUp() {
  const name = document.getElementById('su-name').value.trim();
  const username = document.getElementById('su-username').value.trim().replace(/^@/, '');
  const email = document.getElementById('su-email').value.trim().toLowerCase();
  const phone = document.getElementById('su-phone').value.trim();
  const pass = document.getElementById('su-pass').value;
  const confirm = document.getElementById('su-confirm').value;
  const errEl = document.getElementById('su-error');
  errEl.style.display = 'none';

  if (!name || !username || !email || !pass || !confirm) return showError(errEl, 'Please fill in all required fields.');
  if (pass !== confirm) return showError(errEl, 'Passwords do not match.');
    const passCheck = validatePassword(pass);
  if (!passCheck.isValid) {
    const missing = Object.values(passCheck.rules).filter(r => !r.valid).map(r => r.message);
    return showError(errEl, 'Password: ' + missing.join(', '));
  }

  const users = getAllUsers();
  if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) return showError(errEl, 'Username already taken. Choose another.');
  if (users.find(u => u.email === email)) return showError(errEl, 'An account with this email already exists.');

  const newUser = {
    id: Date.now(),
    name, username, email, phone, password: pass,
    role: users.length === 0 ? 'admin' : 'user',
    joinDate: new Date().toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
  };
  users.push(newUser);
  saveAllUsers(users);

  ['su-name', 'su-username', 'su-email', 'su-phone', 'su-pass', 'su-confirm'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('auth-overlay').style.display = 'none';
  showOTPModal(newUser);
}

function doSignIn() {
  const identifier = document.getElementById('si-user').value.trim().toLowerCase();
  const pass = document.getElementById('si-pass').value;
  const errEl = document.getElementById('si-error');
  errEl.style.display = 'none';

  if (!identifier || !pass) return showError(errEl, 'Please enter your username/email and password.');
  const users = getAllUsers();
  const user = users.find(u => (u.username.toLowerCase() === identifier || u.email === identifier) && u.password === pass);
  if (!user) return showError(errEl, 'Incorrect username/email or password.');

  document.getElementById('auth-overlay').style.display = 'none';
  showOTPModal(user);
}

function loginAs(user) {
  setCurrentUser(user);
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  closeSwitchModal();
  loadUserData(user);
  updateNavUser(user);
  updateAccountsPage();
  renderAll();
  showPage('dashboard');
  scheduleNightReminder();
}

function signOut() {
  if (!confirm('Are you sure you want to sign out?')) return;
  localStorage.removeItem('ps_current_user');
  document.getElementById('app').style.display = 'none';
  document.getElementById('auth-overlay').style.display = 'flex';
  showAuthScreen('signin');
}

function openSwitchUser() {
  renderModalUserList();
  document.getElementById('switch-modal').style.display = 'flex';
}
function closeSwitchModal() {
  document.getElementById('switch-modal').style.display = 'none';
}

function renderModalUserList() {
  const users = getAllUsers();
  const current = getCurrentUser();
  const el = document.getElementById('modal-user-list');
  if (!users.length) { el.innerHTML = '<p class="empty-msg">No registered accounts found.</p>'; return; }

  el.innerHTML = users.map(u => {
    const isMe = current && u.id === current.id;
    return `<div class="switch-user-item ${isMe ? 'current-session' : ''}" onclick="${isMe ? '' : `switchToUser(${u.id})`}">
      <div class="switch-avatar" style="background:${avatarColor(u.username)}">${u.name[0].toUpperCase()}</div>
      <div class="switch-user-info"><h4>${u.name} ${isMe ? '<span style="color:var(--green);font-size:0.75rem;">● You</span>' : ''}</h4><p>@${u.username} · ${u.role}</p></div>
      ${!isMe ? '<span style="color:var(--green-dark); font-size:1.1rem; margin-left:auto;">→</span>' : ''}
    </div>`;
  }).join('');
}

function switchToUser(userId) {
  const users = getAllUsers();
  const user = users.find(u => u.id === userId);
  if (!user) return;
  const pass = prompt(`Enter password for @${user.username}:`);
  if (pass === null) return;
  if (pass !== user.password) { alert('Incorrect password. Switch cancelled.'); return; }
  closeSwitchModal();
  showOTPModal(user);
}

function showError(el, msg) {
  el.textContent = msg;
  el.style.display = 'block';
}

function avatarColor(username) {
  const colors = ['#22c55e', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#06b6d4', '#d97706'];
  let hash = 0;
  for (let i = 0; i < username.length; i++) hash = username.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function updateNavUser(user) {
  document.getElementById('nav-avatar').textContent = user.name[0].toUpperCase();
  document.getElementById('nav-avatar').style.background = avatarColor(user.username);
  document.getElementById('nav-username-display').textContent = user.name.split(' ')[0];
  document.getElementById('dash-welcome-name').textContent = user.name.split(' ')[0];
}

function loadUserData(user) {
  expenses = JSON.parse(localStorage.getItem(`ps_${user.id}_expenses`) || '[]');
  reviews = JSON.parse(localStorage.getItem(`ps_${user.id}_reviews`) || '[]');
  payments = JSON.parse(localStorage.getItem(`ps_${user.id}_payments`) || '[]');
}

function updateAccountsPage() {
  const users = getAllUsers();
  const current = getCurrentUser();
  document.getElementById('acc-total').textContent = users.length;
  document.getElementById('acc-active').textContent = users.length;
  document.getElementById('acc-admins').textContent = users.filter(u => u.role === 'admin').length;

  if (current) {
    document.getElementById('profile-avatar').textContent = current.name[0].toUpperCase();
    document.getElementById('profile-avatar').style.background = avatarColor(current.username);
    document.getElementById('profile-fullname').textContent = current.name;
    document.getElementById('profile-email').textContent = current.email;
    document.getElementById('profile-phone').textContent = current.phone || 'No phone added';
  }

  const tbody = document.getElementById('accounts-table');
  tbody.innerHTML = users.map(u => {
    const isMe = current && u.id === current.id;
    return `<tr style="${isMe ? 'background:rgba(34,197,94,0.08);' : ''}">
      <td><b>@${u.username}</b> ${isMe ? '<span class="badge you">You</span>' : ''}</td>
      <td>${u.name}</td><td>${u.email}</td><td>${u.phone || '—'}</td>
      <td><span class="badge ${u.role}">${u.role.charAt(0).toUpperCase() + u.role.slice(1)}</span></td>
      <td><span class="badge active">Active</span></td>
      <td>${!isMe ? `<button class="btn-switch" style="padding:5px 10px;font-size:0.78rem;" onclick="switchToUser(${u.id})">Switch</button>` : '<span style="color:var(--green);font-size:0.8rem;font-weight:600;">● Active</span>'}</td>
    </tr>`;
  }).join('');
}

// ══════════════════════════════════════════════════════
//  APP STATE
// ══════════════════════════════════════════════════════
let expenses = [];
let reviews = [];
let payments = [];
let feedbackRating = 5;
let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();
let calcVal = '0';
let calcPrev = '';
let calcOpr = '';
let calcNewNum = true;

const COLORS = {
  Food: '#22c55e', Transport: '#f59e0b', Shopping: '#ef4444',
  Entertainment: '#3b82f6', Bills: '#8b5cf6', Health: '#06b6d4',
  Education: '#d97706', Rent: '#64748b', Groceries: '#84cc16',
  Travel: '#f97316', Fuel: '#dc2626', Investment: '#7c3aed', Other: '#6b7280'
};

const PAY_ICONS = { GPay: '🟢', PhonePe: '🟣', Paytm: '🔵', BHIM: '🇮🇳', AmazonPay: '🟠', NetBanking: '🏦', Cash: '💵', Card: '💳' };

function formatINR(amount) {
  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function formatINRShort(amount) {
  return '₹' + Math.round(amount).toLocaleString('en-IN');
}

function capitalizeFirst(input) {
  if (input.value.length >= 1) {
    input.value = input.value.charAt(0).toUpperCase() + input.value.slice(1);
  }
}

// ══════════════════════════════════════════════════════
//  RENDERING
// ══════════════════════════════════════════════════════
let renderTimeout;
function renderAll() {
  if (renderTimeout) clearTimeout(renderTimeout);
  renderTimeout = setTimeout(_renderAll, 50);
}

function _renderAll() {
  const activePage = document.querySelector('.page.active')?.id || '';

  if (document.getElementById('last7days')) renderLast7Days();
  if (document.getElementById('expense-list')) renderExpenseList();

  if (activePage === 'page-dashboard' && document.getElementById('dashCatChart')) {
    renderDashCatChart();
  }
  if (activePage === 'page-stats') renderStats();
  if (activePage === 'page-calendar') renderCalendar();
  if (activePage === 'page-feedback') renderFeedbackSummary();
  if (activePage === 'page-payments') renderPayments();
}

// ── Navigation ───────────────────────────────────────────
function showPage(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(a => a.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  const navEl = document.getElementById('nav-' + page);
  if (navEl) navEl.classList.add('active');

  if (page === 'stats') setTimeout(renderStats, 50); // let the canvas size settle before drawing
  if (page === 'calendar') renderCalendar();
  if (page === 'accounts') updateAccountsPage();
  if (page === 'payments') renderPayments();
}

// ── Expenses ─────────────────────────────────────────────
function saveExpenses() {
  const u = getCurrentUser();
  if (u) localStorage.setItem(`ps_${u.id}_expenses`, JSON.stringify(expenses));
}

function addExpense() {
  const rawDesc = document.getElementById('exp-desc').value.trim();
  const desc = rawDesc ? rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1) : '';
  const amount = parseFloat(document.getElementById('exp-amount').value);
  const cat = document.getElementById('exp-cat').value;
  const date = document.getElementById('exp-date').value;
  if (!desc || !amount || amount <= 0 || !date) { alert('Please fill all fields'); return; }

  expenses.unshift({ id: Date.now(), desc, amount, cat, date });
  saveExpenses();
  document.getElementById('exp-desc').value = '';
  document.getElementById('exp-amount').value = '';
  renderAll();
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses();
  renderAll();
}

function renderExpenseList() {
  const list = document.getElementById('expense-list');
  const total = expenses.reduce((s, e) => s + e.amount, 0);
  document.getElementById('total-display').textContent = 'Total ' + formatINR(total);

  if (!expenses.length) { list.innerHTML = '<p class="empty-msg">No expenses to show</p>'; return; }

  list.innerHTML = expenses.slice(0, 20).map(e => `
    <div class="expense-item">
      <div class="exp-left">
        <div class="exp-cat-dot" style="background:${COLORS[e.cat] || '#6b7280'}"></div>
        <div><div class="exp-desc">${e.desc}</div><div class="exp-meta">${e.cat} · ${e.date}</div></div>
      </div>
      <div style="display:flex; align-items:center;">
        <span class="exp-amount">${formatINR(e.amount)}</span>
        <button class="exp-delete" onclick="deleteExpense(${e.id})">🗑</button>
      </div>
    </div>`).join('');
}

function renderLast7Days() {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const today = new Date();
  const container = document.getElementById('last7days');
  const rows = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const ds = d.toISOString().split('T')[0];
    const total = expenses.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0);
    rows.push(`<div class="day-row"><span>${days[d.getDay()]}</span><span>${formatINR(total)}</span></div>`);
  }
  container.innerHTML = rows.join('');
}

function renderDashCatChart() {
  const canvas = document.getElementById('dashCatChart');
  if (!canvas || canvas.offsetParent === null) return; // not visible, skip drawing

  const cats = {};
  expenses.forEach(e => cats[e.cat] = (cats[e.cat] || 0) + e.amount);
  const keys = Object.keys(cats);
  const msg = document.getElementById('no-cat-msg');

  if (!keys.length) {
    msg.style.display = 'block';
    canvas.style.display = 'none';
    document.getElementById('cat-legend').innerHTML = '';
    if (window._dashPieChart) { window._dashPieChart.destroy(); window._dashPieChart = null; }
    return;
  }

  msg.style.display = 'none';
  canvas.style.display = 'block';
  if (window._dashPieChart) { window._dashPieChart.destroy(); window._dashPieChart = null; }

  window._dashPieChart = new Chart(canvas, {
    type: 'doughnut',
    data: {
      labels: keys,
      datasets: [{ data: keys.map(k => cats[k]), backgroundColor: keys.map(k => COLORS[k] || '#6b7280'), borderWidth: 2 }]
    },
    options: { responsive: true, plugins: { legend: { display: false } }, cutout: '40%' }
  });

  document.getElementById('cat-legend').innerHTML = keys.map(k => `
    <div style="display:flex; align-items:center; gap:6px; margin-bottom:4px; font-size:0.82rem;">
      <div style="width:10px; height:10px; border-radius:50%; background:${COLORS[k] || '#6b7280'}"></div>
      <span>${k}: ${formatINRShort(cats[k])}</span>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════
//  STATS — built entirely from the current user's expenses
// ══════════════════════════════════════════════════════
function onStatsPeriodChange() {
  const val = document.getElementById('stats-period').value;
  document.getElementById('stats-custom-range').style.display = val === 'custom' ? 'flex' : 'none';
  if (val === 'custom') {
    const today = new Date().toISOString().split('T')[0];
    if (!document.getElementById('stats-from').value) document.getElementById('stats-from').value = today;
    if (!document.getElementById('stats-to').value) document.getElementById('stats-to').value = today;
  }
  renderStats();
}

function getFilteredExpenses() {
  const period = document.getElementById('stats-period') ? document.getElementById('stats-period').value : 'monthly';
  const now = new Date();

  if (period === 'weekly') {
    const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
    const end = new Date(now); end.setHours(23, 59, 59, 999);
    return expenses.filter(e => { const d = new Date(e.date); return d >= start && d <= end; });
  }
  if (period === 'monthly') {
    return expenses.filter(e => { const d = new Date(e.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
  }
  if (period === 'annually') {
    return expenses.filter(e => new Date(e.date).getFullYear() === now.getFullYear());
  }
  if (period === 'custom') {
    const from = document.getElementById('stats-from').value;
    const to = document.getElementById('stats-to').value;
    if (!from || !to) return expenses;
    return expenses.filter(e => e.date >= from && e.date <= to);
  }
  return expenses;
}

function makeChart(canvasId, config) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  if (window['_chart_' + canvasId]) {
    window['_chart_' + canvasId].destroy();
    window['_chart_' + canvasId] = null;
  }
  window['_chart_' + canvasId] = new Chart(canvas, config);
}

function renderStats() {
  const filtered = getFilteredExpenses();
  const total = filtered.reduce((s, e) => s + e.amount, 0);
  const cats = {};
  filtered.forEach(e => cats[e.cat] = (cats[e.cat] || 0) + e.amount);
  const catKeys = Object.keys(cats);
  const avg = catKeys.length ? total / catKeys.length : 0;
  const topCat = [...catKeys].sort((a, b) => cats[b] - cats[a])[0] || '—';

  const pieData = catKeys.map(k => cats[k]);
  const pieLabels = catKeys;
  const pieColors = pieLabels.map(k => COLORS[k] || '#6b7280');

  document.getElementById('stat-total').textContent = formatINR(total);
  document.getElementById('stat-avg').textContent = formatINR(avg);
  document.getElementById('stat-top-cat').textContent = topCat;
  document.getElementById('stat-top-amt').textContent = topCat !== '—' ? formatINR(cats[topCat]) : '';

  // ── Pie chart ──
  makeChart('statsPieChart', {
    type: 'pie',
    data: {
      labels: pieLabels,
      datasets: [{ data: pieData, backgroundColor: pieColors, borderWidth: 2 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } } }
    }
  });

  // ── Bar chart (period-sensitive) ──
  const period = document.getElementById('stats-period') ? document.getElementById('stats-period').value : 'monthly';
  let barLabels, barData;

  if (period === 'weekly') {
    barLabels = [];
    barData = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now); d.setDate(now.getDate() - i);
      const ds = d.toISOString().split('T')[0];
      barLabels.push(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d.getDay()]);
      barData.push(filtered.filter(e => e.date === ds).reduce((s, e) => s + e.amount, 0));
    }
    document.getElementById('bar-chart-title').textContent = 'Daily Spending (This Week)';
  } else if (period === 'annually') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    barLabels = months;
    barData = months.map((_, mi) => filtered.filter(e => new Date(e.date).getMonth() === mi).reduce((s, e) => s + e.amount, 0));
    document.getElementById('bar-chart-title').textContent = 'Monthly Spending (This Year)';
  } else if (period === 'monthly') {
    barLabels = ['W1', 'W2', 'W3', 'W4', 'W5'];
    barData = [0, 0, 0, 0, 0];
    filtered.forEach(e => {
      const day = new Date(e.date).getDate();
      const wi = Math.min(Math.floor((day - 1) / 7), 4);
      barData[wi] += e.amount;
    });
    document.getElementById('bar-chart-title').textContent = 'Weekly Breakdown (This Month)';
  } else {
    barLabels = ['Custom Period'];
    barData = [total];
    document.getElementById('bar-chart-title').textContent = 'Custom Period Total';
  }

  makeChart('statsBarChart', {
    type: 'bar',
    data: {
      labels: barLabels,
      datasets: [{ label: 'Spending (₹)', data: barData, backgroundColor: '#22c55e', borderRadius: 6 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f0fdf4' }, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } },
        x: { grid: { display: false } }
      }
    }
  });

  // ── Line chart (full-year monthly trend, not affected by the period filter) ──
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const year = new Date().getFullYear();
  const monthlyTotals = months.map((_, mi) =>
    expenses.filter(e => { const d = new Date(e.date); return d.getFullYear() === year && d.getMonth() === mi; })
      .reduce((s, e) => s + e.amount, 0)
  );

  makeChart('statsLineChart', {
    type: 'line',
    data: {
      labels: months,
      datasets: [{
        label: 'Monthly Expenses (₹)',
        data: monthlyTotals,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,0.1)',
        tension: 0.4, fill: true,
        pointBackgroundColor: '#22c55e', pointRadius: 5
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: '#22c55e', font: { size: 11 } } } },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f0fdf4' }, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } },
        x: { grid: { display: false } }
      }
    }
  });

  // ── Month-by-month comparison bar chart ──
  const maxMonth = monthlyTotals.reduce((max, v, i, arr) => v > arr[max] ? i : max, 0);
  const hasYearData = monthlyTotals.some(v => v > 0);
  const bgColors = monthlyTotals.map((_, i) => hasYearData && i === maxMonth ? '#ef4444' : '#3b82f6');

  makeChart('statsMonthCompareChart', {
    type: 'bar',
    data: {
      labels: months,
      datasets: [{ label: 'Expenses (₹)', data: monthlyTotals, backgroundColor: bgColors, borderRadius: 6 }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: ctx => '₹' + ctx.raw.toLocaleString('en-IN') } }
      },
      scales: {
        y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { callback: v => '₹' + v.toLocaleString('en-IN') } },
        x: { grid: { display: false } }
      }
    }
  });

  // ── Category summary cards ──
  const allCats = Object.keys(COLORS);
  document.getElementById('cat-summary-cards').innerHTML = allCats.map(c => {
    const amt = cats[c] || 0;
    const pct = total > 0 ? ((amt / total) * 100).toFixed(1) : 0;
    return `<div class="cat-card">
      <div><span class="cat-dot" style="background:${COLORS[c]}"></span><span style="font-size:0.85rem; font-weight:600;">${c}</span></div>
      <div class="amt">${formatINRShort(amt)}</div>
      <div class="pct">${pct}% of total</div>
    </div>`;
  }).join('');
}

// ══════════════════════════════════════════════════════
//  CALENDAR
// ══════════════════════════════════════════════════════
function renderCalendar() {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  document.getElementById('cal-title').textContent = monthNames[calMonth] + ' ' + calYear;

  const expensesByDate = {};
  expenses.forEach(e => {
    if (!expensesByDate[e.date]) expensesByDate[e.date] = [];
    expensesByDate[e.date].push(e);
  });

  let html = '';
  for (let i = 0; i < firstDay; i++) html += '<div></div>';
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const dayExp = expensesByDate[ds] || [];
    const total = dayExp.reduce((s, e) => s + e.amount, 0);
    const isToday = ds === todayStr ? 'today' : '';
    html += `<div class="cal-day ${isToday}" onclick="openCalendarDay('${ds}')">
      <span>${d}</span>
      ${total > 0 ? `<div class="cal-day-dot"></div><div class="cal-day-amount">${formatINRShort(total)}</div>` : ''}
    </div>`;
  }
  document.getElementById('cal-grid').innerHTML = html;

  const recs = document.getElementById('cal-records');
  const monthExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getFullYear() === calYear && d.getMonth() === calMonth;
  });
  recs.innerHTML = monthExpenses.length
    ? monthExpenses.map(e => `
      <div class="expense-item">
        <div class="exp-left">
          <div class="exp-cat-dot" style="background:${COLORS[e.cat] || '#6b7280'}"></div>
          <div><div class="exp-desc">${e.desc}</div><div class="exp-meta">${e.cat} · ${e.date}</div></div>
        </div>
        <span class="exp-amount">${formatINR(e.amount)}</span>
      </div>`).join('')
    : '<p class="empty-msg">No records yet</p>';
}

function openCalendarDay(ds) {
  document.getElementById('cal-modal-date-label').textContent = ds;
  document.getElementById('cal-exp-date').value = ds;
  document.getElementById('cal-exp-desc').value = '';
  document.getElementById('cal-exp-amount').value = '';

  const dayExp = expenses.filter(e => e.date === ds);
  const el = document.getElementById('cal-day-expenses');
  if (dayExp.length) {
    el.innerHTML = `<h4 style="font-size:0.85rem; font-weight:700; margin-bottom:8px; color:var(--text-muted);">Expenses on this day</h4>` +
      dayExp.map(e => `<div class="expense-item" style="padding:8px 0;">
        <div class="exp-left"><div class="exp-cat-dot" style="background:${COLORS[e.cat] || '#6b7280'}"></div>
        <div><div class="exp-desc" style="font-size:0.85rem;">${e.desc}</div><div class="exp-meta">${e.cat}</div></div></div>
        <div style="display:flex;align-items:center;gap:6px;">
          <span class="exp-amount" style="font-size:0.88rem;">${formatINR(e.amount)}</span>
          <button class="exp-delete" onclick="deleteExpense(${e.id}); openCalendarDay('${ds}')">🗑</button>
        </div>
      </div>`).join('');
  } else {
    el.innerHTML = '<p style="font-size:0.82rem; color:var(--text-muted); margin-top:8px;">No expenses on this day yet.</p>';
  }
  document.getElementById('cal-add-modal').style.display = 'flex';
}

function addExpenseFromCalendar() {
  const rawDesc = document.getElementById('cal-exp-desc').value.trim();
  const desc = rawDesc ? rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1) : '';
  const amount = parseFloat(document.getElementById('cal-exp-amount').value);
  const cat = document.getElementById('cal-exp-cat').value;
  const date = document.getElementById('cal-exp-date').value;
  if (!desc || !amount || amount <= 0) { alert('Please enter description and amount'); return; }

  expenses.unshift({ id: Date.now(), desc, amount, cat, date });
  saveExpenses();
  document.getElementById('cal-add-modal').style.display = 'none';
  renderAll();
}

function changeMonth(delta) {
  calMonth += delta;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

// ══════════════════════════════════════════════════════
//  CALCULATOR
// ══════════════════════════════════════════════════════
function calcNum(n) {
  if (calcNewNum) { calcVal = n === '.' ? '0.' : n; calcNewNum = false; }
  else { if (n === '.' && calcVal.includes('.')) return; calcVal += n; }
  document.getElementById('calc-display').textContent = calcVal;
}
function calcOp(op) {
  calcPrev = calcVal; calcOpr = op; calcNewNum = true;
  document.getElementById('calc-expr').textContent = calcVal + ' ' + op;
}
function calcEqual() {
  if (!calcOpr) return;
  const a = parseFloat(calcPrev), b = parseFloat(calcVal);
  let result;
  if (calcOpr === '+') result = a + b;
  else if (calcOpr === '-') result = a - b;
  else if (calcOpr === '*') result = a * b;
  else if (calcOpr === '/') result = b !== 0 ? a / b : 'Error';

  const expr = `${a} ${calcOpr} ${b} = ${result}`;
  const hist = document.getElementById('calc-history');
  if (hist.querySelector('.empty-msg')) hist.innerHTML = '';
  hist.innerHTML = `<div class="hist-item">${expr}</div>` + hist.innerHTML;

  calcVal = String(result); calcPrev = ''; calcOpr = ''; calcNewNum = true;
  document.getElementById('calc-display').textContent = calcVal;
  document.getElementById('calc-expr').textContent = '';
}
function calcClear() {
  calcVal = '0'; calcPrev = ''; calcOpr = ''; calcNewNum = true;
  document.getElementById('calc-display').textContent = '0';
  document.getElementById('calc-expr').textContent = '';
}
function calcBack() {
  if (calcNewNum) return;
  calcVal = calcVal.length > 1 ? calcVal.slice(0, -1) : '0';
  document.getElementById('calc-display').textContent = calcVal;
}

// ══════════════════════════════════════════════════════
//  FEEDBACK
// ══════════════════════════════════════════════════════
function saveReviews() {
  const u = getCurrentUser();
  if (u) localStorage.setItem(`ps_${u.id}_reviews`, JSON.stringify(reviews));
}
function setRating(n) {
  feedbackRating = n;
  document.querySelectorAll('.star').forEach((s, i) => s.classList.toggle('active', i < n));
}
function submitFeedback() {
  const name = document.getElementById('fb-name').value.trim();
  const email = document.getElementById('fb-email').value.trim();
  const msg = document.getElementById('fb-message').value.trim();
  if (!name || !msg) { alert('Please fill name and message'); return; }

  reviews.push({ name, email, rating: feedbackRating, msg, date: new Date().toLocaleDateString() });
  saveReviews();
  document.getElementById('fb-name').value = '';
  document.getElementById('fb-email').value = '';
  document.getElementById('fb-message').value = '';
  renderFeedbackSummary();
  alert('Thank you for your feedback!');
}
function renderFeedbackSummary() {
  if (!reviews.length) {
    document.getElementById('avg-rating').textContent = '0';
    document.getElementById('avg-stars').innerHTML = '☆☆☆☆☆';
    document.getElementById('review-count').textContent = 'Based on 0 reviews';
    document.getElementById('rating-bars').innerHTML = [5, 4, 3, 2, 1].map(r =>
      `<div class="rating-bar"><span>${r}★</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:0%"></div></div><span>0</span></div>`
    ).join('');
    document.getElementById('reviews-list').innerHTML = '<p class="empty-msg">No reviews yet</p>';
    return;
  }

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
  const filled = Math.round(avg);
  document.getElementById('avg-rating').textContent = avg.toFixed(1);
  document.getElementById('avg-stars').innerHTML = '★'.repeat(filled) + '☆'.repeat(5 - filled);
  document.getElementById('review-count').textContent = `Based on ${reviews.length} review${reviews.length > 1 ? 's' : ''}`;

  document.getElementById('rating-bars').innerHTML = [5, 4, 3, 2, 1].map(r => {
    const cnt = reviews.filter(rv => rv.rating === r).length;
    const pct = ((cnt / reviews.length) * 100).toFixed(0);
    return `<div class="rating-bar"><span>${r}★</span><div class="rating-bar-track"><div class="rating-bar-fill" style="width:${pct}%"></div></div><span>${cnt}</span></div>`;
  }).join('');

  document.getElementById('reviews-list').innerHTML = reviews.slice().reverse().slice(0, 5).map(r => `
    <div class="review-item">
      <div class="review-meta"><span><b>${r.name}</b> · ${r.date}</span><span class="review-stars">${'★'.repeat(r.rating)}${'☆'.repeat(5 - r.rating)}</span></div>
      <p style="font-size:0.88rem;">${r.msg}</p>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════
//  PAYMENT TRACKING
// ══════════════════════════════════════════════════════
function savePayments() {
  const u = getCurrentUser();
  if (u) localStorage.setItem(`ps_${u.id}_payments`, JSON.stringify(payments));
}

// ══════════════════════════════════════════════════════
//  SMART UPI SMS PARSER
// ══════════════════════════════════════════════════════
function parseUPISMS() {
  const smsText = document.getElementById('pay-sms-parser').value.trim();
  if (!smsText) { alert('Please paste the UPI SMS first.'); return; }

  let amount = '', txnId = '', merchant = '';

  // 1. Extract Amount
  const amountRegex = /(?:Rs\.?|INR)\s*([\d,]+\.?\d*)/i;
  const amountMatch = smsText.match(amountRegex);
  if (amountMatch) amount = amountMatch[1].replace(/,/g, '');

  // 2. Extract Transaction ID
  const txnRegex = /(?:Txn\s*ID?:?|Ref\s*No\.?:?)\s*(\d{10,16})/i;
  const txnMatch = smsText.match(txnRegex);
  if (txnMatch) txnId = txnMatch[1];

  // 3. Extract Merchant Name
  const merchantRegex = /(?:to|at|paid to|for)\s+([A-Za-z0-9\s]+?)(?:\s+on|\s*\.|\s*Ref|\s*Txn|$)/i;
  const merchantMatch = smsText.match(merchantRegex);
  if (merchantMatch) {
    merchant = merchantMatch[1].replace(/[^a-zA-Z0-9\s]/g, '').trim();
    if (merchant.length > 0) merchant = merchant.charAt(0).toUpperCase() + merchant.slice(1).toLowerCase();
  }

  // 4. Auto-fill the form
  if (amount) document.getElementById('pay-amount').value = amount;
  if (txnId) document.getElementById('pay-txn').value = txnId;
  if (merchant) document.getElementById('pay-desc').value = merchant;

  // 5. Auto-detect App
  const smsLower = smsText.toLowerCase();
  if (smsLower.includes('google pay') || smsLower.includes('gpay')) document.getElementById('pay-app').value = 'GPay';
  else if (smsLower.includes('phonepe') || smsLower.includes('phone pe')) document.getElementById('pay-app').value = 'PhonePe';
  else if (smsLower.includes('paytm')) document.getElementById('pay-app').value = 'Paytm';
  else if (smsLower.includes('bhim')) document.getElementById('pay-app').value = 'BHIM';

  // 6. Extract Date
  const dateRegex = /on\s*(\d{2}-\d{2}-\d{2})/i;
  const dateMatch = smsText.match(dateRegex);
  if (dateMatch) {
    const parts = dateMatch[1].split('-');
    if (parts.length === 3) {
      let year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
      document.getElementById('pay-date').value = `${year}-${parts[1]}-${parts[0]}`;
    }
  }

  document.getElementById('pay-sms-parser').value = '';
  
  if (amount || txnId || merchant) {
    alert(`✅ Smart Parser Success!\n\n• Amount: ₹${amount || 'N/A'}\n• TXN ID: ${txnId || 'N/A'}\n• Merchant: ${merchant || 'N/A'}\n\nPlease select a Category and click Save.`);
  } else {
    alert("❌ Could not detect UPI details. Make sure you pasted the correct bank SMS.");
  }
}

function addPayment() {
  const app = document.getElementById('pay-app').value;
  const txn = document.getElementById('pay-txn').value.trim();
  const amount = parseFloat(document.getElementById('pay-amount').value);
  const rawDesc = document.getElementById('pay-desc').value.trim();
  const desc = rawDesc ? rawDesc.charAt(0).toUpperCase() + rawDesc.slice(1) : '';
  const cat = document.getElementById('pay-cat').value;
  const date = document.getElementById('pay-date').value;
  if (!amount || amount <= 0 || !desc || !date) { alert('Please fill amount, description, and date'); return; }

  const payment = { id: Date.now(), app, txn, amount, desc, cat, date };
  payments.unshift(payment);
  savePayments();
  document.getElementById('pay-amount').value = '';
  document.getElementById('pay-txn').value = '';
  document.getElementById('pay-desc').value = '';
  document.getElementById('payment-modal').style.display = 'none';
  renderPayments();

  if (confirm(`💳 Payment saved!\n\nDo you also want to add ₹${amount} (${desc}) to your Expense Tracker?`)) {
    expenses.unshift({ id: Date.now(), desc, amount, cat, date, source: app });
    saveExpenses();
    renderAll();
    alert(`✅ Added to Expense Tracker as "${app} Payment" — you can see it on Dashboard.`);
  }
}

function deletePayment(id) {
  payments = payments.filter(p => p.id !== id);
  savePayments();
  renderPayments();
}

function renderPayments() {
  const filterApp = document.getElementById('pay-filter-app') ? document.getElementById('pay-filter-app').value : '';
  const filtered = filterApp ? payments.filter(p => p.app === filterApp) : payments;

  const total = payments.reduce((s, p) => s + p.amount, 0);
  document.getElementById('pay-stat-total').textContent = formatINRShort(total);
  document.getElementById('pay-stat-count').textContent = payments.length;

  const appCounts = {};
  payments.forEach(p => appCounts[p.app] = (appCounts[p.app] || 0) + 1);
  const topApp = Object.keys(appCounts).sort((a, b) => appCounts[b] - appCounts[a])[0] || '—';
  document.getElementById('pay-stat-app').textContent = topApp !== '—' ? (PAY_ICONS[topApp] || '') + ' ' + topApp : '—';

  const list = document.getElementById('payment-list');
  if (!filtered.length) {
    list.innerHTML = `<p class="empty-msg">No payment records${filterApp ? ' for ' + filterApp : ''} yet.<br><small style="font-size:0.8rem;">Click "Track New Payment" after each UPI/bank payment to record it here.</small></p>`;
    return;
  }

  list.innerHTML = filtered.map(p => `
    <div class="expense-item">
      <div class="exp-left">
        <div style="width:38px; height:38px; border-radius:10px; background:rgba(34,197,94,0.08); display:flex; align-items:center; justify-content:center; font-size:1.3rem;">${PAY_ICONS[p.app] || '💳'}</div>
        <div>
          <div class="exp-desc">${p.desc}</div>
          <div class="exp-meta">${p.app} ${p.txn ? '· TXN: ' + p.txn : ''} · ${p.cat} · ${p.date}</div>
        </div>
      </div>
      <div style="display:flex; align-items:center;">
        <span class="exp-amount">${formatINR(p.amount)}</span>
        <button class="exp-delete" onclick="deletePayment(${p.id})">🗑</button>
      </div>
    </div>`).join('');
}

// ══════════════════════════════════════════════════════
//  CONTACT FORM (no backend yet — front-end confirmation only)
// ══════════════════════════════════════════════════════
function submitContact() {
  const name = document.getElementById('ct-name').value.trim();
  const email = document.getElementById('ct-email').value.trim();
  const msg = document.getElementById('ct-message').value.trim();
  if (!name || !email || !msg) { alert('Please fill in name, email, and message.'); return; }

  document.getElementById('ct-name').value = '';
  document.getElementById('ct-email').value = '';
  document.getElementById('ct-subject').value = '';
  document.getElementById('ct-message').value = '';
  alert("✅ Message sent! We'll get back to you at " + email + ' shortly.');
}

// ══════════════════════════════════════════════════════
//  NIGHT REMINDER — daily 8 PM nudge
// ══════════════════════════════════════════════════════
function scheduleNightReminder() {
  const now = new Date();
  const target = new Date();
  target.setHours(20, 0, 0, 0);
  if (now >= target) target.setDate(target.getDate() + 1);
  const delay = target - now;

  console.log(`[REMINDER] Next 8PM reminder in ${Math.round(delay / 60000)} minutes`);

  setTimeout(() => {
    const user = getCurrentUser();
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const todayTotal = expenses.filter(e => e.date === today).reduce((s, e) => s + e.amount, 0);

    let msg, smsMsg;
    if (todayTotal > 0) {
      msg = `You've tracked ${formatINR(todayTotal)} today. Keep it up! 🎉`;
      smsMsg = `AAPG Expense Tracker: You've tracked ₹${Math.round(todayTotal)} today. Great job! Track more at your app.`;
    } else {
      msg = `You haven't tracked any expenses today. Don't forget! 📋`;
      smsMsg = `AAPG Expense Tracker: Have you tracked your expenses today? Don't forget to log them! Open your app now.`;
    }

    document.getElementById('notif-message').textContent = msg;
    document.getElementById('night-notification').style.display = 'flex';
    setTimeout(() => { document.getElementById('night-notification').style.display = 'none'; }, 15000);

    // Simulated delivery — wire this up to a real backend/SMS provider in production
    console.log(`[8PM SMS REMINDER] To: ${user.phone || 'no phone'} | Message: ${smsMsg}`);
    console.log(`[8PM EMAIL REMINDER] To: ${user.email} | Message: ${smsMsg}`);

    scheduleNightReminder();
  }, delay);
}

// ══════════════════════════════════════════════════════
//  MORE MENU, MODALS & HELP
// ══════════════════════════════════════════════════════
function toggleMoreMenu() {
    document.getElementById('more-dropdown').classList.toggle('active');
}
function closeMoreMenu() {
    document.getElementById('more-dropdown').classList.remove('active');
}
function openModal(id) { document.getElementById(id).style.display = 'flex'; }
function closeModal(id) { document.getElementById(id).style.display = 'none'; }

// Close dropdown if clicking outside
document.addEventListener('click', function(e) {
    if (!e.target.closest('.more-menu-wrap')) closeMoreMenu();
});

// ══════════════════════════════════════════════════════
//  EXPORT REPORTS
// ══════════════════════════════════════════════════════
function getExportData() {
    const period = document.getElementById('export-period').value;
    const now = new Date();
    let filtered = [];
    
    if (period === 'weekly') {
        const start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0,0,0,0);
        const end = new Date(now); end.setHours(23,59,59,999);
        filtered = expenses.filter(e => { const d = new Date(e.date); return d >= start && d <= end; });
    } else if (period === 'monthly') {
        filtered = expenses.filter(e => { const d = new Date(e.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
    } else {
        filtered = expenses.filter(e => new Date(e.date).getFullYear() === now.getFullYear());
    }
    return filtered.map(e => ({ Date: e.date, Description: e.desc, Category: e.cat, Amount: e.amount }));
}

function exportData(type) {
    const data = getExportData();
    if (!data.length) { alert('No expenses found for this period.'); return; }
    const user = getCurrentUser();
    const fileName = `AAPG_Expense_Report_${new Date().toISOString().split('T')[0]}`;

    if (type === 'excel') {
        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Expenses");
        XLSX.writeFile(wb, `${fileName}.xlsx`);
    } 
    else if (type === 'csv') {
        const ws = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(ws);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${fileName}.csv`; link.click();
    } 
    else if (type === 'pdf') {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        doc.setFontSize(16); doc.text(`Expense Report - ${user.name}`, 14, 20);
        doc.setFontSize(10); doc.setTextColor(100); doc.text(`Generated on: ${new Date().toLocaleString()}`, 14, 28);
        doc.autoTable({ startY: 35, head: [['Date', 'Description', 'Category', 'Amount']], body: data.map(e => [e.Date, e.Description, e.Category, '₹' + e.amount]) });
        doc.save(`${fileName}.pdf`);
    } 
    else if (type === 'word') {
        let tableHtml = `<table border="1" style="border-collapse:collapse; width:100%; font-family:sans-serif;"><tr style="background:#22c55e;color:#fff;"><th>Date</th><th>Description</th><th>Category</th><th>Amount</th></tr>`;
        data.forEach(e => { tableHtml += `<tr><td>${e.Date}</td><td>${e.Description}</td><td>${e.Category}</td><td>₹${e.amount}</td></tr>`; });
        tableHtml += `</table>`;
        const html = `<html><head><meta charset="utf-8"><title>Report</title></head><body><h2>Expense Report - ${user.name}</h2><p>Generated: ${new Date().toLocaleString()}</p>${tableHtml}</body></html>`;
        const blob = new Blob(['\ufeff', html], { type: "application/msword" });
        const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${fileName}.doc`; link.click();
    }
    closeModal('export-modal');
    alert(`✅ ${type.toUpperCase()} report downloaded successfully!`);
}

// ══════════════════════════════════════════════════════
//  BACKUP & RESTORE
// ══════════════════════════════════════════════════════
function downloadBackup() {
    const backupData = {};
    for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key.startsWith('ps_') || key === 'aapg-theme') {
            backupData[key] = localStorage.getItem(key);
        }
    }
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const link = document.createElement("a"); link.href = URL.createObjectURL(blob); 
    link.download = `AAPG_Backup_${new Date().toISOString().split('T')[0]}.json`; link.click();
    alert('✅ Backup downloaded successfully! Keep this file safe.');
}

function restoreBackup() {
    const fileInput = document.getElementById('restore-file-input');
    if (!fileInput.files.length) { alert('Please select a backup file first.'); return; }
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            if (confirm('⚠️ This will overwrite all your current data. Are you sure?')) {
                // Clear old ps_ data
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key.startsWith('ps_')) keysToRemove.push(key);
                }
                keysToRemove.forEach(k => localStorage.removeItem(k));
                
                // Restore new data
                for (const key in data) { localStorage.setItem(key, data[key]); }
                alert('✅ Data restored successfully! The page will reload now.');
                location.reload();
            }
        } catch (err) {
            alert('❌ Invalid backup file.');
        }
    };
    reader.readAsText(fileInput.files[0]);
}

// ══════════════════════════════════════════════════════
//  PASSKEY SYSTEM
// ══════════════════════════════════════════════════════
function savePasskey() {
    const user = getCurrentUser();
    if (!user) return;
    const newPasskey = document.getElementById('new-passkey-input').value.trim();
    if (!newPasskey || newPasskey.length < 4) {
        alert('Passkey must be at least 4 characters.');
        return;
    }
    
    user.passkey = newPasskey;
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) { users[idx].passkey = newPasskey; saveAllUsers(users); }
    
    document.getElementById('new-passkey-input').value = '';
    closeModal('passkey-modal');
    alert(`✅ Passkey saved! You can now use "${newPasskey}" on the login screen to login directly without OTP.`);
}

function removePasskey() {
    if (!confirm('Are you sure you want to remove your quick login passkey?')) return;
    const user = getCurrentUser();
    if (!user) return;
    user.passkey = null;
    const users = getAllUsers();
    const idx = users.findIndex(u => u.id === user.id);
    if (idx !== -1) { users[idx].passkey = null; saveAllUsers(users); }
    document.getElementById('new-passkey-input').value = '';
    alert('✅ Passkey removed successfully.');
}

function shareApp() {
    const shareText = "Check out this amazing Expense Tracker by AAPG Public Service! Track your daily finances easily.";
    const shareUrl = window.location.href;
    
    if (navigator.share) {
        navigator.share({
            title: 'AAPG Expense Tracker',
            text: shareText,
            url: shareUrl
        }).catch(err => console.log('Error sharing:', err));
    } else {
        // Fallback for browsers that don't support Web Share API (like Desktop Chrome)
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`;
        window.open(whatsappUrl, '_blank');
    }
}

function loginWithPasskey() {
    const passkey = prompt('Enter your 6-digit Passkey:');
    if (passkey === null) return;
    if (passkey.length !== 6) return alert('Passkey must be exactly 6 digits.');
    
    const users = getAllUsers();
    const user = users.find(u => u.passkey === passkey);
    if (!user) return alert('Incorrect Passkey.');
    
    // DIRECT LOGIN - NO OTP REQUIRED
    loginAs(user);
}



// ══════════════════════════════════════════════════════
//  DARK MODE
// ══════════════════════════════════════════════════════
function applyTheme(theme) {
  const body = document.body;
  const themeToggle = document.getElementById('theme-toggle');
  if (theme === 'dark') {
    body.classList.add('dark-mode');
    if (themeToggle) themeToggle.textContent = '☀️';
    localStorage.setItem('aapg-theme', 'dark');
  } else {
    body.classList.remove('dark-mode');
    if (themeToggle) themeToggle.textContent = '🌙';
    localStorage.setItem('aapg-theme', 'light');
  }
}

function toggleTheme() {
  const isDarkMode = document.body.classList.contains('dark-mode');
  applyTheme(isDarkMode ? 'light' : 'dark');
}

// ══════════════════════════════════════════════════════
//  INIT
// ══════════════════════════════════════════════════════
(function init() {
  applyTheme(localStorage.getItem('aapg-theme') || 'light');
  document.getElementById('exp-date').value = new Date().toISOString().split('T')[0];

  // ALWAYS show login page — clear any saved session
  localStorage.removeItem('ps_current_user');
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  showAuthScreen('signin');

  // Initialize password requirements UI
  initPasswordRequirements();
})();
