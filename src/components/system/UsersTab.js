'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Button, Paper, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, TablePagination, IconButton, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Alert, CircularProgress, Snackbar,
  Grid, MenuItem, Tooltip
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PasswordIcon from '@mui/icons-material/Password';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { usersService, rolesService } from '../../services/api/services';
import { getApiErrorMessage } from '../../services/api/client';

const userSchema = yup.object({
  noms: yup.string().required('Le nom est requis'),
  prenoms: yup.string().required('Le prénom est requis'),
  email: yup.string().email('Email Invalide').required('L\'email est requis'),
  role: yup.string().required('Le rôle est requis'),
});

export default function UsersTab() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openModal, setOpenModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [resetModalInfo, setResetModalInfo] = useState({ open: false, passwordDetails: null });

  const getRoleLabel = (roleCode) => {
    const role = roles.find(r => r.code === roleCode);
    return role ? role.libelle : roleCode;
  };

  const { control, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: yupResolver(userSchema),
    defaultValues: { noms: '', prenoms: '', email: '', role: '' }
  });

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [usersData, rolesData] = await Promise.all([
        usersService.list({ page: page + 1, limit: rowsPerPage }),
        rolesService.list()
      ]);
      const filteredUsers = (usersData || []).filter(
        (user) => user.role !== 'etudiant' && user.role !== 'superadmin'
      );
      setUsers(filteredUsers);
      setTotalCount(filteredUsers.length);
      setRoles(rolesData || []);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors du chargement des données'));
    } finally {
      setLoading(false);
    }
  }, [page, rowsPerPage]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const showSnackbar = (message, severity = 'success') => {
    setSnackbar({ open: true, message, severity });
  };

  const handleOpenModal = (user = null) => {
    if (user) {
      setIsEditing(true);
      setCurrentUserId(user.id);
      reset({ noms: user.noms || '', prenoms: user.prenoms || '', email: user.email || '', role: user.role || '' });
    } else {
      setIsEditing(false);
      setCurrentUserId(null);
      reset({ noms: '', prenoms: '', email: '', role: '' });
    }
    setOpenModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet utilisateur ?')) {
      try {
        await usersService.remove(id);
        showSnackbar('Utilisateur supprimé avec succès');
        fetchData();
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, 'Erreur lors de la suppression'), 'error');
      }
    }
  };

  const handleResetPassword = async (id) => {
    if (window.confirm('Voulez-vous réinitialiser le mot de passe de cet utilisateur ?')) {
      try {
        const result = await usersService.resetPassword(id);
        if (result) {
          setResetModalInfo({ open: true, passwordDetails: result });
        } else {
          showSnackbar('Mot de passe réinitialisé.', 'success');
        }
      } catch (err) {
        showSnackbar(getApiErrorMessage(err, 'Erreur de réinitialisation'), 'error');
      }
    }
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(resetModalInfo.passwordDetails?.new_password);
      showSnackbar('Mot de passe copié avec succès', 'success');
    } catch {
      showSnackbar('Erreur lors de la copie', 'error');
    }
  };

  const onSubmit = async (data) => {
    setActionLoading(true);
    try {
      if (isEditing) {
        await usersService.update(currentUserId, data);
        showSnackbar('Utilisateur modifié avec succès');
      } else {
        const result = await usersService.create(data);
        showSnackbar('Utilisateur créé avec succès');
        if (result && result.raw_password) {
          setResetModalInfo({ open: true, passwordDetails: result });
        }
      }
      setOpenModal(false);
      fetchData();
    } catch (err) {
      showSnackbar(getApiErrorMessage(err, 'Erreur lors de la sauvegarde'), 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" fontWeight="bold">Gestion des Utilisateurs</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenModal()}>
          Nouvel Utilisateur
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ width: '100%', overflow: 'hidden', boxShadow: 3, borderRadius: 2 }}>
        <TableContainer sx={{ maxHeight: 600 }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nom Complet</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Username / Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Rôle</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}><CircularProgress /></TableCell>
                </TableRow>
              ) : users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 3 }}>Aucun utilisateur trouvé</TableCell>
                </TableRow>
              ) : (
                users.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((user) => (
                  <TableRow hover key={user.id}>
                    <TableCell>
                      <Typography fontWeight="500">{user.noms} {user.prenoms}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{user.username}</Typography>
                      <Typography variant="caption" color="text.secondary">{user.email}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ bgcolor: '#e3f2fd', color: '#1976d2', p: 0.5, borderRadius: 1, display: 'inline-block' }}>
                        {getRoleLabel(user.role)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Changer le mot de passe">
                        <IconButton color="warning" onClick={() => handleResetPassword(user.id)}>
                          <PasswordIcon />
                        </IconButton>
                      </Tooltip>
                      <IconButton color="primary" onClick={() => handleOpenModal(user)}>
                        <EditIcon />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(user.id)}>
                        <DeleteIcon />
                      </IconButton>
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
        <DialogTitle>{isEditing ? 'Modifier l\'Utilisateur' : 'Créer un Utilisateur'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent dividers>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Controller name="noms" control={control} render={({ field }) => (
                  <TextField {...field} label="Noms" fullWidth error={!!errors.noms} helperText={errors.noms?.message} disabled={actionLoading} />
                )} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Controller name="prenoms" control={control} render={({ field }) => (
                  <TextField {...field} label="Prénoms" fullWidth error={!!errors.prenoms} helperText={errors.prenoms?.message} disabled={actionLoading} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="email" control={control} render={({ field }) => (
                  <TextField {...field} label="Email" type="email" fullWidth error={!!errors.email} helperText={errors.email?.message} disabled={actionLoading} />
                )} />
              </Grid>
              <Grid item xs={12}>
                <Controller name="role" control={control} render={({ field }) => (
                  <TextField {...field} label="Rôle assigné" fullWidth select error={!!errors.role} helperText={errors.role?.message} disabled={actionLoading}>
                    {roles.map(r => (
                      <MenuItem key={r.code} value={r.code}>{r.libelle} ({r.code})</MenuItem>
                    ))}
                  </TextField>
                )} />
              </Grid>
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

      <Dialog open={resetModalInfo.open} onClose={() => setResetModalInfo({ ...resetModalInfo, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ color: 'primary.main', fontWeight: 'bold' }}>Accès Utilisateur</DialogTitle>
        <DialogContent dividers>
          <Typography variant="body1" sx={{ mb: 2 }}>
            L'opération a réussi. Voici les identifiants d'accès temporaires.
            <br /><strong>Veillez à les transmettre de manière sécurisée.</strong>
          </Typography>
          <Box sx={{ p: 3, bgcolor: '#f5f5f5', borderRadius: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
            <Typography sx={{ mb: 2 }}>
              Nom d'utilisateur : <br />
              <Typography component="span" fontWeight="bold">{resetModalInfo.passwordDetails?.username}</Typography>
            </Typography>
            <Typography sx={{ mb: 1 }}>Mot de passe temporaire :</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2, p: 2, borderRadius: 2, bgcolor: 'white' }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold', letterSpacing: 1, wordBreak: 'break-all' }}>
                {resetModalInfo.passwordDetails?.new_password}
              </Typography>
              <Tooltip title="Copier le mot de passe">
                <IconButton color="primary" onClick={handleCopyPassword}><ContentCopyIcon /></IconButton>
              </Tooltip>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setResetModalInfo({ ...resetModalInfo, open: false })} variant="contained">
            J'ai compris
          </Button>
        </DialogActions>
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
