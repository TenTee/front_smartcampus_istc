'use client';

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, CircularProgress, Snackbar, Alert, IconButton, Button, TextField, Dialog,
  DialogTitle, DialogContent, DialogActions, Grid
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import { cycleGlobalsService, parametresGlobauxService } from '../../services/api/services';
import { getApiErrorMessage } from '../../services/api/client';

export default function ParametresGlobaux() {
  const [loading, setLoading] = useState(true);
  const [cycleGlobals, setCycleGlobals] = useState([]);
  const [parametres, setParametres] = useState({ pourcentage_cc: 30, pourcentage_sn: 70 });
  const [toast, setToast] = useState({ open: false, message: '', severity: 'info' });

  const [openCycleDialog, setOpenCycleDialog] = useState(false);
  const [isEditingCycle, setIsEditingCycle] = useState(false);
  const [selectedCycleId, setSelectedCycleId] = useState(null);
  const [newCycle, setNewCycle] = useState({ nom: '', code: '', heure_pause_debut: '12:00', heure_pause_fin: '13:00', heure_debut_journee: '08:00', heure_fin_journee: '18:00' });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [cycleGlobalsData, paramsData] = await Promise.all([
        cycleGlobalsService.list(),
        parametresGlobauxService.list(),
      ]);
      setCycleGlobals(Array.isArray(cycleGlobalsData) ? cycleGlobalsData : cycleGlobalsData?.results || []);
      const p = Array.isArray(paramsData) ? paramsData[0] : paramsData?.results?.[0] || paramsData;
      if (p) setParametres(p);
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, 'Impossible de charger les données.'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleOpenCycleDialog = (cycle = null) => {
    if (cycle) {
      setIsEditingCycle(true);
      setSelectedCycleId(cycle.id);
      setNewCycle({
        nom: cycle.nom || '',
        code: cycle.code || '',
        heure_pause_debut: cycle.heure_pause_debut?.slice(0, 5) || '12:00',
        heure_pause_fin: cycle.heure_pause_fin?.slice(0, 5) || '13:00',
        heure_debut_journee: cycle.heure_debut_journee?.slice(0, 5) || '08:00',
        heure_fin_journee: cycle.heure_fin_journee?.slice(0, 5) || '18:00'
      });
    } else {
      setIsEditingCycle(false);
      setSelectedCycleId(null);
      setNewCycle({ nom: '', code: '', heure_pause_debut: '12:00', heure_pause_fin: '13:00', heure_debut_journee: '08:00', heure_fin_journee: '18:00' });
    }
    setOpenCycleDialog(true);
  };

  const handleSaveCycle = async () => {
    if (!newCycle.nom) return;
    try {
      if (isEditingCycle) {
        await cycleGlobalsService.update(selectedCycleId, newCycle);
        setToast({ open: true, message: 'Cycle mis à jour.', severity: 'success' });
      } else {
        await cycleGlobalsService.create(newCycle);
        setToast({ open: true, message: 'Cycle ajouté.', severity: 'success' });
      }
      setOpenCycleDialog(false);
      fetchData();
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, "Erreur d'enregistrement."), severity: 'error' });
    }
  };

  const handleDeleteCycle = async (id) => {
    if (!window.confirm('Supprimer ce cycle ?')) return;
    try {
      await cycleGlobalsService.remove(id);
      setToast({ open: true, message: 'Cycle supprimé.', severity: 'success' });
      fetchData();
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, 'Erreur lors de la suppression.'), severity: 'error' });
    }
  };

  const handleUpdateParams = async () => {
    try {
      if (parametres.pourcentage_cc + parametres.pourcentage_sn !== 100) {
        setToast({ open: true, message: 'La somme doit être 100%.', severity: 'warning' });
        return;
      }
      await parametresGlobauxService.updateStats(parametres);
      setToast({ open: true, message: 'Paramètres mis à jour.', severity: 'success' });
      fetchData();
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, 'Erreur lors de la mise à jour.'), severity: 'error' });
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Grid container spacing={4}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
              <Typography variant="h6" fontWeight="bold">Cycles Globaux</Typography>
              <Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => handleOpenCycleDialog()}>
                Nouveau
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold' }}>Nom</TableCell>
                    <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {cycleGlobals.map((cycle) => (
                    <TableRow key={cycle.id}>
                      <TableCell>{cycle.nom}</TableCell>
                      <TableCell>{cycle.code}</TableCell>
                      <TableCell align="right">
                        <IconButton color="primary" size="small" onClick={() => handleOpenCycleDialog(cycle)}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton color="error" size="small" onClick={() => handleDeleteCycle(cycle.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                  {cycleGlobals.length === 0 && (
                    <TableRow><TableCell colSpan={3} align="center">Aucun cycle défini.</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Calcul des Notes</Typography>
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth label="Pourcentage CC (%)" type="number" margin="normal"
                value={parametres.pourcentage_cc}
                onChange={(e) => setParametres({ ...parametres, pourcentage_cc: parseInt(e.target.value) })}
              />
              <TextField
                fullWidth label="Pourcentage SN (%)" type="number" margin="normal"
                value={parametres.pourcentage_sn}
                onChange={(e) => setParametres({ ...parametres, pourcentage_sn: parseInt(e.target.value) })}
              />
              <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleUpdateParams}>
                Mettre à jour les coefficients
              </Button>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                La somme de CC et SN doit être égale à 100%.
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Dialog open={openCycleDialog} onClose={() => setOpenCycleDialog(false)}>
        <DialogTitle>{isEditingCycle ? 'Modifier le Cycle' : 'Ajouter un Cycle Global'}</DialogTitle>
        <DialogContent dividers>
          <TextField autoFocus margin="dense" label="Nom du cycle (ex: Licence)" fullWidth
            value={newCycle.nom} onChange={(e) => setNewCycle({ ...newCycle, nom: e.target.value })} />
          <TextField margin="dense" label="Code (ex: LIC)" fullWidth
            value={newCycle.code} onChange={(e) => setNewCycle({ ...newCycle, code: e.target.value })} />
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <TextField label="Début Pause" type="time" fullWidth InputLabelProps={{ shrink: true }}
              value={newCycle.heure_pause_debut || '12:00'}
              onChange={(e) => setNewCycle({ ...newCycle, heure_pause_debut: e.target.value })} />
            <TextField label="Fin Pause" type="time" fullWidth InputLabelProps={{ shrink: true }}
              value={newCycle.heure_pause_fin || '13:00'}
              onChange={(e) => setNewCycle({ ...newCycle, heure_pause_fin: e.target.value })} />
          </Box>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <TextField label="Début Journée" type="time" fullWidth InputLabelProps={{ shrink: true }}
              value={newCycle.heure_debut_journee || '08:00'}
              onChange={(e) => setNewCycle({ ...newCycle, heure_debut_journee: e.target.value })} />
            <TextField label="Fin Journée" type="time" fullWidth InputLabelProps={{ shrink: true }}
              value={newCycle.heure_fin_journee || '18:00'}
              onChange={(e) => setNewCycle({ ...newCycle, heure_fin_journee: e.target.value })} />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenCycleDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleSaveCycle}>
            {isEditingCycle ? 'Mettre à jour' : 'Ajouter'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
