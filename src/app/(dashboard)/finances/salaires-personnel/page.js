'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
  Snackbar, Alert, CircularProgress, LinearProgress,
  Tooltip, FormControlLabel, Switch, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PaymentIcon from '@mui/icons-material/Payment';
import PeopleIcon from '@mui/icons-material/People';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { formatDate } from '../../../../utils/formatters';
import {
  paiesService, primesService, retenuesService, avancesService,
  bulletinsService, campagnesService, statistiquesPaieService, demandeursService,
} from '../../../../services/api/services';
import { getApiErrorMessage } from '../../../../services/api/client';
import { useUserPermissions } from '../../../../utils/permissions';

const MOIS_LABELS = [
  '', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
];

const TYPES_PRIME = [
  { value: "transport", label: "Prime de transport" },
  { value: "logement", label: "Prime de logement" },
  { value: "rendement", label: "Prime de rendement" },
  { value: "anciennete", label: "Prime d'ancienneté" },
  { value: "responsabilite", label: "Prime de responsabilité" },
  { value: "risque", label: "Prime de risque" },
  { value: "panier", label: "Prime de panier" },
  { value: "heures_sup", label: "Heures supplémentaires" },
  { value: "autre", label: "Autre" },
];

const TYPES_RETENUE = [
  { value: "cnps", label: "CNPS" },
  { value: "irpp", label: "IRPP" },
  { value: "avance", label: "Remboursement avance" },
  { value: "absence", label: "Retenue pour absence" },
  { value: "pret", label: "Remboursement prêt" },
  { value: "autre", label: "Autre" },
];

const BENEFICIAIRE_TYPE = 'Personnel';

export default function SalairesPersonnelPage() {
  const { canWrite } = useUserPermissions();
  const canWriteFinance = canWrite('can_manage_finance');
  const [currentTab, setCurrentTab] = useState(0);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [demandeurs, setDemandeurs] = useState([]);
  const [contentTypes, setContentTypes] = useState({ personnel: null, formateur: null });
  const [forecast, setForecast] = useState(null);

  const [campagnes, setCampagnes] = useState([]);
  const [loadingCampagnes, setLoadingCampagnes] = useState(false);
  const [openGenerer, setOpenGenerer] = useState(false);
  const [genererForm, setGenererForm] = useState({ mois: new Date().getMonth() + 1, annee: new Date().getFullYear() });
  const [generating, setGenerating] = useState(false);
  const [selectedCampagne, setSelectedCampagne] = useState(null);
  const [openCampagneDetail, setOpenCampagneDetail] = useState(false);

  const [primes, setPrimes] = useState([]);
  const [loadingPrimes, setLoadingPrimes] = useState(false);
  const [openPrimeForm, setOpenPrimeForm] = useState(false);
  const [primeForm, setPrimeForm] = useState({
    beneficiaire_content_type: '', beneficiaire_object_id: '',
    type_prime: 'transport', libelle: '', montant: '', est_permanente: true, est_active: true,
    date_debut: '', date_fin: ''
  });
  const [editingPrime, setEditingPrime] = useState(null);
  const [submittingPrime, setSubmittingPrime] = useState(false);

  const [retenues, setRetenues] = useState([]);
  const [loadingRetenues, setLoadingRetenues] = useState(false);
  const [openRetenueForm, setOpenRetenueForm] = useState(false);
  const [retenueForm, setRetenueForm] = useState({
    beneficiaire_content_type: '', beneficiaire_object_id: '',
    type_retenue: 'cnps', libelle: '', montant: '', est_permanente: true, est_active: true,
    date_debut: '', date_fin: ''
  });
  const [editingRetenue, setEditingRetenue] = useState(null);
  const [submittingRetenue, setSubmittingRetenue] = useState(false);

  const [avances, setAvances] = useState([]);
  const [loadingAvances, setLoadingAvances] = useState(false);
  const [openAvanceForm, setOpenAvanceForm] = useState(false);
  const [avanceForm, setAvanceForm] = useState({
    beneficiaire_content_type: '', beneficiaire_object_id: '',
    montant_total: '', nombre_echeances: 1, motif: '', date_debut_remboursement: ''
  });
  const [submittingAvance, setSubmittingAvance] = useState(false);

  const [bulletins, setBulletins] = useState([]);
  const [loadingBulletins, setLoadingBulletins] = useState(false);
  const [selectedBulletin, setSelectedBulletin] = useState(null);
  const [openBulletinDetail, setOpenBulletinDetail] = useState(false);

  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  useEffect(() => {
    fetchDemandeurs();
    fetchContentTypes();
    fetchForecast();
  }, []);

  useEffect(() => {
    if (currentTab === 0) fetchCampagnes();
    if (currentTab === 1) fetchPrimes();
    if (currentTab === 2) fetchRetenues();
    if (currentTab === 3) fetchAvances();
    if (currentTab === 4) fetchBulletins();
    if (currentTab === 5) fetchStats();
  }, [currentTab]);

  const fetchDemandeurs = async () => {
    try {
      const res = await demandeursService.list();
      const all = Array.isArray(res) ? res : res?.results || [];
      setDemandeurs(all.filter(d => d.type === BENEFICIAIRE_TYPE));
    } catch (e) { console.error(e); }
  };

  const fetchContentTypes = async () => {
    try {
      const res = await paiesService.getContentTypes();
      setContentTypes({ ...res, Personnel: res.personnel, Formateur: res.formateur });
    } catch (e) { console.error(e); }
  };

  const fetchForecast = async () => {
    try {
      const data = await paiesService.getForecast();
      setForecast(data);
    } catch (e) { console.error(e); }
  };

  const fetchCampagnes = async () => {
    setLoadingCampagnes(true);
    try {
      const data = await campagnesService.list({ type_beneficiaire: 'personnel' });
      setCampagnes(Array.isArray(data) ? data : data?.results || []);
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur chargement campagnes'), severity: 'error' });
    } finally { setLoadingCampagnes(false); }
  };

  const fetchPrimes = async () => {
    setLoadingPrimes(true);
    try {
      const data = await primesService.list({ beneficiaire_type: 'personnel' });
      const all = Array.isArray(data) ? data : data?.results || [];
      setPrimes(all.filter(p => p.beneficiaire_type === BENEFICIAIRE_TYPE || p.beneficiaire_type === 'personnel'));
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur chargement primes'), severity: 'error' });
    } finally { setLoadingPrimes(false); }
  };

  const fetchRetenues = async () => {
    setLoadingRetenues(true);
    try {
      const data = await retenuesService.list({ beneficiaire_type: 'personnel' });
      const all = Array.isArray(data) ? data : data?.results || [];
      setRetenues(all.filter(r => r.beneficiaire_type === BENEFICIAIRE_TYPE || r.beneficiaire_type === 'personnel'));
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur chargement retenues'), severity: 'error' });
    } finally { setLoadingRetenues(false); }
  };

  const fetchAvances = async () => {
    setLoadingAvances(true);
    try {
      const data = await avancesService.list({ beneficiaire_type: 'personnel' });
      const all = Array.isArray(data) ? data : data?.results || [];
      setAvances(all.filter(a => a.beneficiaire_type === BENEFICIAIRE_TYPE || a.beneficiaire_type === 'personnel'));
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur chargement avances'), severity: 'error' });
    } finally { setLoadingAvances(false); }
  };

  const fetchBulletins = async () => {
    setLoadingBulletins(true);
    try {
      const data = await bulletinsService.list({ beneficiaire_type: 'personnel' });
      const all = Array.isArray(data) ? data : data?.results || [];
      setBulletins(all.filter(b => b.beneficiaire_type === BENEFICIAIRE_TYPE || b.beneficiaire_type === 'personnel'));
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur chargement bulletins'), severity: 'error' });
    } finally { setLoadingBulletins(false); }
  };

  const fetchStats = async () => {
    setLoadingStats(true);
    try {
      const data = await statistiquesPaieService.get({ annee: new Date().getFullYear(), type_beneficiaire: 'personnel' });
      setStats(data);
    } catch (e) { console.error(e); }
    finally { setLoadingStats(false); }
  };

  const handleGenererCampagne = async () => {
    setGenerating(true);
    try {
      await campagnesService.generer({ ...genererForm, type_beneficiaire: 'personnel' });
      setToast({ open: true, message: 'Campagne personnel générée avec succès !', severity: 'success' });
      setOpenGenerer(false);
      fetchCampagnes();
      fetchForecast();
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur lors de la génération'), severity: 'error' });
    } finally { setGenerating(false); }
  };

  const handleValiderCampagne = async (id) => {
    try {
      await campagnesService.valider(id);
      setToast({ open: true, message: 'Campagne validée', severity: 'success' });
      fetchCampagnes();
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur validation'), severity: 'error' });
    }
  };

  const handlePayerCampagne = async (id) => {
    try {
      await campagnesService.payer(id);
      setToast({ open: true, message: 'Campagne marquée comme payée', severity: 'success' });
      fetchCampagnes();
      fetchForecast();
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur paiement'), severity: 'error' });
    }
  };

  const handleViewCampagne = async (campagne) => {
    try {
      const detail = await campagnesService.detail(campagne.id);
      setSelectedCampagne(detail);
      setOpenCampagneDetail(true);
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur chargement détail'), severity: 'error' });
    }
  };

  const handleSavePrime = async () => {
    if (!primeForm.beneficiaire_content_type || !primeForm.montant) {
      setToast({ open: true, message: 'Veuillez remplir les champs obligatoires', severity: 'warning' });
      return;
    }
    setSubmittingPrime(true);
    try {
      const payload = { ...primeForm };
      if (!payload.date_debut) delete payload.date_debut;
      if (!payload.date_fin) delete payload.date_fin;
      if (!payload.libelle) payload.libelle = '';
      if (editingPrime) {
        await primesService.update(editingPrime.id, payload);
        setToast({ open: true, message: 'Prime mise à jour', severity: 'success' });
      } else {
        await primesService.create(payload);
        setToast({ open: true, message: 'Prime ajoutée', severity: 'success' });
      }
      setOpenPrimeForm(false);
      setEditingPrime(null);
      fetchPrimes();
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur sauvegarde prime'), severity: 'error' });
    } finally { setSubmittingPrime(false); }
  };

  const handleSaveRetenue = async () => {
    if (!retenueForm.beneficiaire_content_type || !retenueForm.montant) {
      setToast({ open: true, message: 'Veuillez remplir les champs obligatoires', severity: 'warning' });
      return;
    }
    setSubmittingRetenue(true);
    try {
      const payload = { ...retenueForm };
      if (!payload.date_debut) delete payload.date_debut;
      if (!payload.date_fin) delete payload.date_fin;
      if (!payload.libelle) payload.libelle = '';
      if (editingRetenue) {
        await retenuesService.update(editingRetenue.id, payload);
        setToast({ open: true, message: 'Retenue mise à jour', severity: 'success' });
      } else {
        await retenuesService.create(payload);
        setToast({ open: true, message: 'Retenue ajoutée', severity: 'success' });
      }
      setOpenRetenueForm(false);
      setEditingRetenue(null);
      fetchRetenues();
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur sauvegarde retenue'), severity: 'error' });
    } finally { setSubmittingRetenue(false); }
  };

  const handleSaveAvance = async () => {
    if (!avanceForm.beneficiaire_content_type || !avanceForm.montant_total) {
      setToast({ open: true, message: 'Veuillez remplir les champs obligatoires', severity: 'warning' });
      return;
    }
    setSubmittingAvance(true);
    try {
      const payload = { ...avanceForm };
      if (!payload.date_debut_remboursement) delete payload.date_debut_remboursement;
      await avancesService.create(payload);
      setToast({ open: true, message: 'Avance enregistrée', severity: 'success' });
      setOpenAvanceForm(false);
      fetchAvances();
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur enregistrement avance'), severity: 'error' });
    } finally { setSubmittingAvance(false); }
  };

  const confirmDelete = (item, type) => {
    setItemToDelete({ ...item, _type: type });
    setOpenDeleteDialog(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete._type === 'prime') { await primesService.remove(itemToDelete.id); fetchPrimes(); }
      else if (itemToDelete._type === 'retenue') { await retenuesService.remove(itemToDelete.id); fetchRetenues(); }
      else if (itemToDelete._type === 'avance') { await avancesService.remove(itemToDelete.id); fetchAvances(); }
      else if (itemToDelete._type === 'campagne') { await campagnesService.remove(itemToDelete.id); fetchCampagnes(); }
      setToast({ open: true, message: 'Supprimé avec succès', severity: 'success' });
    } catch (e) {
      setToast({ open: true, message: getApiErrorMessage(e, 'Erreur suppression'), severity: 'error' });
    } finally { setOpenDeleteDialog(false); setItemToDelete(null); }
  };

  const getBeneficiaireValue = (ct, objId) => {
    if (!ct || !objId) return '';
    return `${ct}-${objId}`;
  };

  const parseBeneficiaireValue = (val) => {
    if (!val) return { ct: '', id: '' };
    const [ct, id] = val.split('-');
    return { ct: parseInt(ct), id: parseInt(id) };
  };

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(90deg, #193A7F 0%, #2A52A1 100%)', color: 'white', borderRadius: 3 }}>
        <Typography variant="h5" fontWeight="bold" gutterBottom>
          Salaires du Personnel
        </Typography>
        <Typography variant="body2" sx={{ opacity: 0.8 }}>
          Gestion de la paie des membres du personnel administratif et technique (salaire fixe mensuel).
        </Typography>
      </Paper>

      {forecast && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, borderTop: '4px solid #2196F3' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">MASSE SALARIALE</Typography>
                    <Typography variant="h5" fontWeight="bold">{Number(forecast.total_previsionnel_personnel || forecast.total_previsionnel || 0).toLocaleString()} FCFA</Typography>
                  </Box>
                  <AccountBalanceWalletIcon sx={{ fontSize: 36, color: '#2196F3', opacity: 0.5 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, borderTop: '4px solid #4CAF50' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">PAYÉ CE MOIS</Typography>
                    <Typography variant="h5" fontWeight="bold">{Number(forecast.total_paye_mois_personnel || forecast.total_paye_mois || 0).toLocaleString()} FCFA</Typography>
                  </Box>
                  <CheckCircleIcon sx={{ fontSize: 36, color: '#4CAF50', opacity: 0.5 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, borderTop: '4px solid #FF9800' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">EFFECTIF PERSONNEL</Typography>
                    <Typography variant="h5" fontWeight="bold">{forecast.nb_personnel || 0}</Typography>
                  </Box>
                  <PeopleIcon sx={{ fontSize: 36, color: '#FF9800', opacity: 0.5 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card sx={{ borderRadius: 3, borderTop: `4px solid ${forecast.is_near_payday ? '#F44336' : '#9C27B0'}` }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="caption" color="text.secondary" fontWeight="bold">PROCHAINE PAIE</Typography>
                    <Typography variant="h6" fontWeight="bold" color={forecast.is_near_payday ? 'error' : 'inherit'}>
                      {forecast.prochaine_echeance ? formatDate(forecast.prochaine_echeance) : '-'}
                    </Typography>
                    {forecast.is_near_payday && <Chip label="Échéance proche !" color="error" size="small" />}
                  </Box>
                  <PaymentIcon sx={{ fontSize: 36, color: forecast.is_near_payday ? '#F44336' : '#9C27B0', opacity: 0.5 }} />
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Campagnes de paie" />
        <Tab label="Primes & Indemnités" />
        <Tab label="Retenues" />
        <Tab label="Avances sur salaire" />
        <Tab label="Bulletins" />
        <Tab label="Statistiques" />
      </Tabs>

      {/* TAB 0: CAMPAGNES */}
      {currentTab === 0 && (
        <Box>
          {canWriteFinance && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={() => setOpenGenerer(true)}>
                Générer une campagne
              </Button>
            </Box>
          )}
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Référence</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Période</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Bulletins</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Total Net</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingCampagnes && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                )}
                {!loadingCampagnes && campagnes.map((camp) => (
                  <TableRow key={camp.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{camp.reference}</TableCell>
                    <TableCell>{MOIS_LABELS[camp.mois]} {camp.annee}</TableCell>
                    <TableCell>{camp.nombre_bulletins}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{Number(camp.total_net).toLocaleString()} FCFA</TableCell>
                    <TableCell>
                      <Chip label={camp.statut_display || camp.statut} color={camp.statut === 'payee' ? 'success' : camp.statut === 'validee' ? 'info' : camp.statut === 'annulee' ? 'error' : 'warning'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Voir les bulletins"><IconButton size="small" color="primary" onClick={() => handleViewCampagne(camp)}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                      {canWriteFinance && camp.statut === 'brouillon' && (<Tooltip title="Valider"><IconButton size="small" color="info" onClick={() => handleValiderCampagne(camp.id)}><CheckCircleIcon fontSize="small" /></IconButton></Tooltip>)}
                      {canWriteFinance && camp.statut === 'validee' && (<Tooltip title="Marquer comme payée"><IconButton size="small" color="success" onClick={() => handlePayerCampagne(camp.id)}><PaymentIcon fontSize="small" /></IconButton></Tooltip>)}
                      {canWriteFinance && camp.statut === 'brouillon' && (<IconButton size="small" color="error" onClick={() => confirmDelete(camp, 'campagne')}><DeleteIcon fontSize="small" /></IconButton>)}
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingCampagnes && campagnes.length === 0 && (
                  <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}>Aucune campagne de paie personnel.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 1: PRIMES */}
      {currentTab === 1 && (
        <Box>
          {canWriteFinance && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                setEditingPrime(null);
                setPrimeForm({ beneficiaire_content_type: '', beneficiaire_object_id: '', type_prime: 'transport', libelle: '', montant: '', est_permanente: true, est_active: true, date_debut: '', date_fin: '' });
                setOpenPrimeForm(true);
              }}>
                Ajouter une prime
              </Button>
            </Box>
          )}
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Bénéficiaire</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Montant</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Permanente</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Active</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingPrimes && (<TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>)}
                {!loadingPrimes && primes.map((prime) => (
                  <TableRow key={prime.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{prime.beneficiaire_nom || 'N/A'}</TableCell>
                    <TableCell>{prime.type_prime_display}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>+{Number(prime.montant).toLocaleString()} FCFA</TableCell>
                    <TableCell>{prime.est_permanente ? 'Oui' : 'Non'}</TableCell>
                    <TableCell><Chip label={prime.est_active ? 'Active' : 'Inactive'} color={prime.est_active ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell align="right">
                      {canWriteFinance && (
                        <IconButton size="small" color="primary" onClick={() => {
                          setEditingPrime(prime);
                          setPrimeForm({ beneficiaire_content_type: prime.beneficiaire_content_type, beneficiaire_object_id: prime.beneficiaire_object_id, type_prime: prime.type_prime, libelle: prime.libelle || '', montant: prime.montant, est_permanente: prime.est_permanente, est_active: prime.est_active, date_debut: prime.date_debut || '', date_fin: prime.date_fin || '' });
                          setOpenPrimeForm(true);
                        }}><EditIcon fontSize="small" /></IconButton>
                      )}
                      {canWriteFinance && (
                        <IconButton size="small" color="error" onClick={() => confirmDelete(prime, 'prime')}><DeleteIcon fontSize="small" /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingPrimes && primes.length === 0 && (<TableRow><TableCell colSpan={6} align="center">Aucune prime configurée pour le personnel.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 2: RETENUES */}
      {currentTab === 2 && (
        <Box>
          {canWriteFinance && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                setEditingRetenue(null);
                setRetenueForm({ beneficiaire_content_type: '', beneficiaire_object_id: '', type_retenue: 'cnps', libelle: '', montant: '', est_permanente: true, est_active: true, date_debut: '', date_fin: '' });
                setOpenRetenueForm(true);
              }}>
                Ajouter une retenue
              </Button>
            </Box>
          )}
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Bénéficiaire</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Montant</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Permanente</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Active</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingRetenues && (<TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>)}
                {!loadingRetenues && retenues.map((ret) => (
                  <TableRow key={ret.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{ret.beneficiaire_nom || 'N/A'}</TableCell>
                    <TableCell>{ret.type_retenue_display}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'error.main' }}>-{Number(ret.montant).toLocaleString()} FCFA</TableCell>
                    <TableCell>{ret.est_permanente ? 'Oui' : 'Non'}</TableCell>
                    <TableCell><Chip label={ret.est_active ? 'Active' : 'Inactive'} color={ret.est_active ? 'success' : 'default'} size="small" /></TableCell>
                    <TableCell align="right">
                      {canWriteFinance && (
                        <IconButton size="small" color="primary" onClick={() => {
                          setEditingRetenue(ret);
                          setRetenueForm({ beneficiaire_content_type: ret.beneficiaire_content_type, beneficiaire_object_id: ret.beneficiaire_object_id, type_retenue: ret.type_retenue, libelle: ret.libelle || '', montant: ret.montant, est_permanente: ret.est_permanente, est_active: ret.est_active, date_debut: ret.date_debut || '', date_fin: ret.date_fin || '' });
                          setOpenRetenueForm(true);
                        }}><EditIcon fontSize="small" /></IconButton>
                      )}
                      {canWriteFinance && (
                        <IconButton size="small" color="error" onClick={() => confirmDelete(ret, 'retenue')}><DeleteIcon fontSize="small" /></IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingRetenues && retenues.length === 0 && (<TableRow><TableCell colSpan={6} align="center">Aucune retenue configurée pour le personnel.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 3: AVANCES */}
      {currentTab === 3 && (
        <Box>
          {canWriteFinance && (
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => {
                setAvanceForm({ beneficiaire_content_type: '', beneficiaire_object_id: '', montant_total: '', nombre_echeances: 1, motif: '', date_debut_remboursement: '' });
                setOpenAvanceForm(true);
              }}>
                Nouvelle avance
              </Button>
            </Box>
          )}
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Bénéficiaire</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Montant total</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Remboursé</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Progression</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Échéances</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingAvances && (<TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>)}
                {!loadingAvances && avances.map((av) => {
                  const progress = av.montant_total > 0 ? (Number(av.montant_rembourse) / Number(av.montant_total)) * 100 : 0;
                  return (
                    <TableRow key={av.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{av.beneficiaire_nom || 'N/A'}</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>{Number(av.montant_total).toLocaleString()} FCFA</TableCell>
                      <TableCell>{Number(av.montant_rembourse).toLocaleString()} FCFA</TableCell>
                      <TableCell sx={{ minWidth: 120 }}>
                        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
                        <Typography variant="caption">{progress.toFixed(0)}%</Typography>
                      </TableCell>
                      <TableCell>{av.nombre_echeances} mois ({Number(av.montant_echeance).toLocaleString()}/mois)</TableCell>
                      <TableCell><Chip label={av.statut_display || av.statut} color={av.statut === 'remboursee' ? 'success' : av.statut === 'en_cours' ? 'warning' : 'error'} size="small" /></TableCell>
                      <TableCell align="right">
                        {canWriteFinance && (
                          <IconButton size="small" color="error" onClick={() => confirmDelete(av, 'avance')}><DeleteIcon fontSize="small" /></IconButton>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {!loadingAvances && avances.length === 0 && (<TableRow><TableCell colSpan={7} align="center">Aucune avance sur salaire pour le personnel.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 4: BULLETINS */}
      {currentTab === 4 && (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Bénéficiaire</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Période</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Salaire base</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Primes</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Retenues</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Net à payer</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingBulletins && (<TableRow><TableCell colSpan={8} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>)}
                {!loadingBulletins && bulletins.map((b) => (
                  <TableRow key={b.id} hover>
                    <TableCell sx={{ fontWeight: 500 }}>{b.beneficiaire_nom || 'N/A'}</TableCell>
                    <TableCell>{MOIS_LABELS[b.mois]} {b.annee}</TableCell>
                    <TableCell>{Number(b.salaire_base).toLocaleString()} FCFA</TableCell>
                    <TableCell sx={{ color: 'success.main' }}>+{Number(b.total_primes).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: 'error.main' }}>-{Number(b.total_retenues).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{Number(b.salaire_net).toLocaleString()} FCFA</TableCell>
                    <TableCell><Chip label={b.statut_display || b.statut} color={b.statut === 'paye' ? 'success' : b.statut === 'valide' ? 'info' : b.statut === 'annule' ? 'error' : 'warning'} size="small" /></TableCell>
                    <TableCell align="right">
                      <Tooltip title="Voir détail"><IconButton size="small" color="primary" onClick={() => { setSelectedBulletin(b); setOpenBulletinDetail(true); }}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingBulletins && bulletins.length === 0 && (<TableRow><TableCell colSpan={8} align="center">Aucun bulletin généré pour le personnel.</TableCell></TableRow>)}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* TAB 5: STATISTIQUES */}
      {currentTab === 5 && (
        <Box>
          {loadingStats ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
          ) : stats ? (
            <>
              <Grid container spacing={3} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, borderLeft: '4px solid #2196F3' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">MASSE SALARIALE ANNUELLE {stats.annee}</Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{Number(stats.masse_salariale_annuelle).toLocaleString()} FCFA</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, borderLeft: '4px solid #FF9800' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">AVANCES EN COURS</Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{Number(stats.total_avances_en_cours).toLocaleString()} FCFA</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, borderLeft: '4px solid #4CAF50' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">CAMPAGNES ({stats.annee})</Typography>
                      <Typography variant="h4" fontWeight="bold" sx={{ mt: 1 }}>{stats.nb_campagnes}</Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2 }}>Historique mensuel {stats.annee}</Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Mois</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total Brut</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Primes</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Retenues</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Total Net</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Bulletins</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.historique_mensuel?.map((h, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell sx={{ fontWeight: 500 }}>{MOIS_LABELS[h.mois]}</TableCell>
                        <TableCell>{Number(h.total_brut).toLocaleString()} FCFA</TableCell>
                        <TableCell sx={{ color: 'success.main' }}>+{Number(h.total_primes).toLocaleString()}</TableCell>
                        <TableCell sx={{ color: 'error.main' }}>-{Number(h.total_retenues).toLocaleString()}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{Number(h.total_net).toLocaleString()} FCFA</TableCell>
                        <TableCell>{h.nombre_bulletins}</TableCell>
                        <TableCell><Chip label={h.statut} color={h.statut === 'payee' ? 'success' : h.statut === 'validee' ? 'info' : 'warning'} size="small" /></TableCell>
                      </TableRow>
                    ))}
                    {(!stats.historique_mensuel || stats.historique_mensuel.length === 0) && (
                      <TableRow><TableCell colSpan={7} align="center">Aucun historique pour cette année.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Alert severity="info">Aucune statistique disponible.</Alert>
          )}
        </Box>
      )}

      {/* === DIALOGS === */}
      <Dialog open={openGenerer} onClose={() => setOpenGenerer(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Générer une campagne de paie (Personnel)</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Cette action va créer les bulletins de paie pour tous les membres du personnel ayant un salaire configuré.
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <FormControl fullWidth>
                <InputLabel>Mois</InputLabel>
                <Select value={genererForm.mois} label="Mois" onChange={(e) => setGenererForm({ ...genererForm, mois: e.target.value })}>
                  {MOIS_LABELS.slice(1).map((m, i) => <MenuItem key={i + 1} value={i + 1}>{m}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={6}>
              <TextField fullWidth type="number" label="Année" value={genererForm.annee} onChange={(e) => setGenererForm({ ...genererForm, annee: e.target.value })} />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenGenerer(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleGenererCampagne} disabled={generating}>
            {generating ? <CircularProgress size={20} /> : 'Générer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openCampagneDetail} onClose={() => setOpenCampagneDetail(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Campagne {selectedCampagne?.reference} - {selectedCampagne ? `${MOIS_LABELS[selectedCampagne.mois]} ${selectedCampagne.annee}` : ''}</DialogTitle>
        <DialogContent dividers>
          {selectedCampagne && (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={3}><Typography variant="caption" color="text.secondary">Total Brut</Typography><Typography variant="h6" fontWeight="bold">{Number(selectedCampagne.total_brut).toLocaleString()} FCFA</Typography></Grid>
                <Grid item xs={3}><Typography variant="caption" color="text.secondary">Total Primes</Typography><Typography variant="h6" fontWeight="bold" color="success.main">+{Number(selectedCampagne.total_primes).toLocaleString()}</Typography></Grid>
                <Grid item xs={3}><Typography variant="caption" color="text.secondary">Total Retenues</Typography><Typography variant="h6" fontWeight="bold" color="error.main">-{Number(selectedCampagne.total_retenues).toLocaleString()}</Typography></Grid>
                <Grid item xs={3}><Typography variant="caption" color="text.secondary">Total Net</Typography><Typography variant="h6" fontWeight="bold">{Number(selectedCampagne.total_net).toLocaleString()} FCFA</Typography></Grid>
              </Grid>
              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Bénéficiaire</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Base</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Primes</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Retenues</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Net</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(selectedCampagne.bulletins || []).map((b) => (
                      <TableRow key={b.id} hover>
                        <TableCell>{b.beneficiaire_nom || 'N/A'}</TableCell>
                        <TableCell>{Number(b.salaire_base).toLocaleString()}</TableCell>
                        <TableCell sx={{ color: 'success.main' }}>+{Number(b.total_primes).toLocaleString()}</TableCell>
                        <TableCell sx={{ color: 'error.main' }}>-{Number(b.total_retenues).toLocaleString()}</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>{Number(b.salaire_net).toLocaleString()} FCFA</TableCell>
                        <TableCell><Chip label={b.statut_display || b.statut} size="small" color={b.statut === 'paye' ? 'success' : b.statut === 'valide' ? 'info' : 'warning'} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenCampagneDetail(false)}>Fermer</Button></DialogActions>
      </Dialog>

      {/* Formulaire Prime */}
      <Dialog open={openPrimeForm} onClose={() => setOpenPrimeForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingPrime ? 'Modifier la prime' : 'Ajouter une prime'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Bénéficiaire</InputLabel>
                <Select value={getBeneficiaireValue(primeForm.beneficiaire_content_type, primeForm.beneficiaire_object_id)} label="Bénéficiaire" onChange={(e) => { const { ct, id } = parseBeneficiaireValue(e.target.value); setPrimeForm({ ...primeForm, beneficiaire_content_type: ct, beneficiaire_object_id: id }); }}>
                  {demandeurs.map(d => (<MenuItem key={`${d.type}-${d.id}`} value={`${d.content_type_id}-${d.id}`}>{d.nom}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Type de prime</InputLabel><Select value={primeForm.type_prime} label="Type de prime" onChange={(e) => setPrimeForm({ ...primeForm, type_prime: e.target.value })}>{TYPES_PRIME.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</Select></FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Montant (FCFA)" value={primeForm.montant} onChange={(e) => setPrimeForm({ ...primeForm, montant: e.target.value })} required />
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Libellé (optionnel)" value={primeForm.libelle} onChange={(e) => setPrimeForm({ ...primeForm, libelle: e.target.value })} /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={primeForm.est_permanente} onChange={(e) => setPrimeForm({ ...primeForm, est_permanente: e.target.checked })} />} label="Permanente" /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={primeForm.est_active} onChange={(e) => setPrimeForm({ ...primeForm, est_active: e.target.checked })} />} label="Active" /></Grid>
            {!primeForm.est_permanente && (<><Grid item xs={6}><TextField fullWidth type="date" label="Date début" InputLabelProps={{ shrink: true }} value={primeForm.date_debut} onChange={(e) => setPrimeForm({ ...primeForm, date_debut: e.target.value })} /></Grid><Grid item xs={6}><TextField fullWidth type="date" label="Date fin" InputLabelProps={{ shrink: true }} value={primeForm.date_fin} onChange={(e) => setPrimeForm({ ...primeForm, date_fin: e.target.value })} /></Grid></>)}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPrimeForm(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSavePrime} disabled={submittingPrime}>{submittingPrime ? <CircularProgress size={20} /> : 'Enregistrer'}</Button>
        </DialogActions>
      </Dialog>

      {/* Formulaire Retenue */}
      <Dialog open={openRetenueForm} onClose={() => setOpenRetenueForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingRetenue ? 'Modifier la retenue' : 'Ajouter une retenue'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Bénéficiaire</InputLabel>
                <Select value={getBeneficiaireValue(retenueForm.beneficiaire_content_type, retenueForm.beneficiaire_object_id)} label="Bénéficiaire" onChange={(e) => { const { ct, id } = parseBeneficiaireValue(e.target.value); setRetenueForm({ ...retenueForm, beneficiaire_content_type: ct, beneficiaire_object_id: id }); }}>
                  {demandeurs.map(d => (<MenuItem key={`${d.type}-${d.id}`} value={`${d.content_type_id}-${d.id}`}>{d.nom}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth><InputLabel>Type de retenue</InputLabel><Select value={retenueForm.type_retenue} label="Type de retenue" onChange={(e) => setRetenueForm({ ...retenueForm, type_retenue: e.target.value })}>{TYPES_RETENUE.map(t => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}</Select></FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth type="number" label="Montant (FCFA)" value={retenueForm.montant} onChange={(e) => setRetenueForm({ ...retenueForm, montant: e.target.value })} required />
            </Grid>
            <Grid item xs={12}><TextField fullWidth label="Libellé (optionnel)" value={retenueForm.libelle} onChange={(e) => setRetenueForm({ ...retenueForm, libelle: e.target.value })} /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={retenueForm.est_permanente} onChange={(e) => setRetenueForm({ ...retenueForm, est_permanente: e.target.checked })} />} label="Permanente" /></Grid>
            <Grid item xs={6}><FormControlLabel control={<Switch checked={retenueForm.est_active} onChange={(e) => setRetenueForm({ ...retenueForm, est_active: e.target.checked })} />} label="Active" /></Grid>
            {!retenueForm.est_permanente && (<><Grid item xs={6}><TextField fullWidth type="date" label="Date début" InputLabelProps={{ shrink: true }} value={retenueForm.date_debut} onChange={(e) => setRetenueForm({ ...retenueForm, date_debut: e.target.value })} /></Grid><Grid item xs={6}><TextField fullWidth type="date" label="Date fin" InputLabelProps={{ shrink: true }} value={retenueForm.date_fin} onChange={(e) => setRetenueForm({ ...retenueForm, date_fin: e.target.value })} /></Grid></>)}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRetenueForm(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveRetenue} disabled={submittingRetenue}>{submittingRetenue ? <CircularProgress size={20} /> : 'Enregistrer'}</Button>
        </DialogActions>
      </Dialog>

      {/* Formulaire Avance */}
      <Dialog open={openAvanceForm} onClose={() => setOpenAvanceForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Nouvelle avance sur salaire</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Bénéficiaire</InputLabel>
                <Select value={getBeneficiaireValue(avanceForm.beneficiaire_content_type, avanceForm.beneficiaire_object_id)} label="Bénéficiaire" onChange={(e) => { const { ct, id } = parseBeneficiaireValue(e.target.value); setAvanceForm({ ...avanceForm, beneficiaire_content_type: ct, beneficiaire_object_id: id }); }}>
                  {demandeurs.map(d => (<MenuItem key={`${d.type}-${d.id}`} value={`${d.content_type_id}-${d.id}`}>{d.nom}</MenuItem>))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Montant total (FCFA)" value={avanceForm.montant_total} onChange={(e) => setAvanceForm({ ...avanceForm, montant_total: e.target.value })} required /></Grid>
            <Grid item xs={12} sm={6}><TextField fullWidth type="number" label="Nombre d'échéances (mois)" value={avanceForm.nombre_echeances} onChange={(e) => setAvanceForm({ ...avanceForm, nombre_echeances: e.target.value })} /></Grid>
            {avanceForm.montant_total && avanceForm.nombre_echeances > 0 && (<Grid item xs={12}><Alert severity="info" sx={{ py: 0 }}>Échéance mensuelle: {Math.ceil(Number(avanceForm.montant_total) / Number(avanceForm.nombre_echeances)).toLocaleString()} FCFA/mois</Alert></Grid>)}
            <Grid item xs={12}><TextField fullWidth type="date" label="Début remboursement" InputLabelProps={{ shrink: true }} value={avanceForm.date_debut_remboursement} onChange={(e) => setAvanceForm({ ...avanceForm, date_debut_remboursement: e.target.value })} /></Grid>
            <Grid item xs={12}><TextField fullWidth multiline rows={2} label="Motif" value={avanceForm.motif} onChange={(e) => setAvanceForm({ ...avanceForm, motif: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAvanceForm(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveAvance} disabled={submittingAvance}>{submittingAvance ? <CircularProgress size={20} /> : 'Enregistrer'}</Button>
        </DialogActions>
      </Dialog>

      {/* Détail Bulletin */}
      <Dialog open={openBulletinDetail} onClose={() => setOpenBulletinDetail(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Bulletin de paie - {selectedBulletin?.beneficiaire_nom}</DialogTitle>
        <DialogContent dividers>
          {selectedBulletin && (
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>{MOIS_LABELS[selectedBulletin.mois]} {selectedBulletin.annee}</Typography>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography>Salaire de base</Typography><Typography fontWeight="bold">{Number(selectedBulletin.salaire_base).toLocaleString()} FCFA</Typography></Box>
              {selectedBulletin.detail_primes?.length > 0 && (<><Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'success.main' }}>Primes & Indemnités</Typography>{selectedBulletin.detail_primes.map((p, i) => (<Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', ml: 2, mb: 0.5 }}><Typography variant="body2">{p.type}{p.libelle ? ` - ${p.libelle}` : ''}</Typography><Typography variant="body2" color="success.main">+{Number(p.montant).toLocaleString()}</Typography></Box>))}</>)}
              {selectedBulletin.detail_retenues?.length > 0 && (<><Typography variant="subtitle2" sx={{ mt: 2, mb: 1, color: 'error.main' }}>Retenues</Typography>{selectedBulletin.detail_retenues.map((r, i) => (<Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', ml: 2, mb: 0.5 }}><Typography variant="body2">{r.type}{r.libelle ? ` - ${r.libelle}` : ''}</Typography><Typography variant="body2" color="error.main">-{Number(r.montant).toLocaleString()}</Typography></Box>))}</>)}
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography>Salaire brut</Typography><Typography>{Number(selectedBulletin.salaire_brut).toLocaleString()} FCFA</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography>Total primes</Typography><Typography color="success.main">+{Number(selectedBulletin.total_primes).toLocaleString()}</Typography></Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}><Typography>Total retenues</Typography><Typography color="error.main">-{Number(selectedBulletin.total_retenues).toLocaleString()}</Typography></Box>
              <Divider sx={{ my: 2 }} />
              <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1.5, bgcolor: '#F5F7FA', borderRadius: 2 }}><Typography variant="h6" fontWeight="bold">NET À PAYER</Typography><Typography variant="h6" fontWeight="bold" color="primary">{Number(selectedBulletin.salaire_net).toLocaleString()} FCFA</Typography></Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions><Button onClick={() => setOpenBulletinDetail(false)}>Fermer</Button></DialogActions>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>Voulez-vous vraiment supprimer cet élément ? Cette action est irréversible.</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
