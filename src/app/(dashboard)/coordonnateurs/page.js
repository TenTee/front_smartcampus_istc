'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { vacationsService, formateursService, filieresV2Service } from '../../../services/api/services';
import { getApiErrorMessage } from '../../../services/api/client';
import { useUserPermissions } from '../../../utils/permissions';
import { toList, todayIso } from '../../../components/vacations/common';

export default function CoordonnateursPage() {
  const { canWrite } = useUserPermissions();
  const canEdit = canWrite('can_manage_pedagogie');

  const [coordinations, setCoordinations] = useState([]);
  const [formateurs, setFormateurs] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ formateur: '', filiere: '', date_debut: todayIso() });
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const notify = (message, severity = 'success') => setToast({ open: true, message, severity });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [c, f, fil] = await Promise.all([
        vacationsService.coordinations.list(),
        formateursService.list(),
        filieresV2Service.list(),
      ]);
      setCoordinations(toList(c));
      setFormateurs(toList(f));
      setFilieres(toList(fil));
    } catch (e) {
      notify(getApiErrorMessage(e, 'Chargement impossible.'), 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const submit = async () => {
    if (!form.formateur || !form.filiere) {
      notify('Choisissez un formateur et une filière.', 'warning');
      return;
    }
    setSaving(true);
    try {
      await vacationsService.coordinations.create(form);
      notify('Coordonnateur attribué.');
      setOpen(false);
      load();
    } catch (e) {
      notify(getApiErrorMessage(e, "Erreur lors de l'attribution."), 'error');
    } finally {
      setSaving(false);
    }
  };

  const toggle = async (c) => {
    try {
      await vacationsService.coordinations.patch(c.id, { est_active: !c.est_active });
      load();
    } catch (e) {
      notify(getApiErrorMessage(e, 'Modification impossible.'), 'error');
    }
  };

  const remove = async (c) => {
    if (!window.confirm(`Retirer ${c.formateur_nom} de la coordination de ${c.filiere_nom} ?`)) return;
    try {
      await vacationsService.coordinations.remove(c.id);
      notify('Coordination supprimée.');
      load();
    } catch (e) {
      notify(getApiErrorMessage(e, 'Suppression impossible.'), 'error');
    }
  };

  const filieresSansCoord = filieres.filter((f) => !coordinations.some((c) => c.filiere === f.id && c.est_active));

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Coordonnateurs de filière</Typography>
          <Typography variant="body2" color="text.secondary">
            Le coordonnateur pointe les présences des enseignants de sa filière depuis son portail formateur et clôture le récapitulatif mensuel des heures.
          </Typography>
        </Box>
        {canEdit && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setForm({ formateur: '', filiere: '', date_debut: todayIso() }); setOpen(true); }}>
            Attribuer un coordonnateur
          </Button>
        )}
      </Box>

      {!loading && filieresSansCoord.length > 0 && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Filière(s) sans coordonnateur actif : {filieresSansCoord.map((f) => f.nom).join(', ')}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead sx={{ bgcolor: '#F5F7FA' }}>
              <TableRow>
                <TableCell>Filière</TableCell>
                <TableCell>Coordonnateur</TableCell>
                <TableCell>Depuis</TableCell>
                <TableCell>Jusqu&apos;au</TableCell>
                <TableCell>Actif</TableCell>
                {canEdit && <TableCell align="right">Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {coordinations.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Aucun coordonnateur attribué.
                  </TableCell>
                </TableRow>
              )}
              {coordinations.map((c) => (
                <TableRow key={c.id} hover>
                  <TableCell sx={{ fontWeight: 600 }}>{c.filiere_nom}</TableCell>
                  <TableCell>
                    {c.formateur_nom}
                    <Typography variant="caption" color="text.secondary" display="block">{c.formateur_email}</Typography>
                  </TableCell>
                  <TableCell>{c.date_debut}</TableCell>
                  <TableCell>{c.date_fin || '—'}</TableCell>
                  <TableCell>
                    {canEdit ? (
                      <Switch checked={c.est_active} onChange={() => toggle(c)} />
                    ) : (
                      <Chip size="small" label={c.est_active ? 'Actif' : 'Inactif'} color={c.est_active ? 'success' : 'default'} />
                    )}
                  </TableCell>
                  {canEdit && (
                    <TableCell align="right">
                      <Tooltip title="Supprimer">
                        <IconButton color="error" onClick={() => remove(c)}><DeleteIcon /></IconButton>
                      </Tooltip>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Attribuer un coordonnateur</DialogTitle>
        <DialogContent dividers>
          <Alert severity="info" sx={{ mb: 2 }}>
            Le coordonnateur doit être un formateur disposant d&apos;un compte (portail formateur).
          </Alert>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Filière</InputLabel>
                <Select label="Filière" value={form.filiere} onChange={(e) => setForm({ ...form, filiere: e.target.value })}>
                  {filieres.map((f) => <MenuItem key={f.id} value={f.id}>{f.nom}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Formateur</InputLabel>
                <Select label="Formateur" value={form.formateur} onChange={(e) => setForm({ ...form, formateur: e.target.value })}>
                  {formateurs.map((f) => (
                    <MenuItem key={f.id} value={f.id} disabled={!f.user}>
                      {f.nom} {f.type_formateur === 'vacataire' ? '(vacataire)' : '(permanent)'}{!f.user ? ' – pas de compte' : ''}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth type="date" label="À partir du" InputLabelProps={{ shrink: true }}
                value={form.date_debut} onChange={(e) => setForm({ ...form, date_debut: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Annuler</Button>
          <Button variant="contained" onClick={submit} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : 'Attribuer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((t) => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
