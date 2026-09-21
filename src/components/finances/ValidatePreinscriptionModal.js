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
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  Paper,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import DeleteIcon from '@mui/icons-material/Delete';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { boursesService } from '@/services/api/services';


const DOCUMENT_TYPES = [
  "Photo d'identité",
  "Acte de naissance",
  "CNI / Passeport",
  "Bulletin",
  "Diplôme",
  "Autre document",
];

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

  // Payment receipt scan file
  const [paymentReceipt, setPaymentReceipt] = useState(null);

  // Additional documents to attach during validation
  const [newDocType, setNewDocType] = useState("Photo d'identité");
  const [newDocFile, setNewDocFile] = useState(null);
  const [additionalDocs, setAdditionalDocs] = useState([]);

  // Discount & Scholarship state
  const [typeReduction, setTypeReduction] = useState('NONE'); // NONE | PERCENT_10 | LIBRE_FORMATION | LIBRE_INSCRIPTION | BOURSE
  const [montantReduction, setMontantReduction] = useState('0');
  const [bourseCode, setBourseCode] = useState('');
  const [bourseStatus, setBourseStatus] = useState(null);
  const [checkingBourse, setCheckingBourse] = useState(false);
  const [motifReduction, setMotifReduction] = useState('');

  const handleChange = (field) => (event) => {
    setAmounts((current) => ({ ...current, [field]: event.target.value }));
    setErrors((current) => ({ ...current, [field]: '' }));
  };

  const handleVerifyBourse = async () => {
    if (!bourseCode.trim()) return;
    setCheckingBourse(true);
    setBourseStatus(null);
    try {
      const res = await boursesService.checkCode(bourseCode.trim());
      setBourseStatus(res);
    } catch (err) {
      setBourseStatus({
        valid: false,
        message: err.response?.data?.message || "Erreur lors de la vérification de la bourse.",
      });
    } finally {
      setCheckingBourse(false);
    }
  };

  const handleReceiptChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      setPaymentReceipt(event.target.files[0]);
    }
  };

  const handleAddDocument = () => {
    if (!newDocFile) return;
    setAdditionalDocs((prev) => [
      ...prev,
      { file: newDocFile, type: newDocType, id: Date.now() },
    ]);
    setNewDocFile(null);
  };

  const handleRemoveAdditionalDoc = (id) => {
    setAdditionalDocs((prev) => prev.filter((item) => item.id !== id));
  };

  const handleClose = () => {
    setAmounts({
      montant_inscription_verse: '0',
      montant_formation_verse: '0',
    });
    setErrors({});
    setPaymentReceipt(null);
    setNewDocFile(null);
    setAdditionalDocs([]);
    setTypeReduction('NONE');
    setMontantReduction('0');
    setBourseCode('');
    setBourseStatus(null);
    setMotifReduction('');
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

    if (typeReduction === 'BOURSE' && (!bourseStatus || !bourseStatus.valid)) {
      alert("Veuillez vérifier et valider un code de bourse valide avant d'approuver.");
      return;
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // Build payload (FormData if files present, object otherwise)
    const hasFiles = paymentReceipt || additionalDocs.length > 0;

    if (hasFiles) {
      const formData = new FormData();
      formData.append('montant_inscription_verse', String(inscriptionAmount));
      formData.append('montant_formation_verse', String(formationAmount));
      formData.append('type_reduction', typeReduction);
      formData.append('montant_reduction', String(montantReduction));
      formData.append('bourse_code', bourseCode);
      formData.append('motif_reduction', motifReduction);

      if (paymentReceipt) {
        formData.append('justificatif_paiement', paymentReceipt);
      }

      additionalDocs.forEach((doc) => {
        formData.append('nouveaux_documents', doc.file);
        formData.append('types_documents', doc.type);
      });

      onSave(formData);
    } else {
      onSave({
        montant_inscription_verse: String(inscriptionAmount),
        montant_formation_verse: String(formationAmount),
        type_reduction: typeReduction,
        montant_reduction: String(montantReduction),
        bourse_code: bourseCode,
        motif_reduction: motifReduction,
      });
    }
  };


  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700, color: 'primary.main' }}>
        Approuver et valider la pré-inscription
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Cette action va valider le dossier, créer/mettre à jour la fiche de l&apos;étudiant, enregistrer ses documents et synchroniser son inscription ainsi que son règlement initial.
        </Typography>

        <Grid container spacing={2}>
          {/* Candidate & Parent Info */}
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Candidat</Typography>
              <Typography variant="body1" fontWeight={600}>
                {[preinscription?.nom_candidat, preinscription?.prenom_candidat].filter(Boolean).join(' ') || '-'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Téléphone / Email</Typography>
              <Typography variant="body1" fontWeight={500}>{preinscription?.telephone || '-'}</Typography>
              <Typography variant="caption" color="text.secondary">{preinscription?.email || '-'}</Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Formation & Spécialité</Typography>
              <Typography variant="body1" fontWeight={600}>
                {preinscription?.specialite_souhaitee_nom || preinscription?.filiere_souhaitee_nom || '-'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Niveau & Classe souhaités</Typography>
              <Typography variant="body1" fontWeight={600}>
                {[preinscription?.niveau_souhaite_nom, preinscription?.classe_souhaitee_nom].filter(Boolean).join(' - ') || '-'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
              <Typography variant="caption" color="text.secondary">Parent 1 (Obligatoire)</Typography>
              <Typography variant="body2" fontWeight={600}>
                {[preinscription?.nom_parent, preinscription?.relation_parent1 ? `(${preinscription.relation_parent1})` : null, preinscription?.whatsapp_parent].filter(Boolean).join(' ') || '-'}
              </Typography>
            </Box>
          </Grid>
          {preinscription?.nom_parent2 && (
            <Grid item xs={12} sm={6}>
              <Box sx={{ p: 1.5, bgcolor: '#f8fafc', borderRadius: 2 }}>
                <Typography variant="caption" color="text.secondary">Parent 2 (Optionnel)</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {[preinscription?.nom_parent2, preinscription?.relation_parent2 ? `(${preinscription.relation_parent2})` : null, preinscription?.whatsapp_parent2].filter(Boolean).join(' ')}
                </Typography>
              </Box>
            </Grid>
          )}

          {/* Documents existants */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Typography variant="subtitle2" fontWeight={700} color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AttachFileIcon fontSize="small" /> Documents existants joints
            </Typography>
            {preinscription?.documents?.length > 0 ? (
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
            ) : (
              <Typography variant="caption" color="text.secondary">Aucun document soumis lors de la pré-inscription initiale.</Typography>
            )}
          </Grid>

          {/* Section Ajout de Documents Complémentaires */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fafafa', mt: 1 }}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon fontSize="small" color="action" /> Ajouter des documents manquants / requis
              </Typography>
              <Grid container spacing={1.5} alignItems="center" sx={{ mt: 0.5 }}>
                <Grid item xs={12} sm={5}>
                  <TextField
                    select
                    fullWidth
                    size="small"
                    label="Type de document"
                    value={newDocType}
                    onChange={(e) => setNewDocType(e.target.value)}
                  >
                    {DOCUMENT_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={5}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    size="small"
                    startIcon={<AttachFileIcon />}
                    sx={{ textTransform: 'none', height: 40 }}
                  >
                    {newDocFile ? newDocFile.name : "Sélectionner un fichier"}
                    <input
                      type="file"
                      hidden
                      onChange={(e) => setNewDocFile(e.target.files[0] || null)}
                    />
                  </Button>
                </Grid>
                <Grid item xs={12} sm={2}>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    size="small"
                    disabled={!newDocFile}
                    onClick={handleAddDocument}
                    startIcon={<AddCircleOutlineIcon />}
                    sx={{ height: 40 }}
                  >
                    Ajouter
                  </Button>
                </Grid>
              </Grid>

              {additionalDocs.length > 0 && (
                <List dense sx={{ mt: 1, bgcolor: '#fff', borderRadius: 1, border: '1px solid #e2e8f0' }}>
                  {additionalDocs.map((doc) => (
                    <ListItem key={doc.id}>
                      <ListItemText
                        primary={doc.file.name}
                        secondary={`Type: ${doc.type}`}
                        primaryTypographyProps={{ variant: 'body2', fontWeight: 600 }}
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" size="small" color="error" onClick={() => handleRemoveAdditionalDoc(doc.id)}>
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>

          {/* Section Réduction ou Bourse d'études */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#fdf8f6', borderColor: '#f7d0c3' }}>
              <Typography variant="subtitle2" color="secondary.main" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CardGiftcardIcon fontSize="small" /> Options de Réduction ou Bourse d&apos;études
              </Typography>
              <FormControl component="fieldset" fullWidth sx={{ mt: 1 }}>
                <RadioGroup
                  value={typeReduction}
                  onChange={(e) => {
                    setTypeReduction(e.target.value);
                    setBourseStatus(null);
                  }}
                >
                  <FormControlLabel
                    value="NONE"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2"><strong>Aucune réduction</strong> (Tarif standard de l&apos;échéancier)</Typography>}
                  />
                  <FormControlLabel
                    value="PERCENT_10"
                    control={<Radio size="small" />}
                    label={
                      <Typography variant="body2">
                        <strong>Réduction 10% sur les frais de formation</strong> (Déduite à partir de la dernière tranche en remontant)
                      </Typography>
                    }
                  />
                  <FormControlLabel
                    value="LIBRE_FORMATION"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2"><strong>Réduction libre sur les frais de formation</strong> (Déduite à partir de la dernière tranche)</Typography>}
                  />
                  <FormControlLabel
                    value="LIBRE_INSCRIPTION"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2"><strong>Réduction libre sur les frais d&apos;inscription</strong></Typography>}
                  />
                  <FormControlLabel
                    value="BOURSE"
                    control={<Radio size="small" />}
                    label={<Typography variant="body2"><strong>Bourse d&apos;études Scolarité</strong> (Nécessite un code de bourse valide)</Typography>}
                  />
                </RadioGroup>
              </FormControl>

              {/* Input for custom reduction amount */}
              {(typeReduction === 'LIBRE_FORMATION' || typeReduction === 'LIBRE_INSCRIPTION') && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#fff', borderRadius: 1.5, border: '1px solid #e0e0e0' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Saisissez le montant de la réduction à appliquer {typeReduction === 'LIBRE_FORMATION' ? 'sur les tranches de formation (à partir de la dernière tranche)' : 'sur les frais d\'inscription'} :
                  </Typography>
                  <TextField
                    fullWidth
                    size="small"
                    type="number"
                    label="Montant de la réduction"
                    value={montantReduction}
                    onChange={(e) => setMontantReduction(e.target.value)}
                    sx={{ mt: 1 }}
                    inputProps={{ min: 0 }}
                    InputProps={{ endAdornment: <InputAdornment position="end">FCFA</InputAdornment> }}
                  />
                </Box>
              )}

              {/* Input & Verification for Bourse Code */}
              {typeReduction === 'BOURSE' && (
                <Box sx={{ mt: 2, p: 2, bgcolor: '#fff', borderRadius: 1.5, border: '1px solid #e0e0e0' }}>
                  <Typography variant="caption" color="text.secondary" gutterBottom>
                    Entrez le code de la bourse attribuée à l&apos;étudiant (enregistrée en Scolarité) :
                  </Typography>
                  <Grid container spacing={1} sx={{ mt: 0.5 }} alignItems="center">
                    <Grid item xs={12} sm={8}>
                      <TextField
                        fullWidth
                        size="small"
                        label="Code de la bourse"
                        value={bourseCode}
                        onChange={(e) => {
                          setBourseCode(e.target.value.toUpperCase());
                          setBourseStatus(null);
                        }}
                        placeholder="BRS-XXXX-XXX"
                      />
                    </Grid>
                    <Grid item xs={12} sm={4}>
                      <Button
                        variant="contained"
                        color="secondary"
                        size="small"
                        fullWidth
                        onClick={handleVerifyBourse}
                        disabled={checkingBourse || !bourseCode.trim()}
                        sx={{ height: 40, textTransform: 'none' }}
                      >
                        {checkingBourse ? <CircularProgress size={20} color="inherit" /> : "Vérifier le code"}
                      </Button>
                    </Grid>
                  </Grid>

                  {bourseStatus && (
                    <Box sx={{ mt: 1.5 }}>
                      {bourseStatus.valid ? (
                        <Alert severity="success" icon={<CheckCircleIcon />}>
                          Bourse valide ! Montant : <strong>{Number(bourseStatus.bourse?.montant).toLocaleString()} FCFA</strong>. Cette bourse sera consommée et rattachée à cet étudiant dès l&apos;approbation.
                        </Alert>
                      ) : (
                        <Alert severity="error" icon={<ErrorOutlineIcon />}>
                          {bourseStatus.message || "Code de bourse invalide ou déjà utilisé."}
                        </Alert>
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Paper>
          </Grid>

          {/* Réglage Financier Initial & Scan du reçu de paiement */}
          <Grid item xs={12}>
            <Divider sx={{ my: 1 }} />

            <Typography variant="subtitle2" color="primary" fontWeight={700} gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <ReceiptLongIcon fontSize="small" /> Réglage Financier Initial & Preuve de Paiement
            </Typography>
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

          {/* Upload Scan / Photo du Reçu de Paiement */}
          <Grid item xs={12}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, bgcolor: '#f0f7ff', borderColor: '#b3d8ff' }}>
              <Typography variant="body2" fontWeight={700} color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CloudUploadIcon fontSize="small" /> Scan / Photo du reçu de paiement
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Button
                  variant="contained"
                  component="label"
                  color="info"
                  size="small"
                  startIcon={<AttachFileIcon />}
                  sx={{ textTransform: 'none' }}
                >
                  {paymentReceipt ? "Remplacer le reçu" : "Joindre le reçu de paiement"}
                  <input
                    type="file"
                    hidden
                    accept="image/*,application/pdf"
                    onChange={handleReceiptChange}
                  />
                </Button>
                {paymentReceipt ? (
                  <Chip
                    label={paymentReceipt.name}
                    onDelete={() => setPaymentReceipt(null)}
                    color="primary"
                    size="small"
                    sx={{ maxWidth: 300 }}
                  />
                ) : (
                  <Typography variant="caption" color="text.secondary">
                    Formats acceptés : PDF, JPG, PNG (Facultatif mais recommandé pour traçabilité)
                  </Typography>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={handleClose} disabled={submitting}>Annuler</Button>
        <Button variant="contained" color="success" onClick={handleSave} disabled={submitting} sx={{ minWidth: 120 }}>
          {submitting ? <CircularProgress size={20} color="inherit" /> : 'Approuver'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

