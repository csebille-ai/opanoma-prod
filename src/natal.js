// natal.js — fetch API + rendu DOM carte natale
import { HOUSE_THEMES, degToSignName, parseCoordinateInput, hasValidCoordinates } from './astro-utils.js';
import { geocodeCity } from './geocoding.js';

async function fetchNatal(date, time, tzOffset, label, lat, lon) {
  const endpoint = '/astro/natal?date=' + encodeURIComponent(date)
    + '&time='     + encodeURIComponent(time)
    + '&tzOffset=' + encodeURIComponent(String(tzOffset))
    + '&label='    + encodeURIComponent(label || '')
    + '&lat='      + encodeURIComponent(String(lat))
    + '&lon='      + encodeURIComponent(String(lon));

  const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload && payload.detail ? payload.detail : 'API error');
  }
  return payload;
}

export function renderNatalHouses(payload, targetNode) {
  if (!targetNode) return;
  const houses = payload && payload.houses ? payload.houses : {};
  const planets = payload && payload.planets ? payload.planets : {};
  const cusps = Array.isArray(houses.cusps) ? houses.cusps.slice(0, 12) : [];

  if (!cusps.length) {
    targetNode.innerHTML = '<p class="natal-houses-empty">Les 12 domaines ne sont pas disponibles pour cette carte.</p>';
    return;
  }

  const planetsByHouse = {};
  Object.keys(planets).forEach((key) => {
    const item = planets[key] || {};
    const house = Number(item.house);
    if (!Number.isFinite(house) || house < 1 || house > 12) return;
    if (!planetsByHouse[house]) planetsByHouse[house] = [];
    planetsByHouse[house].push(item.label || key);
  });

  targetNode.innerHTML = cusps.map((deg, index) => {
    const house = index + 1;
    const sign = degToSignName(deg);
    const theme = HOUSE_THEMES[index] || '';
    const occupants = planetsByHouse[house] || [];
    const occupancy = occupants.length
      ? '<p class="natal-house-planets"><strong>Planetes actives:</strong> ' + occupants.join(', ') + '</p>'
      : '<p class="natal-house-planets"><strong>Planetes actives:</strong> aucune</p>';
    return '<article class="natal-house-card">'
      + '<h6>Maison ' + house + ' · ' + sign + '</h6>'
      + '<p>' + theme + '</p>'
      + occupancy
      + '</article>';
  }).join('');
}

/** Initialise la section carte natale (form + observer) */
export function initNatal() {
  const natalForm        = document.getElementById('natal-form');
  const natalResult      = document.getElementById('natal-result');
  const natalHeadline    = document.getElementById('natal-headline');
  const natalTemperament = document.getElementById('natal-temperament');
  const natalMental      = document.getElementById('natal-mental');
  const natalAffectif    = document.getElementById('natal-affectif');
  const natalMomentum    = document.getElementById('natal-momentum');
  const natalAspects     = document.getElementById('natal-aspects');
  const natalHouses      = document.getElementById('natal-houses');
  const natalGeoStatus   = document.getElementById('natal-geo-status');
  const natalSection     = document.querySelector('.natal-section');

  if (!natalForm) return;

  let geoLookupToken = 0;

  function resetNatalUi(clearInputs) {
    if (clearInputs) {
      natalForm.reset();
      ['natal-city', 'natal-lat', 'natal-lon'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
      });
    }
    if (natalResult)      natalResult.style.display = 'none';
    if (natalHeadline)    natalHeadline.textContent    = '';
    if (natalTemperament) natalTemperament.textContent = '';
    if (natalMental)      natalMental.textContent      = '';
    if (natalAffectif)    natalAffectif.textContent    = '';
    if (natalMomentum)    natalMomentum.textContent    = '';
    if (natalAspects)     natalAspects.textContent     = '';
    if (natalHouses)      natalHouses.innerHTML        = '';
    if (natalGeoStatus)   natalGeoStatus.textContent   = '';
  }

  async function resolveCityCoordinatesIntoInputs(forceLookup) {
    const cityInput = document.getElementById('natal-city');
    const latInput  = document.getElementById('natal-lat');
    const lonInput  = document.getElementById('natal-lon');
    if (!cityInput || !latInput || !lonInput) return false;

    const cityValue = cityInput.value.trim();
    const latValue  = parseCoordinateInput(latInput);
    const lonValue  = parseCoordinateInput(lonInput);

    if (!forceLookup && hasValidCoordinates(latValue, lonValue)) {
      if (natalGeoStatus) natalGeoStatus.textContent = 'Coordonnées manuelles utilisées.';
      return true;
    }

    if (!cityValue) {
      if (natalGeoStatus) natalGeoStatus.textContent = '';
      return false;
    }

    const currentToken = ++geoLookupToken;
    if (natalGeoStatus) natalGeoStatus.textContent = 'Recherche des coordonnées de la ville...';

    try {
      const geo = await geocodeCity(cityValue);
      if (currentToken !== geoLookupToken) return false;
      latInput.value = geo.lat.toFixed(4);
      lonInput.value = geo.lon.toFixed(4);
      if (natalGeoStatus) {
        natalGeoStatus.textContent = 'Coordonnées trouvées pour '
          + geo.displayName + ' (' + geo.lat.toFixed(4) + ', ' + geo.lon.toFixed(4) + ')';
      }
      return true;
    } catch (err) {
      if (currentToken !== geoLookupToken) return false;
      if (natalGeoStatus) natalGeoStatus.textContent = String(err && err.message ? err.message : err);
      return false;
    }
  }

  // Géocodage automatique au blur sur le champ ville
  const cityInputLive = document.getElementById('natal-city');
  const latInputLive  = document.getElementById('natal-lat');
  const lonInputLive  = document.getElementById('natal-lon');
  if (cityInputLive) {
    cityInputLive.addEventListener('blur', () => {
      const latNow = parseCoordinateInput(latInputLive);
      const lonNow = parseCoordinateInput(lonInputLive);
      if (!hasValidCoordinates(latNow, lonNow) && cityInputLive.value.trim()) {
        resolveCityCoordinatesIntoInputs(true);
      }
    });
  }

  let hasNatalResult = false;

  natalForm.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const dateInput = document.getElementById('natal-date');
    const timeInput = document.getElementById('natal-time');
    const cityInput = document.getElementById('natal-city');
    const latInput  = document.getElementById('natal-lat');
    const lonInput  = document.getElementById('natal-lon');
    if (!dateInput || !timeInput) return;

    const dateValue = dateInput.value;
    const timeValue = timeInput.value;
    const cityValue = cityInput ? cityInput.value.trim() : '';
    if (!dateValue || !timeValue) return;

    const tzOffset = new Date(dateValue + 'T' + timeValue).getTimezoneOffset();

    natalResult.style.display = 'block';
    natalHeadline.textContent = 'Calcul en cours...';
    natalTemperament.textContent = '';
    natalMental.textContent      = '';
    natalAffectif.textContent    = '';
    natalMomentum.textContent    = '';
    natalAspects.textContent     = '';
    if (natalHouses)    natalHouses.innerHTML      = '';
    if (natalGeoStatus) natalGeoStatus.textContent = '';

    try {
      const resolved = await resolveCityCoordinatesIntoInputs(false);
      const latValue = parseCoordinateInput(latInput);
      const lonValue = parseCoordinateInput(lonInput);
      if (!resolved || !hasValidCoordinates(latValue, lonValue)) {
        throw new Error('Impossible de déterminer les coordonnées. Vérifiez la ville ou saisissez latitude/longitude.');
      }

      const payload  = await fetchNatal(dateValue, timeValue, tzOffset, cityValue, latValue, lonValue);
      const profile  = payload.profile  || {};
      const guidance = payload.guidance || {};
      const topAspects = (payload.aspects || []).slice(0, 3)
        .map(a => a.between + ' ' + a.type + ' (orb ' + a.orb + ')');

      natalHeadline.textContent    = 'Asc ' + (profile.ascSign || '?')
        + ' · Soleil ' + (profile.sunSign || '?')
        + ' · Lune '   + (profile.moonSign || '?')
        + ' · Phase '  + (profile.moonPhase || '?');
      natalTemperament.textContent = guidance.temperament || '';
      natalMental.textContent      = guidance.mental      || '';
      natalAffectif.textContent    = guidance.affectif    || '';
      natalMomentum.textContent    = guidance.momentum    || '';
      natalAspects.textContent     = topAspects.length ? topAspects.join(' | ') : 'Aucun aspect majeur retenu';
      renderNatalHouses(payload, natalHouses);
      hasNatalResult = true;
    } catch (err) {
      natalHeadline.textContent    = 'Impossible de calculer la carte pour le moment';
      natalTemperament.textContent = String(err && err.message ? err.message : err);
      if (natalHouses)    natalHouses.innerHTML      = '';
      if (natalGeoStatus) natalGeoStatus.textContent = '';
    }
  });

  // Reset quand on quitte la section
  if (natalSection && 'IntersectionObserver' in window) {
    new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting && (natalResult.style.display === 'block' || hasNatalResult)) {
          hasNatalResult = false;
          resetNatalUi(true);
        }
      });
    }, { threshold: 0.1 }).observe(natalSection);
  }
}
