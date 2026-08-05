import React, { useState } from 'react';
import {
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  InputAdornment,
  MenuItem,
  TextField,
  Typography,
  CircularProgress,
} from '@mui/material';

export default function ValidatePreinscriptionModal({
  open,
  onClose,
  onSave,
  submitting,
  preinscription,
}) {
  const [amounts, setAmounts] = useState({
    montant_inscription_verse: '0',
    montant_formation_verse: '0',
  });
  const [errors, setErrors] = useState({});

  const handleChange = (field) => (event) => {
    setAmounts((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleClose = () => {
    setAmounts({
      montant_inscription_verse: '0',
      montant_formation_verse: '0',
    });
    setErrors({});
    onClose();
  };

  const handleSave = () => {
    const nextErrors = {};
    const inscriptionAmount = Number(amounts.montant_inscription_verse || 0);
    const formationAmount = Number(amounts.montant_formation_verse || 0);

    if (Number.isNaN(inscriptionAmount) || inscriptionAmount < 0) {
      nextErrors.montant_inscription_verse = 'Montant invalide';
    }
    if (Number.isNaN(formationAmount) || formationAmount < 0) {
      nextErrors.montant_formation_verse = 'Montant invalide';
    }

    onSave({
      montant_inscription_verse: String(inscriptionAmount),
      montant_formation_verse: String(formationAmount),
    });
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
      <DialogTitle>Approuver la pré-inscription</DialogTitle>
      <DialogContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cette action va valider le dossier et déclencher la création de l&apos;étudiant ainsi que de son inscription si un niveau est renseigné.
        </Typography>

        <Divider sx={{ mb: 2 }} />

        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="text.secondary">Candidat</Typography>
              <Typography variant="body1" fontWeight={600}>
                {[preinscription?.nom_candidat, preinscription?.prenom_candidat].filter(Boolean).join(' ') || '-'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="text.secondary">Téléphone</Typography>
              <Typography variant="body1">{preinscription?.telephone || '-'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="text.secondary">Email</Typography>
              <Typography variant="body1">{preinscription?.email || '-'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="text.secondary">Formation</Typography>
              <Typography variant="body1">{preinscription?.formation_souhaitee_nom || preinscription?.filiere_souhaitee_nom || '-'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="text.secondary">Niveau souhaité</Typography>
              <Typography variant="body1">{preinscription?.niveau_souhaite_nom || '-'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box>
              <Typography variant="caption" color="text.secondary">Date de naissance</Typography>
              <Typography variant="body1">
                {preinscription?.date_naissance
                  ? new Date(preinscription.date_naissance).toLocaleDateString('fr-FR')
                  : '-'}
              </Typography>
            </Box>
          </Grid>
          {preinscription?.documents?.length > 0 && (
            <Grid item xs={12}>
              <Typography variant="caption" color="text.secondary">Documents joints</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                {preinscription.documents.map((doc) => (
                  <Chip
                    key={doc.id}
                    label={doc.type_document || 'Document'}
                    component="a"
                    href={doc.fichier}
                    target="_blank"
                    clickable
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>
            </Grid>
          )}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" color="primary" gutterBottom>Réglage Financier Initial</Typography>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Frais d'inscription versés"
              value={amounts.montant_inscription_verse}
              onChange={handleChange('montant_inscription_verse')}
              error={Boolean(errors.montant_inscription_verse)}
              helperText={errors.montant_inscription_verse}
              inputProps={{ min: 0 }}
              InputProps={{ endAdornment: <InputAdornment position="end">FCFA</InputAdornment> }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              size="small"
              type="number"
              label="Avance frais de formation"
              value={amounts.montant_formation_verse}
              onChange={handleChange('montant_formation_verse')}
              error={Boolean(errors.montant_formation_verse)}
              helperText={errors.montant_formation_verse}
              inputProps={{ min: 0 }}
              InputProps={{ endAdornment: <InputAdornment position="end">FCFA</InputAdornment> }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Annuler</Button>
        <Button variant="contained" color="success" onClick={handleSave} disabled={submitting}>
          {submitting ? <CircularProgress size={20} color="inherit" /> : 'Approuver'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
