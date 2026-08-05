import { apiRequest } from './client';
import { API_ENDPOINTS, idPath } from './endpoints';

function createCrudService(basePath) {
  return {
    list: (params) => apiRequest({ url: basePath, method: 'GET', params }),
    detail: (id) => apiRequest({ url: idPath(basePath, id), method: 'GET' }),
    create: (payload) => apiRequest({ url: basePath, method: 'POST', data: payload }),
    update: (id, payload) => apiRequest({ url: idPath(basePath, id), method: 'PUT', data: payload }),
    remove: (id) => apiRequest({ url: idPath(basePath, id), method: 'DELETE' }),
  };
}

export const authService = {
  login: (payload) => apiRequest({ url: API_ENDPOINTS.authLogin, method: 'POST', data: payload }),
  auth_token_refresh_create: (payload) => apiRequest({ url: API_ENDPOINTS.authRefresh, method: 'POST', data: payload }),
};

export const assiduiteService = createCrudService(API_ENDPOINTS.assiduite);
export const communicationService = createCrudService(API_ENDPOINTS.communication);
export const congesService = createCrudService(API_ENDPOINTS.conges);
export const demandesService = createCrudService(API_ENDPOINTS.demandes);
export const depensesService = createCrudService(API_ENDPOINTS.depenses);
export const emploiDuTempsService = {
  ...createCrudService(API_ENDPOINTS.emploiDuTemps),
  me: () => apiRequest({ url: `${API_ENDPOINTS.emploiDuTemps}me/`, method: 'GET' }),
};
export const etudiantsService = {
  ...createCrudService(API_ENDPOINTS.etudiants),
  me: () => apiRequest({ url: `${API_ENDPOINTS.etudiants}me/`, method: 'GET' }),
  getSituation: () => apiRequest({ url: `${API_ENDPOINTS.etudiants}me/situation/`, method: 'GET' }),
  getHistory: () => apiRequest({ url: `${API_ENDPOINTS.etudiants}me/history/`, method: 'GET' }),
  validateInscription: (id) => apiRequest({ url: idPath(API_ENDPOINTS.etudiants, `${id}/valider-inscription`), method: 'POST' }),
  studentCard: () => apiRequest({ url: `${API_ENDPOINTS.etudiantsPortal}carte-etudiant/`, method: 'GET' }),
  studentCertificate: () => apiRequest({ url: `${API_ENDPOINTS.etudiantsPortal}certificat-scolarite/`, method: 'GET' }),
  exportDocuments: (id) => apiRequest({ url: idPath(API_ENDPOINTS.etudiants, `${id}/export-documents`), method: 'GET' }),
  uploadDocument: (id, formData) =>
    apiRequest({
      url: idPath(API_ENDPOINTS.etudiants, `${id}/documents`),
      method: 'POST',
      data: formData,
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
export const formateursService = {
  ...createCrudService(API_ENDPOINTS.formateurs),
  getFormateurs: (params) => apiRequest({ url: API_ENDPOINTS.formateurs, method: 'GET', params }),
  createFormateur: (payload) => apiRequest({ url: API_ENDPOINTS.formateurs, method: 'POST', data: payload }),
  getFormateurById: (id) => apiRequest({ url: idPath(API_ENDPOINTS.formateurs, id), method: 'GET' }),
  updateFormateur: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.formateurs, id), method: 'PUT', data: payload }),
  patchFormateur: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.formateurs, id), method: 'PATCH', data: payload }),
  generateAccount: (id) => apiRequest({ url: idPath(API_ENDPOINTS.formateurs, `${id}/generate-account`), method: 'POST' }),
  resetPassword: (userId) => apiRequest({ url: idPath(API_ENDPOINTS.users, `${userId}/reset-password`), method: 'POST' }),
};
export const formationsService = {
  ...createCrudService(API_ENDPOINTS.formations),
  detail: (id) => apiRequest({ url: idPath(API_ENDPOINTS.formations, id), method: 'GET' }),
};
export const niveauxService = {
  ...createCrudService(API_ENDPOINTS.niveaux),
  patch: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.niveaux, id), method: 'PATCH', data: payload }),
};
export const inscriptionsService = {
  create: (payload) => apiRequest({ url: API_ENDPOINTS.inscriptions, method: 'POST', data: payload }),
};
export const inventairesService = createCrudService(API_ENDPOINTS.inventaires);
export const modulesService = {
  ...createCrudService(API_ENDPOINTS.modules),
  detail: (id) => apiRequest({ url: idPath(API_ENDPOINTS.modules, id), method: 'GET' }),
};
export const notesService = {
  ...createCrudService(API_ENDPOINTS.notes),
  me: (params) => apiRequest({ url: `${API_ENDPOINTS.notes}me/`, method: 'GET', params }),
  studentDetails: (etudiantId, params) =>
    apiRequest({ url: idPath(API_ENDPOINTS.notes, `${etudiantId}/details`), method: 'GET', params }),
  byModule: (params) => apiRequest({ url: `${API_ENDPOINTS.notes}par-module/`, method: 'GET', params }),
  byFiliere: (params) => apiRequest({ url: `${API_ENDPOINTS.notes}par-filiere/`, method: 'GET', params }),
  byFiliereNiveau: (params) => apiRequest({ url: `${API_ENDPOINTS.notes}par-filiere-niveau/`, method: 'GET', params }),
  batchEntry: (params) => apiRequest({ url: `${API_ENDPOINTS.notes}saisie-groupee/`, method: 'GET', params }),
  batchSave: (payload) => apiRequest({ url: `${API_ENDPOINTS.notes}batch-save/`, method: 'POST', data: payload }),
  releveNotes: (etudiantId, params) => apiRequest({ url: idPath(API_ENDPOINTS.notes, `${etudiantId}/releve-notes`), method: 'GET', params }),
};
export const paiesService = {
  ...createCrudService(API_ENDPOINTS.paies),
  getForecast: () => apiRequest({ url: API_ENDPOINTS.paieForecast, method: 'GET' }),
  updatePayday: (payload) => apiRequest({ url: API_ENDPOINTS.paieForecast, method: 'POST', data: payload }),
  getContentTypes: () => apiRequest({ url: API_ENDPOINTS.paieContentTypes, method: 'GET' }),
};
export const paiementsService = {
  ...createCrudService(API_ENDPOINTS.paiements),
  me: () => apiRequest({ url: `${API_ENDPOINTS.paiements}me/`, method: 'GET' }),
  aggregated: (params) => apiRequest({ url: API_ENDPOINTS.paiementsAggregated, method: 'GET', params }),
  dashboard: () => apiRequest({ url: API_ENDPOINTS.paiementsDashboard, method: 'GET' }),
};
export const paiementPoliciesService = createCrudService(API_ENDPOINTS.paiementsConfigurations);
export const paiementPlansService = createCrudService(API_ENDPOINTS.paiementsPlans);
export const paiementAlertsService = {
  list: (params) => apiRequest({ url: API_ENDPOINTS.paiementsAlerts, method: 'GET', params }),
};
export const classScheduleService = {
  ...createCrudService(API_ENDPOINTS.classSchedules),
};
export const studentScheduleService = {
  get: (etudiantId) => apiRequest({ url: `${API_ENDPOINTS.studentSchedule}${etudiantId}/`, method: 'GET' }),
  createOverride: (etudiantId, payload) => apiRequest({ url: `${API_ENDPOINTS.studentSchedule}${etudiantId}/override/`, method: 'POST', data: payload }),
  deleteOverride: (etudiantId) => apiRequest({ url: `${API_ENDPOINTS.studentSchedule}${etudiantId}/override/`, method: 'DELETE' }),
};
export const personnelsService = createCrudService(API_ENDPOINTS.personnels);
export const revenusService = createCrudService(API_ENDPOINTS.revenus);
export const usersService = {
  ...createCrudService(API_ENDPOINTS.users),
  resetPassword: (id) => apiRequest({ url: idPath(API_ENDPOINTS.users, `${id}/reset-password`), method: 'POST' }),
};
export const rôlesService = createCrudService(API_ENDPOINTS.userRoles); // Typo correction not strictly necessary but ignored for now. Use original rolesService.
export const rolesService = createCrudService(API_ENDPOINTS.userRoles);
export const demandeursService = {
  list: () => apiRequest({ url: API_ENDPOINTS.demandeurs, method: 'GET' }),
};

export const preinscriptionsService = {
  ...createCrudService(API_ENDPOINTS.preinscriptions),
  approve: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.preinscriptions, `${id}/approve`), method: 'POST', data: payload }),
  reject: (id) => apiRequest({ url: idPath(API_ENDPOINTS.preinscriptions, `${id}/reject`), method: 'POST' }),
};
export const fraisService = createCrudService(API_ENDPOINTS.frais);
export const paiementsV2Service = createCrudService(API_ENDPOINTS.paiementsV2);
export const notesV2Service = {
  ...createCrudService(API_ENDPOINTS.notesV2),
  me: (params) => apiRequest({ url: `${API_ENDPOINTS.notesV2}me/`, method: 'GET', params }),
  studentDetails: (etudiantId, params) => apiRequest({ url: idPath(API_ENDPOINTS.notesV2, `${etudiantId}/details`), method: 'GET', params }),
  byModule: (params) => apiRequest({ url: `${API_ENDPOINTS.notesV2}par-module/`, method: 'GET', params }),
  byFiliereNiveau: (params) => apiRequest({ url: `${API_ENDPOINTS.notesV2}par-filiere-niveau/`, method: 'GET', params }),
  exportTemplate: (params) => apiRequest({ url: API_ENDPOINTS.notesV2ExportTemplate, method: 'GET', params, responseType: 'blob' }),
  exportTemplateNiveau: (params) => apiRequest({ url: API_ENDPOINTS.notesV2ExportTemplateNiveau, method: 'GET', params, responseType: 'blob' }),
  importNotes: (formData) => apiRequest({ url: API_ENDPOINTS.notesV2Import, method: 'POST', data: formData, headers: { 'Content-Type': 'multipart/form-data' } }),
  importNotesNiveau: (formData) => apiRequest({ url: API_ENDPOINTS.notesV2ImportNiveau, method: 'POST', data: formData, headers: { 'Content-Type': 'multipart/form-data' } }),
  batchEntry: (params) => apiRequest({ url: `${API_ENDPOINTS.notesV2}saisie-groupee/`, method: 'GET', params }),
  batchSave: (payload) => apiRequest({ url: `${API_ENDPOINTS.notesV2}batch-save/`, method: 'POST', data: payload }),
};

export const formateurPortalService = {
  dashboard: () => apiRequest({ url: `${API_ENDPOINTS.formateurPortal}dashboard/`, method: 'GET' }),
  me: () => apiRequest({ url: `${API_ENDPOINTS.formateurPortal}me/`, method: 'GET' }),
  mesClasses: () => apiRequest({ url: `${API_ENDPOINTS.formateurPortal}mes-classes/`, method: 'GET' }),
  monEmploiDuTemps: () => apiRequest({ url: `${API_ENDPOINTS.formateurPortal}mon-emploi-du-temps/`, method: 'GET' }),
  mesNotes: (params) => apiRequest({ url: `${API_ENDPOINTS.formateurPortal}mes-notes/`, method: 'GET', params }),
  saisirNotes: (payload) => apiRequest({ url: `${API_ENDPOINTS.formateurPortal}saisir-notes/`, method: 'POST', data: payload }),
  monSuivi: () => apiRequest({ url: `${API_ENDPOINTS.formateurPortal}mon-suivi/`, method: 'GET' }),
  mesEpreuves: () => apiRequest({ url: `${API_ENDPOINTS.formateurPortal}mes-epreuves/`, method: 'GET' }),
  uploadEpreuve: (formData) => apiRequest({ url: `${API_ENDPOINTS.formateurPortal}upload-epreuve/`, method: 'POST', data: formData, headers: { 'Content-Type': 'multipart/form-data' } }),
  togglePartageEpreuve: (id) => apiRequest({ url: `${API_ENDPOINTS.formateurPortal}toggle-partage-epreuve/${id}/`, method: 'PATCH' }),
};

export const coursDocumentsService = {
  ...createCrudService(API_ENDPOINTS.formateurCoursDocuments),
  toggleVisibilite: (id) => apiRequest({ url: `${API_ENDPOINTS.formateurCoursDocuments}${id}/toggle-visibilite/`, method: 'PATCH' }),
  upload: (formData) => apiRequest({ url: API_ENDPOINTS.formateurCoursDocuments, method: 'POST', data: formData, headers: { 'Content-Type': 'multipart/form-data' } }),
  listForStudents: () => apiRequest({ url: API_ENDPOINTS.formateurCoursEtudiants, method: 'GET' }),
};

export const domainesService = {
  ...createCrudService(API_ENDPOINTS.domaines),
  listFilieres: (id) => apiRequest({ url: idPath(API_ENDPOINTS.domaines, `${id}/filieres`), method: 'GET' })
};

export const facultesService = {
  ...createCrudService(API_ENDPOINTS.facultes),
  listDomaines: (id) => apiRequest({ url: idPath(API_ENDPOINTS.facultes, `${id}/domaines`), method: 'GET' })
};
export const filieresV2Service = {
  ...createCrudService(API_ENDPOINTS.filieresV2),
  listSpecialites: (id) => apiRequest({ url: idPath(API_ENDPOINTS.filieresV2, `${id}/specialites`), method: 'GET' })
};
export const specialitesService = createCrudService(API_ENDPOINTS.specialites);
export const classesService = createCrudService(API_ENDPOINTS.classes);
export const cyclesService = createCrudService(API_ENDPOINTS.cycles);
export const cycleGlobalsService = createCrudService(API_ENDPOINTS.cyclesGlobaux);
export const levelsV2Service = createCrudService(API_ENDPOINTS.levelsV2);
export const coursesV2Service = createCrudService(API_ENDPOINTS.coursesV2);
export const anneesAcademiquesService = createCrudService(API_ENDPOINTS.anneesAcademiques);
export const semestresService = createCrudService(API_ENDPOINTS.semestres);
export const epreuvesService = createCrudService(API_ENDPOINTS.epreuves);
// Allow partial updates (PATCH) for epreuves (useful when editing without uploading files)
epreuvesService.patch = (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.epreuves, id), method: 'PATCH', data: payload });
export const inscriptionsV2Service = createCrudService(API_ENDPOINTS.inscriptionsV2);
export const evaluationsService = createCrudService(API_ENDPOINTS.evaluations);
export const affectationsService = createCrudService(API_ENDPOINTS.affectations);
export const emploisDuTempsV2Service = createCrudService(API_ENDPOINTS.emploisDuTempsV2);
export const parametresGlobauxService = {
  ...createCrudService(API_ENDPOINTS.parametresGlobaux),
  getStats: () => apiRequest({ url: API_ENDPOINTS.parametresGlobaux, method: 'GET' }),
  updateStats: (data) => apiRequest({ url: `${API_ENDPOINTS.parametresGlobaux}1/`, method: 'PUT', data }),
};

export const configurationEtablissementService = {
  ...createCrudService(API_ENDPOINTS.configurationEtablissement),
  getCurrent: () => apiRequest({ url: `${API_ENDPOINTS.configurationEtablissement}current/`, method: 'GET' }),
  updateConfig: (id, formData) => apiRequest({ 
    url: `${API_ENDPOINTS.configurationEtablissement}${id}/`, 
    method: 'PUT', 
    data: formData,
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
};

export const sallesService = createCrudService(API_ENDPOINTS.salles);

// Inventaire v2
export const articlesService = {
  ...createCrudService(API_ENDPOINTS.articles),
  ajouterStock: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.articles, `${id}/ajouter_stock`), method: 'POST', data: payload }),
  exemplaires: (id, params) => apiRequest({ url: idPath(API_ENDPOINTS.articles, `${id}/exemplaires`), method: 'GET', params }),
};
export const exemplairesService = {
  ...createCrudService(API_ENDPOINTS.exemplaires),
  patch: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.exemplaires, id), method: 'PATCH', data: payload }),
  attribuer: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.exemplaires, `${id}/attribuer`), method: 'POST', data: payload }),
  retourner: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.exemplaires, `${id}/retourner`), method: 'POST', data: payload }),
  changerStatut: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.exemplaires, `${id}/changer_statut`), method: 'POST', data: payload }),
};
export const mouvementsService = createCrudService(API_ENDPOINTS.mouvements);
export const inventaireStatsService = {
  get: () => apiRequest({ url: API_ENDPOINTS.inventaireStats, method: 'GET' }),
};
export const demandesStatsService = {
  get: () => apiRequest({ url: API_ENDPOINTS.demandesStats, method: 'GET' }),
};
export const demandesV2Service = {
  ...createCrudService(API_ENDPOINTS.demandes),
  soumettre: (id) => apiRequest({ url: idPath(API_ENDPOINTS.demandes, `${id}/soumettre`), method: 'POST' }),
  approuver: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.demandes, `${id}/approuver`), method: 'POST', data: payload }),
  livrer: (id) => apiRequest({ url: idPath(API_ENDPOINTS.demandes, `${id}/livrer`), method: 'POST' }),
  refuser: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.demandes, `${id}/refuser`), method: 'POST', data: payload }),
  ajouterLigne: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.demandes, `${id}/lignes`), method: 'POST', data: payload }),
  supprimerLigne: (id, payload) => apiRequest({ url: idPath(API_ENDPOINTS.demandes, `${id}/lignes`), method: 'DELETE', data: payload }),
};

// Gestion des salaires complète
export const primesService = createCrudService(API_ENDPOINTS.paiesPrimes);
export const retenuesService = createCrudService(API_ENDPOINTS.paiesRetenues);
export const avancesService = createCrudService(API_ENDPOINTS.paiesAvances);
export const bulletinsService = createCrudService(API_ENDPOINTS.paiesBulletins);
export const campagnesService = {
  ...createCrudService(API_ENDPOINTS.paiesCampagnes),
  generer: (payload) => apiRequest({ url: API_ENDPOINTS.paiesGenererCampagne, method: 'POST', data: payload }),
  valider: (id) => apiRequest({ url: `${API_ENDPOINTS.paiesCampagnes}${id}/valider/`, method: 'POST' }),
  payer: (id) => apiRequest({ url: `${API_ENDPOINTS.paiesCampagnes}${id}/payer/`, method: 'POST' }),
};
export const statistiquesPaieService = {
  get: (params) => apiRequest({ url: API_ENDPOINTS.paiesStatistiques, method: 'GET', params }),
};
