'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip,
  DialogTitle, TextField, Select, MenuItem, FormControl, InputLabel, Grid, IconButton, TablePagination,
  Button, Tabs, Tab, CircularProgress, Dialog, DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import { formatDate } from '../../../utils/formatters';
import FlightTakeoffIcon from '@mui/icons-material/FlightTakeoff';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { congesService, demandesService, personnelsService } from '../../../services/api/services';
import { getApiErrorMessage } from '../../../services/api/client';

const initialCongeForm = { date_debut: '', date_fin: '', type_conge: '', raison: '', statut: 'en_attente', personnel_id: '' };

export default function LeavesRequestsPage() {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(true);
  
  const [leaves, setLeaves] = useState([]);
  const [requests, setRequests] = useState([]);
  const [personnels, setPersonnels] = useState([]);
  
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const [leavesPage, setLeavesPage] = useState(0);
  const [leavesRowsPerPage, setLeavesRowsPerPage] = useState(20);
  
  const [requestsPage, setRequestsPage] = useState(0);
  const [requestsRowsPerPage, setRequestsRowsPerPage] = useState(20);

  // Dialog & Form states for Congés
  const [openCongeDialog, setOpenCongeDialog] = useState(false);
  const [isEditingConge, setIsEditingConge] = useState(false);
  const [congeForm, setCongeForm] = useState(initialCongeForm);
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete states
  const [openDelete, setOpenDelete] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [leavesData, requestsData, persData] = await Promise.all([
        congesService.list(),
        demandesService.list(),
        personnelsService.list()
      ]);

      setLeaves(Array.isArray(leavesData) ? leavesData : leavesData?.results || []);
      setRequests(Array.isArray(requestsData) ? requestsData : requestsData?.results || []);
      setPersonnels(Array.isArray(persData) ? persData : persData?.results || []);
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, 'Impossible de charger les données.'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const renderStatus = (status) => {
    let color = 'default';
    const s = String(status).toLowerCase();
    if (s.includes('accept') || s.includes('approuv') || s.includes('valid')) color = 'success';
    else if (s.includes('refus') || s.includes('rejet')) color = 'error';
    else if (s.includes('attente') || s.includes('pend')) color = 'warning';

    const labels = {
      en_attente: 'En attente',
      accepte: 'Accepté',
      refuse: 'Refusé'
    };
    const displayLabel = labels[status] || status || 'En attente';

    return <Chip label={displayLabel} color={color} size="small" />;
  };

  // ----- CONGÉS CRUD -----
  const validateConge = () => {
    const errors = {};
    if (!congeForm.date_debut) errors.date_debut = 'Requis';
    if (!congeForm.date_fin) errors.date_fin = 'Requis';
    if (!congeForm.type_conge.trim()) errors.type_conge = 'Requis';
    if (!congeForm.personnel_id) errors.personnel_id = 'Requis';
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleOpenCongeCreate = () => {
    setIsEditingConge(false);
    setCongeForm(initialCongeForm);
    setFormErrors({});
    setOpenCongeDialog(true);
  };

  const handleEditConge = (leave) => {
    setIsEditingConge(true);
    setCongeForm({
      id: leave.id,
      date_debut: leave.date_debut || '',
      date_fin: leave.date_fin || '',
      type_conge: leave.type_conge || '',
      raison: leave.raison || '',
      statut: leave.statut || 'en_attente',
      personnel_id: leave.personnel?.id || leave.personnel_id || '',
    });
    setFormErrors({});
    setOpenCongeDialog(true);
  };

  const handleDeleteClick = (item, type) => {
    setItemToDelete({ ...item, _type: type });
    setOpenDelete(true);
  };

  const confirmDelete = async () => {
    if (!itemToDelete) return;
    try {
      if (itemToDelete._type === 'conge') {
        await congesService.remove(itemToDelete.id);
        setToast({ open: true, message: 'Congé supprimé.', severity: 'success' });
      }
      fetchData();
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, "Suppression impossible."), severity: 'error' });
    } finally {
      setOpenDelete(false);
      setItemToDelete(null);
    }
  };

  const saveConge = async () => {
    if (!validateConge()) return;
    setSubmitting(true);
    try {
      const payload = {
        date_debut: congeForm.date_debut,
        date_fin: congeForm.date_fin,
        type_conge: congeForm.type_conge,
        raison: congeForm.raison || null,
        statut: congeForm.statut,
        personnel_id: congeForm.personnel_id,
      };

      if (isEditingConge) {
        await congesService.update(congeForm.id, payload);
        setToast({ open: true, message: 'Congé mis à jour.', severity: 'success' });
      } else {
        await congesService.create(payload);
        setToast({ open: true, message: 'Congé ajouté.', severity: 'success' });
      }
      setOpenCongeDialog(false);
      fetchData();
    } catch (error) {
           setToast({ open: true, message: getApiErrorMessage(error, "Action impossible."), severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Congés & Demandes Administratives
        </Typography>
        {tabValue === 0 && (
          <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenCongeCreate}>
            Ajouter un Congé
          </Button>
        )}
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab icon={<FlightTakeoffIcon />} iconPosition="start" label="Congés" />
          <Tab icon={<MailOutlineIcon />} iconPosition="start" label="Demandes" />
        </Tabs>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* TAB 0: CONGÉS */}
          {tabValue === 0 && (
            <>
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                  <TableRow>
                     <TableCell sx={{ fontWeight: 'bold' }}>Personnel (Demandeur)</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date Début</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date Fin</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Type / Raison</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {leaves.slice(leavesPage * leavesRowsPerPage, leavesPage * leavesRowsPerPage + leavesRowsPerPage).map((leave) => (
                    <TableRow key={leave.id} hover>
                      <TableCell sx={{ fontWeight: 500 }}>{leave.personnel?.nom || leave.demandeur?.nom || '-'}</TableCell>
                      <TableCell>{formatDate(leave.date_debut)}</TableCell>
                      <TableCell>{formatDate(leave.date_fin)}</TableCell>
                      <TableCell>
                         <Typography variant="body2">{leave.type_conge || '-'}</Typography>
                         <Typography variant="caption" color="text.secondary">{leave.raison}</Typography>
                      </TableCell>
                      <TableCell>{renderStatus(leave.statut)}</TableCell>
                      <TableCell align="right">
                        <IconButton size="small" color="info" onClick={() => handleEditConge(leave)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton size="small" color="error" onClick={() => handleDeleteClick(leave, 'conge')}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {leaves.length === 0 && (
                    <TableRow><TableCell colSpan={6} align="center" sx={{ py: 3 }}>Aucune demande de congé.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[20, 50, 100]}
              component="div"
              count={leaves.length}
              rowsPerPage={leavesRowsPerPage}
              page={leavesPage}
              onPageChange={(e, newPage) => setLeavesPage(newPage)}
              onRowsPerPageChange={(e) => {
                setLeavesRowsPerPage(parseInt(e.target.value, 10));
                setLeavesPage(0);
              }}
              labelRowsPerPage="Lignes par page:"
            />
          </>
          )}

          {/* TAB 1: DEMANDES */}
          {tabValue === 1 && (
            <>
            <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
              <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Référence</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Date Demande</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Demandeur</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Article / Objet</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {requests.slice(requestsPage * requestsRowsPerPage, requestsPage * requestsRowsPerPage + requestsRowsPerPage).map((req) => (
                    <TableRow key={req.id} hover>
                      <TableCell>{req.reference || '-'}</TableCell>
                      <TableCell>{formatDate(req.date_demande || req.date)}</TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{req.demandeur_nom || req.demandeur_object_id || '-'}</TableCell>
                      <TableCell>{req.article?.nom || req.object || '-'}</TableCell>
                      <TableCell>{renderStatus(req.statut)}</TableCell>
                    </TableRow>
                  ))}
                  {requests.length === 0 && (
                    <TableRow><TableCell colSpan={5} align="center" sx={{ py: 3 }}>Aucune demande administrative.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            <TablePagination
              rowsPerPageOptions={[20, 50, 100]}
              component="div"
              count={requests.length}
              rowsPerPage={requestsRowsPerPage}
              page={requestsPage}
              onPageChange={(e, newPage) => setRequestsPage(newPage)}
              onRowsPerPageChange={(e) => {
                setRequestsRowsPerPage(parseInt(e.target.value, 10));
                setRequestsPage(0);
              }}
              labelRowsPerPage="Lignes par page:"
            />
          </>
          )}
        </>
      )}

      {/* DIALOG CONGÉ */}
      <Dialog open={openCongeDialog} onClose={() => setOpenCongeDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>{isEditingConge ? 'Modifier Congé' : 'Demander un Congé'}</DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
             <Grid item xs={12}>
              <FormControl fullWidth size="small" margin="dense" error={Boolean(formErrors.personnel_id)}>
                <InputLabel>Personnel</InputLabel>
                <Select
                  value={congeForm.personnel_id}
                  label="Personnel"
                  onChange={(e) => {
                    const pId = e.target.value;
                    const p = personnels.find(pers => pers.id === pId);
                    setCongeForm({ ...congeForm, personnel_id: pId });
                    if (p) {
                      if (!p.est_eligible_conges) {
                        setFormErrors(prev => ({ ...prev, personnel_id: `Non éligible (${p.anciennete_annees} an(s) d'ancienneté)` }));
                      } else {
                        setFormErrors(prev => {
                          const newErrors = { ...prev };
                          delete newErrors.personnel_id;
                          return newErrors;
                        });
                      }
                    }
                  }}
                >
                  {personnels.map(p => (
                    <MenuItem key={p.id} value={p.id}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                        <Typography variant="body2">{p.nom} - {p.fonction}</Typography>
                        <Typography variant="caption" sx={{ ml: 2, color: p.est_eligible_conges ? 'success.main' : 'warning.main' }}>
                          {p.solde_conges_restant}j restants
                        </Typography>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.personnel_id && <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>{formErrors.personnel_id}</Typography>}
              </FormControl>
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField fullWidth size="small" margin="dense" type="date" label="Date Début" InputLabelProps={{ shrink: true }}
                 value={congeForm.date_debut} onChange={(e) => setCongeForm({ ...congeForm, date_debut: e.target.value })}
                 error={Boolean(formErrors.date_debut)} helperText={formErrors.date_debut} />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField fullWidth size="small" margin="dense" type="date" label="Date Fin" InputLabelProps={{ shrink: true }}
                 value={congeForm.date_fin} onChange={(e) => setCongeForm({ ...congeForm, date_fin: e.target.value })}
                 error={Boolean(formErrors.date_fin)} helperText={formErrors.date_fin} />
             </Grid>
             <Grid item xs={12} sm={6}>
               <TextField fullWidth size="small" margin="dense" label="Type de congé" 
                 value={congeForm.type_conge} onChange={(e) => setCongeForm({ ...congeForm, type_conge: e.target.value })}
                 error={Boolean(formErrors.type_conge)} helperText={formErrors.type_conge} />
             </Grid>
             <Grid item xs={12} sm={6}>
               <FormControl fullWidth size="small" margin="dense">
                  <InputLabel>Statut</InputLabel>
                  <Select value={congeForm.statut} label="Statut" onChange={(e) => setCongeForm({ ...congeForm, statut: e.target.value })}>
                    <MenuItem value="en_attente">En attente</MenuItem>
                    <MenuItem value="accepte">Accepté</MenuItem>
                    <MenuItem value="refuse">Refusé</MenuItem>
                  </Select>
               </FormControl>
             </Grid>
             <Grid item xs={12}>
               <TextField fullWidth size="small" margin="dense" label="Raison / Motif (Optionnel)" multiline rows={3}
                 value={congeForm.raison} onChange={(e) => setCongeForm({ ...congeForm, raison: e.target.value })} />
             </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setOpenCongeDialog(false)} color="inherit" disabled={submitting}>Annuler</Button>
          <Button variant="contained" onClick={saveConge} disabled={submitting}>
            {submitting ? <CircularProgress size={20} color="inherit" /> : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openDelete} onClose={() => setOpenDelete(false)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>Voulez-vous vraiment supprimer cet élément ?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDelete(false)} color="inherit">Annuler</Button>
          <Button variant="contained" color="error" onClick={confirmDelete}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })} sx={{ width: '100%', boxShadow: 3 }}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
