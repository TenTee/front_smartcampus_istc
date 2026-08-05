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
  Typography,
} from '@mui/material';

export default function PaymentModal({
  open,
  onClose,
  onSave,
  form,
  setForm,
  formErrors,
  submitting,
  selectedStudent,
}) {
  const remaining =
    form.paiement_type === 'INSCRIPTION'
      ? selectedStudent?.solde_restant_inscription
      : selectedStudent?.solde_restant_formation;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Enregistrer un paiement</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {selectedStudent
            ? `Étudiant: ${selectedStudent.etudiant_nom} | Formation: ${selectedStudent.formation_nom}`
            : 'Renseignez les informations du paiement.'}
        </Typography>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" error={Boolean(formErrors.paiement_type)}>
              <InputLabel>Type de paiement</InputLabel>
              <Select
                label="Type de paiement"
                value={form.paiement_type}
                onChange={(event) => setForm({ ...form, paiement_type: event.target.value })}
              >
                <MenuItem value="INSCRIPTION">Frais d&apos;inscription</MenuItem>
                <MenuItem value="FORMATION">Frais de formation</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Montant à payer"
              value={form.montant}
              onChange={(event) => setForm({ ...form, montant: event.target.value })}
              error={Boolean(formErrors.montant)}
              helperText={formErrors.montant || (remaining != null ? `Reste à payer: ${remaining} FCFA` : '')}
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" error={Boolean(formErrors.mode_paiement)}>
              <InputLabel>Mode de paiement</InputLabel>
              <Select
                label="Mode de paiement"
                value={form.mode_paiement}
                onChange={(event) => setForm({ ...form, mode_paiement: event.target.value })}
              >
                <MenuItem value="cash">Cash</MenuItem>
                <MenuItem value="mobile_money">Mobile Money</MenuItem>
                <MenuItem value="orange_money">Orange Money</MenuItem>
                <MenuItem value="virement">Virement bancaire</MenuItem>
                <MenuItem value="cheque">Chèque</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" color="primary" onClick={onSave} disabled={submitting}>
          {submitting ? <CircularProgress size={20} color="inherit" /> : 'Valider le paiement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
