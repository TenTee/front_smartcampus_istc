'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Snackbar,
  Alert,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Business as UniversityIcon,
  AccountTree as DepartmentIcon,
  School as FiliereIcon,
  DateRange as YearIcon,
  Class as ClassIcon,
  Layers as LevelIcon,
  Loop as CycleIcon,
  MeetingRoom as RoomIcon,
} from '@mui/icons-material';
import {
  anneesAcademiquesService,
  classesService,
  cyclesService,
  domainesService,
  facultesService,
  filieresV2Service,
  levelsV2Service,
  semestresService,
  cycleGlobalsService,
  sallesService,
} from '../../../services/api/services';
import { getApiErrorMessage } from '../../../services/api/client';
import { useUserPermissions } from '../../../utils/permissions';

function toList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

export default function PedagogyPage() {
  const { canWrite } = useUserPermissions();
  const canWritePedagogie = canWrite('can_manage_pedagogie');
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [selectedItem, setSelectedItem] = useState(null);
  
  // Dependency data for selects
  const [universities, setUniversities] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [cycles, setCycles] = useState([]);
  const [levels, setLevels] = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [cycleGlobals, setCycleGlobals] = useState([]);

  const [formData, setFormData] = useState({});
// Tabs: 0=Universités, 1=Départements, 2=Filières, 3=Niveaux(auto), 4=Classes(auto), 5=Années Académiques, 6=Salles
  // Niveaux (3) et Classes (4) sont créés automatiquement lors de la création d'une filière
  const canAdd = ![3, 4].includes(tabValue);
  const tabs = [
    { label: 'Universités', icon: <UniversityIcon fontSize="small" />, service: facultesService },
    { label: 'Départements', icon: <DepartmentIcon fontSize="small" />, service: domainesService },
    { label: 'Filières', icon: <FiliereIcon fontSize="small" />, service: filieresV2Service },
    { label: 'Niveaux', icon: <LevelIcon fontSize="small" />, service: levelsV2Service },
    { label: 'Classes', icon: <ClassIcon fontSize="small" />, service: classesService },
    { label: 'Années Académiques', icon: <YearIcon fontSize="small" />, service: anneesAcademiquesService },
    { label: 'Salles', icon: <RoomIcon fontSize="small" />, service: sallesService },
  ];

  const fetchDependencyData = async () => {
    try {
      const [univs, depts, fils, cycs, lvls, years, cycleGlobalsData] = await Promise.all([
        facultesService.list(),
        domainesService.list(),
        filieresV2Service.list(),
        cyclesService.list(),
        levelsV2Service.list(),
        anneesAcademiquesService.list(),
        cycleGlobalsService.list(),
      ]);
      setUniversities(toList(univs));
      setDepartments(toList(depts));
      setFilieres(toList(fils));
      setCycles(toList(cycs));
      setLevels(toList(lvls));
      setAcademicYears(toList(years));
      setCycleGlobals(toList(cycleGlobalsData));
    } catch (error) {
      console.error("Error fetching dependency data:", error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const currentTab = tabs[tabValue];
      const res = await currentTab.service.list();
      setData(toList(res));
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, 'Impossible de charger les données.'),
        severity: 'error',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchDependencyData();
  }, [tabValue]);

  const handleOpenDialog = (item = null) => {
    if (item) {
      setDialogMode('edit');
      setSelectedItem(item);
      setFormData(item);
    } else {
      setDialogMode('add');
      setSelectedItem(null);
      setFormData({});
    }
    setOpenDialog(true);
  };

const handleSave = async () => {
    try {
      const currentTab = tabs[tabValue];
      if (dialogMode === 'add') {
        if (tabValue === 2) {
          // Création filière : le backend crée automatiquement Cycle + Niveaux + Classes
          // Le payload doit contenir : departement, nom, type_cycle (id CycleGlobal), nombre_niveaux
          const filiereRes = await filieresV2Service.create(formData);
          const filiereData = filiereRes?.id ? filiereRes : filiereRes?.data || filiereRes;

          // Basculer vers l'onglet Classes (index 4) pour montrer les classes auto-créées
          const classesRes = await classesService.list({ filiere: filiereData.id });
          const classesList = Array.isArray(classesRes) ? classesRes : classesRes?.results || [];
          setTabValue(4); // ← onglet Classes
          setData(classesList);

          const nb = formData.nombre_niveaux || 0;
          const cycleNom = cycleGlobals.find(c => c.id === formData.type_cycle)?.nom || 'cycle';
          setToast({
            open: true,
            message: `Filière créée avec succès ! ${nb} niveau(x) et ${classesList.length} classe(s) ${cycleNom} générés automatiquement.`,
            severity: 'success',
          });
        } else {
          await currentTab.service.create(formData);
          setToast({ open: true, message: 'Création réussie.', severity: 'success' });
        }
      } else {
        await currentTab.service.update(selectedItem.id, formData);
        setToast({ open: true, message: 'Modification réussie.', severity: 'success' });
      }
      setOpenDialog(false);
      fetchData();
      fetchDependencyData();
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, "Erreur lors de l'enregistrement."),
        severity: 'error',
      });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cet élément ?')) return;
    try {
      const currentTab = tabs[tabValue];
      await currentTab.service.remove(id);
      setToast({ open: true, message: 'Suppression réussie.', severity: 'success' });
      fetchData();
      fetchDependencyData();
    } catch (error) {
      setToast({
        open: true,
        message: getApiErrorMessage(error, 'Erreur lors de la suppression.'),
        severity: 'error',
      });
    }
  };
  

  const renderFormFields = () => {
    switch (tabValue) {
      case 0: // Universités
        return (
          <>
            <TextField fullWidth margin="dense" label="Nom" value={formData.nom || ''} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
            <TextField fullWidth margin="dense" label="Code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            <TextField fullWidth multiline rows={3} margin="dense" label="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </>
        );
      case 1: // Départements
        return (
          <>
            <TextField select fullWidth margin="dense" label="Université" value={formData.universite_tutelle || ''} onChange={(e) => setFormData({ ...formData, universite_tutelle: e.target.value })}>
              {universities.map((u) => <MenuItem key={u.id} value={u.id}>{u.nom}</MenuItem>)}
            </TextField>
            <TextField fullWidth margin="dense" label="Nom" value={formData.nom || ''} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
            <TextField fullWidth margin="dense" label="Code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
          </>
        );
      case 2: // Filières — crée automatiquement Cycle + Niveaux + Classes
        return (
          <>
            <Alert severity="info" sx={{ mb: 1, fontSize: '0.82rem' }}>
              En créant une filière avec un type de cycle et un nombre de niveaux, les <strong>niveaux</strong> et <strong>classes</strong> correspondants seront générés <strong>automatiquement</strong>.<br />
              Ex : Filière &quot;Informatique&quot; + Cycle &quot;Licence&quot; + 3 niveaux → classes <em>Informatique Licence 1</em>, <em>Informatique Licence 2</em>, <em>Informatique Licence 3</em>.
            </Alert>
            <TextField select fullWidth margin="dense" label="Département" value={formData.departement || ''} onChange={(e) => setFormData({ ...formData, departement: e.target.value })}>
              {departments.map((d) => <MenuItem key={d.id} value={d.id}>{d.nom}</MenuItem>)}
            </TextField>
            <TextField select fullWidth margin="dense" label="Type de Cycle (ex: Licence, BTS, Master)" value={formData.type_cycle || ''} onChange={(e) => {
              const cg = cycleGlobals.find(c => c.id === e.target.value);
              setFormData({ ...formData, type_cycle: e.target.value, _cycleNom: cg?.nom || '' });
            }}>
              {cycleGlobals.map((cg) => <MenuItem key={cg.id} value={cg.id}>{cg.nom}</MenuItem>)}
            </TextField>
            <TextField
              fullWidth margin="dense" type="number"
              label="Nombre de niveaux (ex: 3 pour Licence 1, 2, 3)"
              inputProps={{ min: 1, max: 10 }}
              value={formData.nombre_niveaux || ''}
              onChange={(e) => setFormData({ ...formData, nombre_niveaux: Number(e.target.value) })}
            />
            <TextField fullWidth margin="dense" label="Nom de la filière (ex: Informatique)" value={formData.nom || ''} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
            <TextField fullWidth margin="dense" label="Code" value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} />
            <TextField fullWidth margin="dense" label="Nom du responsable" value={formData.responsable_nom || ''} onChange={(e) => setFormData({ ...formData, responsable_nom: e.target.value })} />
          </>
        );
      // case 3 (Niveaux) et case 4 (Classes) : lecture seule, pas de formulaire d'ajout
      case 5: // Années Académiques
        return (
          <>
            <TextField fullWidth margin="dense" label="Libellé (ex: 2024-2025)" value={formData.libelle || ''} onChange={(e) => setFormData({ ...formData, libelle: e.target.value })} />
            <TextField fullWidth margin="dense" type="date" InputLabelProps={{ shrink: true }} label="Date Début" value={formData.date_debut || ''} onChange={(e) => setFormData({ ...formData, date_debut: e.target.value })} />
            <TextField fullWidth margin="dense" type="date" InputLabelProps={{ shrink: true }} label="Date Fin" value={formData.date_fin || ''} onChange={(e) => setFormData({ ...formData, date_fin: e.target.value })} />
            <TextField select fullWidth margin="dense" label="Est Active" value={formData.est_active === undefined ? false : formData.est_active} onChange={(e) => setFormData({ ...formData, est_active: e.target.value })}>
              <MenuItem value={true}>Oui</MenuItem>
              <MenuItem value={false}>Non</MenuItem>
            </TextField>
          </>
        );
      case 6: // Salles
        return (
          <>
            <TextField fullWidth required margin="dense" label="Nom de la salle" value={formData.nom || ''} onChange={(e) => setFormData({ ...formData, nom: e.target.value })} />
            <TextField fullWidth margin="dense" type="number" label="Capacité (optionnel)" value={formData.capacite || ''} onChange={(e) => setFormData({ ...formData, capacite: e.target.value ? Number(e.target.value) : '' })} />
            <TextField fullWidth multiline rows={3} margin="dense" label="Description" value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          </>
        );
      default:
        return null;
    }
  };

  const getTableColumns = () => {
    switch (tabValue) {
      case 0: return [ 'Nom', 'Code', 'Actions'];
      case 1: return [ 'Université', 'Nom', 'Code', 'Actions'];
      case 2: return [ 'Département', 'Cycle', 'Nom', 'Nb Niveaux', 'Code', 'Responsable', 'Actions'];
      case 3: return [ 'Filière', 'Cycle', 'Nom', 'Ordre'];
      case 4: return [ 'Nom de la classe', 'Filière', 'Cycle', 'Niveau', 'Année'];
      case 5: return [ 'Libellé', 'Début', 'Fin', 'Active', 'Actions'];
      case 6: return [ 'Nom de la salle', 'Capacité', 'Description', 'Actions'];
      default: return [];
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Structure Académique
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {(tabValue === 3 || tabValue === 4) && (
            <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
              {tabValue === 3 ? '🔒 Niveaux générés automatiquement via les filières' : '🔒 Classes générées automatiquement via les filières'}
            </Typography>
          )}
          {canWritePedagogie && canAdd && (
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
              Ajouter
            </Button>
          )}
        </Box>
      </Box>

      <Paper sx={{ mb: 3, borderRadius: 3, overflow: 'hidden' }}>
        <Tabs
          value={tabValue}
          onChange={(e, v) => setTabValue(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'white' }}
        >
          {tabs.map((tab, index) => (
            <Tab key={index} icon={tab.icon} iconPosition="start" label={tab.label} sx={{ textTransform: 'none', minHeight: 60 }} />
          ))}
        </Tabs>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F5F7FA' }}>
            <TableRow>
              {getTableColumns().map((col) => (
                <TableCell key={col} sx={{ fontWeight: 'bold' }}>{col}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={10} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 5 }}>
                  {tabValue === 3
                    ? 'Aucun niveau trouvé. Les niveaux sont créés automatiquement lors de la création d\'une filière.'
                    : tabValue === 4
                    ? 'Aucune classe trouvée. Les classes sont créées automatiquement lors de la création d\'une filière.'
                    : 'Aucun élément trouvé.'}
                </TableCell>
              </TableRow>
            ) : data.map((item) => (
              <TableRow key={item.id} hover>
   
                {tabValue === 0 && (
                  <>
                    <TableCell sx={{ fontWeight: 500 }}>{item.nom}</TableCell>
                    <TableCell>{item.code}</TableCell>
                  </>
                )}
                {tabValue === 1 && (
                  <>
                    <TableCell>{item.universite_tutelle_nom || item.universite_tutelle?.nom || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{item.nom}</TableCell>
                    <TableCell>{item.code}</TableCell>
                  </>
                )}
                {tabValue === 2 && (
                  <>
                    <TableCell>{item.departement_nom || item.departement?.nom || '-'}</TableCell>
                    <TableCell>{item.cycle_nom || item.cycle?.nom || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{item.nom}</TableCell>
                    <TableCell>
                      <Chip label={item.nombre_niveaux ?? '-'} size="small" color="primary" variant="outlined" />
                    </TableCell>
                    <TableCell>{item.code}</TableCell>
                    <TableCell>{item.responsable_nom || '-'}</TableCell>
                  </>
                )}
                {/* Niveaux (tab 3) — lecture seule, créés automatiquement */}
                {tabValue === 3 && (
                  <>
                    <TableCell>{item.filiere_nom || '-'}</TableCell>
                    <TableCell>{item.cycle_nom || '-'}</TableCell>
                    <TableCell sx={{ fontWeight: 500 }}>{item.nom}</TableCell>
                    <TableCell>{item.ordre}</TableCell>
                  </>
                )}
                {/* Classes (tab 4) — lecture seule, créées automatiquement */}
                {tabValue === 4 && (
                  <>
                    <TableCell sx={{ fontWeight: 600, color: 'primary.main' }}>{item.nom}</TableCell>
                    <TableCell>{item.filiere_nom || item.filiere?.nom || '-'}</TableCell>
                    <TableCell>{item.cycle_nom || item.cycle?.nom || '-'}</TableCell>
                    <TableCell>{item.niveau_nom || item.niveau?.nom || '-'}</TableCell>
                    <TableCell>{item.annee_academique_libelle || item.annee_academique?.libelle || '-'}</TableCell>
                  </>
                )}
                {tabValue === 5 && (
                  <>
                    <TableCell sx={{ fontWeight: 500 }}>{item.libelle}</TableCell>
                    <TableCell>{item.date_debut || '-'}</TableCell>
                    <TableCell>{item.date_fin || '-'}</TableCell>
                    <TableCell>
                      <Chip label={item.est_active ? 'Active' : 'Inactive'} color={item.est_active ? 'success' : 'default'} size="small" />
                    </TableCell>
                  </>
                )}
                {tabValue === 6 && (
                  <>
                    <TableCell sx={{ fontWeight: 500 }}>{item.nom}</TableCell>
                    <TableCell>{item.capacite || '-'}</TableCell>
                    <TableCell>{item.description || '-'}</TableCell>
                  </>
                )}
                {/* Boutons Actions : masqués pour Niveaux et Classes (auto-gérés) */}
                {![3, 4].includes(tabValue) && canWritePedagogie && (
                  <TableCell align="right">
                    <IconButton color="primary" size="small" onClick={() => handleOpenDialog(item)}><EditIcon fontSize="small" /></IconButton>
                    <IconButton color="error" size="small" onClick={() => handleDelete(item.id)}><DeleteIcon fontSize="small" /></IconButton>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{dialogMode === 'add' ? 'Ajouter' : 'Modifier'} - {tabs[tabValue].label}</DialogTitle>
        <DialogContent dividers>
          {renderFormFields()}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSave}>Enregistrer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} sx={{ width: '100%' }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
