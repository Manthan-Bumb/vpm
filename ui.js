// ═══════════════════════════════════════════
//  VAULT — UI ENGINE
// ═══════════════════════════════════════════

// ── TOAST ─────────────────────────────────
function showToast(msg, icon = '') {
  const container = document.getElementById('toast-container');
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = icon
    ? `<span>${icon}</span><span>${msg}</span>`
    : `<span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 350);
  }, 3500);
}

// ── MODAL ─────────────────────────────────
let activeModal = null;
function openModal(html) {
  const overlay = document.getElementById('modal-overlay');
  document.getElementById('modal-body').innerHTML = html;
  overlay.classList.add('open');
  activeModal = overlay;
}
function closeModal() {
  if (activeModal) activeModal.classList.remove('open');
}

// ── NAVIGATION ────────────────────────────
function navigate(screen) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.querySelectorAll('.pill-item').forEach(a => a.classList.remove('active'));

  const el = document.getElementById(screen + '-screen');
  if (el) el.classList.add('active');

  const pill = document.querySelector(`.pill-item[data-screen="${screen}"]`);
  if (pill) pill.classList.add('active');

  AppState.currentScreen = screen;

  const renders = {
    dashboard:    renderDashboard,
    add:          renderAddPage,
    transactions: renderTransactions,
    analytics:    renderAnalytics,
    goals:        renderGoals,
  };
  if (renders[screen]) renders[screen]();
}

// ── AUTH ──────────────────────────────────
function initLogin() {
  // Tab switching handled inline
}

function setTab(tab) {
  document.getElementById('tab-login').classList.toggle('active', tab === 'login');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
  document.getElementById('login-form').style.display  = tab === 'login'  ? 'flex' : 'none';
  document.getElementById('signup-form').style.display = tab === 'signup' ? 'flex' : 'none';
}

function doLogin() {
  const email = document.getElementById('login-email').value.trim();
  const pass  = document.getElementById('login-pass').value;
  if (!email || !pass) { showToast('Please fill in all fields'); return; }
  const users = JSON.parse(localStorage.getItem('pf_users') || '[]');
  const user  = users.find(u => u.email === email && u.pass === pass);
  enterApp(user || { name: email.split('@')[0] || 'User', email });
}

function doSignup() {
  const name  = document.getElementById('signup-name').value.trim();
  const email = document.getElementById('signup-email').value.trim();
  const pass  = document.getElementById('signup-pass').value;
  if (!name || !email || !pass) { showToast('Please fill in all fields'); return; }
  const users = JSON.parse(localStorage.getItem('pf_users') || '[]');
  users.push({ name, email, pass });
  localStorage.setItem('pf_users', JSON.stringify(users));
  enterApp({ name, email });
}

function enterApp(user) {
  AppState.user = user;
  AppState.save();

  const loginScreen = document.getElementById("login-screen");
  loginScreen.style.transition = "opacity 0.5s ease";
  loginScreen.style.opacity = "0";
  loginScreen.style.pointerEvents = "none";
  setTimeout(() => { loginScreen.style.display = "none"; }, 520);

  document.getElementById("nav-user-name").textContent = user.name.charAt(0).toUpperCase();
  document.getElementById("nav-username-display").textContent = user.name;

  setTimeout(() => {
    document.getElementById("nav").classList.add("visible");
    document.getElementById("app").classList.add("visible");
    navigate("dashboard");
    showToast("Welcome back, " + user.name);
  }, 300);
}

function doLogout() {
  AppState.user = null;
  AppState.save();
  const loginScreen = document.getElementById('login-screen');
  document.getElementById('nav').classList.remove('visible');
  document.getElementById('app').classList.remove('visible');
  loginScreen.style.display = 'flex';
  loginScreen.style.opacity = '0';
  setTimeout(() => {
    loginScreen.style.transition = 'opacity 0.4s';
    loginScreen.style.opacity = '1';
  }, 30);
}

// ── DASHBOARD ─────────────────────────────
function renderDashboard() {
  const s = AppState;
  const pnl = s.totalPnL;
  const pnlPct = s.totalPnLPct;

  const tvEl = document.getElementById('total-value');
  const tiEl = document.getElementById('total-invested');
  if (tvEl) countUp(tvEl, s.totalCurrent, 1200);
  if (tiEl) countUp(tiEl, s.totalInvested, 1000);

  const pnlEl = document.getElementById('total-pnl');
  if (pnlEl) {
    pnlEl.textContent = (pnl >= 0 ? '+' : '') + fmt.inr(Math.abs(pnl));
    pnlEl.className = 'kpi-value ' + (pnl >= 0 ? 'positive' : 'negative');
  }

  const pnlPctEl = document.getElementById('pnl-pct');
  if (pnlPctEl) pnlPctEl.textContent = fmt.pct(pnlPct);

  const holdingCount = document.getElementById('holding-count');
  if (holdingCount) holdingCount.textContent = s.holdings.length;

  const bestH = s.holdings.length
    ? [...s.holdings].sort((a,b) => ((b.current-b.invested)/b.invested) - ((a.current-a.invested)/a.invested))[0]
    : null;
  const bestEl = document.getElementById('best-performer');
  if (bestEl) bestEl.textContent = bestH ? bestH.name : '—';

  const riskEl = document.getElementById('risk-label-dash');
  if (riskEl) {
    const rs = s.riskScore();
    const level = rs < 35 ? 'Low' : rs < 65 ? 'Medium' : 'High';
    riskEl.textContent = level;
    riskEl.className = 'badge ' + level.toLowerCase();
  }

  renderAssetGrid();
}

const ASSET_COLORS = {
  gold: '#F5A623', silver: '#A8DADC', stocks: '#52B788',
  mf: '#80B918', fd: '#457B9D', beer: '#D4A017',
  copper: '#CD7F32', oil: '#6b7280', wheat: '#F5C518', crypto: '#9B5DE5',
};

function renderAssetGrid() {
  const grid = document.getElementById('asset-grid');
  if (!grid) return;

  if (AppState.holdings.length === 0) {
    grid.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" opacity="0.3"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
        </div>
        <h3>No holdings yet</h3>
        <p>Add your first investment to get started</p>
      </div>`;
    return;
  }

  grid.innerHTML = AppState.holdings.map(h => {
    const meta  = ASSET_META[h.type] || { label: h.type, icon: '' };
    const color = ASSET_COLORS[h.type] || '#6c63ff';
    const pnl   = h.current - h.invested;
    const pnlPct = (pnl / h.invested * 100).toFixed(2);
    const up = pnl >= 0;

    return `
      <div class="asset-card" data-id="${h.id}">
        <div class="asset-card-header">
          <div class="asset-name-text">${h.name}</div>
          <div class="asset-type-tag">
            <div class="asset-dot-sm" style="background:${color}"></div>
            ${meta.label}
          </div>
        </div>
        <div class="asset-card-body">
          <div class="asset-metrics">
            <div class="metric">
              <div class="metric-label">Invested</div>
              <div class="metric-value">${fmt.inr(h.invested)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Current</div>
              <div class="metric-value">${fmt.inr(h.current)}</div>
            </div>
            <div class="metric">
              <div class="metric-label">Returns</div>
              <div class="metric-value ${up ? 'up' : 'down'}">${up?'+':''}${pnlPct}%</div>
            </div>
          </div>
        </div>
        <div class="asset-card-footer">
          <button class="btn-sm btn-buy" onclick="openBuyModal(${h.id})">+ Buy More</button>
          <button class="btn-sm btn-sell" onclick="sellHolding(${h.id})">Sell</button>
        </div>
      </div>`;
  }).join('');
}

// ── BUY MODAL ─────────────────────────────
function openBuyModal(id) {
  const h = AppState.holdings.find(x => x.id === id);
  if (!h) return;
  openModal(`
    <div class="modal-header">
      <h3>Buy More — ${h.name}</h3>
      <button class="modal-close" onclick="closeModal()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <p style="font-size:0.85rem;color:var(--text-mid);margin-bottom:1.25rem">Current value: <strong style="color:var(--text)">${fmt.inr(h.current)}</strong></p>
    <div class="field-wrap" style="margin-bottom:0.75rem">
      <input class="field-input" style="padding-left:0.9rem" type="number" id="buy-amount" placeholder="Additional amount (₹)" min="1">
    </div>
    <div class="field-wrap" style="margin-bottom:1.25rem">
      <input class="field-input" style="padding-left:0.9rem" type="number" id="buy-units" placeholder="Units (optional)" min="1">
    </div>
    <button class="btn-primary btn-full" onclick="confirmBuy(${id})">Confirm Purchase</button>
  `);
}

function confirmBuy(id) {
  const amount = parseFloat(document.getElementById('buy-amount').value);
  const units  = parseFloat(document.getElementById('buy-units').value);
  if (!amount || amount <= 0) { showToast('Enter a valid amount'); return; }

  const h = AppState.holdings.find(x => x.id === id);
  if (!h) return;
  h.invested += amount;
  h.current  += amount * 1.05;
  h.units    += (units || 0);

  AppState.transactions.unshift({
    id: Date.now(), date: new Date().toISOString().split('T')[0],
    asset: h.name, type: 'BUY',
    units: units || 0, price: units ? Math.round(amount/units) : 0, total: amount,
  });
  AppState.save();
  closeModal();
  showToast(`Added ${fmt.inr(amount)} to ${h.name}`);
  renderDashboard();
}

// ── SELL ──────────────────────────────────
function sellHolding(id) {
  const h = AppState.holdings.find(x => x.id === id);
  if (!h) return;
  openModal(`
    <div class="modal-header">
      <h3>Sell — ${h.name}</h3>
      <button class="modal-close" onclick="closeModal()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <p style="font-size:0.85rem;color:var(--text-mid);margin-bottom:1.5rem">This will close your entire position. Current value: <strong style="color:var(--green)">${fmt.inr(h.current)}</strong></p>
    <div style="display:flex;gap:0.75rem">
      <button class="btn-ghost" style="flex:1" onclick="closeModal()">Cancel</button>
      <button class="btn-primary" style="flex:1;background:var(--red);box-shadow:none" onclick="confirmSell(${id})">Confirm Sell</button>
    </div>
  `);
}

function confirmSell(id) {
  AppState.deleteHolding(id);
  closeModal();
  showToast('Position closed successfully');
  renderDashboard();
}

// ── ADD INVESTMENT ─────────────────────────
let selectedType = 'gold';

function renderAddPage() {
  selectedType = 'gold';
  document.querySelectorAll('.type-btn').forEach(b => {
    b.classList.toggle('selected', b.dataset.type === selectedType);
    b.onclick = () => {
      selectedType = b.dataset.type;
      document.querySelectorAll('.type-btn').forEach(x => x.classList.remove('selected'));
      b.classList.add('selected');
    };
  });
}

function submitInvestment() {
  const name    = document.getElementById('inv-name').value.trim();
  const invested = parseFloat(document.getElementById('inv-amount').value);
  const units   = parseFloat(document.getElementById('inv-units').value) || 1;
  const date    = document.getElementById('inv-date').value || new Date().toISOString().split('T')[0];

  if (!name || !invested || invested <= 0) {
    showToast('Please fill in all required fields');
    return;
  }

  const buyPrice = invested / units;
  const h = {
    type: selectedType, name, invested,
    current: invested * (1 + (Math.random() * 0.2 - 0.05)),
    units, buyPrice, date,
  };

  AppState.addHolding(h);
  showToast(`${name} added to your portfolio`);

  document.getElementById('add-investment-form-el').reset();
  document.getElementById('inv-date').value = new Date().toISOString().split('T')[0];
  document.querySelectorAll('.type-btn').forEach(b => b.classList.toggle('selected', b.dataset.type === 'gold'));
  selectedType = 'gold';
}

// ── TRANSACTIONS ──────────────────────────
function renderTransactions() {
  const tbody = document.getElementById('tx-body');
  if (!tbody) return;

  if (AppState.transactions.length === 0) {
    tbody.innerHTML = `<div class="empty-state" style="border:none"><h3>No transactions yet</h3><p>Your transaction history will appear here</p></div>`;
    return;
  }

  tbody.innerHTML = AppState.transactions.map(tx => `
    <div class="table-row">
      <div>
        <div class="tx-date">${fmt.date(tx.date)}</div>
        <div class="tx-asset">${tx.asset}</div>
      </div>
      <div><span class="tx-badge ${tx.type === 'BUY' ? 'tx-buy' : 'tx-sell'}">${tx.type}</span></div>
      <div class="tx-mono">${tx.units}</div>
      <div class="tx-mono">${fmt.inr(tx.price || 0)}</div>
      <div class="${tx.type === 'BUY' ? 'tx-total-buy' : 'tx-total-sell'}">${fmt.inr(tx.total)}</div>
    </div>
  `).join('');
}

// ── ANALYTICS ─────────────────────────────
function renderAnalytics() {
  renderPieChart();
  renderAllocationBars();
  renderRecommendations();
  renderRiskDial();
}

function renderPieChart() {
  const canvas = document.getElementById('pie-canvas');
  if (!canvas || !AppState.holdings.length) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const cx = W/2, cy = H/2, r = Math.min(W,H)/2 - 10, inner = r * 0.55;

  const groups = {};
  AppState.holdings.forEach(h => { groups[h.type] = (groups[h.type] || 0) + h.current; });
  const total = Object.values(groups).reduce((s,v) => s+v, 0);

  const colors = Object.values(ASSET_COLORS);
  let startAngle = -Math.PI / 2;
  const legendEl = document.getElementById('pie-legend');
  let legendHTML = '';

  ctx.clearRect(0,0,W,H);

  Object.entries(groups).forEach(([type, val], i) => {
    const angle = (val / total) * Math.PI * 2;
    const color = ASSET_COLORS[type] || colors[i % colors.length];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startAngle, startAngle + angle);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#111113';
    ctx.lineWidth = 2;
    ctx.stroke();

    startAngle += angle;
    const meta = ASSET_META[type] || { label: type };
    legendHTML += `<div class="legend-item"><div class="legend-dot" style="background:${color}"></div><span>${meta.label} — ${(val/total*100).toFixed(1)}%</span></div>`;
  });

  // Donut hole
  ctx.beginPath();
  ctx.arc(cx, cy, inner, 0, Math.PI * 2);
  ctx.fillStyle = '#111113';
  ctx.fill();

  if (legendEl) legendEl.innerHTML = legendHTML;
}

function renderAllocationBars() {
  const el = document.getElementById('alloc-bars');
  if (!el) return;

  const groups = {};
  AppState.holdings.forEach(h => { groups[h.type] = (groups[h.type] || 0) + h.current; });
  const total = Object.values(groups).reduce((s,v) => s+v, 1);

  el.innerHTML = Object.entries(groups).map(([type, val]) => {
    const pct   = (val/total*100).toFixed(1);
    const meta  = ASSET_META[type] || { label: type };
    const color = ASSET_COLORS[type] || '#6c63ff';
    return `
      <div class="alloc-bar-wrap">
        <div class="alloc-label-row">
          <span style="font-size:0.85rem;font-weight:500">${meta.label}</span>
          <span>${pct}%</span>
        </div>
        <div class="alloc-bar">
          <div class="alloc-fill" style="background:${color}" data-target="${pct}"></div>
        </div>
      </div>`;
  }).join('');

  setTimeout(() => {
    el.querySelectorAll('.alloc-fill').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  }, 100);
}

function renderRecommendations() {
  const el = document.getElementById('recommendations');
  if (!el) return;
  el.innerHTML = AppState.recommendations().map(r => `
    <div class="rec-card">
      <div class="rec-title">${r.title}</div>
      <div class="rec-text">${r.text}</div>
    </div>
  `).join('');
}

function renderRiskDial() {
  const score = AppState.riskScore();
  const riskLabelEl  = document.getElementById('risk-score-label');
  const indicatorEl  = document.getElementById('risk-indicator');
  const fillEl       = document.getElementById('risk-fill');
  const scoreNumEl   = document.getElementById('risk-score-num');

  const level = score < 35 ? 'Low Risk' : score < 65 ? 'Medium Risk' : 'High Risk';
  const color = score < 35 ? '#22c55e' : score < 65 ? '#f59e0b' : '#ef4444';

  if (scoreNumEl) { scoreNumEl.textContent = score; scoreNumEl.style.color = color; }
  if (riskLabelEl) { riskLabelEl.textContent = level; riskLabelEl.style.color = color; }
  if (fillEl) setTimeout(() => { fillEl.style.width = score + '%'; }, 200);
  if (indicatorEl) setTimeout(() => { indicatorEl.style.left = score + '%'; }, 200);
}

// ── GOALS ─────────────────────────────────
function renderGoals() {
  const el = document.getElementById('goals-container');
  if (!el) return;

  if (AppState.goals.length === 0) {
    el.innerHTML = `<div class="empty-state"><h3>No goals yet</h3><p>Set a financial goal to track your progress</p></div>`;
    return;
  }

  el.innerHTML = `<div class="goals-grid">${AppState.goals.map(g => {
    const pct = Math.min(100, (g.current / g.target) * 100);
    return `
      <div class="goal-card">
        <div class="goal-top">
          <div>
            <div class="goal-name">${g.name}</div>
            <div class="goal-deadline">Target: ${g.deadline}</div>
          </div>
          <div style="text-align:right">
            <div class="goal-pct">${pct.toFixed(0)}%</div>
            <div class="goal-saved">${fmt.inr(g.current)} saved</div>
          </div>
        </div>
        <div class="goal-progress-track">
          <div class="goal-progress-fill" data-target="${pct}"></div>
        </div>
        <div class="goal-bottom">
          <span>Target: <strong style="color:var(--text)">${fmt.inr(g.target)}</strong></span>
          <span>Remaining: <strong style="color:var(--text)">${fmt.inr(g.target - g.current)}</strong></span>
        </div>
      </div>`;
  }).join('')}</div>`;

  setTimeout(() => {
    el.querySelectorAll('.goal-progress-fill').forEach(bar => {
      bar.style.width = bar.dataset.target + '%';
    });
  }, 100);
}

function openAddGoalModal() {
  openModal(`
    <div class="modal-header">
      <h3>New Goal</h3>
      <button class="modal-close" onclick="closeModal()">
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
      </button>
    </div>
    <div class="field-wrap" style="margin-bottom:0.75rem">
      <input class="field-input" style="padding-left:0.9rem" id="goal-name" placeholder="Goal name (e.g. World Trip)">
    </div>
    <div class="field-wrap" style="margin-bottom:0.75rem">
      <input class="field-input" style="padding-left:0.9rem" type="number" id="goal-target" placeholder="Target amount (₹)">
    </div>
    <div class="field-wrap" style="margin-bottom:0.75rem">
      <input class="field-input" style="padding-left:0.9rem" type="number" id="goal-current" placeholder="Current savings (₹)">
    </div>
    <div class="field-wrap" style="margin-bottom:1.25rem">
      <input class="field-input" style="padding-left:0.9rem" id="goal-deadline" placeholder="Target date (YYYY-MM)">
    </div>
    <button class="btn-primary btn-full" onclick="saveGoal()">Add Goal</button>
  `);
}

function saveGoal() {
  const name     = document.getElementById('goal-name').value.trim();
  const target   = parseFloat(document.getElementById('goal-target').value);
  const current  = parseFloat(document.getElementById('goal-current').value) || 0;
  const deadline = document.getElementById('goal-deadline').value.trim();

  if (!name || !target || target <= 0) { showToast('Please fill in all required fields'); return; }
  AppState.goals.push({ id: Date.now(), name, target, current, deadline });
  AppState.save();
  closeModal();
  showToast(`Goal "${name}" added`);
  renderGoals();
}
