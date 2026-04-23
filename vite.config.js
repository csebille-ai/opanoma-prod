import { defineConfig, loadEnv } from 'vite';
import { cpSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import {
  swe_julday,
  swe_calc_ut,
  SE_GREG_CAL,
  SE_SUN,
  SE_MOON,
  SE_MERCURY,
  SE_VENUS,
  SE_MARS,
  SE_JUPITER,
  SE_SATURN,
} from '@fusionstrings/swisseph-wasm';
import SwissEPH from 'sweph-wasm';

const SIGNS = [
  'Belier', 'Taureau', 'Gemeaux', 'Cancer', 'Lion', 'Vierge',
  'Balance', 'Scorpion', 'Sagittaire', 'Capricorne', 'Verseau', 'Poissons',
];

const PLANETS = [
  { key: 'sun', label: 'Soleil', id: SE_SUN },
  { key: 'moon', label: 'Lune', id: SE_MOON },
  { key: 'mercury', label: 'Mercure', id: SE_MERCURY },
  { key: 'venus', label: 'Venus', id: SE_VENUS },
  { key: 'mars', label: 'Mars', id: SE_MARS },
  { key: 'jupiter', label: 'Jupiter', id: SE_JUPITER },
  { key: 'saturn', label: 'Saturne', id: SE_SATURN },
];

const ASPECTS = [
  { name: 'conjonction', angle: 0, orb: 6 },
  { name: 'sextile', angle: 60, orb: 4 },
  { name: 'carre', angle: 90, orb: 5 },
  { name: 'trigone', angle: 120, orb: 5 },
  { name: 'opposition', angle: 180, orb: 6 },
];

const HOUSE_MEANINGS = {
  1: 'identite et elan personnel',
  2: 'valeurs et securite materielle',
  3: 'echanges et clarte mentale',
  4: 'foyer et ancrage emotionnel',
  5: 'creativite et expression du coeur',
  6: 'organisation et rythme quotidien',
  7: 'relationnel et partenariat',
  8: 'transformation et profondeur',
  9: 'vision et ouverture',
  10: 'ambition et trajectoire pro',
  11: 'reseau et projets collectifs',
  12: 'recul et regeneration interieure',
};

const NATAL_PLANETS = [
  { key: 'sun', label: 'Soleil', id: 0 },
  { key: 'moon', label: 'Lune', id: 1 },
  { key: 'mercury', label: 'Mercure', id: 2 },
  { key: 'venus', label: 'Venus', id: 3 },
  { key: 'mars', label: 'Mars', id: 4 },
  { key: 'jupiter', label: 'Jupiter', id: 5 },
  { key: 'saturn', label: 'Saturne', id: 6 },
];

let sweEnginePromise;
const SWE_WASM_URL = 'https://unpkg.com/sweph-wasm@2.6.9/dist/wasm/swisseph.wasm';
let OPENAI_API_KEY = String(process.env.OPENAI_API_KEY || '').trim();
let OPENAI_HOROSCOPE_MODEL = String(process.env.OPENAI_HOROSCOPE_MODEL || 'gpt-4o-mini').trim();
const openAiGuidanceCache = new Map();

function normalizeDeg(value) {
  return (((Number(value) % 360) + 360) % 360);
}

async function getSweEngine() {
  if (!sweEnginePromise) {
    sweEnginePromise = (async () => {
      const swe = await SwissEPH.init(SWE_WASM_URL);
      return swe;
    })();
  }
  return sweEnginePromise;
}

function normalizeSign(input) {
  const raw = String(input || '').trim();
  if (!raw) return 'Belier';
  const simple = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const hit = SIGNS.find((s) => s.toLowerCase() === simple);
  return hit || 'Belier';
}

function longitudeToSign(longitude) {
  const idx = Math.floor((((longitude % 360) + 360) % 360) / 30);
  return SIGNS[idx];
}

function signToIndex(sign) {
  return Math.max(0, SIGNS.indexOf(sign));
}

function houseFromSign(baseSign, targetSign) {
  const base = signToIndex(baseSign);
  const target = signToIndex(targetSign);
  return ((target - base + 12) % 12) + 1;
}

function angularDistance(a, b) {
  const diff = Math.abs(a - b) % 360;
  return diff > 180 ? 360 - diff : diff;
}

function moonPhaseLabel(angle) {
  if (angle < 45) return 'Nouvelle Lune';
  if (angle < 90) return 'Premier croissant';
  if (angle < 135) return 'Premier quartier';
  if (angle < 180) return 'Gibbeuse croissante';
  if (angle < 225) return 'Pleine Lune';
  if (angle < 270) return 'Gibbeuse decroissante';
  if (angle < 315) return 'Dernier quartier';
  return 'Dernier croissant';
}

function calcPlanetLongitudes(date) {
  const hour = date.getUTCHours() + (date.getUTCMinutes() / 60) + (date.getUTCSeconds() / 3600);
  const jd = swe_julday(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
    hour,
    SE_GREG_CAL,
  );

  const byKey = {};
  const byLabel = {};
  for (const planet of PLANETS) {
    const result = swe_calc_ut(jd, planet.id, 0);
    const longitude = (((result.longitude % 360) + 360) % 360);
    byKey[planet.key] = {
      label: planet.label,
      longitude,
      sign: longitudeToSign(longitude),
    };
    byLabel[planet.label] = byKey[planet.key];
  }

  return { jd, byKey, byLabel };
}

function findMajorAspects(byLabel) {
  const labels = Object.keys(byLabel);
  const out = [];

  for (let i = 0; i < labels.length; i += 1) {
    for (let j = i + 1; j < labels.length; j += 1) {
      const a = labels[i];
      const b = labels[j];
      const dist = angularDistance(byLabel[a].longitude, byLabel[b].longitude);

      for (const asp of ASPECTS) {
        const orb = Math.abs(dist - asp.angle);
        if (orb <= asp.orb) {
          out.push({
            between: `${a}-${b}`,
            type: asp.name,
            orb: Number(orb.toFixed(2)),
            exact: Number(dist.toFixed(2)),
          });
          break;
        }
      }
    }
  }

  return out.sort((x, y) => x.orb - y.orb).slice(0, 6);
}

function buildGuidance(sign, byKey, aspects) {
  // Templates poétiques et bienveillants - moins techniques
  const energyTemplates = [
    `L'énergie du jour vous invite à suivre votre intuition. Votre essence créative brille particulièrement : c'est le moment d'exprimer ce qui vous tient vraiment à cœur.`,
    `Les astres alignent votre lumière intérieure avec vos possibilités. Écoutez cette petite voix qui vous guide vers l'authenticité et la vérité.`,
    `L'univers vous envoie une onde bienveillante. Votre puissance personnelle est à son apogée : c'est le moment d'avancer vers vos rêves.`,
    `Les énergies cosmiques soutiennent votre mouvement aujourd'hui. Faites confiance à votre instinct et à la sagesse que vous portez en vous.`,
  ];

  const loveTemplates = [
    `Dans vos relations, l'authenticité est votre plus grande force. Osez partager vos vrais sentiments—c'est là que naît la connexion véritable.`,
    `L'amour sous toutes ses formes vous sourit aujourd'hui. Soyez ouvert à recevoir et à donner avec générosité et confiance.`,
    `Votre cœur vibre sur une belle fréquence. C'est le moment de cultiver la tendresse, que ce soit avec vous-même ou avec ceux qui vous sont chers.`,
    `Les liens émotionnels se renforcent. Montrez votre vulnérabilité—c'est une forme de courage que les autres apprécieront.`,
  ];

  const workTemplates = [
    `Vos idées sont brillantes aujourd'hui. C'est le moment de communiquer vos visions, de clarifier vos intentions et de passer à l'action avec confiance.`,
    `L'énergie créative est forte. Utilisez-la pour avancer sur vos projets, même les petits pas comptent. Votre discipline et votre vision se renforcent.`,
    `Les obstacles se transforment en opportunités. Restez flexible, cherchez des solutions innovantes, et avancez avec détermination mais sans forcer.`,
    `C'est un jour favorable aux décisions importantes. Votre clarté mentale est au rendez-vous—faites confiance à votre jugement et à votre expérience.`,
  ];

  const tipTemplates = [
    `Conseil du jour : Prenez un moment pour vous reconnecter à votre intention profonde. Une méditation, une pause, ou simplement quelques respirations conscientes.`,
    `Conseil du jour : Privilégiez une conversation honnête avec quelqu'un que vous aimez. L'heure est à l'authenticité et à la transparence.`,
    `Conseil du jour : Écoutez votre corps et vos émotions. Elles vous parlent—accordez-leur de l'attention, c'est votre sagesse intérieure qui s'exprime.`,
    `Conseil du jour : Notez une intention claire pour demain. Visualisez-la brièvement avant de dormir. Les rêves vous apporteront des réponses.`,
  ];

  // Seed basé sur la date du jour pour stabilité quotidienne (même texte toute la journée)
  const now = new Date();
  const dateString = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const dateSeed = dateString.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 4;
  
  // Sélection basée sur le signe + la date pour variation quotidienne stable
  const signIndex = SIGNS.indexOf(sign) % SIGNS.length;
  
  const energy = energyTemplates[(signIndex + dateSeed) % energyTemplates.length];
  const love = loveTemplates[(signIndex + dateSeed + 1) % loveTemplates.length];
  const work = workTemplates[(signIndex + dateSeed + 2) % workTemplates.length];
  const tip = tipTemplates[(signIndex + dateSeed + 3) % tipTemplates.length];

  const moonAngle = ((byKey.moon.longitude - byKey.sun.longitude + 360) % 360);
  const moonPhase = moonPhaseLabel(moonAngle);

  return { energy, love, work, tip, moonPhase };
}

function extractFirstJsonObject(rawText) {
  const text = String(rawText || '').trim();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_) {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) return null;
    try {
      return JSON.parse(match[0]);
    } catch (__){
      return null;
    }
  }
}

function getDailyCacheKey(sign) {
  const now = new Date();
  const day = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return `${day}:${sign}`;
}

async function maybeBuildOpenAiGuidance(sign, byKey, aspects) {
  if (!OPENAI_API_KEY) return null;

  const cacheKey = getDailyCacheKey(sign);
  if (openAiGuidanceCache.has(cacheKey)) {
    return openAiGuidanceCache.get(cacheKey);
  }

  const topAspects = (Array.isArray(aspects) ? aspects : [])
    .slice(0, 3)
    .map((a) => `${a.between} (${a.type})`)
    .join(', ');

  const prompt = [
    'Ecris un mini horoscope en francais naturel, chaleureux, inspirant et non technique.',
    `Signe cible: ${sign}.`,
    `Soleil: ${byKey.sun.sign}. Lune: ${byKey.moon.sign}.`,
    `Aspects majeurs: ${topAspects || 'aucun aspect dominant notable'}.`,
    'Retourne STRICTEMENT un objet JSON valide sans markdown et sans texte autour avec ces cles exactes:',
    '{"energy":"...","love":"...","work":"...","tip":"..."}',
    'Contraintes: 1 a 2 phrases par champ, ton bienveillant, concret, pas de jargon astrologique.',
  ].join(' ');

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_HOROSCOPE_MODEL,
      temperature: 0.9,
      max_tokens: 420,
      messages: [
        {
          role: 'system',
          content: 'Tu es un redacteur d\'horoscope premium en francais. Tu retournes uniquement du JSON valide.',
        },
        { role: 'user', content: prompt },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI request failed (${response.status})`);
  }

  const data = await response.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message
    ? data.choices[0].message.content
    : '';
  const parsed = extractFirstJsonObject(content);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error('OpenAI payload is not valid JSON object');
  }

  const candidate = {
    energy: String(parsed.energy || '').trim(),
    love: String(parsed.love || '').trim(),
    work: String(parsed.work || '').trim(),
    tip: String(parsed.tip || '').trim(),
  };

  if (!candidate.energy || !candidate.love || !candidate.work || !candidate.tip) {
    throw new Error('OpenAI payload missing required fields');
  }

  openAiGuidanceCache.set(cacheKey, candidate);
  return candidate;
}

async function buildHoroscopePayload(sign) {
  const now = new Date();
  const targetSign = normalizeSign(sign);
  const { byKey, byLabel } = calcPlanetLongitudes(now);
  const aspects = findMajorAspects(byLabel);
  const fallbackGuidance = buildGuidance(targetSign, byKey, aspects);

  let guidance = fallbackGuidance;
  let guidanceSource = 'template';
  try {
    const aiGuidance = await maybeBuildOpenAiGuidance(targetSign, byKey, aspects);
    if (aiGuidance) {
      guidance = { ...fallbackGuidance, ...aiGuidance };
      guidanceSource = 'openai';
    }
  } catch (error) {
    guidanceSource = 'template-fallback';
    console.warn('OpenAI horoscope guidance failed, using fallback:', error && error.message ? error.message : error);
  }

  return {
    source: 'swiss-ephemeris-wasm',
    guidanceSource,
    timestamp: now.toISOString(),
    sign: targetSign,
    sky: {
      sunSign: byKey.sun.sign,
      moonSign: byKey.moon.sign,
      moonPhase: guidance.moonPhase,
      planets: Object.fromEntries(
        Object.entries(byKey).map(([k, v]) => [k, {
          label: v.label,
          longitude: Number(v.longitude.toFixed(4)),
          sign: v.sign,
        }]),
      ),
      aspects,
    },
    guidance: {
      energy: guidance.energy,
      love: guidance.love,
      work: guidance.work,
      tip: guidance.tip,
    },
  };
}

function parseBirthInput(dateText, timeText, tzOffsetText) {
  const [year, month, day] = String(dateText || '').split('-').map((v) => Number(v));
  const [hour, minute] = String(timeText || '').split(':').map((v) => Number(v));
  const tzOffsetMin = Number(tzOffsetText || 0);

  if (!year || !month || !day || Number.isNaN(hour) || Number.isNaN(minute)) {
    throw new Error('Missing or invalid date/time');
  }

  const utcMillis = Date.UTC(year, month - 1, day, hour, minute, 0, 0) + (tzOffsetMin * 60000);
  return new Date(utcMillis);
}

function parseGeoInput(latText, lonText) {
  const latitude = Number(latText);
  const longitude = Number(lonText);

  if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
    throw new Error('Latitude/longitude invalides');
  }
  if (latitude < -90 || latitude > 90) {
    throw new Error('Latitude hors plage (-90 a 90)');
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('Longitude hors plage (-180 a 180)');
  }

  return { latitude, longitude };
}

function normalizeCusps(rawCusps) {
  if (!Array.isArray(rawCusps) || rawCusps.length < 12) {
    throw new Error('Cusps maison indisponibles');
  }

  const cusps = [];
  if (rawCusps.length >= 13 && typeof rawCusps[1] === 'number') {
    for (let i = 1; i <= 12; i += 1) cusps.push(normalizeDeg(rawCusps[i]));
  } else {
    for (let i = 0; i < 12; i += 1) cusps.push(normalizeDeg(rawCusps[i]));
  }
  return cusps;
}

function isWithinArc(point, start, end) {
  if (start <= end) return point >= start && point < end;
  return point >= start || point < end;
}

function longitudeToHouse(longitude, cusps) {
  const lon = normalizeDeg(longitude);
  for (let i = 0; i < 12; i += 1) {
    const start = cusps[i];
    const end = cusps[(i + 1) % 12];
    if (isWithinArc(lon, start, end)) return i + 1;
  }
  return 1;
}

function calcNatalData(dateUtc, latitude, longitude, hsys = 'P') {
  const swe = null;
  return { swe, dateUtc, latitude, longitude, hsys };
}

async function calcNatalLongitudesAndHouses(dateUtc, latitude, longitude, hsys = 'P') {
  const swe = await getSweEngine();
  const hour = dateUtc.getUTCHours() + (dateUtc.getUTCMinutes() / 60) + (dateUtc.getUTCSeconds() / 3600);
  const jd = swe.swe_julday(
    dateUtc.getUTCFullYear(),
    dateUtc.getUTCMonth() + 1,
    dateUtc.getUTCDate(),
    hour,
    1,
  );

  const byKey = {};
  const byLabel = {};
  for (const planet of NATAL_PLANETS) {
    const pos = swe.swe_calc_ut(jd, planet.id, 0);
    const longitudeDeg = normalizeDeg(pos[0]);
    byKey[planet.key] = {
      label: planet.label,
      longitude: longitudeDeg,
      sign: longitudeToSign(longitudeDeg),
    };
    byLabel[planet.label] = byKey[planet.key];
  }

  const houses = swe.swe_houses(jd, latitude, longitude, hsys);
  const cusps = normalizeCusps(houses.cusps);
  const ascmc = Array.isArray(houses.ascmc) ? houses.ascmc : [];
  const asc = normalizeDeg(ascmc[0] || cusps[0]);
  const mc = normalizeDeg(ascmc[1] || cusps[9]);

  const placements = Object.fromEntries(
    Object.entries(byKey).map(([key, value]) => [key, {
      ...value,
      house: longitudeToHouse(value.longitude, cusps),
    }]),
  );

  return {
    jd,
    byKey: placements,
    byLabel,
    cusps,
    asc,
    mc,
  };
}

function buildNatalGuidance(byKey, aspects, ascSign) {
  const moonAngle = ((byKey.moon.longitude - byKey.sun.longitude + 360) % 360);
  const moonPhase = moonPhaseLabel(moonAngle);
  const keyAspect = aspects.length ? `${aspects[0].between} (${aspects[0].type})` : 'Aucun aspect majeur detecte';

  const chartSeed = Math.round(
    (byKey.sun.longitude * 13)
    + (byKey.moon.longitude * 11)
    + (byKey.mercury.longitude * 7)
    + (byKey.venus.longitude * 5)
    + (byKey.mars.longitude * 3)
    + (byKey.jupiter.longitude * 2)
    + byKey.saturn.longitude,
  );

  const pick = (options, offset = 0) => options[(Math.abs(chartSeed + offset) % options.length)];

  const temperamentTemplates = [
    `Ascendant ${ascSign}, Soleil en ${byKey.sun.sign} (maison ${byKey.sun.house}), Lune en ${byKey.moon.sign} (maison ${byKey.moon.house}): une presence qui melange instinct, stabilite et expression personnelle.`,
    `Votre axe de base met en avant Ascendant ${ascSign}, Soleil en ${byKey.sun.sign} et Lune en ${byKey.moon.sign}: cela donne une signature personnelle lisible, entre elan et sensibilite.`,
    `Le trio Ascendant ${ascSign} + Soleil maison ${byKey.sun.house} + Lune maison ${byKey.moon.house} montre un temperament oriente vers la coherence entre image exterieure et besoins interieurs.`,
  ];

  const mentalTemplates = [
    `Mercure en ${byKey.mercury.sign} (maison ${byKey.mercury.house}) et Saturne en ${byKey.saturn.sign} (maison ${byKey.saturn.house}) soutiennent une pensee structuree, analytique et constante.`,
    `Sur le plan mental, Mercure (${byKey.mercury.sign}, maison ${byKey.mercury.house}) privilegie la precision, pendant que Saturne (${byKey.saturn.sign}, maison ${byKey.saturn.house}) renforce la rigueur.`,
    `Votre fonctionnement intellectuel combine clarte mercurienne (maison ${byKey.mercury.house}) et cadre saturnien (maison ${byKey.saturn.house}), utile pour les decisions de fond.`,
  ];

  const affectifTemplates = [
    `Venus en ${byKey.venus.sign} (maison ${byKey.venus.house}) et Mars en ${byKey.mars.sign} (maison ${byKey.mars.house}) indiquent un style affectif qui alterne douceur relationnelle et besoin d action claire.`,
    `Cote lien et desir: Venus (${byKey.venus.sign}, maison ${byKey.venus.house}) cherche l harmonie, Mars (${byKey.mars.sign}, maison ${byKey.mars.house}) demande des preuves concretes.`,
    `La dynamique Venus-Mars (maisons ${byKey.venus.house} et ${byKey.mars.house}) favorise des relations authentiques, avec une attente forte sur l engagement reel.`,
  ];

  const momentumTemplates = [
    `Aspect central: ${keyAspect}. Phase lunaire natale: ${moonPhase}. Le mouvement evolutif passe par des ajustements progressifs et reguliers.`,
    `Le fil conducteur actuel est ${keyAspect}, sur fond de ${moonPhase}: l efficacite vient d actions simples mais tenues dans le temps.`,
    `Avec ${keyAspect} et une phase ${moonPhase}, la carte suggere d avancer par priorites nettes plutot que par dispersion.`,
  ];

  const temperament = pick(temperamentTemplates, 3);
  const mental = pick(mentalTemplates, 7);
  const affectif = pick(affectifTemplates, 11);
  const momentum = pick(momentumTemplates, 17);

  return { temperament, mental, affectif, momentum, moonPhase };
}

async function buildNatalPayload(input) {
  const birthUtc = parseBirthInput(input.date, input.time, input.tzOffset);
  const { latitude, longitude } = parseGeoInput(input.lat, input.lon);
  const { byKey, byLabel, cusps, asc, mc } = await calcNatalLongitudesAndHouses(birthUtc, latitude, longitude, 'P');
  const aspects = findMajorAspects(byLabel);
  const guidance = buildNatalGuidance(byKey, aspects, longitudeToSign(asc));

  return {
    source: 'swiss-ephemeris-wasm',
    type: 'natal-v2',
    input: {
      date: input.date,
      time: input.time,
      tzOffset: Number(input.tzOffset || 0),
      label: input.label || '',
      latitude,
      longitude,
    },
    birthUtc: birthUtc.toISOString(),
    profile: {
      ascSign: longitudeToSign(asc),
      mcSign: longitudeToSign(mc),
      sunSign: byKey.sun.sign,
      moonSign: byKey.moon.sign,
      mercurySign: byKey.mercury.sign,
      venusSign: byKey.venus.sign,
      marsSign: byKey.mars.sign,
      jupiterSign: byKey.jupiter.sign,
      saturnSign: byKey.saturn.sign,
      moonPhase: guidance.moonPhase,
    },
    houses: {
      system: 'Placidus',
      ascendant: Number(asc.toFixed(4)),
      midheaven: Number(mc.toFixed(4)),
      cusps: cusps.map((deg) => Number(deg.toFixed(4))),
    },
    planets: Object.fromEntries(
      Object.entries(byKey).map(([k, v]) => [k, {
        label: v.label,
        longitude: Number(v.longitude.toFixed(4)),
        sign: v.sign,
        house: v.house,
      }]),
    ),
    aspects,
    guidance,
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  OPENAI_API_KEY = String(env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '').trim();
  OPENAI_HOROSCOPE_MODEL = String(env.OPENAI_HOROSCOPE_MODEL || process.env.OPENAI_HOROSCOPE_MODEL || 'gpt-4o-mini').trim();

  return {
    root: '.',
    base: './',
    publicDir: 'public',   // public/ contains images, videos — copied as-is to dist/
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: 'index.html',
      },
    },
    plugins: [
    {
      name: 'astro-horoscope-dev-api',
      configureServer(server) {
        server.middlewares.use('/astro/horoscope', (req, res) => {
          (async () => {
            try {
              const requestUrl = new URL(req.url || '', 'http://localhost');
              const sign = requestUrl.searchParams.get('sign') || 'Belier';
              const payload = await buildHoroscopePayload(sign);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify(payload));
            } catch (error) {
              res.statusCode = 500;
              res.setHeader('Content-Type', 'application/json; charset=utf-8');
              res.end(JSON.stringify({
                error: 'Horoscope calculation failed',
                detail: String(error && error.message ? error.message : error),
              }));
            }
          })();
        });

        server.middlewares.use('/astro/natal', (req, res) => {
          (async () => {
            try {
            const requestUrl = new URL(req.url || '', 'http://localhost');
            const payload = await buildNatalPayload({
              date: requestUrl.searchParams.get('date'),
              time: requestUrl.searchParams.get('time'),
              tzOffset: requestUrl.searchParams.get('tzOffset'),
              label: requestUrl.searchParams.get('label') || '',
              lat: requestUrl.searchParams.get('lat'),
              lon: requestUrl.searchParams.get('lon'),
            });

            res.statusCode = 200;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify(payload));
            } catch (error) {
            res.statusCode = 400;
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(JSON.stringify({
              error: 'Natal chart calculation failed',
              detail: String(error && error.message ? error.message : error),
            }));
            }
          })();
        });
      },
    },
    {
      name: 'copy-backend',
      closeBundle() {
        // Copy PHP/Node API backend
        cpSync('prod/api', join('dist', 'api'), { recursive: true });
        // Copy PWA files
        cpSync('prod/sw.js', join('dist', 'sw.js'));
        cpSync('prod/manifest.json', join('dist', 'manifest.json'));
        // Copy non-module scripts referenced by inline HTML
        cpSync('src/popup.js', join('dist', 'src', 'popup.js'));
        cpSync('src/popup-adapter.js', join('dist', 'src', 'popup-adapter.js'));
        cpSync('src/card-animations.js', join('dist', 'src', 'card-animations.js'));
      },
    },
    ],
    server: {
      open: true,
      proxy: {
        '/api': {
          target: 'https://api-opanoma.csebille.workers.dev',
          changeOrigin: true,
          secure: true,
        },
      },
    },
  };
});
