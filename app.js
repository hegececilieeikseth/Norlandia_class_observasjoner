/* ============================================================
   Norlandia · Kvalitetsportal – app (prototype)
   ============================================================ */

const STORAGE_KEY = 'norlandia-kvalitetsportal-v1';
const LANG_KEY = 'norlandia-kvalitetsportal-lang';

const state = {
  role: null,
  observations: null
};

let loginRole = 'fagdirektor';
let drawer = null;
let kgSearch = '';
let kgRegion = 'all';
let toastTimer = null;
let storageWarned = false;
let lang = loadLanguage();

/* ---------------- language ---------------- */

function loadLanguage() {
  try {
    return localStorage.getItem(LANG_KEY) === 'en' ? 'en' : 'no';
  } catch (error) {
    return 'no';
  }
}

function L(no, en) {
  return lang === 'en' ? en : no;
}

function saveLanguage() {
  try {
    localStorage.setItem(LANG_KEY, lang);
  } catch (error) {
    /* language still applies for this session */
  }
}

function setLanguage(next) {
  if (next !== 'no' && next !== 'en') return;
  lang = next;
  saveLanguage();
  render();
}

const roleLabel = role => L(role.label, role.labelEn || role.label);
const roleScope = role => L(role.scope, role.scopeEn || role.scope);
const roleScopeDetail = role => L(role.scopeDetail, role.scopeDetailEn || role.scopeDetail);
const roleDescription = role => L(role.description, role.descriptionEn || role.description);
const roleEyebrow = role => L(role.loginEyebrow, role.loginEyebrowEn || role.loginEyebrow);
const paramLabel = param => L(param.label, param.labelEn || param.label);
const paramDesc = param => L(param.desc, param.descEn || param.desc);
const bandLabel = band => L(SCORE_BANDS[band].label, SCORE_BANDS[band].labelEn);
const unitName = unit => L(unit.name, unit.nameEn || unit.name);
const unitKinderName = unit => L(unit.kinderName, unit.kinderNameEn || unit.kinderName);
const unitRegionName = unit => L(unit.regionName, unit.regionNameEn || unit.regionName);
const kinderLabel = kg => L(kg.name, kg.nameEn || kg.name);
const kinderRegionName = kg => L(kg.regionName, kg.regionNameEn || kg.regionName);
const regionLabel = region => L(region.name, region.nameEn || region.name);
const regionShortLabel = region => L(region.short, region.shortEn || region.short);

function reportText(report) {
  if (!report) return '';
  if (lang === 'en' && report.textEn) return report.textEn;
  return report.text || '';
}

function plural(count, noOne, noMany, enOne, enMany) {
  if (lang === 'en') return count === 1 ? enOne : enMany;
  return count === 1 ? noOne : noMany;
}

function langSwitchHTML(extraClass = '') {
  return `<div class="lang-switch ${extraClass}" role="group" aria-label="${L('Språk', 'Language')}">
    <button class="lang-btn${lang === 'no' ? ' active' : ''}" type="button" data-action="set-lang" data-lang="no" aria-pressed="${lang === 'no'}">NO</button>
    <button class="lang-btn${lang === 'en' ? ' active' : ''}" type="button" data-action="set-lang" data-lang="en" aria-pressed="${lang === 'en'}">EN</button>
  </div>`;
}

/* ---------------- helpers ---------------- */

const esc = value => String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[ch]));

const pad = n => String(n).padStart(2, '0');
const clone = value => JSON.parse(JSON.stringify(value));

function formatDate(iso) {
  if (!iso) return '–';
  const d = new Date(iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return '–';
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'nb-NO', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  }).format(d);
}

function formatDateLong(iso) {
  if (!iso) return '–';
  const d = new Date(iso + 'T12:00:00');
  if (Number.isNaN(d.getTime())) return '–';
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'nb-NO', {
    day: 'numeric', month: 'long', year: 'numeric'
  }).format(d);
}

function todayISO() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatAvg(value) {
  if (value == null || Number.isNaN(value)) return '–';
  const text = value.toFixed(1);
  return lang === 'en' ? text : text.replace('.', ',');
}

function clampScore(value) {
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(Number(value))));
}

function gradeScore(value) {
  const score = Number(value);
  return Number.isFinite(score) ? score : 0;
}

function gradeAvg(grades) {
  if (!grades) return null;
  const values = PARAMS.map(p => grades[p.id]).filter(value => value != null);
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + gradeScore(value), 0) / values.length;
}

function gradedCount(grades) {
  if (!grades) return 0;
  return PARAMS.filter(p => grades[p.id] != null).length;
}

function toneFor(value) {
  if (value == null) return '';
  if (value >= 5.5) return 'high';
  if (value >= 3.5) return 'mid';
  return 'low';
}

function scoreTone(score) {
  return bandForScore(score);
}

function normalizeGrades(grades) {
  if (!grades) return null;
  const normalized = {};
  let found = false;
  PARAMS.forEach(param => {
    const value = grades[param.id];
    if (typeof value === 'number' && Number.isFinite(value)) {
      normalized[param.id] = clampScore(value);
      found = true;
    } else if (value === 'low') {
      normalized[param.id] = 1;
      found = true;
    } else if (value === 'mid') {
      normalized[param.id] = 4;
      found = true;
    } else if (value === 'high') {
      normalized[param.id] = 6;
      found = true;
    }
  });
  return found ? normalized : null;
}

function scoreChip(score) {
  return `<span class="score-chip tone-${scoreTone(score)}"><strong>${score}</strong><span class="score-max">/7</span></span>`;
}

function obs(unitId) {
  let record = state.observations[unitId];
  if (!record) {
    record = DATA.blankObservation();
    state.observations[unitId] = record;
  }
  return record;
}

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1,
      role: state.role,
      observations: state.observations
    }));
  } catch (error) {
    if (!storageWarned) {
      storageWarned = true;
      toast(L('Lagring er ikke tilgjengelig i denne nettleseren.', 'Storage is not available in this browser.'));
    }
  }
}

function loadPersisted() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch (error) {
    return null;
  }
}

/* ---------------- scope ---------------- */

function scopedKindergartens(role = state.role) {
  if (role === 'fagdirektor') return DATA.kindergartens;
  if (role === 'regiondirektor') return DATA.kindergartens.filter(k => k.regionId === 'ost');
  if (role === 'leder' || role === 'pedagogisk') return [DATA.solstua];
  return [];
}

function scopedUnits(role = state.role) {
  if (role === 'fagdirektor') return DATA.units;
  if (role === 'regiondirektor') return DATA.units.filter(u => u.regionId === 'ost');
  if (role === 'leder') return DATA.solstua.units;
  if (role === 'pedagogisk') return [DATA.pedUnit];
  return [];
}

function assignmentFor(role = state.role) {
  return DATA.rosters[role] || [];
}

function canSeeKinder(id) {
  return scopedKindergartens().some(k => k.id === id);
}

function canSeeUnit(id) {
  return scopedUnits().some(u => u.id === id);
}

/* ---------------- statistics ---------------- */

function statsForUnits(list) {
  const counts = {};
  PARAMS.forEach(p => { counts[p.id] = { low: 0, mid: 0, high: 0, total: 0, sum: 0 }; });

  let assessed = 0;
  let reports = 0;
  let visited = 0;
  let gradeTotal = 0;
  let gradeSum = 0;

  list.forEach(unit => {
    const record = obs(unit.id);
    if (record.visited) visited++;
    if (record.report) reports++;
    if (record.grades) {
      if (gradedCount(record.grades) > 0) assessed++;
      PARAMS.forEach(p => {
        const score = record.grades[p.id];
        if (score != null) {
          const band = bandForScore(score);
          counts[p.id][band]++;
          counts[p.id].total++;
          counts[p.id].sum += gradeScore(score);
          gradeTotal++;
          gradeSum += gradeScore(score);
        }
      });
    }
  });

  const distribution = { low: 0, mid: 0, high: 0 };
  const paramAvg = {};
  PARAMS.forEach(p => {
    const c = counts[p.id];
    const total = c.low + c.mid + c.high;
    LEVEL_KEYS.forEach(level => { distribution[level] += c[level]; });
    paramAvg[p.id] = total ? c.sum / total : null;
  });

  return {
    unitCount: list.length,
    assessed,
    reports,
    visited,
    counts,
    distribution,
    paramAvg,
    avg: gradeTotal ? gradeSum / gradeTotal : null,
    gradeTotal
  };
}

function observationStatus(record) {
  if (!record.visited) return { key: 'todo', label: L('Ikke besøkt', 'Not visited') };
  const count = gradedCount(record.grades);
  if (record.report && count === PARAMS.length) return { key: 'done', label: L('Fullført', 'Completed') };
  if (record.report || count > 0) return { key: 'partial', label: L('Pågår', 'In progress') };
  return { key: 'visited', label: L('Besøkt', 'Visited') };
}

function statusChip(record, subtle = false) {
  const status = observationStatus(record);
  return `<span class="chip chip-${status.key}${subtle ? ' chip-outline' : ''}">${status.label}</span>`;
}

/* ---------------- icons ---------------- */

const ICON_PATHS = {
  eye: '<path d="M2.5 12s3.3-6.4 9.5-6.4S21.5 12 21.5 12s-3.3 6.4-9.5 6.4S2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.7"/>',
  layout: '<rect x="3" y="3" width="7" height="9" rx="1.6"/><rect x="14" y="3" width="7" height="5" rx="1.6"/><rect x="14" y="12" width="7" height="9" rx="1.6"/><rect x="3" y="16" width="7" height="5" rx="1.6"/>',
  clipboard: '<path d="M9 4h6M8 6H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2"/><path d="M9 3.5A1.5 1.5 0 0 1 10.5 2h3A1.5 1.5 0 0 1 15 3.5V6H9V3.5Z"/><path d="M8 12h8M8 16h5"/>',
  chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
  search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  arrowRight: '<path d="M4 12h15M13 6l6 6-6 6"/>',
  arrowLeft: '<path d="M20 12H5M11 18l-6-6 6-6"/>',
  chevronRight: '<path d="m9 5 7 7-7 7"/>',
  chevronDown: '<path d="m5 9 7 7 7-7"/>',
  calendar: '<rect x="3.5" y="5" width="17" height="16" rx="2"/><path d="M8 3v4M16 3v4M3.5 10.5h17"/>',
  building: '<path d="M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16"/><path d="M16 9h2a2 2 0 0 1 2 2v10"/><path d="M2 21h20M8 7h4M8 11h4M8 15h4M8 21v-3h4v3"/>',
  switch: '<path d="M16 3h4v4M20 3l-6 6M8 21H4v-4M4 21l6-6"/>',
  refresh: '<path d="M20 11a8 8 0 1 0-2.3 5.7"/><path d="M20 4v7h-7"/>',
  check: '<path d="m5 13 4 4L19 7"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/>',
  close: '<path d="M6 6l12 12M18 6 6 18"/>',
  pin: '<path d="M12 21s7-5.6 7-11a7 7 0 1 0-14 0c0 5.4 7 11 7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
  users: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>',
  sparkle: '<path d="m12 3 1.9 5.6L20 10.5l-5.6 1.9L12 18l-1.9-5.6L4.5 10.5l5.6-1.9L12 3Z"/>',
  lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>'
};

function icon(name) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON_PATHS[name] || ''}</svg>`;
}

function brandMark() {
  return `<svg viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 29V14.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
    <path d="M16 15c0-6.2 4.2-10.2 10.4-10.2C26.4 11 22.2 15 16 15Z" fill="currentColor" opacity=".85"/>
    <path d="M16 20.5c0-4.2-2.9-7-7.3-7 0 4.2 2.9 7 7.3 7Z" fill="currentColor" opacity=".45"/>
  </svg>`;
}

/* ---------------- init ---------------- */

function initState() {
  const persisted = loadPersisted();
  if (persisted && ROLES[persisted.role]) {
    state.role = persisted.role;
    loginRole = persisted.role;
  }
  if (persisted && persisted.observations && typeof persisted.observations === 'object') {
    state.observations = persisted.observations;
  } else {
    state.observations = clone(DATA.seedObservations);
  }
  DATA.units.forEach(unit => {
    if (!state.observations[unit.id]) {
      state.observations[unit.id] = DATA.blankObservation();
    } else if (state.observations[unit.id].grades) {
      state.observations[unit.id].grades = normalizeGrades(state.observations[unit.id].grades);
    }
  });
}

/* ---------------- routing ---------------- */

function parseRoute() {
  const raw = location.hash.replace(/^#\/?/, '');
  const parts = raw.split('/').filter(Boolean);
  if (!parts.length) return { view: 'observator' };
  if (parts[0] === 'login') return { view: 'login' };
  if (parts[0] === 'observator') return { view: 'observator' };
  if (parts[0] === 'admin') {
    if (parts[1] === 'barnehage' && parts[2]) return { view: 'kinder', id: parts[2] };
    if (parts[1] === 'enhet' && parts[2]) return { view: 'unit', id: parts[2] };
    return { view: 'admin' };
  }
  return { view: 'observator' };
}

function go(hash) {
  if (location.hash === hash) {
    render();
  } else {
    location.hash = hash;
  }
}

/* ---------------- shared view pieces ---------------- */

function pageHead({ eyebrow, title, lede, right = '', back = null }) {
  return `<header class="page-head">
    ${back ? `<a class="back-link" href="${back.href}">${icon('arrowLeft')}<span>${esc(back.label)}</span></a>` : ''}
    <div class="page-head-row">
      <div>
        ${eyebrow ? `<p class="eyebrow">${eyebrow}</p>` : ''}
        <h1>${esc(title)}</h1>
        ${lede ? `<p class="lede">${lede}</p>` : ''}
      </div>
      ${right ? `<div class="page-head-right">${right}</div>` : ''}
    </div>
  </header>`;
}

function scopeChip(text, iconName = 'pin') {
  return `<span class="scope-chip">${icon(iconName)}<span>${esc(text)}</span></span>`;
}

function emptyState(title, text, iconName = 'clipboard') {
  return `<div class="empty-state">
    <span class="empty-icon">${icon(iconName)}</span>
    <strong>${esc(title)}</strong>
    <p>${esc(text)}</p>
  </div>`;
}

function toast(message) {
  const element = document.getElementById('toast');
  if (!element) return;
  element.textContent = message;
  element.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => element.classList.remove('show'), 2800);
}

/* ---------------- login ---------------- */

function roleScopeText(roleId) {
  const role = ROLES[roleId];
  if (roleId === 'fagdirektor') {
    return L(
      `${DATA.regions.length} regioner · ${DATA.kindergartens.length} barnehager · ${DATA.units.length} avdelinger`,
      `${DATA.regions.length} regions · ${DATA.kindergartens.length} kindergartens · ${DATA.units.length} units`
    );
  }
  if (roleId === 'regiondirektor') {
    const k = DATA.kindergartens.filter(x => x.regionId === 'ost');
    return L(
      `${k.length} barnehager · ${k.length * 10} avdelinger i ${role.scope}`,
      `${k.length} kindergartens · ${k.length * 10} units in ${roleScope(role)}`
    );
  }
  if (roleId === 'leder') {
    return L(
      `${DATA.solstua.units.length} avdelinger i ${DATA.solstua.name}`,
      `${DATA.solstua.units.length} units at ${kinderLabel(DATA.solstua)}`
    );
  }
  return L(
    `${DATA.pedUnit.name}, ${DATA.solstua.name}`,
    `${unitName(DATA.pedUnit)}, ${kinderLabel(DATA.solstua)}`
  );
}

function rolePreviewHTML(roleId) {
  const role = ROLES[roleId];
  return `<div class="role-preview-head">
      <span class="avatar">${esc(role.initials)}</span>
      <div><strong>${esc(role.person)}</strong><span>${esc(roleLabel(role))}</span></div>
    </div>
    <p>${esc(roleDescription(role))}</p>
    <dl>
      <div><dt>${L('Innsyn', 'Access')}</dt><dd>${esc(roleScopeText(roleId))}</dd></div>
      <div><dt>${L('Sider', 'Pages')}</dt><dd>${L('CLASS veileder og administrasjon', 'CLASS Coach and Administration')}</dd></div>
    </dl>`;
}

function loginHTML() {
  const options = ROLE_ORDER.map(id => {
    const role = ROLES[id];
    return `<option value="${id}"${id === loginRole ? ' selected' : ''}>${esc(roleLabel(role))} – ${esc(role.person)}</option>`;
  }).join('');

  return `<div class="login-page">
    <section class="login-brand">
      <span class="orb orb-1"></span>
      <span class="orb orb-2"></span>
      <span class="orb orb-3"></span>
      <div class="login-brand-inner">
        <div class="brand">
          <span class="brand-mark">${brandMark()}</span>
          <span class="brand-text">
            <span class="brand-name">Norlandia</span>
            <span class="brand-sub">${L('Kvalitetsportal', 'Quality Portal')}</span>
          </span>
        </div>
        <div class="login-hero">
          <p class="eyebrow light">${L('Observasjon · Rapport · Kvalitet', 'Observation · Report · Quality')}</p>
          <h1>${L('Kvalitet som<br><em>blir sett.</em>', 'Quality that<br><em>gets noticed.</em>')}</h1>
          <p>${L('Én arbeidsflate for besøk, rapporter og pedagogiske vurderinger – tilpasset rollen din og barnehagene du følger opp.', 'One workspace for visits, reports and pedagogical assessments – tailored to your role and the kindergartens you follow up.')}</p>
          <ul class="login-points">
            <li><span class="point-icon">${icon('eye')}</span>${L('CLASS-veilederliste med ti avdelinger og besøksdato', 'CLASS Coach list with ten units and visit dates')}</li>
            <li><span class="point-icon">${icon('clipboard')}</span>${L('Publiser rapporter og sett skår på ti parametere', 'Publish reports and score ten parameters')}</li>
            <li><span class="point-icon">${icon('chart')}</span>${L('Oppsummeringer på avdelings-, barnehage- og regionsnivå', 'Summaries at unit, kindergarten and regional level')}</li>
          </ul>
        </div>
        <blockquote class="login-quote">
          ${L('«Vi følger opp det som betyr noe for barna – hver dag, i hver avdeling.»', '“We follow up on what matters to the children – every day, in every unit.”')}
          <span>${L('Norlandia barnehager', 'Norlandia Kindergartens')}</span>
        </blockquote>
      </div>
    </section>

    <section class="login-form-side">
      <form class="login-card" id="login-form">
        <div class="login-topline">
          <p class="eyebrow">${L('Norlandia kvalitetsportal', 'Norlandia Quality Portal')}</p>
          ${langSwitchHTML()}
        </div>
        <h2>${L('Logg inn', 'Sign in')}</h2>
        <p class="muted">${L('Velg en rolle for å se prototypen fra den rollens perspektiv.', 'Choose a role to explore the prototype from that role’s perspective.')}</p>
        <label class="field">
          <span>${L('Rolle', 'Role')}</span>
          <div class="select-wrap">
            <select id="login-role" name="role">${options}</select>
            ${icon('chevronDown')}
          </div>
        </label>
        <div class="role-preview" id="role-preview">${rolePreviewHTML(loginRole)}</div>
        <button class="btn btn-primary btn-wide" type="submit">
          ${L('Logg inn', 'Sign in')} ${icon('arrowRight')}
        </button>
        <p class="login-note">${icon('lock')} ${L('Prototype · ingen ekte pålogging. Data lagres bare i denne nettleseren.', 'Prototype · no real sign-in. Data is stored only in this browser.')}</p>
      </form>
    </section>
  </div>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>`;
}

/* ---------------- shell ---------------- */

function shellHTML(content, route) {
  const role = ROLES[state.role];
  const assigned = assignmentFor(state.role);
  const remaining = assigned.filter(unit => !obs(unit.id).visited).length;
  const adminActive = ['admin', 'kinder', 'unit'].includes(route.view);
  const observerActive = route.view === 'observator';

  return `<div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="#/observator" aria-label="${L('Norlandia kvalitetsportal', 'Norlandia Quality Portal')}">
        <span class="brand-mark">${brandMark()}</span>
        <span class="brand-text">
          <span class="brand-name">Norlandia</span>
          <span class="brand-sub">${L('Kvalitetsportal', 'Quality Portal')}</span>
        </span>
      </a>
      <nav class="side-nav" aria-label="${L('Hovedmeny', 'Main menu')}">
        <span class="side-nav-label">${L('Arbeidsflate', 'Workspace')}</span>
        <a class="side-link${observerActive ? ' active' : ''}" href="#/observator">
          ${icon('eye')}<span>${L('CLASS veileder', 'CLASS Coach')}</span>${remaining ? `<span class="count">${remaining}</span>` : ''}
        </a>
        <a class="side-link${adminActive ? ' active' : ''}" href="#/admin">
          ${icon('layout')}<span>${L('Administrasjon', 'Administration')}</span>
        </a>
      </nav>
      <div class="sidebar-foot">
        <div class="role-card">
          <span class="avatar avatar-dark">${esc(role.initials)}</span>
          <div style="min-width:0">
            <strong>${esc(role.person)}</strong>
            <span>${esc(roleLabel(role))} · ${esc(roleScope(role))}</span>
          </div>
        </div>
        ${langSwitchHTML('lang-switch-side')}
        <button class="side-action" type="button" data-action="switch-role">
          ${icon('switch')}<span>${L('Bytt rolle', 'Switch role')}</span>
        </button>
        <button class="side-action danger" type="button" data-action="reset-demo">
          ${icon('refresh')}<span>${L('Nullstill demodata', 'Reset demo data')}</span>
        </button>
        <p class="side-version">${L('Prototype · v1.0', 'Prototype · v1.0')}</p>
      </div>
    </aside>
    <main class="main">
      <div class="main-inner">${content}</div>
    </main>
  </div>
  <div id="toast" class="toast" role="status" aria-live="polite"></div>
  ${drawer ? drawerHTML() : ''}`;
}

/* ============================================================
   CLASS VEILEDER
   ============================================================ */

function visitCardHTML(unit, index) {
  const record = obs(unit.id);
  const status = observationStatus(record);
  const count = gradedCount(record.grades);
  const avg = gradeAvg(record.grades);
  const isDone = status.key === 'done';

  const actions = record.visited
    ? `<div class="visit-actions">
        <button class="btn btn-small ${record.report ? 'btn-outline' : 'btn-soft'}" type="button" data-action="open-report" data-unit="${unit.id}">
          ${icon('clipboard')}${record.report ? L('Rediger rapport', 'Edit report') : L('Skriv rapport', 'Write report')}
        </button>
        <button class="btn btn-small ${count ? 'btn-outline' : 'btn-soft'}" type="button" data-action="open-grade" data-unit="${unit.id}">
          ${icon('chart')}${count ? L('Endre skår', 'Edit scores') : L('Gi skår', 'Set scores')}
        </button>
      </div>`
    : `<span class="visit-hint">${L('Merk av for besøkt for å skrive rapport og gi skår.', 'Tick “Visited” to write a report and set scores.')}</span>`;

  const reportBlock = record.report ? `<div class="visit-attached">
      <div class="attached-head">
        <span class="mini-label">${L('Rapport', 'Report')}</span>
        <span class="attached-meta">${L('Publisert', 'Published')} ${formatDate(record.report.publishedAt)} · ${esc(record.report.author)}</span>
      </div>
      <p class="clamp-3">${esc(reportText(record.report))}</p>
    </div>` : '';

  const gradeBlock = count ? `<div class="grade-readout">
      <div class="dots" aria-label="${L(`${count} av 10 parametere vurdert`, `${count} of 10 parameters assessed`)}">
        ${PARAMS.map(p => {
          const score = record.grades && record.grades[p.id];
          const band = score != null ? bandForScore(score) : 'empty';
          return `<span class="dot ${band}" title="${esc(paramLabel(p))}: ${score != null ? `${score}/7 ${bandLabel(band)}` : L('Ikke vurdert', 'Not assessed')}"></span>`;
        }).join('')}
      </div>
      <span class="avg-pill tone-${toneFor(avg)}">${L('Snitt', 'Avg.')} ${formatAvg(avg)}</span>
      <span class="muted">${L(`${count} av 10 parametere vurdert`, `${count} of 10 parameters assessed`)}</span>
    </div>` : '';

  return `<article class="visit-card${isDone ? ' is-done' : ''}">
    <div class="visit-top">
      <span class="visit-number">${pad(index + 1)}</span>
      <div class="visit-info">
        <p class="visit-kicker">${esc(unitRegionName(unit))} · ${esc(unitKinderName(unit))}</p>
        <h3>${esc(unitName(unit))}</h3>
        <p class="visit-meta">${unit.children} ${L('barn', 'children')} · ${unit.staff} ${L('voksne', 'adults')} · ${L('Kontakt', 'Contact')} ${esc(unit.leader)}</p>
      </div>
      ${statusChip(record)}
    </div>
    <div class="visit-bar">
      <label class="check">
        <input type="checkbox" data-action="visit-check" data-unit="${unit.id}"${record.visited ? ' checked' : ''}>
        <span>${L('Besøkt', 'Visited')}</span>
      </label>
      <label class="date-control">
        <span>${L('Dato for besøk', 'Visit date')}</span>
        <input type="date" data-action="visit-date" data-unit="${unit.id}" value="${record.visitDate || ''}">
      </label>
      ${actions}
    </div>
    ${reportBlock}
    ${gradeBlock}
  </article>`;
}

function observerView() {
  const assigned = assignmentFor(state.role);
  const role = ROLES[state.role];
  const visited = assigned.filter(unit => obs(unit.id).visited).length;
  const graded = assigned.filter(unit => gradedCount(obs(unit.id).grades) > 0).length;
  const reports = assigned.filter(unit => obs(unit.id).report).length;
  const total = assigned.length;
  const percent = total ? Math.round((visited / total) * 100) : 0;
  const remaining = total - visited;

  const lede = state.role === 'pedagogisk'
    ? L('Følg opp din egen avdeling: marker besøk, publiser rapport og sett skår.', 'Follow up your own unit: mark visits, publish reports and set scores.')
    : L(
      `Besøksplanen din med ${total} avdelinger. Marker besøk, publiser rapport og sett skår på ti parametere.`,
      `Your visit plan with ${total} units. Mark visits, publish reports and score ten parameters.`
    );

  const progressText = remaining === 0
    ? L('Alle avdelinger i besøksplanen er besøkt.', 'All units in the visit plan have been visited.')
    : L(
      `${remaining} ${plural(remaining, 'avdeling', 'avdelinger', 'unit', 'units')} gjenstår i besøksplanen.`,
      `${remaining} ${plural(remaining, 'avdeling', 'avdelinger', 'unit', 'units')} remaining in the visit plan.`
    );

  return `<div class="view">
    ${pageHead({
      eyebrow: `${esc(roleEyebrow(role))} · ${L('CLASS veileder', 'CLASS Coach')}`,
      title: L('CLASS veileder', 'CLASS Coach'),
      lede,
      right: scopeChip(roleScopeDetail(role), 'pin')
    })}

    <section class="progress-card">
      <div class="progress-main">
        <div class="progress-head">
          <span>${L('Besøksfremdrift', 'Visit progress')}</span>
          <strong>${L(`${visited} av ${total} besøkt`, `${visited} of ${total} visited`)}</strong>
        </div>
        <div class="progress-track"><i style="width:${percent}%"></i></div>
        <p class="muted">${progressText}</p>
      </div>
      <div class="progress-stats">
        <div class="progress-stat"><strong>${graded}</strong><span>${L('Skår satt', 'Scored')}</span></div>
        <div class="progress-stat"><strong>${reports}</strong><span>${L('Rapporter', 'Reports')}</span></div>
      </div>
    </section>

    <div class="section-head">
      <h2>${L('Besøksliste', 'Visit list')}</h2>
      <span class="section-meta">${total} ${plural(total, 'avdeling', 'avdelinger', 'unit', 'units')} ${L('tildelt', 'assigned')}</span>
    </div>
    <div class="visit-list">
      ${assigned.map((unit, index) => visitCardHTML(unit, index)).join('')}
    </div>
    <p class="foot-note">${L('Tips: marker «Besøkt» for å låse opp rapport og skårsetting. Alt lagres lokalt i nettleseren.', 'Tip: tick “Visited” to unlock reports and scoring. Everything is saved locally in your browser.')}</p>
  </div>`;
}

/* ============================================================
   ADMINISTRASJON
   ============================================================ */

function kpiCard(label, value, meta) {
  return `<div class="kpi">
    <p class="kpi-label">${esc(label)}</p>
    <p class="kpi-value">${value}</p>
    <p class="kpi-meta">${esc(meta)}</p>
  </div>`;
}

function distributionBar(stats) {
  const total = stats.distribution.low + stats.distribution.mid + stats.distribution.high;
  if (!total) return `<div class="dist-bar"><span class="dist-mid" style="width:100%;opacity:.15"></span></div>`;
  const pct = level => (stats.distribution[level] / total) * 100;
  return `<div class="dist-bar" title="${L('Fordeling lav, middels og høy', 'Distribution low, medium and high')}">
    <span class="dist-low" style="width:${pct('low')}%"></span>
    <span class="dist-mid" style="width:${pct('mid')}%"></span>
    <span class="dist-high" style="width:${pct('high')}%"></span>
  </div>`;
}

function gradeSummaryHTML(stats, options = {}) {
  const title = options.title || L('Skåroversikt', 'Score overview');
  const subtitle = options.subtitle || L('Gjennomsnitt av ti kvalitetsparametere', 'Average of ten quality parameters');
  const avg = stats.avg;
  const donutPercent = avg == null ? 0 : Math.min(100, (avg / 7) * 100);
  const donutTone = avg == null ? 'var(--line-strong)' : `var(--${toneFor(avg) === 'high' ? 'high' : toneFor(avg) === 'mid' ? 'mid' : 'low'})`;
  const totalGrades = stats.gradeTotal;

  return `<section class="panel summary-panel">
    <div class="panel-head">
      <div>
        <h2>${esc(title)}</h2>
        <p class="panel-sub">${esc(subtitle)}</p>
      </div>
      ${avg != null ? `<span class="avg-pill large tone-${toneFor(avg)}">${L('Snitt', 'Avg.')} ${formatAvg(avg)}</span>` : ''}
    </div>
    ${stats.gradeTotal ? `
      <div class="summary-hero">
        <div class="donut" style="--p:${donutPercent};--donut-tone:${donutTone}">
          <div class="donut-inner"><strong>${formatAvg(avg)}</strong><span>${L('av 7', 'of 7')}</span></div>
        </div>
        <div class="summary-hero-info">
          <p class="summary-label">${L(`Fordeling av ${totalGrades} vurderinger`, `Distribution of ${totalGrades} assessments`)}</p>
          ${distributionBar(stats)}
          <div class="legend">
            <span><i style="background:var(--low)"></i>${bandLabel('low')} ${Math.round((stats.distribution.low / totalGrades) * 100)} %</span>
            <span><i style="background:var(--mid)"></i>${bandLabel('mid')} ${Math.round((stats.distribution.mid / totalGrades) * 100)} %</span>
            <span><i style="background:var(--high)"></i>${bandLabel('high')} ${Math.round((stats.distribution.high / totalGrades) * 100)} %</span>
          </div>
        </div>
      </div>
      <div class="param-rows">
        ${PARAMS.map(param => {
          const c = stats.counts[param.id];
          const total = c.low + c.mid + c.high;
          const rowAvg = stats.paramAvg[param.id];
          if (!total) {
            return `<div class="param-row">
              <div class="param-row-head"><span>${esc(paramLabel(param))}</span><strong>–</strong></div>
              <div class="stack-bar"><span class="dist-mid" style="width:100%;opacity:.12"></span></div>
            </div>`;
          }
          return `<div class="param-row">
            <div class="param-row-head">
              <span>${esc(paramLabel(param))}</span>
              <strong>${formatAvg(rowAvg)}<em> / 7</em></strong>
            </div>
            <div class="stack-bar" title="${esc(paramLabel(param))}: ${c.low} ${bandLabel('low').toLowerCase()}, ${c.mid} ${bandLabel('mid').toLowerCase()}, ${c.high} ${bandLabel('high').toLowerCase()}">
              <span class="dist-low" style="width:${(c.low / total) * 100}%"></span>
              <span class="dist-mid" style="width:${(c.mid / total) * 100}%"></span>
              <span class="dist-high" style="width:${(c.high / total) * 100}%"></span>
            </div>
          </div>`;
        }).join('')}
      </div>
    ` : emptyState(
      L('Ingen skår ennå', 'No scores yet'),
      L('Når CLASS-veilederne setter skår, vises fordelingen her.', 'When CLASS Coaches set scores, the distribution appears here.'),
      'chart'
    )}
  </section>`;
}

function reportItemsHTML(list, limit = 4) {
  const withReports = list
    .filter(unit => obs(unit.id).report)
    .sort((a, b) => (obs(b.id).report.publishedAt || '').localeCompare(obs(a.id).report.publishedAt || ''))
    .slice(0, limit);

  if (!withReports.length) {
    return emptyState(
      L('Ingen rapporter ennå', 'No reports yet'),
      L('Publiserte rapporter fra CLASS-veilederne vises her.', 'Published reports from CLASS Coaches appear here.'),
      'clipboard'
    );
  }

  return `<div class="reports-list">${withReports.map(unit => {
    const record = obs(unit.id);
    return `<a class="report-link" href="#/admin/enhet/${unit.id}">
      <div class="report-link-top">
        <span class="unit-kicker">${esc(unitKinderName(unit))}</span>
        <span class="muted" style="font-size:10.5px">${formatDate(record.report.publishedAt)}</span>
      </div>
      <h4>${esc(unitName(unit))}</h4>
      <p class="clamp-2">${esc(reportText(record.report))}</p>
      <span class="report-author">${esc(record.report.author)}</span>
    </a>`;
  }).join('')}</div>`;
}

function reportsPanelHTML(list, title = L('Siste rapporter', 'Latest reports')) {
  return `<section class="panel reports-panel">
    <div class="panel-head">
      <div><h2>${esc(title)}</h2><p class="panel-sub">${L('Publiserte observasjonsrapporter i utvalget', 'Published observation reports in the selection')}</p></div>
    </div>
    ${reportItemsHTML(list)}
  </section>`;
}

function unitRowHTML(unit, index) {
  const record = obs(unit.id);
  const status = observationStatus(record);
  const avg = gradeAvg(record.grades);
  const details = [status.label];
  if (record.visitDate) details.push(`${L('Besøkt', 'Visited')} ${formatDate(record.visitDate)}`);
  if (record.report) details.push(L('Rapport publisert', 'Report published'));

  return `<a class="unit-row" href="#/admin/enhet/${unit.id}">
    <span class="unit-row-num">${pad(index + 1)}</span>
    <div class="unit-row-main">
      <h4>${esc(unitName(unit))}</h4>
      <p>${esc(details.join(' · '))}</p>
    </div>
    ${avg != null ? `<span class="avg-pill tone-${toneFor(avg)}">${formatAvg(avg)}</span>` : statusChip(record, true)}
    <span class="chev">${icon('chevronRight')}</span>
  </a>`;
}

function kinderListHTML() {
  let list = scopedKindergartens();
  if (state.role === 'fagdirektor' && kgRegion !== 'all') {
    list = list.filter(k => k.regionId === kgRegion);
  }
  const query = kgSearch.trim().toLowerCase();
  if (query) {
    list = list.filter(k => `${k.name} ${k.nameEn || ''} ${k.regionName} ${k.regionNameEn || ''}`.toLowerCase().includes(query));
  }

  if (!list.length) {
    return emptyState(
      L('Ingen barnehager funnet', 'No kindergartens found'),
      L('Prøv et annet søkeord eller velg en annen region.', 'Try another search term or choose a different region.'),
      'search'
    );
  }

  const grouped = {};
  list.forEach(k => {
    if (!grouped[k.regionId]) grouped[k.regionId] = { name: kinderRegionName(k), items: [] };
    grouped[k.regionId].items.push(k);
  });

  return Object.values(grouped).map(group => `<div class="kg-group">
    <div class="kg-group-head">
      <h3>${esc(group.name)}</h3>
      <span>${group.items.length} ${plural(group.items.length, 'barnehage', 'barnehager', 'kindergarten', 'kindergartens')}</span>
    </div>
    <div class="kg-grid">
      ${group.items.map(kg => {
        const stats = statsForUnits(kg.units);
        const coverage = kg.units.length ? Math.round((stats.assessed / kg.units.length) * 100) : 0;
        return `<a class="kg-card" href="#/admin/barnehage/${kg.id}">
          <div class="kg-card-head">
            <span class="kg-icon">${icon('building')}</span>
            <div class="kg-card-titles">
              <h3>${esc(kinderLabel(kg))}</h3>
              <p>${kg.units.length} ${plural(kg.units.length, 'avdeling', 'avdelinger', 'unit', 'units')} · ${coverage} % ${L('vurdert', 'assessed')}</p>
            </div>
            <span class="arrow">${icon('chevronRight')}</span>
          </div>
          <div class="kg-card-foot">
            ${stats.avg != null ? `<span class="avg-pill tone-${toneFor(stats.avg)}">${formatAvg(stats.avg)}</span>` : '<span class="avg-pill">–</span>'}
            <span class="mini-bar"><i style="width:${coverage}%"></i></span>
            <span class="muted">${stats.reports} ${plural(stats.reports, 'rapport', 'rapporter', 'report', 'reports')}</span>
          </div>
        </a>`;
      }).join('')}
    </div>
  </div>`).join('');
}

function visibleKinderCount() {
  let list = scopedKindergartens();
  if (state.role === 'fagdirektor' && kgRegion !== 'all') {
    list = list.filter(k => k.regionId === kgRegion);
  }
  const query = kgSearch.trim().toLowerCase();
  if (query) {
    list = list.filter(k => `${k.name} ${k.nameEn || ''} ${k.regionName} ${k.regionNameEn || ''}`.toLowerCase().includes(query));
  }
  return list.length;
}

function filterChipsHTML() {
  if (state.role !== 'fagdirektor') return '';
  const chips = [{ id: 'all', label: L('Alle', 'All') }].concat(DATA.regions.map(r => ({ id: r.id, label: regionShortLabel(r) })));
  return `<div class="filter-chips" role="group" aria-label="${L('Filtrer på region', 'Filter by region')}">
    ${chips.map(chip => `<button class="filter-chip${kgRegion === chip.id ? ' active' : ''}" type="button" data-action="filter-region" data-region="${chip.id}">${esc(chip.label)}</button>`).join('')}
  </div>`;
}

function adminOverviewView() {
  const role = ROLES[state.role];
  const kindergartens = scopedKindergartens();
  const units = scopedUnits();
  const stats = statsForUnits(units);
  const regionCount = new Set(kindergartens.map(k => k.regionId)).size;

  return `<div class="view">
    ${pageHead({
      eyebrow: `${esc(roleScope(role))} · ${L('Administrasjon', 'Administration')}`,
      title: L('Administrasjon', 'Administration'),
      lede: state.role === 'fagdirektor'
        ? L('Velg en region og en barnehage for å se alle avdelinger, rapporter og skårsammendrag.', 'Choose a region and a kindergarten to see all units, reports and score summaries.')
        : L('Velg en barnehage for å se alle avdelinger, rapporter og skårsammendrag.', 'Choose a kindergarten to see all units, reports and score summaries.'),
      right: scopeChip(roleScopeDetail(role), 'building')
    })}

    <div class="kpi-grid">
      ${kpiCard(
        L('Barnehager', 'Kindergartens'),
        String(kindergartens.length),
        state.role === 'fagdirektor' ? `${regionCount} ${plural(regionCount, 'region', 'regioner', 'region', 'regions')}` : roleScope(role)
      )}
      ${kpiCard(L('Avdelinger', 'Units'), String(units.length), `${stats.assessed} ${L('vurdert', 'assessed')}`)}
      ${kpiCard(L('Gjennomsnitt', 'Average'), `${formatAvg(stats.avg)}<small>/ 7</small>`, `${stats.gradeTotal} ${plural(stats.gradeTotal, 'enkeltvurdering', 'enkeltvurderinger', 'individual assessment', 'individual assessments')}`)}
      ${kpiCard(L('Rapporter', 'Reports'), String(stats.reports), L('publisert i utvalget', 'published in the selection'))}
    </div>

    <div class="admin-grid">
      <section class="panel kg-panel">
        <div class="panel-head">
          <div>
            <h2>${L('Barnehager', 'Kindergartens')}</h2>
            <p class="panel-sub">${L('Trykk på en barnehage for å se avdelingene', 'Select a kindergarten to see its units')}</p>
          </div>
          <span class="chip chip-subtle" id="kg-count">${kindergartens.length} ${L('i utvalget', 'in selection')}</span>
        </div>
        <div class="toolbar">
          <label class="search-box">
            <span class="sr-only">${L('Søk etter barnehage', 'Search for a kindergarten')}</span>
            ${icon('search')}
            <input type="search" id="kg-search" placeholder="${L('Søk etter barnehage', 'Search for a kindergarten')}" value="${esc(kgSearch)}" data-action="search-kinder">
          </label>
          ${filterChipsHTML()}
        </div>
        <div class="kg-list" id="kinder-list">${kinderListHTML()}</div>
      </section>

      <div class="side-stack">
        ${gradeSummaryHTML(stats, {
          subtitle: state.role === 'fagdirektor'
            ? L('Alle barnehager og avdelinger', 'All kindergartens and units')
            : L('Alle barnehager i regionen', 'All kindergartens in the region')
        })}
        ${reportsPanelHTML(units)}
      </div>
    </div>
  </div>`;
}

function kinderDetailView(kg) {
  const stats = statsForUnits(kg.units);
  const isHome = state.role === 'leder';
  const coverage = kg.units.length ? Math.round((stats.assessed / kg.units.length) * 100) : 0;

  return `<div class="view">
    ${pageHead({
      eyebrow: `${esc(kinderRegionName(kg))} · ${L('Administrasjon', 'Administration')}`,
      title: kinderLabel(kg),
      lede: isHome
        ? L('Rapporter og skårsammendrag for alle avdelingene i barnehagen.', 'Reports and score summaries for all units in the kindergarten.')
        : L(`Alle avdelinger i ${kinderLabel(kg)}. Trykk på en avdeling for rapport og skår.`, `All units at ${kinderLabel(kg)}. Select a unit for its report and scores.`),
      back: isHome ? null : { href: '#/admin', label: L('Alle barnehager', 'All kindergartens') },
      right: `${scopeChip(kinderRegionName(kg), 'pin')}${stats.avg != null ? `<span class="avg-pill large tone-${toneFor(stats.avg)}">${L('Snitt', 'Avg.')} ${formatAvg(stats.avg)}</span>` : ''}`
    })}

    <div class="kpi-grid detail-kpis">
      ${kpiCard(L('Avdelinger', 'Units'), String(kg.units.length), L('i barnehagen', 'in the kindergarten'))}
      ${kpiCard(L('Vurdert', 'Assessed'), `${stats.assessed}<small>/ ${kg.units.length}</small>`, `${coverage} % ${L('dekning', 'coverage')}`)}
      ${kpiCard(L('Rapporter', 'Reports'), String(stats.reports), L('publisert', 'published'))}
    </div>

    <div class="detail-grid">
      <section class="panel units-panel">
        <div class="panel-head">
          <div><h2>${L('Avdelinger', 'Units')}</h2><p class="panel-sub">${L('Rapport, skår og besøksdato per avdeling', 'Report, scores and visit date per unit')}</p></div>
          <span class="chip chip-subtle">${kg.units.length} ${plural(kg.units.length, 'enhet', 'enheter', 'unit', 'units')}</span>
        </div>
        <div class="unit-list">
          ${kg.units.map((unit, index) => unitRowHTML(unit, index)).join('')}
        </div>
      </section>
      <div class="side-stack">
        ${gradeSummaryHTML(stats, {
          subtitle: L(`Alle avdelinger i ${kinderLabel(kg)}`, `All units at ${kinderLabel(kg)}`)
        })}
        ${reportsPanelHTML(kg.units)}
      </div>
    </div>
  </div>`;
}

function unitDetailView(unit) {
  const record = obs(unit.id);
  const avg = gradeAvg(record.grades);
  const count = gradedCount(record.grades);
  const back = state.role === 'pedagogisk'
    ? null
    : state.role === 'leder'
      ? { href: '#/admin', label: kinderLabel(DATA.solstua) }
      : { href: `#/admin/barnehage/${unit.kinderId}`, label: unitKinderName(unit) };

  const gradeDist = { low: 0, mid: 0, high: 0 };
  PARAMS.forEach(p => {
    const score = record.grades && record.grades[p.id];
    if (score != null) gradeDist[bandForScore(score)]++;
  });

  const reportPanel = `<section class="panel">
    <div class="panel-head">
      <div><h2>${L('Rapport', 'Report')}</h2><p class="panel-sub">${L('Observasjonsrapport fra besøket', 'Observation report from the visit')}</p></div>
      ${record.report ? `<span class="chip chip-done">${L('Publisert', 'Published')}</span>` : ''}
    </div>
    ${record.report ? `<div class="report-body">
      <div class="report-meta">
        <span class="mini-label">${L('Rapport', 'Report')}</span>
        <span>${esc(record.report.author)}</span>
        <span>·</span>
        <span>${formatDateLong(record.report.publishedAt)}</span>
        <span>·</span>
        <span>${esc(unitName(unit))}</span>
      </div>
      <p class="report-text">${esc(reportText(record.report))}</p>
    </div>` : emptyState(
      L('Ingen rapport publisert', 'No report published'),
      L('CLASS-veilederen har ikke publisert rapport for denne avdelingen ennå.', 'The CLASS Coach has not published a report for this unit yet.'),
      'clipboard'
    )}
  </section>`;

  const gradePanel = `<section class="panel">
    <div class="panel-head">
      <div><h2>${L('Skår', 'Scores')}</h2><p class="panel-sub">${L(`${count} av 10 parametere vurdert`, `${count} of 10 parameters assessed`)}</p></div>
      ${avg != null ? `<span class="avg-pill large tone-${toneFor(avg)}">${L('Snitt', 'Avg.')} ${formatAvg(avg)}</span>` : ''}
    </div>
    ${count ? `<div class="summary-hero">
      <div class="donut" style="--p:${avg != null ? (avg / 7) * 100 : 0};--donut-tone:var(--${toneFor(avg) === 'high' ? 'high' : toneFor(avg) === 'mid' ? 'mid' : 'low'})">
        <div class="donut-inner"><strong>${formatAvg(avg)}</strong><span>${L('av 7', 'of 7')}</span></div>
      </div>
      <div class="summary-hero-info">
        <p class="summary-label">${L('Fordeling', 'Distribution')}</p>
        <div class="dist-bar">
          <span class="dist-low" style="width:${(gradeDist.low / count) * 100}%"></span>
          <span class="dist-mid" style="width:${(gradeDist.mid / count) * 100}%"></span>
          <span class="dist-high" style="width:${(gradeDist.high / count) * 100}%"></span>
        </div>
        <div class="legend">
          <span><i style="background:var(--low)"></i>${bandLabel('low')} ${gradeDist.low}</span>
          <span><i style="background:var(--mid)"></i>${bandLabel('mid')} ${gradeDist.mid}</span>
          <span><i style="background:var(--high)"></i>${bandLabel('high')} ${gradeDist.high}</span>
        </div>
      </div>
    </div>
    <div class="grade-list">
      ${PARAMS.map(param => {
        const score = record.grades && record.grades[param.id];
        const band = score != null ? bandForScore(score) : null;
        return `<div class="grade-item">
          <div>
            <h4>${esc(paramLabel(param))}</h4>
            <p>${esc(paramDesc(param))}</p>
          </div>
          ${score != null
            ? `<span class="score-pill tone-${band}"><strong>${score}</strong><span>${bandLabel(band)}</span></span>`
            : `<span class="level-pill none">${L('Ikke satt', 'Not set')}</span>`}
        </div>`;
      }).join('')}
    </div>` : emptyState(
      L('Ingen skår satt', 'No scores set'),
      L('Når CLASS-veilederen gir skår, vises alle ti parameterne her.', 'When the CLASS Coach sets scores, all ten parameters appear here.'),
      'chart'
    )}
  </section>`;

  return `<div class="view">
    ${pageHead({
      eyebrow: `${esc(unitRegionName(unit))} · ${state.role === 'pedagogisk' ? L('Din avdeling', 'Your unit') : L('Administrasjon', 'Administration')}`,
      title: unitName(unit),
      lede: `${esc(unitKinderName(unit))} · ${unit.children} ${L('barn', 'children')} · ${unit.staff} ${L('voksne', 'adults')} · ${L('Kontakt', 'Contact')} ${esc(unit.leader)}${record.visitDate ? ` · ${L('Besøkt', 'Visited')} ${formatDate(record.visitDate)}` : ''}`,
      back,
      right: `${statusChip(record)}<span class="avg-pill large tone-${toneFor(avg)}">${avg != null ? `${L('Snitt', 'Avg.')} ${formatAvg(avg)}` : L('Ikke vurdert', 'Not assessed')}</span>`
    })}

    <div class="unit-detail-grid">
      ${reportPanel}
      ${gradePanel}
    </div>
  </div>`;
}

function unauthorizedView() {
  return `<div class="view unauthorized">
    <span class="chip chip-subtle">${L('Ingen tilgang', 'No access')}</span>
    <h1>${L('Denne siden er utenfor din rolle', 'This page is outside your role')}</h1>
    <p>${L('Rollen din har ikke innsyn i dette området. Gå tilbake til arbeidsflaten din.', 'Your role does not have access to this area. Return to your workspace.')}</p>
    <a class="btn btn-primary" href="#/admin">${icon('arrowLeft')} ${L('Til administrasjon', 'Go to administration')}</a>
  </div>`;
}

function adminView(route) {
  if (route.view === 'unit') {
    const unit = DATA.unitById[route.id];
    if (!unit || !canSeeUnit(unit.id)) return unauthorizedView();
    return unitDetailView(unit);
  }

  if (route.view === 'kinder') {
    const kg = DATA.kindergartenById[route.id];
    if (!kg || !canSeeKinder(kg.id)) return unauthorizedView();
    if (state.role === 'pedagogisk') return unauthorizedView();
    return kinderDetailView(kg);
  }

  if (state.role === 'pedagogisk') {
    return unitDetailView(DATA.pedUnit);
  }
  if (state.role === 'leder') {
    return kinderDetailView(DATA.solstua);
  }
  return adminOverviewView();
}

/* ============================================================
   DRAWERS – rapport og skår
   ============================================================ */

function drawerHTML() {
  const unit = DATA.unitById[drawer.unitId];
  if (!unit) return '';
  return drawer.type === 'report' ? reportDrawerHTML(unit) : gradeDrawerHTML(unit);
}

function drawerShell(unit, title, body, footer, eyebrow) {
  return `<div class="drawer-layer">
    <div class="drawer-backdrop" data-action="close-drawer"></div>
    <aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabindex="-1">
      <header class="drawer-head">
        <div>
          <p class="eyebrow">${esc(eyebrow || unitKinderName(unit))}</p>
          <h2 id="drawer-title">${esc(title)}</h2>
        </div>
        <button class="icon-btn" type="button" data-action="close-drawer" aria-label="${L('Lukk', 'Close')}">${icon('close')}</button>
      </header>
      <div class="drawer-body">${body}</div>
      <footer class="drawer-foot">${footer}</footer>
    </aside>
  </div>`;
}

function reportDrawerHTML(unit) {
  const record = obs(unit.id);
  const existing = record.report;
  const text = drawer.text != null ? drawer.text : reportText(existing);

  const body = `<p class="drawer-intro">${L(
    `Skriv en kort rapport fra besøket i ${esc(unitName(unit))}. Rapporten blir synlig for ledelsen når den publiseres.`,
    `Write a short report from the visit to ${esc(unitName(unit))}. The report becomes visible to management once published.`
  )}</p>
    <label class="field">
      <span>${L('Observasjonsrapport', 'Observation report')}</span>
      <textarea class="report-textarea" data-action="report-text" placeholder="${L('Hva observerte du? Beskriv lek, samspill, miljø og eventuelle utviklingsområder …', 'What did you observe? Describe play, interactions, environment and any areas for development …')}">${esc(text)}</textarea>
    </label>
    <div class="report-counter">
      <span data-report-count>${text.length} ${L('tegn', 'characters')}</span>
      <span>${L('Publiseres som', 'Published as')} <strong>${esc(ROLES[state.role].person)}</strong></span>
    </div>
    ${existing ? `<p class="muted small" style="margin-top:14px">${L(
      `Sist publisert ${formatDate(existing.publishedAt)} av ${esc(existing.author)}. En ny publisering oppdaterer rapporten.`,
      `Last published ${formatDate(existing.publishedAt)} by ${esc(existing.author)}. Publishing again updates the report.`
    )}</p>` : ''}`;

  const footer = `<button class="btn btn-quiet" type="button" data-action="close-drawer">${L('Avbryt', 'Cancel')}</button>
    <button class="btn btn-primary" type="button" data-action="publish-report" data-unit="${unit.id}"${text.trim() ? '' : ' disabled'}>
      ${icon('check')} ${L('Publiser rapport', 'Publish report')}
    </button>`;

  return drawerShell(unit, unitName(unit), body, footer, `${unitKinderName(unit)} · ${L('Rapport', 'Report')}`);
}

function gradeDrawerHTML(unit) {
  const selection = drawer.grades || {};
  const count = gradedCount(selection);
  const complete = count === PARAMS.length;

  const body = `<p class="drawer-intro">${L(
    `Sett skår fra 1 til 7 for alle ti parameterne i ${esc(unitName(unit))}.`,
    `Score all ten parameters from 1 to 7 in ${esc(unitName(unit))}.`
  )}</p>
    <div class="score-scale">
      <span><strong>1–2</strong> ${bandLabel('low')}</span>
      <span><strong>3–5</strong> ${bandLabel('mid')}</span>
      <span><strong>6–7</strong> ${bandLabel('high')}</span>
    </div>
    <div class="grade-progress">
      <div class="grade-progress-head">
        <span>${L('Vurderingsgrad', 'Assessment progress')}</span>
        <span data-grade-count>${L(`${count} av ${PARAMS.length} vurdert`, `${count} of ${PARAMS.length} assessed`)}</span>
      </div>
      <div class="grade-progress-track"><i data-grade-bar style="width:${(count / PARAMS.length) * 100}%"></i></div>
    </div>
    <div class="param-grades">
      ${PARAMS.map(param => `<div class="param-grade">
        <div class="param-grade-head">
          <h4>${esc(paramLabel(param))}</h4>
          <p>${esc(paramDesc(param))}</p>
        </div>
        <div class="segmented" data-seg="${param.id}" role="group" aria-label="${esc(paramLabel(param))}">
          ${SCORE_VALUES.map(value => {
            const active = selection[param.id] === value;
            const band = bandForScore(value);
            return `<button class="seg seg-${band}${active ? ' is-selected' : ''}" type="button"
              data-action="grade-pick" data-param="${param.id}" data-value="${value}"
              aria-pressed="${active ? 'true' : 'false'}" aria-label="${value} ${L('av 7', 'of 7')} · ${bandLabel(band)}">${value}</button>`;
          }).join('')}
        </div>
      </div>`).join('')}
    </div>`;

  const footer = `<button class="btn btn-quiet" type="button" data-action="close-drawer">${L('Avbryt', 'Cancel')}</button>
    <button class="btn btn-primary" type="button" data-action="save-grades" data-unit="${unit.id}"${complete ? '' : ' disabled'}>
      ${icon('check')} ${L('Lagre skår', 'Save scores')}
    </button>`;

  return drawerShell(unit, L('Gi skår', 'Set scores'), body, footer, `${unitKinderName(unit)} · ${unitName(unit)}`);
}

/* ============================================================
   RENDER
   ============================================================ */

const app = document.getElementById('app');
let lastRouteKey = null;

function render() {
  if (!state.role) {
    document.body.classList.remove('drawer-open');
    app.innerHTML = loginHTML();
    if (lastRouteKey !== 'login') {
      window.scrollTo(0, 0);
      lastRouteKey = 'login';
    }
    return;
  }

  const route = parseRoute();
  if (route.view === 'login') {
    location.hash = '#/observator';
    return;
  }

  const routeKey = `${route.view}|${route.id || ''}|${lang}`;
  const resetScroll = routeKey !== lastRouteKey;
  const content = route.view === 'observator' ? observerView() : adminView(route);
  document.body.classList.toggle('drawer-open', Boolean(drawer));
  app.innerHTML = shellHTML(content, route);
  lastRouteKey = routeKey;
  if (resetScroll) window.scrollTo(0, 0);

  if (drawer) {
    window.requestAnimationFrame(() => {
      if (drawer.type === 'report') {
        const field = document.querySelector('[data-action="report-text"]');
        if (field) {
          field.focus({ preventScroll: true });
          field.setSelectionRange(field.value.length, field.value.length);
        }
      } else {
        const first = document.querySelector('.drawer .seg');
        if (first) first.focus({ preventScroll: true });
      }
    });
  }
}

function openDrawer(type, unitId) {
  const unit = DATA.unitById[unitId];
  if (!unit) return;
  const record = obs(unitId);
  if (type === 'report') {
    drawer = { type: 'report', unitId, text: record.report ? reportText(record.report) : '' };
  } else {
    drawer = { type: 'grade', unitId, grades: record.grades ? Object.assign({}, record.grades) : {} };
  }
  render();
}

function closeDrawer() {
  drawer = null;
  render();
}

function updateGradeDrawerUI() {
  if (!drawer || drawer.type !== 'grade') return;
  const count = gradedCount(drawer.grades);

  document.querySelectorAll('[data-seg]').forEach(group => {
    const param = group.dataset.seg;
    group.querySelectorAll('.seg').forEach(button => {
      const active = drawer.grades[param] === Number(button.dataset.value);
      button.classList.toggle('is-selected', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  });

  const countElement = document.querySelector('[data-grade-count]');
  if (countElement) countElement.textContent = L(`${count} av ${PARAMS.length} vurdert`, `${count} of ${PARAMS.length} assessed`);
  const bar = document.querySelector('[data-grade-bar]');
  if (bar) bar.style.width = `${(count / PARAMS.length) * 100}%`;
  const save = document.querySelector('[data-action="save-grades"]');
  if (save) save.disabled = count < PARAMS.length;
}

function publishReport(unitId) {
  if (!drawer || drawer.type !== 'report') return;
  const textarea = document.querySelector('[data-action="report-text"]');
  const text = (textarea ? textarea.value : drawer.text || '').trim();
  if (!text) return;

  const record = obs(unitId);
  record.visited = true;
  if (!record.visitDate) record.visitDate = todayISO();
  record.report = {
    text,
    textEn: lang === 'en' ? text : null,
    author: ROLES[state.role].person,
    publishedAt: todayISO()
  };
  saveState();
  drawer = null;
  render();
  toast(L('Rapporten er publisert.', 'The report has been published.'));
}

function saveGrades(unitId) {
  if (!drawer || drawer.type !== 'grade') return;
  if (gradedCount(drawer.grades) < PARAMS.length) return;

  const record = obs(unitId);
  record.visited = true;
  if (!record.visitDate) record.visitDate = todayISO();
  record.grades = Object.assign({}, drawer.grades);
  record.gradedAt = todayISO();
  saveState();
  drawer = null;
  render();
  toast(L('Skårene er lagret.', 'The scores have been saved.'));
}

/* ============================================================
   EVENTS
   ============================================================ */

document.addEventListener('click', event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  const action = target.dataset.action;

  if (action === 'set-lang') {
    setLanguage(target.dataset.lang);
    return;
  }

  if (action === 'switch-role') {
    loginRole = state.role || 'fagdirektor';
    state.role = null;
    drawer = null;
    kgSearch = '';
    kgRegion = 'all';
    saveState();
    go('#/login');
    return;
  }

  if (action === 'reset-demo') {
    const confirmed = window.confirm(L(
      'Nullstille alle besøk, rapporter og skår til demodataene?',
      'Reset all visits, reports and scores to the demo data?'
    ));
    if (!confirmed) return;
    state.observations = clone(DATA.seedObservations);
    drawer = null;
    saveState();
    render();
    toast(L('Demodataene er nullstilt.', 'The demo data has been reset.'));
    return;
  }

  if (action === 'close-drawer') {
    closeDrawer();
    return;
  }

  if (action === 'open-report') {
    openDrawer('report', target.dataset.unit);
    return;
  }

  if (action === 'open-grade') {
    openDrawer('grade', target.dataset.unit);
    return;
  }

  if (action === 'grade-pick') {
    if (!drawer || drawer.type !== 'grade') return;
    drawer.grades[target.dataset.param] = Number(target.dataset.value);
    updateGradeDrawerUI();
    return;
  }

  if (action === 'publish-report') {
    publishReport(target.dataset.unit);
    return;
  }

  if (action === 'save-grades') {
    saveGrades(target.dataset.unit);
    return;
  }

  if (action === 'filter-region') {
    kgRegion = target.dataset.region || 'all';
    render();
    return;
  }
});

document.addEventListener('change', event => {
  if (event.target.id === 'login-role') {
    loginRole = event.target.value;
    const preview = document.getElementById('role-preview');
    if (preview) preview.innerHTML = rolePreviewHTML(loginRole);
    return;
  }

  const target = event.target.closest('[data-action]');
  if (!target) return;

  if (target.dataset.action === 'visit-check') {
    const unitId = target.dataset.unit;
    const record = obs(unitId);
    if (!target.checked && (record.report || record.grades)) {
      const confirmed = window.confirm(L(
        'Fjerne besøksmarkeringen? Rapport og skår beholdes.',
        'Remove the visit tick? The report and scores are kept.'
      ));
      if (!confirmed) {
        target.checked = true;
        return;
      }
    }
    record.visited = target.checked;
    if (target.checked && !record.visitDate) record.visitDate = todayISO();
    saveState();
    render();
    return;
  }

  if (target.dataset.action === 'visit-date') {
    const record = obs(target.dataset.unit);
    record.visitDate = target.value;
    saveState();
  }
});

document.addEventListener('input', event => {
  const target = event.target;

  if (target.matches('[data-action="report-text"]') && drawer && drawer.type === 'report') {
    drawer.text = target.value;
    const counter = document.querySelector('[data-report-count]');
    if (counter) counter.textContent = `${target.value.length} ${L('tegn', 'characters')}`;
    const publish = document.querySelector('[data-action="publish-report"]');
    if (publish) publish.disabled = !target.value.trim();
    return;
  }

  if (target.id === 'kg-search') {
    kgSearch = target.value;
    const list = document.getElementById('kinder-list');
    if (list) list.innerHTML = kinderListHTML();
    const count = document.getElementById('kg-count');
    if (count) count.textContent = `${visibleKinderCount()} ${L('i utvalget', 'in selection')}`;
    return;
  }
});

document.addEventListener('submit', event => {
  if (event.target.id !== 'login-form') return;
  event.preventDefault();
  state.role = loginRole;
  drawer = null;
  kgSearch = '';
  kgRegion = 'all';
  saveState();
  if (location.hash === '#/observator') {
    render();
  } else {
    location.hash = '#/observator';
  }
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && drawer) {
    closeDrawer();
  }
});

window.addEventListener('hashchange', () => {
  drawer = null;
  render();
});

/* ---------------- start ---------------- */

initState();
render();
