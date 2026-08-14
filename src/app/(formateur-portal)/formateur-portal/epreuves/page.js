'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  Switch,
  FormControlLabel,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ShareIcon from '@mui/icons-material/Share';
import BlockIcon from '@mui/icons-material/Block';
import DownloadIcon from '@mui/icons-material/Download';
import { formateurPortalService, filieresV2Service, levelsV2Service, semestresService } from '../../../../services/api/services';

const TYPE_CHOICES = ['DEVOIR', 'EXAMEN', 'RATTRAPAGE', 'TP', 'AUTRE'];
const TYPES_A_VALIDER = new Set(['EXAMEN', 'RATTRAPAGE', 'TP']);

export default function EpreuvesPage() {
  const [epreuves, setEpreuves] = useState([]);
  const [classes, setClasses] = useState([]);
  const [filieres, setFilieres] = useState([]);
  const [niveaux, setNiveaux] = useState([]);
  const [semestres, setSemestres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    nom: '',
    module_id: '',
    filiere_id: '',
    niveau_id: '',
    semestre_id: '',
    type_epreuve: 'EXAMEN',
    est_partage: false,
    fichier: null,
    corrige: null,
  });

  useEffect(() => {
    Promise.all([
      formateurPortalService.mesEpreuves(),
      formateurPortalService.mesClasses(),
      filieresV2Service.list().catch(() => []),
      levelsV2Service.list().catch(() => []),
      semestresService.list().catch(() => []),
    ]).then(([ep, cls, fil, niv, sem]) => {
      setEpreuves(ep);
      setClasses(cls);
      setFilieres(Array.isArray(fil) ? fil : fil?.results || []);
      setNiveaux(Array.isArray(niv) ? niv : niv?.results || []);
      setSemestres(Array.isArray(sem) ? sem : sem?.results || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleUpload = async () => {
    if (!formData.nom || !formData.fichier || !formData.module_id) {
      setSnackbar({ open: true, message: 'Remplissez les champs obligatoires (nom, module, fichier).', severity: 'warning' });
      return;
    }

    const fd = new FormData();
    fd.append('nom', formData.nom);
    fd.append('module_id', formData.module_id);
    fd.append('type_epreuve', formData.type_epreuve);
    fd.append('est_partage', TYPES_A_VALIDER.has(formData.type_epreuve) ? 'false' : formData.est_partage);
    fd.append('fichier', formData.fichier);
    if (formData.filiere_id) fd.append('filiere_id', formData.filiere_id);
    if (formData.niveau_id) fd.append('niveau_id', formData.niveau_id);
    if (formData.semestre_id) fd.append('semestre_id', formData.semestre_id);
    if (formData.corrige) fd.append('corrige', formData.corrige);

    try {
      await formateurPortalService.uploadEpreuve(fd);
      setSnackbar({ open: true, message: 'Épreuve importée avec succès.', severity: 'success' });
      setOpenDialog(false);
      setFormData({ nom: '', module_id: '', filiere_id: '', niveau_id: '', semestre_id: '', type_epreuve: 'EXAMEN', est_partage: false, fichier: null, corrige: null });
      const updated = await formateurPortalService.mesEpreuves();
      setEpreuves(updated);
    } catch (e) {
      setSnackbar({ open: true, message: "Erreur lors de l'import.", severity: 'error' });
    }
  };

  const handleTogglePartage = async (ep) => {
    if (TYPES_A_VALIDER.has(ep.type_epreuve)) {
      setSnackbar({ open: true, message: "Seule l'administration peut partager cette épreuve avec les étudiants.", severity: 'info' });
      return;
    }
    try {
      const result = await formateurPortalService.togglePartageEpreuve(ep.id);
      setEpreuves(prev => prev.map(e => e.id === ep.id ? { ...e, est_partage: result.est_partage } : e));
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  const uniqueModules = [...new Map(classes.map(c => [c.module_id, { id: c.module_id, nom: c.module_nom }])).values()];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Mes Épreuves</Typography>
        <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => setOpenDialog(true)}>
          Importer une épreuve
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Nom</strong></TableCell>
                <TableCell><strong>Module</strong></TableCell>
                <TableCell><strong>Type</strong></TableCell>
                <TableCell align="center"><strong>Partagé (étudiants)</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {epreuves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Aucune épreuve importée</TableCell>
                </TableRow>
              ) : (
                epreuves.map((ep) => (
                  <TableRow key={ep.id}>
                    <TableCell>{ep.nom}</TableCell>
                    <TableCell>{ep.module_nom}</TableCell>
                    <TableCell><Chip label={ep.type_epreuve} size="small" /></TableCell>
                    <TableCell align="center">
                      <Chip
                        label={ep.est_partage ? 'Partagé' : 'Non partagé'}
                        color={ep.est_partage ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      {TYPES_A_VALIDER.has(ep.type_epreuve) ? (
                        <Chip label="Validation administrative" size="small" color="warning" variant="outlined" />
                      ) : (
                        <IconButton size="small" onClick={() => handleTogglePartage(ep)} title={ep.est_partage ? 'Retirer le partage' : 'Partager aux étudiants'}>
                          {ep.est_partage ? <BlockIcon /> : <ShareIcon />}
                        </IconButton>
                      )}
                      {ep.fichier && (
                        <IconButton size="small" component="a" href={ep.fichier} target="_blank" title="Télécharger sujet">
                          <DownloadIcon />
                        </IconButton>
                      )}
                      {ep.corrige && (
                        <IconButton size="small" component="a" href={ep.corrige} target="_blank" title="Télécharger corrigé" color="success">
                          <DownloadIcon />
                        </IconButton>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Upload Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Importer une épreuve</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Nom de l'épreuve"
            value={formData.nom}
            onChange={(e) => setFormData(f => ({ ...f, nom: e.target.value }))}
            fullWidth
            required
          />
          <FormControl fullWidth required>
            <InputLabel>Module</InputLabel>
            <Select value={formData.module_id} label="Module" onChange={(e) => setFormData(f => ({ ...f, module_id: e.target.value }))}>
              {uniqueModules.map(m => <MenuItem key={m.id} value={m.id}>{m.nom}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Type</InputLabel>
            <Select value={formData.type_epreuve} label="Type" onChange={(e) => setFormData(f => ({ ...f, type_epreuve: e.target.value, est_partage: TYPES_A_VALIDER.has(e.target.value) ? false : f.est_partage }))}>
              {TYPE_CHOICES.map(t => <MenuItem key={t} value={t}>{t}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Filière</InputLabel>
            <Select value={formData.filiere_id} label="Filière" onChange={(e) => setFormData(f => ({ ...f, filiere_id: e.target.value }))}>
              <MenuItem value="">-- Aucune --</MenuItem>
              {filieres.map(f => <MenuItem key={f.id} value={f.id}>{f.nom}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Niveau</InputLabel>
            <Select value={formData.niveau_id} label="Niveau" onChange={(e) => setFormData(f => ({ ...f, niveau_id: e.target.value }))}>
              <MenuItem value="">-- Aucun --</MenuItem>
              {niveaux.map(n => <MenuItem key={n.id} value={n.id}>{n.nom || n.libelle || `Niveau ${n.id}`}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth>
            <InputLabel>Semestre</InputLabel>
            <Select value={formData.semestre_id} label="Semestre" onChange={(e) => setFormData(f => ({ ...f, semestre_id: e.target.value }))}>
              <MenuItem value="">-- Aucun --</MenuItem>
              {semestres.map(s => <MenuItem key={s.id} value={s.id}>{s.nom || s.libelle || `Semestre ${s.id}`}</MenuItem>)}
            </Select>
          </FormControl>
          <Button variant="outlined" component="label">
            {formData.fichier ? `Sujet: ${formData.fichier.name}` : 'Choisir le fichier sujet *'}
            <input type="file" hidden onChange={(e) => setFormData(f => ({ ...f, fichier: e.target.files[0] }))} />
          </Button>
          <Button variant="outlined" component="label" color="secondary">
            {formData.corrige ? `Corrigé: ${formData.corrige.name}` : 'Choisir le corrigé (optionnel)'}
            <input type="file" hidden onChange={(e) => setFormData(f => ({ ...f, corrige: e.target.files[0] }))} />
          </Button>
          {TYPES_A_VALIDER.has(formData.type_epreuve) ? (
            <Alert severity="info">Cette épreuve restera privée. Seule l'administration peut la publier pour les étudiants.</Alert>
          ) : (
            <FormControlLabel
              control={<Switch checked={formData.est_partage} onChange={(e) => setFormData(f => ({ ...f, est_partage: e.target.checked }))} />}
              label="Partager immédiatement aux étudiants"
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Annuler</Button>
          <Button variant="contained" onClick={handleUpload}>Importer</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Box>
  );
}
