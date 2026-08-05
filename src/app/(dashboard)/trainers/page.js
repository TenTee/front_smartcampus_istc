'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box, Card, Typography, Button, TextField, InputAdornment, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Dialog,
  DialogTitle, DialogContent, DialogActions, Snackbar, Alert, CircularProgress,
  TablePagination, IconButton, FormControl, InputLabel, Select, MenuItem,
  OutlinedInput, Grid
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import { formateursService, modulesService } from '../../../services/api/services';
import { getApiErrorMessage } from '../../../services/api/client';

const COUNTRY_CODES = [
  { code: '+241', country: 'GA', label: 'Gabon (+241)' },
  { code: '+237', country: 'CM', label: 'Cameroun (+237)' },
  { code: '+242', country: 'CG', label: 'Congo (+242)' },
  { code: '+243', country: 'CD', label: 'RD Congo (+243)' },
  { code: '+240', country: 'GQ', label: 'Guinée Éq. (+240)' },
  { code: '+235', country: 'TD', label: 'Tchad (+235)' },
  { code: '+236', country: 'CF', label: 'Centrafrique (+236)' },
  { code: '+225', country: 'CI', label: "Côte d'Ivoire (+225)" },
  { code: '+221', country: 'SN', label: 'Sénégal (+221)' },
  { code: '+33', country: 'FR', label: 'France (+33)' },
  { code: '+1', country: 'US', label: 'USA/Canada (+1)' },
];

const parseContactWithIndicatif = (contact) => {
  if (!contact) return { indicatif: '+241', numero: '' };
  const sorted = [...COUNTRY_CODES].sort((a, b) => b.code.length - a.code.length);
  for (const cc of sorted) {
    if (contact.startsWith(cc.code)) {
      return { indicatif: cc.code, numero: contact.slice(cc.code.length).trim() };
    }
  }
  return { indicatif: '+241', numero: contact };
};

const initialForm = { nom: '', email: '', contact: '', indicatif: '+241', salaire: '', specialites: [] };

export default function TrainersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [trainers, setTrainers] = useState([]);
  const [modules, setModules] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [openCreate, setOpenCreate] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  const [form, setForm] = useState(initialForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const [openDelete, setOpenDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tData, mData] = await Promise.all([
        formateursService.list(),
        modulesService.list()
      ]);
      setTrainers(Array.isArray(tData) ? tData : tData?.results || []);
      setModules(Array.isArray(mData) ? mData : mData?.results || []);
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, 'Chargement des formateurs impossible.'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredTrainers = useMemo(() => {
    return trainers.filter((trainer) => {
      const name = (trainer.nom || trainer.name || '').toLowerCase();
      const email = (trainer.email || '').toLowerCase();
      const term = searchTerm.toLowerCase();
      return !term || name.includes(term) || email.includes(term);
    });
  }, [trainers, searchTerm]);

  const validateForm = () => {
    const errors = {};
    if (!form.nom.trim()) errors.nom = 'Le nom est requis';
    if (!form.email.trim()) errors.email = "L'email est requis";
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Email invalide';
    if (!form.contact.trim()) errors.contact = 'Le contact est requis';
    if (!form.salaire.toString().trim()) {
      errors.salaire = 'Le salaire est requis';
    } else if (isNaN(form.salaire) || Number(form.salaire) < 0) {
      errors.salaire = 'Doit être positif';
    }
    if (form.specialites.length === 0) errors.specialites = 'Au moins une spécialité est requise';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCreate = () => {
    setIsEditing(false);
    setForm(initialForm);
    setFormErrors({});
    setOpenCreate(true);
  };

  const handleEdit = (trainer) => {
    setIsEditing(true);
    setFormErrors({});

    let specIds = [];
    if (Array.isArray(trainer.specialites)) {
      specIds = typeof trainer.specialites[0] === 'object'
        ? trainer.specialites.map(s => s.id)
        : trainer.specialites;
    }

    const { indicatif, numero } = parseContactWithIndicatif(trainer.contact);

    setForm({
      id: trainer.id,
      nom: trainer.nom || '',
      email: trainer.email || '',
      contact: numero,
      indicatif: indicatif,
      salaire: trainer.salaire || '',
      specialites: specIds,
    });
    setOpenCreate(true);
  };

  const handleDeleteClick = (trainer) => {
    setItemToDelete(trainer);
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      await formateursService.remove(itemToDelete.id);
      setToast({ open: true, message: 'Formateur supprimé avec succès.', severity: 'success' });
      fetchData();
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, "Suppression impossible."), severity: 'error' });
    } finally {
      setOpenDelete(false);
      setItemToDelete(null);
    }
  };

  const handlePhoneChange = (e) => {
    const val = e.target.value;
    if (val === '' || /^[0-9+\s\-]+$/.test(val)) {
      setForm((prev) => ({ ...prev, contact: val }));
    }
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const fullContact = `${form.indicatif} ${form.contact}`.trim();
      const payload = {
        nom: form.nom,
        email: form.email,
        contact: fullContact,
        salaire: String(form.salaire),
        specialites: form.specialites
      };

      if (isEditing) {
        await formateursService.update(form.id, payload);
        setToast({ open: true, message: 'Formateur mis à jour.', severity: 'success' });
      } else {
        await formateursService.create(payload);
        setToast({ open: true, message: 'Formateur ajouté avec succès.', severity: 'success' });
      }
      setOpenCreate(false);
      fetchData();
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, "Erreur lors de l'enregistrement."), severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">Liste des formateurs</Typography>
        <Button variant="contained" color="primary" startIcon={<AddIcon />} sx={{ borderRadius: 2 }} onClick={handleOpenCreate}>
          Ajouter un formateur
        </Button>
      </Box>

      <Card sx={{ mb: 3, p: 2, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <TextField
          fullWidth size="small" placeholder="Rechercher un formateur..." value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{ startAdornment: (<InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>), sx: { borderRadius: 2, maxWidth: 400 } }}
        />
      </Card>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#F5F7FA' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Nom complet</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Contact</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Spécialité(s)</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Salaire</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 4 }}><CircularProgress size={24} /></TableCell></TableRow>
            ) : filteredTrainers.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((trainer) => (
              <TableRow key={trainer.id} hover>
                <TableCell sx={{ fontWeight: 500 }}>{trainer.nom || '-'}</TableCell>
                <TableCell>{trainer.email}</TableCell>
                <TableCell>
                  {trainer.contact ? (
                    <a href={`tel:${trainer.contact.replace(/\s/g, '')}`} style={{ textDecoration: 'none', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <PhoneIcon sx={{ fontSize: 16 }} />
                      {trainer.contact}
                    </a>
                  ) : '-'}
                </TableCell>
                <TableCell>
                  {Array.isArray(trainer.specialites) && trainer.specialites.length > 0 ? (
                     trainer.specialites.map((spec, i) => {
                       const moduleName = typeof spec === 'object' ? spec.nom : modules.find(m => m.id === spec)?.nom || spec;
                       return <Chip key={i} label={moduleName} size="small" sx={{ mr: 0.5, mb: 0.5 }} />;
                     })
                  ) : '-'}
                </TableCell>
                <TableCell>{trainer.salaire ? `${trainer.salaire} Fcfa` : '-'}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" color="info" onClick={() => handleEdit(trainer)}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDeleteClick(trainer)}>
                    <DeleteIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {!loading && filteredTrainers.length === 0 && (
              <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Aucun formateur trouvé.</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[20, 50, 100]}
        component="div"
        count={filteredTrainers.length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={(e, newPage) => setPage(newPage)}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        labelRowsPerPage="Lignes par page :"
      />

      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditing ? 'Modifier le formateur' : 'Ajouter un formateur'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField margin="dense" size="small" fullWidth label="Nom complet" value={form.nom} onChange={(e) => setForm({ ...form, nom: e.target.value })} error={Boolean(formErrors.nom)} helperText={formErrors.nom} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField margin="dense" size="small" fullWidth label="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={Boolean(formErrors.email)} helperText={formErrors.email} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                <FormControl size="small" margin="dense" sx={{ minWidth: 140 }}>
                  <Select
                    value={form.indicatif}
                    onChange={(e) => setForm({ ...form, indicatif: e.target.value })}
                  >
                    {COUNTRY_CODES.map((cc) => (
                      <MenuItem key={cc.code} value={cc.code}>{cc.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField margin="dense" size="small" fullWidth label="Numéro" value={form.contact} onChange={handlePhoneChange} error={Boolean(formErrors.contact)} helperText={formErrors.contact || "Ex: 07 12 34 56"} placeholder="07 12 34 56" />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField margin="dense" size="small" fullWidth label="Salaire" type="number" value={form.salaire} onChange={(e) => setForm({ ...form, salaire: e.target.value })} error={Boolean(formErrors.salaire)} helperText={formErrors.salaire} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" margin="dense" error={Boolean(formErrors.specialites)}>
                <InputLabel>Spécialités</InputLabel>
                <Select
                  multiple
                  value={form.specialites}
                  onChange={(e) => setForm({ ...form, specialites: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value })}
                  input={<OutlinedInput label="Spécialités" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={modules.find(m => m.id === value)?.nom || value} size="small" />
                      ))}
                    </Box>
                  )}
                >
                  {modules.map((mod) => (
                    <MenuItem key={mod.id} value={mod.id}>{mod.nom}</MenuItem>
                  ))}
                </Select>
                {formErrors.specialites && <Typography variant="caption" color="error">{formErrors.specialites}</Typography>}
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenCreate(false)} color="inherit" disabled={submitting}>Annuler</Button>
          <Button variant="contained" onClick={handleSave} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
      
      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>Voulez-vous vraiment supprimer le formateur <strong>{itemToDelete?.nom}</strong> ?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} color="inherit">Annuler</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((prev) => ({ ...prev, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast((prev) => ({ ...prev, open: false }))} sx={{ width: '100%', boxShadow: 3 }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
