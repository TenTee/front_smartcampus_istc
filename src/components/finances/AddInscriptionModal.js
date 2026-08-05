import React from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from '@mui/material';

export default function AddInscriptionModal({
  open,
  onClose,
  onSave,
  form,
  setForm,
  formErrors,
  submitting,
  etudiants,
  niveaux,
  anneesAcademiques,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Créer une inscription</DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" error={Boolean(formErrors.etudiant)}>
              <InputLabel>Étudiant</InputLabel>
              <Select
                label="Étudiant"
                value={form.etudiant || ''}
                onChange={(event) => setForm({ ...form, etudiant: event.target.value })}
              >
                {etudiants.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.nom} {item.matricule ? `(${item.matricule})` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" error={Boolean(formErrors.niveau)}>
              <InputLabel>Niveau</InputLabel>
              <Select
                label="Niveau"
                value={form.niveau || ''}
                onChange={(event) => setForm({ ...form, niveau: event.target.value })}
              >
                {niveaux.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.nom} {item.filiere_nom ? `- ${item.filiere_nom}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" error={Boolean(formErrors.annee_academique_ref)}>
              <InputLabel>Année académique</InputLabel>
              <Select
                label="Année académique"
                value={form.annee_academique_ref || ''}
                onChange={(event) => {
                  const selectedYear = anneesAcademiques.find((item) => item.id === event.target.value);
                  setForm({
                    ...form,
                    annee_academique_ref: event.target.value,
                    annee_academique: selectedYear?.libelle || '',
                  });
                }}
              >
                {anneesAcademiques.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.libelle}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              label="Libellé année académique"
              value={form.annee_academique || ''}
              onChange={(event) => setForm({ ...form, annee_academique: event.target.value })}
              error={Boolean(formErrors.annee_academique)}
              helperText={formErrors.annee_academique || 'Exemple: 2025-2026'}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" color="primary" onClick={onSave} disabled={submitting}>
          {submitting ? <CircularProgress size={20} color="inherit" /> : 'Créer l’inscription'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
