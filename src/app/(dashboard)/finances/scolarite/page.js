'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  LinearProgress,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import SearchIcon from '@mui/icons-material/Search';
import AddCardIcon from '@mui/icons-material/AddCard';
import FilterListIcon from '@mui/icons-material/FilterList';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import SchoolIcon from '@mui/icons-material/School';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import PeopleIcon from '@mui/icons-material/People';
import {
  anneesAcademiquesService,
  classesService,
  classScheduleService,
  etudiantsService,
  fraisService,
  inscriptionsV2Service,
  levelsV2Service,
  paiementsService,
  paiementAlertsService,
} from '../../../../services/api/services';
import { getApiErrorMessage } from '../../../../services/api/client';
import { formatDate } from '../../../../utils/formatters';
import PaymentModal from '../../../../components/finances/PaymentModal';
import AddInscriptionModal from '../../../../components/finances/AddInscriptionModal';
import { useAcademicYear } from '../../../../context/AcademicYearContext';

function toList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

function formatCurrency(value) {
  return `${Number(value || 0).toLocaleString('fr-FR')} FCFA`;
}

function formatDateLocal(dateString) {
  if (!dateString) return '-';
  return new Date(dateString).toLocaleDateString('fr-FR');
}

function paymentStateLabel(item) {
  if ((Number(item.solde_restant) || 0) <= 0) return 'Soldé';
  if ((Number(item.montant_paye_total) || 0) > 0) return 'Partiel';
  return 'Non payé';
}

function paymentStateColor(item) {
  if ((Number(item.solde_restant) || 0) <= 0) return 'success';
  if ((Number(item.montant_paye_total) || 0) > 0) return 'warning';
  return 'default';
}

const MOIS_LABELS = ['', 'Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

const initialFraisForm = {
  libelle: '', montant: '', classe: '', obligatoire: true, date_echeance: ''
};

export default function ScolaritePage() {
  const [currentTab, setCurrentTab] = useState(0);
  const { selectedYear } = useAcademicYear();

  // Dashboard / Stats
  const [dashboard, setDashboard] = useState(null);
  const [loadingDashboard, setLoadingDashboard] = useState(true);

  // Suivi paiements
  const [financialRows, setFinancialRows] = useState([]);
  const [students, setStudents] = useState([]);
  const [levels, setLevels] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingAlerts, setLoadingAlerts] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('Tous');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [paymentAlerts, setPaymentAlerts] = useState([]);
  const [errorAlerts, setErrorAlerts] = useState('');
  const [openPaymentModal, setOpenPaymentModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [openInscriptionModal, setOpenInscriptionModal] = useState(false);

  // Frais
  const [frais, setFrais] = useState([]);
  const [loadingFrais, setLoadingFrais] = useState(true);
  const [classes, setClasses] = useState([]);
  const [openFraisForm, setOpenFraisForm] = useState(false);
  const [isEditingFrais, setIsEditingFrais] = useState(false);
  const [formFrais, setFormFrais] = useState(initialFraisForm);
  const [selectedFrais, setSelectedFrais] = useState(null);
  const [submittingFrais, setSubmittingFrais] = useState(false);
  const [openQuickConfig, setOpenQuickConfig] = useState(false);
  const [quickConfigData, setQuickConfigData] = useState({
    classe: '', inscription: '', scolariteTotal: '',
    tranches: [
      { label: 'Tranche 1', montant: '', date: '' },
      { label: 'Tranche 2', montant: '', date: '' },
      { label: 'Tranche 3', montant: '', date: '' },
    ]
  });
  const [isConfiguringQuickly, setIsConfiguringQuickly] = useState(false);

  // Delete
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const initialPaymentForm = {
    paiement_type: 'INSCRIPTION',
    montant: '',
    mode_paiement: 'cash',
  };
  const initialInscriptionForm = {
    etudiant: '',
    niveau: '',
    annee_academique: '',
    annee_academique_ref: '',
  };

  const [paymentForm, setPaymentForm] = useState(initialPaymentForm);
  const [inscriptionForm, setInscriptionForm] = useState(initialInscriptionForm);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    fetchDashboard();
  }, [selectedYear?.id]);

  useEffect(() => {
    if (currentTab === 0) fetchDashboard();
    if (currentTab === 1) fetchData();
    if (currentTab === 2) fetchFrais();
  }, [currentTab, selectedYear?.id]);

  const fetchDashboard = async () => {
    setLoadingDashboard(true);
    try {
      const data = await paiementsService.dashboard();
      setDashboard(data);
    } catch (e) { console.error(e); }
    finally { setLoadingDashboard(false); }
  };

  const fetchData = async () => {
    setLoading(true);
    setLoadingAlerts(true);
    setErrorAlerts('');
    try {
      const [paymentsRes, studentsRes, levelsRes, yearsRes, alertsRes] = await Promise.all([
        paiementsService.aggregated(),
        etudiantsService.list(),
        levelsV2Service.list(),
        anneesAcademiquesService.list(),
        paiementAlertsService.list().catch(() => []),
      ]);
      setFinancialRows(toList(paymentsRes));
      setStudents(toList(studentsRes));
      setLevels(toList(levelsRes));
      setAcademicYears(toList(yearsRes));
      setPaymentAlerts(
        (Array.isArray(alertsRes) ? alertsRes : alertsRes?.results || [])
          .filter((item) => item.status === 'OVERDUE')
          .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
      );
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, 'Erreur de chargement'), severity: 'error' });
      setErrorAlerts(getApiErrorMessage(error, "Chargement des alertes d'echeance impossible."));
    } finally {
      setLoading(false);
      setLoadingAlerts(false);
    }
  };

  const fetchFrais = async () => {
    setLoadingFrais(true);
    try {
      const [fData, cData] = await Promise.all([fraisService.list(), classesService.list()]);
      setFrais(Array.isArray(fData) ? fData : fData?.results || []);
      setClasses(Array.isArray(cData) ? cData : cData?.results || []);
    } catch (err) {
      setToast({ open: true, message: getApiErrorMessage(err, 'Chargement des frais impossible.'), severity: 'error' });
    } finally { setLoadingFrais(false); }
  };

  const filteredRows = useMemo(() => {
    return financialRows.filter((item) => {
      const needle = searchTerm.toLowerCase();
      const matchSearch =
        (item.etudiant_nom || '').toLowerCase().includes(needle) ||
        (item.formation_nom || '').toLowerCase().includes(needle);
      const matchStatus = statusFilter === 'Tous' || paymentStateLabel(item) === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [financialRows, searchTerm, statusFilter]);

  const validateInscriptionForm = () => {
    const errors = {};
    if (!inscriptionForm.etudiant) errors.etudiant = 'Requis';
    if (!inscriptionForm.niveau) errors.niveau = 'Requis';
    if (!inscriptionForm.annee_academique_ref) errors.annee_academique_ref = 'Requis';
    if (!inscriptionForm.annee_academique) errors.annee_academique = 'Requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateInscription = async () => {
    if (!validateInscriptionForm()) return;
    setSubmitting(true);
    try {
      await inscriptionsV2Service.create({
        etudiant: inscriptionForm.etudiant,
        niveau: inscriptionForm.niveau,
        annee_academique: inscriptionForm.annee_academique,
        annee_academique_ref: inscriptionForm.annee_academique_ref,
      });
      setToast({ open: true, message: 'Inscription créée avec succès.', severity: 'success' });
      setOpenInscriptionModal(false);
      await fetchData();
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, 'Création impossible'), severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const validatePaymentForm = () => {
    const errors = {};
    const amount = Number(paymentForm.montant || 0);
    const remaining =
      paymentForm.paiement_type === 'INSCRIPTION'
        ? Number(selectedRow?.solde_restant_inscription || 0)
        : Number(selectedRow?.solde_restant_formation || 0);

    if (!paymentForm.paiement_type) errors.paiement_type = 'Requis';
    if (!amount || amount <= 0) errors.montant = 'Montant invalide';
    if (remaining > 0 && amount > remaining) errors.montant = 'Le montant dépasse le reste à payer.';
    if (!paymentForm.mode_paiement) errors.mode_paiement = 'Requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreatePayment = async () => {
    if (!selectedRow || !validatePaymentForm()) return;
    setSubmitting(true);
    try {
      await paiementsService.create({
        etudiant: selectedRow.etudiant,
        paiement_type: paymentForm.paiement_type,
        montant_paye: paymentForm.montant,
        moyen_paiement: paymentForm.mode_paiement,
      });
      setToast({ open: true, message: 'Paiement enregistré avec succès.', severity: 'success' });
      setOpenPaymentModal(false);
      await fetchData();
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, 'Paiement impossible'), severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const openPaymentForRow = (row) => {
    setSelectedRow(row);
    setPaymentForm({
      paiement_type: Number(row.solde_restant_inscription || 0) > 0 ? 'INSCRIPTION' : 'FORMATION',
      montant: '',
      mode_paiement: 'cash',
    });
    setFormErrors({});
    setOpenPaymentModal(true);
  };

  const openInscriptionForm = () => {
    const activeYear = academicYears.find((item) => item.est_active) || academicYears[0];
    setInscriptionForm({
      etudiant: '',
      niveau: '',
      annee_academique_ref: activeYear?.id || '',
      annee_academique: activeYear?.libelle || '',
    });
    setFormErrors({});
    setOpenInscriptionModal(true);
  };

  const confirmDelete = (item) => { setItemToDelete(item); setOpenDeleteDialog(true); };
  const handleDelete = async () => {
    if (!itemToDelete) return;
    try {
      await fraisService.remove(itemToDelete.id);
      fetchFrais();
      setToast({ open: true, message: 'Supprimé.', severity: 'success' });
    } catch (err) { setToast({ open: true, message: getApiErrorMessage(err, "Erreur"), severity: 'error' }); }
    finally { setOpenDeleteDialog(false); setItemToDelete(null); }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Scolarité
        </Typography>
        {currentTab === 1 && (
          <Button variant="contained" color="primary" startIcon={<AddCircleOutlineIcon />} onClick={openInscriptionForm}>
            Nouvelle inscription
          </Button>
        )}
        {currentTab === 2 && (
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button variant="outlined" color="success" startIcon={<AddIcon />} onClick={() => setOpenQuickConfig(true)}>Config. Rapide</Button>
          </Box>
        )}
      </Box>

      <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} variant="scrollable" scrollButtons="auto" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
        <Tab label="Statistiques" />
        <Tab label="Suivi des paiements" />
        <Tab label="Configuration des Frais" />
      </Tabs>

      {/* TAB 0: STATISTIQUES SCOLARITE */}
      {currentTab === 0 && (
        <Box>
          {loadingDashboard ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
          ) : dashboard ? (
            <>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3, borderTop: '4px solid #2196F3' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">ATTENDU (SCOLARITÉ)</Typography>
                      <Typography variant="h5" fontWeight="bold">{Number(dashboard.total_attendu).toLocaleString()} FCFA</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Inscr: {Number(dashboard.total_attendu_inscription).toLocaleString()} | Form: {Number(dashboard.total_attendu_formation).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3, borderTop: '4px solid #4CAF50' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">RECOUVRÉ</Typography>
                      <Typography variant="h5" fontWeight="bold" color="success.main">{Number(dashboard.total_recouvre).toLocaleString()} FCFA</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Inscr: {Number(dashboard.total_recouvre_inscription).toLocaleString()} | Form: {Number(dashboard.total_recouvre_formation).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3, borderTop: '4px solid #FF9800' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">RESTE À RECOUVRER</Typography>
                      <Typography variant="h5" fontWeight="bold" color="warning.main">{Number(dashboard.solde_global).toLocaleString()} FCFA</Typography>
                      <Box sx={{ mt: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={dashboard.taux_recouvrement}
                          sx={{ height: 8, borderRadius: 4 }}
                          color={dashboard.taux_recouvrement >= 75 ? 'success' : dashboard.taux_recouvrement >= 50 ? 'warning' : 'error'}
                        />
                        <Typography variant="caption" fontWeight="bold">{dashboard.taux_recouvrement}% recouvré</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card sx={{ borderRadius: 3, borderTop: '4px solid #9C27B0' }}>
                    <CardContent>
                      <Typography variant="caption" color="text.secondary" fontWeight="bold">ÉTUDIANTS INSCRITS</Typography>
                      <Typography variant="h5" fontWeight="bold">{dashboard.total_etudiants}</Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, mt: 1, flexWrap: 'wrap' }}>
                        <Chip label={`${dashboard.etudiants_soldes} soldés`} color="success" size="small" variant="outlined" />
                        <Chip label={`${dashboard.etudiants_partiels} partiels`} color="warning" size="small" variant="outlined" />
                        <Chip label={`${dashboard.etudiants_non_payes} impayés`} color="error" size="small" variant="outlined" />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <WarningAmberIcon sx={{ color: '#F44336', mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold">Échéances en retard</Typography>
                      </Box>
                      <Typography variant="h4" fontWeight="bold" color="error.main">{dashboard.nb_echeances_retard}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Montant total: {Number(dashboard.montant_echeances_retard).toLocaleString()} FCFA
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <TrendingUpIcon sx={{ color: '#4CAF50', mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold">Activité (7 derniers jours)</Typography>
                      </Box>
                      <Typography variant="h4" fontWeight="bold">{dashboard.paiements_7j} paiements</Typography>
                      <Typography variant="body2" color="success.main" fontWeight="bold">
                        +{Number(dashboard.montant_7j).toLocaleString()} FCFA
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} md={4}>
                  <Card sx={{ borderRadius: 3, height: '100%' }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <AccountBalanceIcon sx={{ color: '#2196F3', mr: 1 }} />
                        <Typography variant="subtitle1" fontWeight="bold">Moyens de paiement</Typography>
                      </Box>
                      {dashboard.repartition_moyens?.length > 0 ? (
                        dashboard.repartition_moyens.map((m, i) => (
                          <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">{m.moyen} ({m.nombre})</Typography>
                            <Typography variant="body2" fontWeight="bold">{Number(m.montant).toLocaleString()}</Typography>
                          </Box>
                        ))
                      ) : (
                        <Typography variant="body2" color="text.secondary">Aucun paiement</Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>

              {dashboard.repartition_filieres?.length > 0 && (
                <Card sx={{ borderRadius: 3, mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                      <SchoolIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Recouvrement par filière
                    </Typography>
                    <TableContainer>
                      <Table size="small">
                        <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 'bold' }}>Filière</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Étudiants</TableCell>
                            <TableCell sx={{ fontWeight: 'bold' }}>Total recouvré</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {dashboard.repartition_filieres.map((f, i) => (
                            <TableRow key={i} hover>
                              <TableCell sx={{ fontWeight: 500 }}>{f.filiere}</TableCell>
                              <TableCell>{f.nb_etudiants}</TableCell>
                              <TableCell sx={{ fontWeight: 'bold', color: 'success.main' }}>{Number(f.total_recouvre).toLocaleString()} FCFA</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}

              {dashboard.paiements_par_mois?.length > 0 && (
                <Card sx={{ borderRadius: 3, mb: 3 }}>
                  <CardContent>
                    <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 2 }}>
                      <TrendingUpIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                      Encaissements mensuels
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
            </>
          ) : (
            <Alert severity="info">Aucune donnée financière de scolarité disponible.</Alert>
          )}
        </Box>
      )}

      {/* TAB 1: SUIVI DES PAIEMENTS */}
      {currentTab === 1 && (
        <Box>
          <Card sx={{ mb: 3, p: 2, borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              size="small"
              placeholder="Rechercher étudiant ou formation..."
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
              sx={{ minWidth: 320 }}
            />
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <Select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value)}
                startAdornment={<InputAdornment position="start"><FilterListIcon /></InputAdornment>}
              >
                <MenuItem value="Tous">Tous les statuts</MenuItem>
                <MenuItem value="Non payé">Non payé</MenuItem>
                <MenuItem value="Partiel">Partiel</MenuItem>
                <MenuItem value="Soldé">Soldé</MenuItem>
              </Select>
            </FormControl>
          </Card>

          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Étudiant</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Classe</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Inscription</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Formation</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Solde global</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                      <CircularProgress size={24} />
                    </TableCell>
                  </TableRow>
                ) : filteredRows.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
                  <TableRow key={`${item.etudiant}-${item.formation}`} hover>
                    <TableCell>{item.etudiant_nom || '-'}</TableCell>
                    <TableCell>{item.formation_nom || '-'}</TableCell>
                    <TableCell>
                      <Typography variant="body2">Dû: {formatCurrency(item.montant_du_inscription)}</Typography>
                      <Typography variant="body2">Payé: {formatCurrency(item.montant_paye_inscription_total)}</Typography>
                      <Typography variant="body2" color={(Number(item.solde_restant_inscription) || 0) <= 0 ? 'success.main' : 'warning.main'}>
                        Reste: {formatCurrency(item.solde_restant_inscription)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">Dû: {formatCurrency(item.montant_du_formation)}</Typography>
                      <Typography variant="body2">Payé: {formatCurrency(item.montant_paye_formation_total)}</Typography>
                      <Typography variant="body2" color={(Number(item.solde_restant_formation) || 0) <= 0 ? 'success.main' : 'warning.main'}>
                        Reste: {formatCurrency(item.solde_restant_formation)}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ fontWeight: 700, color: (Number(item.solde_restant) || 0) <= 0 ? 'success.main' : 'error.main' }}>
                      {formatCurrency(item.solde_restant)}
                    </TableCell>
                    <TableCell>
                      <Chip label={paymentStateLabel(item)} color={paymentStateColor(item)} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      {(Number(item.solde_restant) || 0) > 0 && (
                        <Button size="small" variant="outlined" color="primary" startIcon={<AddCardIcon />} onClick={() => openPaymentForRow(item)}>
                          Payer
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
                {!loading && filteredRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      Aucun dossier trouvé.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[20, 50, 100]}
              component="div"
              count={filteredRows.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={(_event, newPage) => setPage(newPage)}
              onRowsPerPageChange={(event) => {
                setRowsPerPage(parseInt(event.target.value, 10));
                setPage(0);
              }}
            />
          </TableContainer>

          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" fontWeight="bold" color="primary" sx={{ mb: 2 }}>
              Échéances en retard
            </Typography>
            <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Étudiant</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Formation</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Échéance</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Tranche</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Reste à payer</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Alerte</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingAlerts ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                        <CircularProgress size={24} />
                      </TableCell>
                    </TableRow>
                  ) : errorAlerts ? (
                    <TableRow>
                      <TableCell colSpan={6}>
                        <Alert severity="error">{errorAlerts}</Alert>
                      </TableCell>
                    </TableRow>
                  ) : paymentAlerts.length > 0 ? (
                    paymentAlerts.slice(0, 10).map((alert) => (
                      <TableRow key={alert.installment_id} hover>
                        <TableCell sx={{ fontWeight: 600 }}>{alert.etudiant_nom || '-'}</TableCell>
                        <TableCell>{alert.formation_nom || '-'}</TableCell>
                        <TableCell>{formatDateLocal(alert.due_date)}</TableCell>
                        <TableCell>{alert.label || '-'}</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'error.main' }}>
                          {Number(alert.balance_due || 0).toLocaleString('fr-FR')} FCFA
                        </TableCell>
                        <TableCell>
                          <Alert
                            severity={alert.severity === 'high' ? 'error' : 'warning'}
                            icon={<WarningAmberIcon fontSize="inherit" />}
                            sx={{ py: 0 }}
                          >
                            {alert.message}
                          </Alert>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                        Aucune échéance en retard.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Paper>
          </Box>
        </Box>
      )}

      {/* TAB 2: CONFIGURATION DES FRAIS */}
      {currentTab === 2 && (
        <Box>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table>
              <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Classe</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Libellé</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Montant</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Obligatoire</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Échéance</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loadingFrais && <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>}
                {!loadingFrais && frais.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ fontWeight: 600 }}>{item.classe_nom || item.classe_id}</TableCell>
                    <TableCell>{item.libelle}</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>{Number(item.montant).toLocaleString()} FCFA</TableCell>
                    <TableCell>{item.obligatoire ? 'Oui' : 'Non'}</TableCell>
                    <TableCell>{item.date_echeance ? formatDate(item.date_echeance) : '-'}</TableCell>
                    <TableCell align="right">
                      <IconButton size="small" color="primary" onClick={() => { setIsEditingFrais(true); setSelectedFrais(item); setFormFrais({ libelle: item.libelle, montant: item.montant, classe: item.classe_id || item.classe, obligatoire: item.obligatoire, date_echeance: item.date_echeance || '' }); setOpenFraisForm(true); }}><EditIcon fontSize="small" /></IconButton>
                      <IconButton size="small" color="error" onClick={() => confirmDelete(item)}><DeleteIcon fontSize="small" /></IconButton>
                    </TableCell>
                  </TableRow>
                ))}
                {!loadingFrais && frais.length === 0 && <TableRow><TableCell colSpan={6} align="center">Aucun frais configuré.</TableCell></TableRow>}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      )}

      {/* === DIALOGS === */}

      {/* Frais */}
      <Dialog open={openFraisForm} onClose={() => setOpenFraisForm(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{isEditingFrais ? 'Modifier le frais' : 'Ajouter un frais'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}><FormControl fullWidth required><InputLabel>Classe</InputLabel><Select value={formFrais.classe} label="Classe" onChange={(e) => setFormFrais({ ...formFrais, classe: e.target.value })}>{classes.map(c => <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12}><TextField fullWidth label="Libellé" value={formFrais.libelle} onChange={(e) => setFormFrais({ ...formFrais, libelle: e.target.value })} required /></Grid>
            <Grid item xs={12}><TextField fullWidth type="number" label="Montant (FCFA)" value={formFrais.montant} onChange={(e) => setFormFrais({ ...formFrais, montant: e.target.value })} required /></Grid>
            <Grid item xs={12}><TextField fullWidth type="date" label="Date d'échéance" InputLabelProps={{ shrink: true }} value={formFrais.date_echeance} onChange={(e) => setFormFrais({ ...formFrais, date_echeance: e.target.value })} /></Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenFraisForm(false)}>Annuler</Button>
          <Button variant="contained" onClick={async () => {
            setSubmittingFrais(true);
            try { if (isEditingFrais) await fraisService.update(selectedFrais.id, formFrais); else await fraisService.create(formFrais); setOpenFraisForm(false); fetchFrais(); setToast({ open: true, message: 'OK', severity: 'success' }); }
            catch (err) { setToast({ open: true, message: getApiErrorMessage(err, "Erreur"), severity: 'error' }); }
            finally { setSubmittingFrais(false); }
          }} disabled={submittingFrais}>{submittingFrais ? <CircularProgress size={20} /> : 'Enregistrer'}</Button>
        </DialogActions>
      </Dialog>

      {/* Quick Config */}
      <Dialog open={openQuickConfig} onClose={() => setOpenQuickConfig(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Configuration Rapide</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}><FormControl fullWidth required><InputLabel>Classe</InputLabel><Select value={quickConfigData.classe} label="Classe" onChange={(e) => setQuickConfigData({ ...quickConfigData, classe: e.target.value })}>{classes.map(c => <MenuItem key={c.id} value={c.id}>{c.nom}</MenuItem>)}</Select></FormControl></Grid>
            <Grid item xs={12}><TextField fullWidth label="Inscription (FCFA)" type="number" value={quickConfigData.inscription} onChange={(e) => setQuickConfigData({ ...quickConfigData, inscription: e.target.value })} /></Grid>
            <Grid item xs={12}><Divider><Chip label="Scolarité & Échéancier" size="small" /></Divider></Grid>
            <Grid item xs={12}><TextField fullWidth label="Total Scolarité" type="number" value={quickConfigData.scolariteTotal} onChange={(e) => setQuickConfigData({ ...quickConfigData, scolariteTotal: e.target.value })} /></Grid>
            {quickConfigData.tranches.map((tr, idx) => (
              <Grid item xs={12} key={idx} container spacing={1} alignItems="center">
                <Grid item xs={4}><TextField fullWidth size="small" label={`Tranche ${idx + 1}`} type="number" value={tr.montant} onChange={(e) => { const t = [...quickConfigData.tranches]; t[idx] = { ...t[idx], montant: e.target.value }; setQuickConfigData({ ...quickConfigData, tranches: t }); }} /></Grid>
                <Grid item xs={4}><TextField fullWidth size="small" label="Échéance" type="date" InputLabelProps={{ shrink: true }} value={tr.date} onChange={(e) => { const t = [...quickConfigData.tranches]; t[idx] = { ...t[idx], date: e.target.value }; setQuickConfigData({ ...quickConfigData, tranches: t }); }} /></Grid>
                <Grid item xs={3}><TextField fullWidth size="small" label="Libellé" value={tr.label} onChange={(e) => { const t = [...quickConfigData.tranches]; t[idx] = { ...t[idx], label: e.target.value }; setQuickConfigData({ ...quickConfigData, tranches: t }); }} /></Grid>
                <Grid item xs={1}>{quickConfigData.tranches.length > 1 && <IconButton size="small" color="error" onClick={() => { const t = quickConfigData.tranches.filter((_, i) => i !== idx); setQuickConfigData({ ...quickConfigData, tranches: t }); }}><DeleteIcon fontSize="small" /></IconButton>}</Grid>
              </Grid>
            ))}
            <Grid item xs={12}>
              <Button size="small" startIcon={<AddIcon />} onClick={() => { const n = quickConfigData.tranches.length + 1; setQuickConfigData({ ...quickConfigData, tranches: [...quickConfigData.tranches, { label: `Tranche ${n}`, montant: '', date: '' }] }); }}>Ajouter une tranche</Button>
            </Grid>
            {quickConfigData.scolariteTotal > 0 && (
              <Grid item xs={12}>
                <Alert severity={quickConfigData.tranches.reduce((s, t) => s + Number(t.montant || 0), 0) === Number(quickConfigData.scolariteTotal) ? "success" : "warning"} sx={{ py: 0 }}>
                  {quickConfigData.tranches.reduce((s, t) => s + Number(t.montant || 0), 0).toLocaleString()} / {Number(quickConfigData.scolariteTotal).toLocaleString()}
                </Alert>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQuickConfig(false)}>Annuler</Button>
          <Button variant="contained" color="success" disabled={isConfiguringQuickly || !quickConfigData.classe || quickConfigData.tranches.reduce((s, t) => s + Number(t.montant || 0), 0) !== Number(quickConfigData.scolariteTotal) || quickConfigData.tranches.some(t => !t.date)} onClick={async () => {
            setIsConfiguringQuickly(true);
            try {
              const { classe, inscription, scolariteTotal, tranches } = quickConfigData;
              const promises = [];
              if (Number(inscription) > 0) promises.push(fraisService.create({ classe, libelle: "Frais d'inscription", montant: inscription, obligatoire: true }));
              tranches.forEach(tr => {
                if (Number(tr.montant) > 0) promises.push(fraisService.create({ classe, libelle: tr.label, montant: tr.montant, obligatoire: true, date_echeance: tr.date }));
              });
              await Promise.all(promises);
              const installments = tranches.filter(t => Number(t.montant) > 0).map((t, i) => ({
                order: i + 1, label: t.label, due_date: t.date, amount_due: t.montant,
              }));
              if (installments.length > 0) {
                await classScheduleService.create({ classe, total_amount: scolariteTotal, installments });
              }
              setToast({ open: true, message: 'Frais et échéancier générés.', severity: 'success' }); fetchFrais(); setOpenQuickConfig(false);
            } catch (err) { setToast({ open: true, message: getApiErrorMessage(err, "Erreur"), severity: 'error' }); }
            finally { setIsConfiguringQuickly(false); }
          }}>{isConfiguringQuickly ? <CircularProgress size={20} /> : 'Générer'}</Button>
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

      <PaymentModal
        open={openPaymentModal}
        onClose={() => setOpenPaymentModal(false)}
        onSave={handleCreatePayment}
        form={paymentForm}
        setForm={setPaymentForm}
        formErrors={formErrors}
        submitting={submitting}
        selectedStudent={selectedRow}
      />

      <AddInscriptionModal
        open={openInscriptionModal}
        onClose={() => setOpenInscriptionModal(false)}
        onSave={handleCreateInscription}
        form={inscriptionForm}
        setForm={setInscriptionForm}
        formErrors={formErrors}
        submitting={submitting}
        etudiants={students}
        niveaux={levels}
        anneesAcademiques={academicYears}
      />

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((current) => ({ ...current, open: false }))}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
