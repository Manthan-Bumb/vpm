// ═══════════════════════════════════════════
//  PORTFOLIO DATA & STATE MANAGEMENT
// ═══════════════════════════════════════════

const ASSET_META = {
  gold:    { label: 'Gold',         icon: '⛏️',  color: '#F5A623', bg: '#2A1A00', world: 'Gold Mine'         },
  silver:  { label: 'Silver',       icon: '🌕',  color: '#A8DADC', bg: '#0A1520', world: 'Silver Vault'       },
  stocks:  { label: 'Equities',     icon: '🏛️',  color: '#52B788', bg: '#001020', world: 'NSE Bull Arena'     },
  mf:      { label: 'Mutual Funds', icon: '🍎',  color: '#80B918', bg: '#0A1800', world: 'Magic Orchard'      },
  fd:      { label: 'Fixed Deposit',icon: '🔒',  color: '#457B9D', bg: '#050D18', world: 'Stone Vault'        },
  beer:    { label: 'Beer',         icon: '🍺',  color: '#D4A017', bg: '#1A0800', world: 'Brewery Village'    },
  copper:  { label: 'Copper',       icon: '🔶',  color: '#CD7F32', bg: '#150800', world: 'Copper Foundry'     },
  oil:     { label: 'Crude Oil',    icon: '🛢️',  color: '#1A1A2E', bg: '#050510', world: 'Offshore Oil Rig'   },
  wheat:   { label: 'Wheat',        icon: '🌾',  color: '#F5C518', bg: '#1A1000', world: 'Golden Wheat Farm'  },
  crypto:  { label: 'Crypto',       icon: '🚀',  color: '#9B5DE5', bg: '#050020', world: 'Neon Space Station' },
};

// Default seed data
const DEFAULT_HOLDINGS = [
  { id: 1, type: 'gold',   name: 'Gold Holdings',        invested: 150000, current: 172500, units: 75,   buyPrice: 2000, date: '2024-01-15' },
  { id: 2, type: 'stocks', name: 'NIFTY 50 Portfolio',   invested: 200000, current: 238000, units: 120,  buyPrice: 1666, date: '2024-02-20' },
  { id: 3, type: 'mf',     name: 'Parag Parikh FlexiCap',invested: 100000, current: 118500, units: 2500, buyPrice:   40, date: '2024-03-10' },
  { id: 4, type: 'fd',     name: 'SBI Fixed Deposit',    invested: 250000, current: 267000, units: 1,    buyPrice: 250000, date: '2024-01-01' },
  { id: 5, type: 'silver', name: 'Silver ETF',            invested: 50000,  current: 44000,  units: 500,  buyPrice: 100,  date: '2024-04-05' },
  { id: 6, type: 'wheat',  name: 'Wheat Futures',         invested: 75000,  current: 89250,  units: 300,  buyPrice: 250,  date: '2024-05-12' },
];

const DEFAULT_TRANSACTIONS = [
  { id:1, date:'2024-01-15', asset:'Gold Holdings',         type:'BUY',  units:75,   price:2000,  total:150000 },
  { id:2, date:'2024-02-20', asset:'NIFTY 50 Portfolio',    type:'BUY',  units:120,  price:1666,  total:200000 },
  { id:3, date:'2024-03-10', asset:'Parag Parikh FlexiCap', type:'BUY',  units:2500, price:40,    total:100000 },
  { id:4, date:'2024-01-01', asset:'SBI Fixed Deposit',     type:'BUY',  units:1,    price:250000,total:250000 },
  { id:5, date:'2024-04-05', asset:'Silver ETF',             type:'BUY',  units:500,  price:100,   total:50000  },
  { id:6, date:'2024-04-20', asset:'NIFTY 50 Portfolio',    type:'SELL', units:20,   price:1800,  total:36000  },
  { id:7, date:'2024-05-12', asset:'Wheat Futures',          type:'BUY',  units:300,  price:250,   total:75000  },
  { id:8, date:'2024-06-01', asset:'Gold Holdings',          type:'BUY',  units:25,   price:2100,  total:52500  },
];

const DEFAULT_GOALS = [
  { id:1, name:'Emergency Fund',     target: 500000,  current: 350000, deadline:'2025-12' },
  { id:2, name:'World Trip',          target:1000000,  current: 250000, deadline:'2026-06' },
  { id:3, name:'Home Down Payment',   target:2500000,  current: 625000, deadline:'2027-03' },
];

// ─── STATE ───────────────────────────────────
const AppState = {
  user: null,
  holdings: [],
  transactions: [],
  goals: [],
  currentScreen: 'dashboard',

  load() {
    const saved = localStorage.getItem('pf_state');
    if (saved) {
      const s = JSON.parse(saved);
      this.user         = s.user         || null;
      this.holdings     = s.holdings     || [...DEFAULT_HOLDINGS];
      this.transactions = s.transactions || [...DEFAULT_TRANSACTIONS];
      this.goals        = s.goals        || [...DEFAULT_GOALS];
    } else {
      this.holdings     = [...DEFAULT_HOLDINGS];
      this.transactions = [...DEFAULT_TRANSACTIONS];
      this.goals        = [...DEFAULT_GOALS];
    }
  },

  save() {
    localStorage.setItem('pf_state', JSON.stringify({
      user: this.user,
      holdings: this.holdings,
      transactions: this.transactions,
      goals: this.goals,
    }));
  },

  get totalInvested()  { return this.holdings.reduce((s,h) => s + h.invested, 0); },
  get totalCurrent()   { return this.holdings.reduce((s,h) => s + h.current, 0); },
  get totalPnL()       { return this.totalCurrent - this.totalInvested; },
  get totalPnLPct()    { return this.totalInvested ? (this.totalPnL / this.totalInvested * 100) : 0; },

  allocationPct(type) {
    const total = this.totalCurrent || 1;
    return this.holdings.filter(h => h.type === type).reduce((s,h) => s + h.current, 0) / total * 100;
  },

  addHolding(h) {
    h.id = Date.now();
    this.holdings.push(h);
    this.transactions.unshift({
      id: Date.now() + 1,
      date: new Date().toISOString().split('T')[0],
      asset: h.name, type: 'BUY',
      units: h.units, price: h.buyPrice, total: h.invested,
    });
    this.save();
  },

  deleteHolding(id) {
    const h = this.holdings.find(x => x.id === id);
    if (!h) return;
    this.holdings = this.holdings.filter(x => x.id !== id);
    this.transactions.unshift({
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      asset: h.name, type: 'SELL',
      units: h.units, price: Math.round(h.current / h.units), total: h.current,
    });
    this.save();
  },

  riskScore() {
    const types = [...new Set(this.holdings.map(h => h.type))].length;
    const maxAlloc = Math.max(...Object.keys(ASSET_META).map(t => this.allocationPct(t)));
    // Low diversity + high concentration = high risk
    let score = 50;
    if (types <= 2) score += 30;
    else if (types >= 5) score -= 20;
    if (maxAlloc > 60) score += 20;
    else if (maxAlloc < 30) score -= 15;
    return Math.max(5, Math.min(95, score));
  },

  recommendations() {
    const recs = [];
    const score = this.riskScore();
    const types = [...new Set(this.holdings.map(h => h.type))].length;

    if (types < 3)
      recs.push({ icon:'🗺️', title:'Explore New Worlds!', text:'Your portfolio spans only '+ types +' asset class(es). Diversify to reduce risk and unlock new adventures!' });

    const bestH = [...this.holdings].sort((a,b) => (b.current-b.invested)/b.invested - (a.current-a.invested)/a.invested)[0];
    if (bestH) {
      const pct = ((bestH.current - bestH.invested) / bestH.invested * 100).toFixed(1);
      recs.push({ icon:'⭐', title:`${bestH.name} is Thriving!`, text:`Your best performer is up ${pct}%. The ${ASSET_META[bestH.type]?.world} is glowing!` });
    }

    if (score > 65)
      recs.push({ icon:'⛈️', title:'Portfolio Risk is High', text:'Your portfolio is concentrated. Consider spreading across more worlds to weather any storm.' });
    else if (score < 35)
      recs.push({ icon:'☀️', title:'Well Balanced Portfolio!', text:'Your investments are nicely spread. The guide fox is dancing with joy!' });

    const fdAlloc = this.allocationPct('fd');
    if (fdAlloc > 50)
      recs.push({ icon:'🔒', title:'Heavy Fixed Deposits', text:'Over half your wealth is in the Stone Vault. Fixed returns are safe, but consider some growth assets.' });

    if (recs.length === 0)
      recs.push({ icon:'📜', title:'Looking Good, Adventurer!', text:'No urgent recommendations. Keep growing your portfolio world by world.' });

    return recs;
  },
};

// ─── UTILITIES ────────────────────────────────
const fmt = {
  inr(n)  { return '₹' + Number(n).toLocaleString('en-IN', { maximumFractionDigits:0 }); },
  pct(n)  { return (n >= 0 ? '+' : '') + n.toFixed(2) + '%'; },
  date(s) { return new Date(s).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }); },
};

function countUp(el, target, duration = 1200, prefix = '₹') {
  const start = Date.now();
  const tick = () => {
    const elapsed = Date.now() - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const val = Math.round(eased * target);
    el.textContent = prefix + val.toLocaleString('en-IN');
    if (progress < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}
