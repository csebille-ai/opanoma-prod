// geocoding.js — appels Nominatim, fonctions pures async
import { hasValidCoordinates } from './astro-utils.js';

/**
 * Géocode une ville via Nominatim (essaie "Ville, France" puis "Ville")
 * @returns {{ lat: number, lon: number, displayName: string }}
 */
export async function geocodeCity(city) {
  const cityTrimmed = String(city || '').trim();
  if (!cityTrimmed) {
    throw new Error('Veuillez renseigner une ville de naissance.');
  }

  const queries = [cityTrimmed + ', France', cityTrimmed];
  for (const query of queries) {
    const endpoint = 'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&addressdetails=1&accept-language=fr&q='
      + encodeURIComponent(query);
    const response = await fetch(endpoint, { headers: { Accept: 'application/json' } });
    if (!response.ok) continue;

    const results = await response.json();
    if (Array.isArray(results) && results.length) {
      const first = results[0];
      const lat = Number(first.lat);
      const lon = Number(first.lon);
      if (hasValidCoordinates(lat, lon)) {
        return { lat, lon, displayName: first.display_name || cityTrimmed };
      }
    }
  }

  throw new Error('Impossible de trouver des coordonnées pour cette ville. Essayez avec "Ville, Pays".');
}
