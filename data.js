/* ============================================================
   Norlandia · Kvalitetsportal – demodata (prototype)
   Ingen backend. Alt genereres lokalt og lagres i localStorage.
   ============================================================ */

const PARAMS = [
  { id: 'lek', label: 'Positivt klima', labelEn: 'Positive climate', desc: 'Varme, anerkjennelse og et trygt og positivt samspill i avdelingen.', descEn: 'Warmth, acknowledgement and a safe, positive climate in the unit.' },
  { id: 'sprak', label: 'Negativt klima', labelEn: 'Negative climate', desc: 'Hvordan avdelingen forebygger og håndterer negative samspillmønstre.', descEn: 'How the unit prevents and handles negative interaction patterns.' },
  { id: 'omsorg', label: 'Sensitive ansatte', labelEn: 'Sensitive staff', desc: 'Ansattes evne til å fange opp og svare på barnas signaler.', descEn: "Staff's ability to notice and respond to children's signals." },
  { id: 'sosial', label: 'Barns perspektiv og medvirkning', labelEn: "Children's perspective and participation", desc: 'Barnas opplevelse, innflytelse og rett til å påvirke egen hverdag.', descEn: "Children's experience, influence and right to shape their everyday life." },
  { id: 'medvirkning', label: 'Regler og rutiner', labelEn: 'Rules and routines', desc: 'Forutsigbarhet, tydelighet og hvordan regler og rutiner støtter barna.', descEn: 'Predictability, clarity and how rules and routines support the children.' },
  { id: 'inkludering', label: 'Produktivitet', labelEn: 'Productivity', desc: 'Organisering av dagen og bruk av tid og ressurser i barnas lek og læring.', descEn: 'How the day is organised and how time and resources are used for play and learning.' },
  { id: 'fysisk', label: 'Materiell og modaliteter', labelEn: 'Materials and modalities', desc: 'Tilgang til og bruk av materiell, leker og ulike uttrykksformer.', descEn: 'Access to and use of materials, toys and different forms of expression.' },
  { id: 'foreldre', label: 'Forståelse og tenking', labelEn: 'Understanding and thinking', desc: 'Hvordan personalet støtter barnas forståelse, undring og tenking.', descEn: "How staff support children's understanding, curiosity and thinking." },
  { id: 'dokumentasjon', label: 'Kvalitet på tilbakemeldinger', labelEn: 'Feedback quality', desc: 'Hvordan ansatte gir barn, kolleger og foresatte tydelige og støttende tilbakemeldinger.', descEn: 'How staff give clear and supportive feedback to children, colleagues and parents.' },
  { id: 'kompetanse', label: 'Språkstøtte', labelEn: 'Language support', desc: 'Systematisk språkstøtte og tilrettelegging for barnas språkutvikling.', descEn: "Systematic language support and adaptations for children's language development." }
];

const SCORE_MIN = 1;
const SCORE_MAX = 7;
const SCORE_VALUES = [1, 2, 3, 4, 5, 6, 7];
const SCORE_BANDS = {
  low:  { key: 'low',  label: 'Lav',     labelEn: 'Low',    range: '1–2', min: 1, max: 2 },
  mid:  { key: 'mid',  label: 'Middels', labelEn: 'Medium', range: '3–5', min: 3, max: 5 },
  high: { key: 'high', label: 'Høy',     labelEn: 'High',   range: '6–7', min: 6, max: 7 }
};
const LEVEL_KEYS = ['low', 'mid', 'high'];

function bandForScore(score) {
  if (score <= 2) return 'low';
  if (score <= 5) return 'mid';
  return 'high';
}

const REGION_DEFS = [
  {
    id: 'ost', name: 'Region Øst', short: 'Øst',
    nameEn: 'Eastern Region', shortEn: 'East',
    names: [
      'Solstua', 'Bjørkely', 'Eventyrskogen', 'Regnbuen', 'Trollstua', 'Lillevik',
      'Nordlys', 'Månegløtt', 'Smørblomst', 'Furuhaugen', 'Vintereng', 'Sommerfuglen',
      'Sandslottet', 'Blåklokke', 'Tømmerstua', 'Stjernestua', 'Maurtua', 'Bikuben',
      'Kastanjen', 'Lønnebakken', 'Pilefletten', 'Fugletun', 'Engstua', 'Rognehaugen',
      'Elvebakken', 'Skogkanten', 'Myrull', 'Krekling', 'Reveskogen', 'Marihøna'
    ]
  },
  {
    id: 'vest', name: 'Region Vest', short: 'Vest',
    nameEn: 'Western Region', shortEn: 'West',
    names: [
      'Havbris', 'Fjordstua', 'Bryggekanten', 'Seilduken', 'Strandtun', 'Bølgen',
      'Svaberget', 'Lyngheia', 'Tindved', 'Vierstua', 'Fossestua', 'Elvekanten',
      'Dalstua', 'Fjellro', 'Viddevang', 'Vestavind', 'Solbakken', 'Måkeskriket',
      'Skjærgården', 'Naustet', 'Tangen', 'Klippen', 'Vågen', 'Sundet',
      'Holmen', 'Neset', 'Odden', 'Vikja', 'Brekken', 'Sjøstjerna'
    ]
  },
  {
    id: 'nord', name: 'Region Nord', short: 'Nord',
    nameEn: 'Northern Region', shortEn: 'North',
    names: [
      'Nordstjerna', 'Polarlys', 'Midnattssol', 'Snøfnugg', 'Isbjørnen', 'Ravnen',
      'Tundra', 'Vidda', 'Nordkalotten', 'Borealis', 'Froststua', 'Vinterhavn',
      'Skarv', 'Lomvi', 'Fjellvåk', 'Steinura', 'Bergtatt', 'Ravnehaugen',
      'Bjørnehiet', 'Gaupehiet', 'Reinslykke', 'Nordavind', 'Kaldkilden', 'Høgfjell'
    ]
  }
];

const UNIT_NAME_POOL = [
  'Bjørka', 'Furu', 'Eika', 'Rogna', 'Selja', 'Ospa', 'Hegga', 'Lønna',
  'Grana', 'Vier', 'Blåbær', 'Tyttebær', 'Multe', 'Bringebær', 'Jordbær',
  'Solbær', 'Nype', 'Hvitveis', 'Kløver', 'Tiriltunga', 'Marikåpe', 'Fiolen',
  'Blåklokke', 'Smørblomst'
];

const UNIT_LEADERS = [
  'Ingrid Bakke', 'Kari Nordheim', 'Jonas Lie', 'Mette Holt', 'Anders Vik',
  'Tone Solberg', 'Eirik Dahl', 'Mari Tveit', 'Henrik Aas', 'Live Berg',
  'Oda Lund', 'Sindre Moen'
];

const OBSERVERS = [
  'Hege Cecilie', 'Morten Sæther', 'Ingrid Bakke', 'Silje Aas',
  'Kari Nordheim', 'Jonas Lie', 'Mette Holt'
];

const ROLE_ORDER = ['fagdirektor', 'regiondirektor', 'leder', 'pedagogisk'];

const ROLES = {
  fagdirektor: {
    id: 'fagdirektor',
    label: 'Fagdirektør',
    labelEn: 'Director of Pedagogy',
    short: 'Fagdirektør',
    shortEn: 'Director',
    person: 'Hege Cecilie',
    initials: 'HC',
    scope: 'Alle regioner',
    scopeEn: 'All regions',
    scopeDetail: 'Alle barnehager og avdelinger i Norlandia',
    scopeDetailEn: 'All kindergartens and units in Norlandia',
    description: 'Ser alle barnehager og avdelinger på tvers av regionene, med samlet skåroversikt for hele virksomheten.',
    descriptionEn: 'Sees every kindergarten and unit across all regions, with an overall score summary for the whole organisation.',
    loginEyebrow: 'Hele virksomheten',
    loginEyebrowEn: 'Whole organisation'
  },
  regiondirektor: {
    id: 'regiondirektor',
    label: 'Regiondirektør',
    labelEn: 'Regional Director',
    short: 'Regiondirektør',
    shortEn: 'Regional Director',
    person: 'Morten Sæther',
    initials: 'MS',
    scope: 'Region Øst',
    scopeEn: 'Eastern Region',
    scopeDetail: 'Alle barnehager i Region Øst',
    scopeDetailEn: 'All kindergartens in the Eastern Region',
    description: 'Ser alle barnehager i regionen, følger opp avdelingene og sammenstiller skår på regionsnivå.',
    descriptionEn: 'Sees all kindergartens in the region, follows up units and aggregates scores at regional level.',
    regionId: 'ost',
    loginEyebrow: 'Region Øst',
    loginEyebrowEn: 'Eastern Region'
  },
  leder: {
    id: 'leder',
    label: 'Barnehageleder',
    labelEn: 'Kindergarten Manager',
    short: 'Leder',
    shortEn: 'Manager',
    person: 'Ingrid Bakke',
    initials: 'IB',
    scope: 'Solstua barnehage',
    scopeEn: 'Solstua Kindergarten',
    scopeDetail: 'Alle avdelinger i Solstua barnehage',
    scopeDetailEn: 'All units at Solstua Kindergarten',
    description: 'Ser rapporter og skårsammendrag for alle avdelingene i egen barnehage.',
    descriptionEn: 'Sees reports and score summaries for all units in their own kindergarten.',
    loginEyebrow: 'Solstua barnehage',
    loginEyebrowEn: 'Solstua Kindergarten'
  },
  pedagogisk: {
    id: 'pedagogisk',
    label: 'Pedagogisk leder',
    labelEn: 'Pedagogical Lead',
    short: 'Ped. leder',
    shortEn: 'Ped. lead',
    person: 'Silje Aas',
    initials: 'SA',
    scope: 'Avdeling Eika',
    scopeEn: 'Eika Unit',
    scopeDetail: 'Solstua barnehage · Avdeling Eika',
    scopeDetailEn: 'Solstua Kindergarten · Eika Unit',
    description: 'Ser rapport, skår og oppsummering for egen avdeling.',
    descriptionEn: 'Sees the report, scores and summary for their own unit.',
    loginEyebrow: 'Avdeling Eika',
    loginEyebrowEn: 'Eika Unit'
  }
};

/* ---------- deterministisk tilfeldighet ---------- */

function hashString(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function randomFor(key) {
  return mulberry32(hashString(key));
}

function isoDaysAgo(days) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - days);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function blankObservation() {
  return { visited: false, visitDate: '', report: null, grades: null, gradedAt: '' };
}

/* ---------- bygg regioner, barnehager og avdelinger ---------- */

const regions = REGION_DEFS.map(r => ({
  id: r.id,
  name: r.name,
  short: r.short,
  nameEn: r.nameEn,
  shortEn: r.shortEn
}));
const kindergartens = [];
const units = [];

REGION_DEFS.forEach(regionDef => {
  regionDef.names.forEach((baseName, localIndex) => {
    const kIdx = kindergartens.length;
    const region = regions.find(r => r.id === regionDef.id);
    const kg = {
      id: `k-${kIdx}`,
      idx: kIdx,
      name: `${baseName} barnehage`,
      nameEn: `${baseName} Kindergarten`,
      baseName,
      regionId: regionDef.id,
      regionName: region.name,
      regionNameEn: region.nameEn,
      units: []
    };

    const offset = (kIdx * 3) % UNIT_NAME_POOL.length;
    for (let i = 0; i < 10; i++) {
      const poolName = UNIT_NAME_POOL[(offset + i) % UNIT_NAME_POOL.length];
      const unitId = `u-${kIdx}-${i}`;
      const rng = randomFor(unitId + 'meta');
      const unit = {
        id: unitId,
        idx: i,
        name: `Avdeling ${poolName}`,
        nameEn: `Unit ${poolName}`,
        kinderId: kg.id,
        kinderName: kg.name,
        kinderNameEn: kg.nameEn,
        regionId: regionDef.id,
        regionName: region.name,
        regionNameEn: region.nameEn,
        children: 13 + Math.floor(rng() * 12),
        staff: 3 + Math.floor(rng() * 4),
        leader: UNIT_LEADERS[Math.floor(rng() * UNIT_LEADERS.length)]
      };
      kg.units.push(unit);
      units.push(unit);
    }
    kindergartens.push(kg);
  });
});

const kindergartenById = Object.fromEntries(kindergartens.map(k => [k.id, k]));
const unitById = Object.fromEntries(units.map(u => [u.id, u]));
const solstua = kindergartens.find(k => k.baseName === 'Solstua');
const pedUnit = solstua.units[2]; // Avdeling Eika

/* ---------- rapportmaler ---------- */

const REPORT_TEMPLATES = [
  'Det er en rolig og trygg atmosfære i {unit}, og personalet er tett på barna i lek og hverdagssituasjoner. Materialene er godt tilgjengelige, men det er behov for tydeligere voksenstyring i overgangene mellom inne og ute.',
  'Barna viser stor glede og engasjement i leken. Personalet lytter og bygger videre på barnas initiativ, og språkstimuleringen er godt integrert i måltidene. Uteområdet bør få mer variert utstyr for de eldste barna.',
  'Avdelingen har et varmt og inkluderende miljø. Alle barna blir sett og hilset på ved oppstart, og det legges godt til rette for vennskap på tvers av alder. Dokumentasjonsarbeidet kan bli mer systematisk.',
  'God struktur og forutsigbare rutiner preger dagen. Personalet samarbeider godt og fordeler oppgaver tydelig. Det anbefales å involvere barna mer i planlegging av aktiviteter og i å velge innhold.',
  'Det fysiske miljøet er lyst og innbydende, med tydelige soner for ulike typer lek. Uteområdet er godt utnyttet, men noe vedlikehold gjenstår. Relasjonen til foresatte fremstår trygg og jevnlig.',
  'Personalet viser høy faglig bevissthet og reflekterer aktivt over egen praksis. Barna får gode muligheter til medvirkning, og konflikter håndteres rolig og tydelig. Språkstimulering kan styrkes i utelek.',
  'Det er en positiv og arbeidsom gjeng som skaper gode dager for barna. Rutinene er godt innarbeidet. Det er likevel rom for å styrke systematisk observasjon og bruk av pedagogisk dokumentasjon.',
  'Avdelingen fremstår godt organisert, med tydelig ledelse og engasjerte ansatte. Barna har gode lekevilkår og trygge rammer. Overgangen til skole for de eldste barna kan planlegges tettere sammen med foresatte.'
];

const REPORT_TEMPLATES_EN = [
  'There is a calm and safe atmosphere in the unit, and staff are close to the children during play and daily routines. Materials are easily accessible, but transitions between indoors and outdoors need clearer adult guidance.',
  'The children show great joy and engagement in play. Staff listen and build on children\'s initiatives, and language stimulation is well integrated into mealtimes. The outdoor area should offer more varied equipment for the oldest children.',
  'The unit has a warm and inclusive environment. All children are seen and greeted at the start of the day, and friendships across ages are well supported. Documentation could become more systematic.',
  'Clear structure and predictable routines shape the day. Staff collaborate well and divide tasks clearly. Children should be more involved in planning activities and choosing content.',
  'The physical environment is bright and inviting, with clear zones for different types of play. The outdoor area is well used, but some maintenance remains. The relationship with parents appears safe and regular.',
  'Staff show high professional awareness and reflect actively on their own practice. Children have good opportunities for participation, and conflicts are handled calmly and clearly. Language stimulation could be strengthened during outdoor play.',
  'The team is positive and hard-working and creates good days for the children. Routines are well established. There is still room to strengthen systematic observation and the use of pedagogical documentation.',
  'The unit appears well organised, with clear leadership and engaged staff. Children have good play conditions and safe frameworks. The transition to school for the oldest children could be planned more closely with parents.'
];

const PARAM_BIAS = [0.05, 0.02, 0.10, 0.03, -0.04, 0.01, 0.02, 0.00, -0.12, 0.09];

function seedScore(rng, paramIndex) {
  const bias = (PARAM_BIAS[paramIndex] || 0) * 2;
  const triangular = (rng() + rng()) / 2;
  const raw = 1 + triangular * 6 + bias;
  return Math.max(SCORE_MIN, Math.min(SCORE_MAX, Math.round(raw)));
}

function seedGrades(seedKey) {
  const rng = randomFor(seedKey + 'grades');
  const grades = {};
  PARAMS.forEach((p, i) => { grades[p.id] = seedScore(rng, i); });
  return grades;
}

function seedReport(seedKey, unit, author) {
  const rng = randomFor(seedKey + 'report');
  const index = Math.floor(rng() * REPORT_TEMPLATES.length);
  return {
    text: REPORT_TEMPLATES[index].replace('{unit}', unit.name.toLowerCase()),
    textEn: REPORT_TEMPLATES_EN[index],
    author,
    publishedAt: isoDaysAgo(1 + Math.floor(rng() * 4))
  };
}

/* ---------- seed observasjoner for alle 840 avdelinger ---------- */

function buildSeedObservations() {
  const observations = {};

  units.forEach(unit => {
    const rng = randomFor(unit.id + 'obs');
    const assessed = rng() < 0.7;
    const hasReport = assessed && rng() < 0.58;
    const obs = blankObservation();

    if (assessed) {
      obs.visited = true;
      obs.visitDate = isoDaysAgo(4 + Math.floor(rng() * 105));
      obs.grades = seedGrades(unit.id);
      obs.gradedAt = obs.visitDate;
    } else if (rng() < 0.12) {
      obs.visited = true;
      obs.visitDate = isoDaysAgo(8 + Math.floor(rng() * 90));
    }

    if (hasReport) {
      const author = OBSERVERS[Math.floor(rng() * OBSERVERS.length)];
      const report = seedReport(unit.id, unit, author);
      obs.report = report;
      obs.visitDate = report.publishedAt;
      obs.gradedAt = report.publishedAt;
    }

    observations[unit.id] = obs;
  });

  return observations;
}

/* ---------- tildelte avdelinger per rolle ---------- */

function unitAt(kIdx, uIdx) {
  return kindergartens[kIdx].units[uIdx];
}

const FAG_PICKS = [
  [0, 0], [7, 3], [14, 6], [21, 1], [28, 8],
  [32, 2], [40, 5], [48, 7], [62, 4], [70, 9]
];

const REGION_PICKS = [
  [2, 0], [5, 4], [8, 2], [11, 7], [13, 1],
  [16, 5], [19, 8], [23, 3], [26, 6], [29, 9]
];

const rosters = {
  fagdirektor: FAG_PICKS.map(([k, u]) => unitAt(k, u)),
  regiondirektor: REGION_PICKS.map(([k, u]) => unitAt(k, u)),
  leder: solstua.units.slice(),
  pedagogisk: [pedUnit]
};

/* Gjør besøkslisten levende: første avdelinger er i ulike stadier. */
function applyAssignmentPatterns(observations) {
  const startDays = { fagdirektor: 16, regiondirektor: 9, leder: 22, pedagogisk: 6 };
  const startOffset = { fagdirektor: 0, regiondirektor: 3, leder: 6, pedagogisk: 0 };

  ROLE_ORDER.forEach(roleId => {
    const list = rosters[roleId];
    const limit = roleId === 'pedagogisk' ? 1 : 3;
    const base = startDays[roleId];
    const offset = startOffset[roleId];

    list.forEach((unit, index) => {
      if (index >= limit) {
        observations[unit.id] = blankObservation();
        return;
      }

      const date = isoDaysAgo(base + offset + index * 11);
      const obs = blankObservation();
      obs.visited = true;
      obs.visitDate = date;

      if (index === 0) {
        const templateIndex = (unit.idx + 2) % REPORT_TEMPLATES.length;
        obs.grades = seedGrades(unit.id + roleId);
        obs.gradedAt = date;
        obs.report = {
          text: REPORT_TEMPLATES[templateIndex].replace('{unit}', unit.name.toLowerCase()),
          textEn: REPORT_TEMPLATES_EN[templateIndex],
          author: ROLES[roleId].person,
          publishedAt: date
        };
      } else if (index === 1) {
        obs.grades = seedGrades(unit.id + roleId);
        obs.gradedAt = date;
      }

      observations[unit.id] = obs;
    });
  });
}

const seedObservations = buildSeedObservations();
applyAssignmentPatterns(seedObservations);

const DATA = {
  regions,
  kindergartens,
  units,
  kindergartenById,
  unitById,
  solstua,
  pedUnit,
  rosters,
  seedObservations,
  blankObservation
};
