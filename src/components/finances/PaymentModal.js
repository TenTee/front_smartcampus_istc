import React from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormHelperText,
  Grid,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';

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

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setForm({ ...form, justificatif: e.target.files[0] });
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>
        Enregistrer un nouveau paiement
      </DialogTitle>
      <DialogContent dividers>
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
              helperText={formErrors.montant || (remaining != null ? `Reste à payer: ${Number(remaining).toLocaleString()} FCFA` : '')}
              InputProps={{ endAdornment: <InputAdornment position="end">FCFA</InputAdornment> }}
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

          {/* Justificatif / Reçu de Paiement OBLIGATOIRE */}
          <Grid item xs={12}>
            <Paper
              variant="outlined"
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: formErrors.justificatif ? '#fff5f5' : '#f0f7ff',
                borderColor: formErrors.justificatif ? '#f44336' : '#b3d8ff',
              }}
            >
              <Typography
                variant="body2"
                fontWeight={700}
                color={formErrors.justificatif ? 'error.main' : 'primary.main'}
                gutterBottom
                sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
              >
                <CloudUploadIcon fontSize="small" /> Scan / Photo du reçu de paiement * (Obligatoire)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Button
                  variant="contained"
                  component="label"
                  color={formErrors.justificatif ? 'error' : 'info'}
                  size="small"
                  startIcon={<AttachFileIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  {form.justificatif ? 'Changer le reçu' : 'Importer le justificatif'}
                  <input
                    type="file"
                    hidden
                    accept="image/*,application/pdf"
                    onChange={handleFileChange}
                  />
                </Button>
                {form.justificatif ? (
                  <Chip
                    label={form.justificatif.name}
                    onDelete={() => setForm({ ...form, justificatif: null })}
                    color="primary"
                    size="small"
                    sx={{ maxWidth: 300 }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Fichiers acceptés: PDF, PNG, JPG (Requis pour la validation du paiement)
                  </Typography>
                )}
              </Box>
              {formErrors.justificatif && (
                <FormHelperText error sx={{ mt: 1, fontWeight: 600 }}>
                  {formErrors.justificatif}
                </FormHelperText>
              )}
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={submitting}>Annuler</Button>
        <Button variant="contained" color="success" onClick={onSave} disabled={submitting} sx={{ minWidth: 140 }}>
          {submitting ? <CircularProgress size={20} color="inherit" /> : 'Valider le paiement'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

