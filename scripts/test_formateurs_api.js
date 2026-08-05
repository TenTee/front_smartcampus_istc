import axios from 'axios';

const API_BASE_URL = 'https://apismart.ifpt.dev';

async function testFormateursAPI() {
  console.log('--- TEST DES APIS FORMATEURS ---');
  try {
    // Note: Pour tester avec succès en production/staging, 
    // un token JWT valide doit être fourni dans les headers :
    // { headers: { Authorization: `Bearer ${TOKEN}` } }
    
    // 1. GET /api/formateurs/
    console.log('1. Test GET /api/formateurs/ (Liste)');
    const getRes = await axios.get(`${API_BASE_URL}/api/formateurs/`);
    console.log(`✅ GET Réussi. Status: ${getRes.status}`);
    console.log(`Données reçues:`, getRes.data?.slice(0, 2), '...');

    // 2. POST /api/formateurs/ (Simulation mock)
    console.log('\n2. Test POST /api/formateurs/ (Création)');
    const fakeData = {
      nom: "Testeur Formateur",
      email: "test.formateur@example.com",
      contact: "0102030405",
      salaire: 2000,
      specialites: [1, 2] // IDs de spécialités mockées
    };
    console.log('Payload soumis :', fakeData);
    // On commente l'exécution réelle pour éviter de surpeupler la DB en cas de tests répétés.
    // const postRes = await axios.post(`${API_BASE_URL}/api/formateurs/`, fakeData);
    // console.log(`✅ POST Réussi. Status: ${postRes.status}`);

    // Les autres méthodes (PUT, PATCH, DELETE) suivraient la même logique avec un ID issu du GET.
    console.log('\n✅ Tous les tests sont structurés.');
  } catch (error) {
    console.error('❌ Erreur lors du test:', error.response?.status, error.response?.data || error.message);
  }
}

testFormateursAPI();
