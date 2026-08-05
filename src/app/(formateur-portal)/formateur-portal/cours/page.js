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
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { formateurPortalService, coursDocumentsService } from '../../../../services/api/services';

export default function MesCoursPage() {
  const [documents, setDocuments] = useState([]);
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    titre: '',
    description: '',
    module: '',
    est_visible_etudiants: false,
    fichier: null,
  });

  const fetchDocuments = () => {
    coursDocumentsService.list()
      .then(data => setDocuments(Array.isArray(data) ? data : data?.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    Promise.all([
      formateurPortalService.mesClasses(),
      coursDocumentsService.list(),
    ]).then(([cls, docs]) => {
      setClasses(cls);
      setDocuments(Array.isArray(docs) ? docs : docs?.results || []);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  const handleUpload = async () => {
    if (!formData.titre || !formData.module || !formData.fichier) {
      setSnackbar({ open: true, message: 'Veuillez remplir les champs obligatoires.', severity: 'warning' });
      return;
    }

    const fd = new FormData();
    fd.append('titre', formData.titre);
    fd.append('description', formData.description);
    fd.append('module', formData.module);
    fd.append('est_visible_etudiants', formData.est_visible_etudiants);
    fd.append('fichier', formData.fichier);

    try {
      await coursDocumentsService.upload(fd);
      setSnackbar({ open: true, message: 'Document uploadé avec succès.', severity: 'success' });
      setOpenDialog(false);
      setFormData({ titre: '', description: '', module: '', est_visible_etudiants: false, fichier: null });
      fetchDocuments();
    } catch (e) {
      setSnackbar({ open: true, message: 'Erreur lors de l\'upload.', severity: 'error' });
    }
  };

  const handleToggleVisibility = async (doc) => {
    try {
      const result = await coursDocumentsService.toggleVisibilite(doc.id);
      setDocuments(prev => prev.map(d => d.id === doc.id ? { ...d, est_visible_etudiants: result.est_visible_etudiants } : d));
    } catch (e) {
      console.error(e);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce document ?')) return;
    try {
      await coursDocumentsService.remove(id);
      setDocuments(prev => prev.filter(d => d.id !== id));
      setSnackbar({ open: true, message: 'Document supprimé.', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Erreur lors de la suppression.', severity: 'error' });
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  const uniqueModules = [...new Map(classes.map(c => [c.module_id, { id: c.module_id, nom: c.module_nom }])).values()];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold">Mes Cours & Documents</Typography>
        <Button variant="contained" startIcon={<CloudUploadIcon />} onClick={() => setOpenDialog(true)}>
          Importer un document
        </Button>
      </Box>

      <Paper>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell><strong>Titre</strong></TableCell>
                <TableCell><strong>Module</strong></TableCell>
                <TableCell><strong>Date</strong></TableCell>
                <TableCell align="center"><strong>Visible étudiants</strong></TableCell>
                <TableCell align="center"><strong>Actions</strong></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {documents.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">Aucun document importé</TableCell>
                </TableRow>
              ) : (
                documents.map((doc) => (
                  <TableRow key={doc.id}>
                    <TableCell>
                      <Typography fontWeight="bold">{doc.titre}</Typography>
                      {doc.description && <Typography variant="caption" color="text.secondary">{doc.description}</Typography>}
                    </TableCell>
                    <TableCell>{doc.module_nom}</TableCell>
                    <TableCell>{new Date(doc.date_upload).toLocaleDateString('fr-FR')}</TableCell>
                    <TableCell align="center">
                      <Chip
                        label={doc.est_visible_etudiants ? 'Visible' : 'Masqué'}
                        color={doc.est_visible_etudiants ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton size="small" onClick={() => handleToggleVisibility(doc)} title={doc.est_visible_etudiants ? 'Masquer' : 'Rendre visible'}>
                        {doc.est_visible_etudiants ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                      {doc.fichier_url && (
                        <IconButton size="small" component="a" href={doc.fichier_url} target="_blank" title="Télécharger">
                          <DownloadIcon />
                        </IconButton>
                      )}
                      <IconButton size="small" color="error" onClick={() => handleDelete(doc.id)} title="Supprimer">
                        <DeleteIcon />
                      </IconButton>
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
        <DialogTitle>Importer un document de cours</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Titre du document"
            value={formData.titre}
            onChange={(e) => setFormData(f => ({ ...f, titre: e.target.value }))}
            fullWidth
            required
          />
          <TextField
            label="Description (optionnel)"
            value={formData.description}
            onChange={(e) => setFormData(f => ({ ...f, description: e.target.value }))}
            fullWidth
            multiline
            rows={2}
          />
          <FormControl fullWidth required>
            <InputLabel>Module</InputLabel>
            <Select
              value={formData.module}
              label="Module"
              onChange={(e) => setFormData(f => ({ ...f, module: e.target.value }))}
            >
              {uniqueModules.map(m => (
                <MenuItem key={m.id} value={m.id}>{m.nom}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button variant="outlined" component="label">
            {formData.fichier ? formData.fichier.name : 'Choisir un fichier'}
            <input
              type="file"
              hidden
              onChange={(e) => setFormData(f => ({ ...f, fichier: e.target.files[0] }))}
            />
          </Button>
          <FormControlLabel
            control={
              <Switch
                checked={formData.est_visible_etudiants}
                onChange={(e) => setFormData(f => ({ ...f, est_visible_etudiants: e.target.checked }))}
              />
            }
            label="Rendre visible aux étudiants"
          />
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
