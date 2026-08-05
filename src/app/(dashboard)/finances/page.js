'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, CardContent, Typography, Grid, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  Tabs, Tab, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem, IconButton,
  Snackbar, Alert, CircularProgress, TablePagination, Divider,
  LinearProgress, Tooltip
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PaymentsIcon from '@mui/icons-material/Payments';
import ReceiptIcon from '@mui/icons-material/Receipt';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import { formatDate } from '../../../utils/formatters';
import {
  depensesService,
  paiementsService,
  revenusService,
  demandeursService,
  paiesService,
  statistiquesPaieService,
} from '../../../services/api/services';
import { getApiErrorMessage } from '../../../services/api/client';
import { useAcademicYear } from '../../../context/AcademicYearContext';
import CardSkeletonGrid from '../../../components/common/CardSkeleton';
import TableSkeleton from '../../../components/common/TableSkeleton';
import ErrorState from '../../../components/common/ErrorState';

const CATEGORIES_DEPENSE = ["Materiel", "Entretien", "Logistique", "Activites", "Autres"];
const STATUTS_DEPENSE = ["En attente", "Validée", "Rejetée"];
const CATEGORIES_REVENU = ["Inscription", "Scolarite", "Subvention", "Don", "Autre"];
const STATUTS_REVENU = ["En attente", "Validé", "Annulé"];

const MOIS_LABELS = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const initialDepenseForm = {
  libelle: '', montant: '', categorie: 'Materiel', date_depense: '', statut: 'En attente', responsable: null, justificatif: null
};
const initialRevenuForm = {
  libelle: '', montant: '', categorie: 'Inscription', date_entree: '', responsable: '', statut: 'Validé', justificatif: null
};

export default function FinancesPage() {
  const [currentTab, setCurrentTab] = useState(0);

  // Dashboard scolarite
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Salaires stats
  const [salairesStats, setSalairesStats] = useState(null);
  const [paieForecast, setPaieForecast] = useState(null);
  const [loadingSalaires, setLoadingSalaires] = useState(true);

  // Transactions
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(true);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  // Dépenses
  const [depenses, setDepenses] = useState([]);
  const [loadingDepenses, setLoadingDepenses] = useState(true);
  const [depensePage, setDepensePage] = useState(0);
  const [depenseRowsPerPage, setDepenseRowsPerPage] = useState(20);

  // Revenus
  const [revenus, setRevenus] = useState([]);
  const [loadingRevenus, setLoadingRevenus] = useState(true);
  const [revenuPage, setRevenuPage] = useState(0);
  const [revenuRowsPerPage, setRevenuRowsPerPage] = useState(20);

  const [demandeurs, setDemandeurs] = useState([]);
  const [openDepenseForm, setOpenDepenseForm] = useState(false);
  const [isEditingDepense, setIsEditingDepense] = useState(false);
  const [formDepense, setFormDepense] = useState(initialDepenseForm);
  const [selectedDepense, setSelectedDepense] = useState(null);
  const [submittingDepense, setSubmittingDepense] = useState(false);
  const [openRevenuForm, setOpenRevenuForm] = useState(false);
  const [isEditingRevenu, setIsEditingRevenu] = useState(false);
  const [formRevenu, setFormRevenu] = useState(initialRevenuForm);
  const [selectedRevenu, setSelectedRevenu] = useState(null);
  const [submittingRevenu, setSubmittingRevenu] = useState(false);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const { selectedYear } = useAcademicYear();

  useEffect(() => {
    fetchDemandeurs();
    fetchGlobalDashboard();
  }, [selectedYear?.id]);

  useEffect(() => {
    if (currentTab === 0) { fetchGlobalDashboard(); }
    if (currentTab === 1) fetchRevenus();
    if (currentTab === 2) fetchDepenses();
  }, [currentTab, selectedYear?.id]);

  const fetchGlobalDashboard = async () => {
    setLoadingDashboard(true);
    setLoadingSalaires(true);
    setLoadingTransactions(true);
    try {
      const [dashData, forecastData, statsData, paiements, mDepenses, mRevenus] = await Promise.all([
        paiementsService.dashboard(),
        paiesService.getForecast().catch(() => null),
        statistiquesPaieService.get().catch(() => null),
        paiementsService.list(),
        depensesService.list(),
        revenusService.list(),
      ]);
      setDashboard(dashData);
      setPaieForecast(forecastData);
      setSalairesStats(statsData);

      const pData = Array.isArray(paiements) ? paiements : paiements?.results || [];
      const dData = Array.isArray(mDepenses) ? mDepenses : mDepenses?.results || [];
      const rData = Array.isArray(mRevenus) ? mRevenus : mRevenus?.results || [];

      const normalizePaiement = (item) => ({
        id: `paiement-${item.id}`, rawId: item.id,
        date: item.date_paiement || item.created_at || null,
        description: item.frais_libelle || (item.paiement_type === 'INSCRIPTION' ? `Inscription ${item.etudiant_nom || ''}`.trim() : `Formation ${item.etudiant_nom || ''}`.trim()),
        type: 'Entrée', amount: Number(item.montant_paye || 0),
        status: item.solde_restant > 0 ? 'En attente' : 'Complété',
        moyen: item.moyen_paiement || '-',
      });
      const normalizeRevenu = (item) => ({
        id: `revenu-${item.id}`, rawId: item.id,
        date: item.date_entree || item.created_at || null,
        description: item.libelle || null, type: 'Entrée',
        amount: Number(item.montant || 0), status: item.statut || 'Complété', moyen: '-',
      });
      const normalizeDepense = (item) => ({
        id: `depense-${item.id}`, rawId: item.id,
        date: item.date_depense || item.created_at || null,
        description: item.libelle || null, type: 'Sortie',
        amount: Number(item.montant || 0), status: item.statut || 'Complété', moyen: '-',
      });

      const merged = [
        ...pData.map(normalizePaiement), ...rData.map(normalizeRevenu), ...dData.map(normalizeDepense),
      ].filter((item) => item.date && item.description && item.amount > 0)
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setTransactions(merged);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingDashboard(false);
      setLoadingSalaires(false);
      setLoadingTransactions(false);
    }
  };

  const fetchDemandeurs = async () => {
    try {
      const res = await demandeursService.list();
      setDemandeurs(Array.isArray(res) ? res : res?.results || []);
    } catch (e) { console.error(e); }
  };

  const fetchRevenus = async () => {
    setLoadingRevenus(true);
    try {
      const data = await revenusService.list();
      setRevenus(Array.isArray(data) ? data : data?.results || []);
    } catch (err) { setToast({ open: true, message: getApiErrorMessage(err, 'Erreur'), severity: 'error' }); }
    finally { setLoadingRevenus(false); }
  };

  const fetchDepenses = async () => {
    setLoadingDepenses(true);
    try {
      const data = await depensesService.list();
      setDepenses(Array.isArray(data) ? data : data?.results || []);
    } catch (err) { setToast({ open: true, message: getApiErrorMessage(err, 'Erreur'), severity: 'error' }); }
    finally { setLoadingDepenses(false); }
  };

  const { totalRevenus, totalDepenses } = useMemo(() => {
    const rev = transactions.filter(t => t.type === 'Entrée').reduce((s, t) => s + t.amount, 0);
    const dep = transactions.filter(t => t.type === 'Sortie').reduce((s, t) => s + t.amount, 0);
    return { totalRevenus: rev, totalDepenses: dep };
  }, [transactions]);

  const handleSaveDepense = async () => {
    if (!formDepense.libelle || !formDepense.montant || !formDepense.date_depense) {
      setToast({ open: true, message: 'Veuillez remplir les champs obligatoires.', severity: 'warning' }); return;
    }
    setSubmittingDepense(true);
    try {
      const formData = new FormData();
      formData.append('libelle', formDepense.libelle);
      formData.append('montant', String(formDepense.montant));
      formData.append('categorie', formDepense.categorie);
      formData.append('date_depense', formDepense.date_depense);
      formData.append('statut', formDepense.statut);
      if (formDepense.responsable) {
        formData.append('responsable_content_type', formDepense.responsable.content_type_id);
        formData.append('responsable_object_id', formDepense.responsable.id);
      }
      if (formDepense.justificatif) formData.append('justificatif', formDepense.justificatif);
      if (isEditingDepense) { await depensesService.update(selectedDepense.id, formData); }
      else { await depensesService.create(formData); }
      setToast({ open: true, message: 'Enregistré.', severity: 'success' });
      setOpenDepenseForm(false); fetchDepenses();
    } catch (err) { setToast({ open: true, message: getApiErrorMessage(err, "Erreur"), severity: 'error' }); }
    finally { setSubmittingDepense(false); }
  };

  const handleSaveRevenu = async () => {
    if (!formRevenu.libelle || !formRevenu.montant || !formRevenu.date_entree) {
      setToast({ open: true, message: 'Veuillez remplir les champs obligatoires.', severity: 'warning' }); return;
    }
    setSubmittingRevenu(true);
    try {
      const formData = new FormData();
      formData.append('libelle', formRevenu.libelle);
      formData.append('montant', String(formRevenu.montant));
      formData.append('categorie', formRevenu.categorie);
      formData.append('date_entree', formRevenu.date_entree);
      formData.append('statut', formRevenu.statut);
      if (formRevenu.responsable) formData.append('responsable', formRevenu.responsable);
      if (formRevenu.justificatif) formData.append('justificatif', formRevenu.justificatif);
      if (isEditingRevenu) { await revenusService.update(selectedRevenu.id, formData); }
      else { await revenusService.create(formData); }
      setToast({ open: true, message: 'Enregistré.', severity: 'success' });
      setOpenRevenuForm(false); fetchRevenus();
    } catch (err) { setToast({ open: true, message: getApiErrorMessage(err, "Erreur"), severity: 'error' }); }
    finally { setSubmittingRevenu(false); }
  };

  const confirmDelete = (item, type) => { setItemToDelete({ ...item, _type: type }); setOpenDeleteDialog(true); };
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete._type === 'depense') { await depensesService.remove(itemToDelete.id); fetchDepenses(); }
      else if (itemToDelete._type === 'revenu') { await revenusService.remove(itemToDelete.id); fetchRevenus(); }
      setToast({ open: true, message: 'Supprimé.', severity: 'success' });
    } catch (err) { setToast({ open: true, message: getApiErrorMessage(err, "Erreur"), severity: 'error' }); }
    finally { setOpenDeleteDialog(false); setItemToDelete(null); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">Aperçu Financier Global</Typography>
        {currentTab === 1 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setIsEditingRevenu(false); setFormRevenu({ ...initialRevenuForm, date_entree: new Date().toISOString().split('T')[0] }); setSelectedRevenu(null); setOpenRevenuForm(true); }}>Ajouter un revenu</Button>
        )}
        {currentTab === 2 && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setIsEditingDepense(false); setFormDepense({ ...initialDepenseForm, date_depense: new Date().toISOString().split('T')[0] }); setSelectedDepense(null); setOpenDepenseForm(true); }}>Ajouter une dépense</Button>
        )}
      </Box>

      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Tableau de bord" />
        <Tab label="Revenus" />
        <Tab label="Dépenses" />
      </Tabs>

      {/* TAB 0: TABLEAU DE BORD GLOBAL COMPLET */}
      {currentTab === 0 && (
        <Box>
          {loadingDashboard ? (
            <Box>
              <Box sx={{ mb: 4 }}>
                <CardSkeletonGrid count={4} md={3} />
              </Box>
              <TableSkeleton rows={5} columns={5} />
            </Box>
          ) : (
            <>
              {/* Section 1: Vue d'ensemble financière globale */}
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <AccountBalanceIcon sx={{ mr: 1 }} /> Vue d'ensemble
              </Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3, borderTop: '4px solid #4CAF50' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">TOTAL REVENUS</Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">{totalRevenus.toLocaleString()} FCFA</Typography>
                      <Typography variant="caption" color="text.secondary">Paiements + Revenus divers</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3, borderTop: '4px solid #F44336' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">TOTAL DÉPENSES</Typography>
                      <Typography variant="h5" fontWeight="bold" color="error.main">{totalDepenses.toLocaleString()} FCFA</Typography>
                      <Typography variant="caption" color="text.secondary">Dépenses + Salaires</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3, borderTop: '4px solid #2196F3' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">SOLDE NET</Typography>
                      <Typography variant="h5" fontWeight="bold" color={(totalRevenus - totalDepenses) >= 0 ? 'success.main' : 'error.main'}>
                        {(totalRevenus - totalDepenses).toLocaleString()} FCFA
                      </Typography>
                      <Typography variant="caption" color="text.secondary">Revenus - Dépenses</Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3, borderTop: '4px solid #FF9800' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">MASSE SALARIALE</Typography>
                      <Typography variant="h5" fontWeight="bold" color="warning.main">
                        {paieForecast ? Number(paieForecast.total_previsionnel || 0).toLocaleString() : '—'} FCFA
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Payé ce mois: {paieForecast ? Number(paieForecast.total_paye_mois || 0).toLocaleString() : '—'} FCFA
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Section 2: Scolarité */}
              {dashboard && (
                <>
                  <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                    <SchoolIcon sx={{ mr: 1 }} /> Scolarité
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 4 }}>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">ATTENDU</Typography>
                          <Typography variant="h6" fontWeight="bold">{Number(dashboard.total_attendu).toLocaleString()} FCFA</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">RECOUVRÉ</Typography>
                          <Typography variant="h6" fontWeight="bold" color="success.main">{Number(dashboard.total_recouvre).toLocaleString()} FCFA</Typography>
                          <LinearProgress
                            variant="determinate"
                            value={dashboard.taux_recouvrement}
                            sx={{ height: 6, borderRadius: 3, mt: 1 }}
                            color={dashboard.taux_recouvrement >= 75 ? 'success' : dashboard.taux_recouvrement >= 50 ? 'warning' : 'error'}
                          />
                          <Typography variant="caption">{dashboard.taux_recouvrement}%</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">RESTE À RECOUVRER</Typography>
                          <Typography variant="h6" fontWeight="bold" color="warning.main">{Number(dashboard.solde_global).toLocaleString()} FCFA</Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                      <Card sx={{ borderRadius: 3 }}>
                        <CardContent>
                          <Typography variant="caption" color="text.secondary" fontWeight="bold">ÉTUDIANTS</Typography>
                          <Typography variant="h6" fontWeight="bold">{dashboard.total_etudiants}</Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                            <Chip label={`${dashboard.etudiants_soldes} soldés`} color="success" size="small" variant="outlined" />
                            <Chip label={`${dashboard.etudiants_non_payes} impayés`} color="error" size="small" variant="outlined" />
                          </Box>
                        </CardContent>
                      </Card>
                    </Grid>
                  </Grid>
                </>
              )}

              {/* Section 3: Salaires */}
              <Typography variant="h6" fontWeight="bold" sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
                <PaymentsIcon sx={{ mr: 1 }} /> Salaires
              </Typography>
              <Grid container spacing={2} sx={{ mb: 4 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">PRÉVISIONNEL MENSUEL</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {paieForecast ? Number(paieForecast.total_previsionnel || 0).toLocaleString() : '—'} FCFA
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">PAYÉ CE MOIS</Typography>
                      <Typography variant="h6" fontWeight="bold" color="success.main">
                        {paieForecast ? Number(paieForecast.total_paye_mois || 0).toLocaleString() : '—'} FCFA
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">RESTE À PAYER</Typography>
                      <Typography variant="h6" fontWeight="bold" color="warning.main">
                        {paieForecast ? Number(paieForecast.reste_a_payer || 0).toLocaleString() : '—'} FCFA
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3 }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">JOUR DE PAIE</Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {paieForecast ? paieForecast.jour_de_paie : '—'}
                      </Typography>
                      {paieForecast?.is_near_payday && (
                        <Chip label="Paie proche" color="warning" size="small" />
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {/* Section 4: Statistiques mensuelles salaires */}
              {salairesStats?.monthly_history?.length > 0 && (
                <Card sx={{ borderRadius: 3, mb: 4 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                      Historique salaires mensuels
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Mois</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Brut</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Net</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Primes</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Retenues</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {salairesStats.monthly_history.slice(0, 6).map((m, i) => (
                            <TableRow key={i} hover>
                              <TableCell sx={{ fontWeight: 500 }}>{MOIS_LABELS[m.mois]} {m.annee}</TableCell>
                              <TableCell>{Number(m.brut || 0).toLocaleString()} FCFA</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>{Number(m.net || 0).toLocaleString()} FCFA</TableCell>
                              <TableCell>{Number(m.primes || 0).toLocaleString()} FCFA</TableCell>
                              <TableCell sx={{ color: 'error.main' }}>{Number(m.retenues || 0).toLocaleString()} FCFA</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Section 5: Encaissements scolarité par mois */}
              {dashboard?.paiements_par_mois?.length > 0 && (
                <Card sx={{ borderRadius: 3, mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                      <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Encaissements scolarité mensuels
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Mois</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Nombre de paiements</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Montant total</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dashboard.paiements_par_mois.map((p, i) => (
                            <TableRow key={i} hover>
                              <TableCell sx={{ fontWeight: 500 }}>{MOIS_LABELS[p.mois]} {p.annee}</TableCell>
                              <TableCell>{p.nombre}</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>{Number(p.total).toLocaleString()} FCFA</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {/* Section 6: Dernières transactions */}
              <Typography variant="h6" fontWeight="bold" mb={2}>Dernières transactions</Typography>
              <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
                <Table>
                  <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Description</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Montant</TableCell>
                      <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {loadingTransactions ? (
                      <TableRow><TableCell colSpan={5} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
                    ) : transactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((trx) => (
                      <TableRow key={trx.id} hover>
                        <TableCell>{formatDate(trx.date)}</TableCell>
                        <TableCell>{trx.description}</TableCell>
                        <TableCell>
                          <Chip label={trx.type} color={trx.type === 'Entrée' ? 'success' : 'error'} variant="outlined" size="small" />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 'bold', color: trx.type === 'Entrée' ? 'success.main' : 'error.main' }}>
                          {trx.type === 'Entrée' ? '+ ' : '- '}{Number(trx.amount).toLocaleString()} FCFA
                        </TableCell>
                        <TableCell>
                          <Chip label={trx.status} color={trx.status === 'Complété' ? 'primary' : 'warning'} size="small" />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination rowsPerPageOptions={[20, 50, 100]} component="div" count={transactions.length} rowsPerPage={rowsPerPage} page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                labelRowsPerPage="Lignes :"
              />
            </>
          )}
        </Box>
      )}

      {/* TAB 1: REVENUS */}
      {currentTab === 1 && (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Libellé</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Catégorie</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Responsable</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Montant</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingRevenus && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>}
                {!loadingRevenus && revenus.slice(revenuPage * revenuRowsPerPage, revenuPage * revenuRowsPerPage + revenuRowsPerPage).map((rev) => (
                  <TableRow key={rev.id} hover>
                    <TableCell>{formatDate(rev.date_entree || rev.created_at)}</TableCell>
                    <TableCell>{rev.libelle}</TableCell>
                    <TableCell><Chip label={rev.categorie} size="small" variant="outlined" /></TableCell>
                    <TableCell>{rev.responsable || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>+{Number(rev.montant).toLocaleString()} FCFA</TableCell>
                    <TableCell><Chip label={rev.statut || 'N/A'} color={rev.statut === 'Validé' ? 'success' : 'warning'} size="small" /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => { setIsEditingRevenu(true); setFormRevenu({ libelle: rev.libelle || '', montant: rev.montant || '', categorie: rev.categorie || 'Inscription', date_entree: rev.date_entree ? rev.date_entree.split('T')[0] : '', responsable: rev.responsable || '', statut: rev.statut || 'Validé', justificatif: null }); setSelectedRevenu(rev); setOpenRevenuForm(true); }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => confirmDelete(rev, 'revenu')}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingRevenus && revenus.length === 0 && <TableRow><TableCell colSpan={7} align="center">Aucun revenu.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          {revenus.length > 0 && <TablePagination rowsPerPageOptions={[20, 50, 100]} component="div" count={revenus.length} rowsPerPage={revenuRowsPerPage} page={revenuPage} onPageChange={(e, n) => setRevenuPage(n)} onRowsPerPageChange={(e) => { setRevenuRowsPerPage(parseInt(e.target.value, 10)); setRevenuPage(0); }} labelRowsPerPage="Lignes :" />}
        </Box>
      )}

      {/* TAB 2: DÉPENSES */}
      {currentTab === 2 && (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Libellé</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Catégorie</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Responsable</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Montant</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingDepenses && <TableRow><TableCell colSpan={7} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>}
                {!loadingDepenses && depenses.slice(depensePage * depenseRowsPerPage, depensePage * depenseRowsPerPage + depenseRowsPerPage).map((dep) => (
                  <TableRow key={dep.id} hover>
                    <TableCell>{formatDate(dep.date_depense || dep.created_at)}</TableCell>
                    <TableCell>{dep.libelle}</TableCell>
                    <TableCell><Chip label={dep.categorie} size="small" variant="outlined" /></TableCell>
                    <TableCell>{dep.responsable_nom || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: 'error.main' }}>-{Number(dep.montant).toLocaleString()} FCFA</TableCell>
                    <TableCell><Chip label={dep.statut || 'N/A'} color={dep.statut === 'Validée' ? 'success' : dep.statut === 'Rejetée' ? 'error' : 'warning'} size="small" /></TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => { setIsEditingDepense(true); setFormDepense({ libelle: dep.libelle || '', montant: dep.montant || '', categorie: dep.categorie || 'Materiel', date_depense: dep.date_depense ? dep.date_depense.split('T')[0] : '', statut: dep.statut || 'En attente', responsable: demandeurs.find(d => d.nom === dep.responsable_nom) || null, justificatif: null }); setSelectedDepense(dep); setOpenDepenseForm(true); }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => confirmDelete(dep, 'depense')}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingDepenses && depenses.length === 0 && <TableRow><TableCell colSpan={7} align="center">Aucune dépense.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
          {depenses.length > 0 && <TablePagination rowsPerPageOptions={[20, 50, 100]} component="div" count={depenses.length} rowsPerPage={depenseRowsPerPage} page={depensePage} onPageChange={(e, n) => setDepensePage(n)} onRowsPerPageChange={(e) => { setDepenseRowsPerPage(parseInt(e.target.value, 10)); setDepensePage(0); }} labelRowsPerPage="Lignes :" />}
        </Box>
      )}

      {/* === DIALOGS === */}

      {/* Revenu */}
      <Dialog open={openRevenuForm} onClose={() => setOpenRevenuForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditingRevenu ? 'Modifier le revenu' : 'Ajouter un revenu'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth label="Libellé" value={formRevenu.libelle} onChange={(e) => setFormRevenu({ ...formRevenu, libelle: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Montant (FCFA)" value={formRevenu.montant} onChange={(e) => setFormRevenu({ ...formRevenu, montant: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth type="date" label="Date" InputLabelProps={{ shrink: true }} value={formRevenu.date_entree} onChange={(e) => setFormRevenu({ ...formRevenu, date_entree: e.target.value })} required /></Grid>
            <Grid item xs={6}><FormControl fullWidth><InputLabel>Catégorie</InputLabel><Select value={formRevenu.categorie} label="Catégorie" onChange={(e) => setFormRevenu({ ...formRevenu, categorie: e.target.value })}>{CATEGORIES_REVENU.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={6}><FormControl fullWidth><InputLabel>Statut</InputLabel><Select value={formRevenu.statut} label="Statut" onChange={(e) => setFormRevenu({ ...formRevenu, statut: e.target.value })}>{STATUTS_REVENU.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12}><TextField fullWidth label="Responsable" value={formRevenu.responsable} onChange={(e) => setFormRevenu({ ...formRevenu, responsable: e.target.value })} /></Grid>
            <Grid item xs={12}><Box><input accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} id="justif-rev" type="file" onChange={(e) => { if (e.target.files[0]) setFormRevenu({ ...formRevenu, justificatif: e.target.files[0] }); }} /><label htmlFor="justif-rev"><Button variant="outlined" component="span" fullWidth startIcon={<CloudUploadIcon />}>{formRevenu.justificatif ? formRevenu.justificatif.name : 'Justificatif'}</Button></label></Box></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRevenuForm(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveRevenu} disabled={submittingRevenu}>{submittingRevenu ? <CircularProgress size={20} /> : 'Enregistrer'}</Button>
        </DialogActions>
      </Dialog>

      {/* Dépense */}
      <Dialog open={openDepenseForm} onClose={() => setOpenDepenseForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditingDepense ? 'Modifier la dépense' : 'Ajouter une dépense'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}><TextField fullWidth label="Libellé" value={formDepense.libelle} onChange={(e) => setFormDepense({ ...formDepense, libelle: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth type="number" label="Montant (FCFA)" value={formDepense.montant} onChange={(e) => setFormDepense({ ...formDepense, montant: e.target.value })} required /></Grid>
            <Grid item xs={6}><TextField fullWidth type="date" label="Date" InputLabelProps={{ shrink: true }} value={formDepense.date_depense} onChange={(e) => setFormDepense({ ...formDepense, date_depense: e.target.value })} required /></Grid>
            <Grid item xs={6}><FormControl fullWidth><InputLabel>Catégorie</InputLabel><Select value={formDepense.categorie} label="Catégorie" onChange={(e) => setFormDepense({ ...formDepense, categorie: e.target.value })}>{CATEGORIES_DEPENSE.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={6}><FormControl fullWidth><InputLabel>Statut</InputLabel><Select value={formDepense.statut} label="Statut" onChange={(e) => setFormDepense({ ...formDepense, statut: e.target.value })}>{STATUTS_DEPENSE.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12}><FormControl fullWidth><InputLabel>Responsable</InputLabel><Select value={formDepense.responsable ? `${formDepense.responsable.type}-${formDepense.responsable.id}` : ''} label="Responsable" onChange={(e) => { const sel = demandeurs.find(d => `${d.type}-${d.id}` === e.target.value); setFormDepense({ ...formDepense, responsable: sel }); }}>{demandeurs.map(d => <MenuItem key={`${d.type}-${d.id}`} value={`${d.type}-${d.id}`}>{d.nom} ({d.type})</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12}><Box><input accept=".pdf,.png,.jpg,.jpeg" style={{ display: 'none' }} id="justif-dep" type="file" onChange={(e) => { if (e.target.files[0]) setFormDepense({ ...formDepense, justificatif: e.target.files[0] }); }} /><label htmlFor="justif-dep"><Button variant="outlined" component="span" fullWidth startIcon={<CloudUploadIcon />}>{formDepense.justificatif ? formDepense.justificatif.name : 'Justificatif'}</Button></label></Box></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDepenseForm(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveDepense} disabled={submittingDepense}>{submittingDepense ? <CircularProgress size={20} /> : 'Enregistrer'}</Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Suppression */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={handleDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
