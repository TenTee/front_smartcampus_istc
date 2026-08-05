'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, CircularProgress, Snackbar,
  FormControl, InputLabel, Select, MenuItem, Grid, Chip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { rolesService } from '../../services/api/services';
import { getApiErrorMessage } from '../../services/api/client';

const ACCESS_OPTIONS = [
  { value: 'none', label: 'Aucun' },
  { value: 'lecture', label: 'Lecture' },
  { value: 'ecriture', label: 'Écriture' },
];

const PERMISSION_FIELDS = [
  { name: 'can_manage_etudiants', label: 'Étudiants' },
  { name: 'can_manage_pedagogie', label: 'Pédagogie (Notes, Cours)' },
  { name: 'can_manage_rh', label: 'Ressources Humaines' },
  { name: 'can_manage_logistique', label: 'Logistique / Inventaire' },
  { name: 'can_manage_finance', label: 'Finances' },
];

const roleSchema = yup.object({
  code: yup.string().required('Le code est requis'),
  libelle: yup.string().required('Le libellé est requis'),
  can_manage_rh: yup.string().oneOf(['none', 'lecture', 'ecriture']).default('none'),
  can_manage_pedagogie: yup.string().oneOf(['none', 'lecture', 'ecriture']).default('none'),
  can_manage_logistique: yup.string().oneOf(['none', 'lecture', 'ecriture']).default('none'),
  can_manage_finance: yup.string().oneOf(['none', 'lecture', 'ecriture']).default('none'),
  can_manage_etudiants: yup.string().oneOf(['none', 'lecture', 'ecriture']).default('none'),
});

const defaultPermissions = {
  can_manage_rh: 'none',
  can_manage_pedagogie: 'none',
  can_manage_logistique: 'none',
  can_manage_finance: 'none',
  can_manage_etudiants: 'none',
};

function AccessChip({ level, label }) {
  if (level === 'none') return null;
  const color = level === 'ecriture' ? 'success' : 'info';
  const accessLabel = level === 'ecriture' ? 'Écriture' : 'Lecture';
  return <Chip size="small" label={`${label}: ${accessLabel}`} color={color} variant="outlined" sx={{ mr: 0.5, mb: 0.5 }} />;
}

export default function RolesTab() {
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentRoleId, setCurrentRoleId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(roleSchema),
    defaultValues: { code: '', libelle: '', ...defaultPermissions }
  });

  const fetchRoles = useCallback(async () => {
    try {
      setLoading(true);
      const data = await rolesService.list({ page: page + 1, limit: rowsPerPage });
      setRoles(data || []);
      setTotalCount(data?.length || 0);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des rôles'));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setIsEditing(true);
      setCurrentRoleId(role.id);
      reset({
        code: role.code || '', libelle: role.libelle || '',
        can_manage_rh: role.can_manage_rh || 'none',
        can_manage_pedagogie: role.can_manage_pedagogie || 'none',
        can_manage_logistique: role.can_manage_logistique || 'none',
        can_manage_finance: role.can_manage_finance || 'none',
        can_manage_etudiants: role.can_manage_etudiants || 'none',
      });
    } else {
      setIsEditing(false);
      setCurrentRoleId(null);
      reset({ code: '', libelle: '', ...defaultPermissions });
    }
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer ce rôle ?')) {
      try {
        await rolesService.remove(id);
        showSnackbar('Rôle supprimé avec succès');
        fetchRoles();
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, 'Erreur lors de la suppression'), 'error');
      }
    }
  };

  const onSubmit = async (data) => {
    setActionLoading(true);
    try {
      if (isEditing) {
        await rolesService.update(currentRoleId, data);
        showSnackbar('Rôle modifié avec succès');
      } else {
        await rolesService.create(data);
        showSnackbar('Rôle créé avec succès');
      }
      setOpenModal(false);
      fetchRoles();
    } catch (err) {
      showSnackbar(getApiErrorMessage(err, 'Erreur lors de la sauvegarde'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">Rôles & Autorisations</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Nouveau Rôle
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Code</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Libellé</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Droits d'accès</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell>
                </TableRow>
              ) : roles.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>Aucun rôle trouvé</TableCell>
                </TableRow>
              ) : (
                roles.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((role) => (
                  <TableRow hover key={role.id}>
                    <TableCell>{role.code}</TableCell>
                    <TableCell>{role.libelle}</TableCell>
                    <TableCell>
                      {PERMISSION_FIELDS.map((pf) => (
                        <AccessChip key={pf.name} level={role[pf.name]} label={pf.label} />
                      ))}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleOpenModal(role)}><EditIcon /></IconButton>
                      <IconButton color="error" onClick={() => handleDelete(role.id)}><DeleteIcon /></IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, newPage) => setPage(newPage)}
          onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
          labelRowsPerPage="Lignes par page"
        />
      </Paper>

      <Dialog open={openModal} onClose={() => !actionLoading && setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Modifier le Rôle' : 'Créer un Rôle'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller name="code" control={control} render={({ field }) => (
                  <TextField {...field} label="Code unique (ex: ADMIN)" fullWidth error={!!errors.code} helperText={errors.code?.message} disabled={actionLoading} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="libelle" control={control} render={({ field }) => (
                  <TextField {...field} label="Libellé complet" fullWidth error={!!errors.libelle} helperText={errors.libelle?.message} disabled={actionLoading} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" sx={{ mt: 2, mb: 1 }}>Permissions associées</Typography>
              </Grid>
              {PERMISSION_FIELDS.map((pf) => (
                <Grid item xs={12} sm={6} key={pf.name}>
                  <Controller name={pf.name} control={control} render={({ field }) => (
                    <FormControl fullWidth size="small" disabled={actionLoading}>
                      <InputLabel>{pf.label}</InputLabel>
                      <Select {...field} label={pf.label}>
                        {ACCESS_OPTIONS.map((opt) => (
                          <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )} />
                </Grid>
              ))}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} disabled={actionLoading}>Annuler</Button>
            <Button type="submit" variant="contained" disabled={actionLoading}
              startIcon={actionLoading ? <CircularProgress size={20} /> : null}>
              Enregistrer
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
        <Alert onClose={() => setSnackbar({ ...snackbar, open: false })} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
