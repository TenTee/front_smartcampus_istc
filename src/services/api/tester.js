import { API_ENDPOINTS } from './endpoints';
import { apiRequest } from './client';

const smokeTests = [
  { name: 'Etudiants', url: API_ENDPOINTS.etudiants },
  { name: 'Formateurs', url: API_ENDPOINTS.formateurs },
  { name: 'Formations', url: API_ENDPOINTS.formations },
  { name: 'Inventaires', url: API_ENDPOINTS.inventaires },
  { name: 'Paiements', url: API_ENDPOINTS.paiements },
  { name: 'Depenses', url: API_ENDPOINTS.depenses },
  { name: 'Revenus', url: API_ENDPOINTS.revenus },
  { name: 'Users', url: API_ENDPOINTS.users },
];

export async function runApiSmokeTests() {
  const results = await Promise.all(
    smokeTests.map(async (test) => {
      try {
        const data = await apiRequest({ url: test.url, method: 'GET' });
        const count = Array.isArray(data) ? data.length : Array.isArray(data?.results) ? data.results.length : null;
        return { ...test, success: true, count, error: null };
      } catch (error) {
        return {
          ...test,
          success: false,
          count: null,
          error: error?.response?.data?.detail || error?.message || 'Erreur inconnue',
        };
      }
    })
  );

  return results;
}
