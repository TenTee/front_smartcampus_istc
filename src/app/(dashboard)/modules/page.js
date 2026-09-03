'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  FormControlLabel,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Search as SearchIcon } from '@mui/icons-material';
import { classesService, modulesService } from '../../../services/api/services';
import { getApiErrorMessage } from '../../../services/api/client';
import { useUserPermissions } from '../../../utils/permissions';

function toList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

export default function ModulesPage() {
  const { canWrite } = useUserPermissions();
  const canWritePedagogie = canWrite('can_manage_pedagogie');
  const [modules, setModules] = useState([]);
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState('add');
  const [selectedModule, setSelectedModule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [moduleToDelete, setModuleToDelete] = useState(null);
  const [formData, setFormData] = useState({
    nom: '',
    duree: '',
    coefficient: '',
    semestre: 'Semestre 1',
    classe: [],
  });

  const loadModules = async () => {
    setLoading(true);
    setError('');
    try {
      const [modulesResponse, classesResponse] = await Promise.all([
        modulesService.list(),
        classesService.list(),
      ]);
      setModules(toList(modulesResponse));
      setClasses(toList(classesResponse));
    } catch (err) {
      setError(getApiErrorMessage(err, 'Chargement des cours impossible.'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadModules();
  }, []);

  const filteredModules = useMemo(() => {
    const needle = searchTerm.toLowerCase();
    return modules.filter((item) => {
      const classNames = (item.attributions || []).map((a) => a.classe_nom || a.niveau_nom).join(' ').toLowerCase();
      return (item.nom || '').toLowerCase().includes(needle) || classNames.includes(needle);
    });
  }, [modules, searchTerm]);

  const handleOpenDialog = (module = null) => {
    if (module) {
      setDialogMode('edit');
      setSelectedModule(module);
      setFormData({
        nom: module.nom || '',
        duree: module.duree || '',
        coefficient: module.coefficient || '',
        semestre: module.semestre || 'Semestre 1',
        classe: (module.attributions || []).filter((a) => a.classe_id).map((a) => a.classe_id),
      });
    } else {
      setDialogMode('add');
      setSelectedModule(null);
      setFormData({
        nom: '',
        duree: '',
        coefficient: '',
        semestre: 'Semestre 1',
        classe: [],
      });
    }
    setOpenDialog(true);
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

  };
  

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        nom: formData.nom.trim(),
        duree: Number(formData.duree || 0),
        coefficient: Number(formData.coefficient || 1),
        semestre: formData.semestre || 'Semestre 1',
        classe: formData.classe || [],
      };

      if (dialogMode === 'add') {
        await modulesService.create(payload);
      } else {
        await modulesService.update(selectedModule.id, payload);
      }
      setOpenDialog(false);
      await loadModules();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de l’enregistrement.'));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    try {
      await modulesService.remove(moduleToDelete.id);
      setOpenDeleteDialog(false);
      await loadModules();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de la suppression.'));
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Cours et modules
        </Typography>
        {canWritePedagogie && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
            Nouveau cours
          </Button>
        )}
      </Box>

      <Card sx={{ mb: 3, p: 2, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Rechercher un cours ou une formation..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            ),
            sx: { borderRadius: 2, maxWidth: 420 },
          }}
        />
      </Card>

      <Paper sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F5F7FA' }}>
            <TableRow>
              <TableCell>Nom</TableCell>
              <TableCell>Durée</TableCell>
              <TableCell>Coefficient</TableCell>
              <TableCell>Semestre</TableCell>
              <TableCell>Classes liées</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            )}
            {!loading && error && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Alert severity="error">{error}</Alert>
                </TableCell>
              </TableRow>
            )}
            {!loading && !error && filteredModules.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
              <TableRow key={item.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{item.nom || '-'}</TableCell>
                <TableCell>{item.duree ? `${item.duree} h` : '-'}</TableCell>
                <TableCell>{item.coefficient || '-'}</TableCell>
                <TableCell>{item.semestre || '-'}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {(item.attributions || []).length > 0
                      ? item.attributions.map((att, idx) => (
                        <Chip key={idx} label={att.classe_nom || `${att.filiere_nom} - ${att.niveau_nom}`} size="small" variant="outlined" />
                      ))
                      : <Typography variant="body2" color="text.secondary">Aucun</Typography>}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  {canWritePedagogie && (
                    <IconButton color="primary" onClick={() => handleOpenDialog(item)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  )}
                  {canWritePedagogie && (
                    <IconButton color="error" onClick={() => { setModuleToDelete(item); setOpenDeleteDialog(true); }}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {!loading && !error && filteredModules.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                  Aucun cours trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {filteredModules.length > 0 && (
        <TablePagination
          rowsPerPageOptions={[20, 50, 100]}
          component="div"
          count={filteredModules.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
          labelRowsPerPage="Lignes par page :"
        />
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === 'add' ? 'Ajouter un cours' : 'Modifier le cours'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField fullWidth label="Nom du cours" name="nom" value={formData.nom} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Classes rattachées</InputLabel>
                <Select
                  multiple
                  name="classe"
                  value={formData.classe || []}
                  onChange={handleInputChange}
                  label="Classes rattachées"
                  renderValue={(selected) =>
                    classes
                      .filter((c) => selected.includes(c.id))
                      .map((c) => c.nom)
                      .join(', ')
                  }
                >
                  {classes.map((c) => (
                    <MenuItem key={c.id} value={c.id}>
                      {c.nom}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Durée (heures)" name="duree" type="number" value={formData.duree} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField fullWidth label="Coefficient" name="coefficient" type="number" value={formData.coefficient} onChange={handleInputChange} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Semestre</InputLabel>
                <Select
                  label="Semestre"
                  name="semestre"
                  value={formData.semestre}
                  onChange={handleInputChange}
                >
                  <MenuItem value="Semestre 1">Semestre 1</MenuItem>
                  <MenuItem value="Semestre 2">Semestre 2</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit" disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving || !formData.nom.trim()}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer le cours &quot;{moduleToDelete?.nom}&quot; ?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)} color="inherit">Annuler</Button>
          <Button onClick={confirmDelete} color="error" variant="contained">Supprimer</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
