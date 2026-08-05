"use client";

import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import {
  anneesAcademiquesService,
  epreuvesService,
  semestresService,
  classesService,
  modulesService,
  formateursService,
} from '../../../services/api/services';
import { getApiErrorMessage, getMediaUrl } from '../../../services/api/client';

function toList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

export default function ExamsBankAdminPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openImporter, setOpenImporter] = useState(false);
  const [previewDialog, setPreviewDialog] = useState({ open: false, url: '', title: '' });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const [selectedEpreuve, setSelectedEpreuve] = useState(null);
  const [options, setOptions] = useState({ classes: [], modules: [], annees: [], semestres: [], formateurs: [] });
  const [formData, setFormData] = useState({
    nom: '',
    description: '',
    classe: '',
    module: '',
    annee_academique: '',
    semestre: '',
    type_epreuve: 'EXAMEN',
    fichier: null,
    corrige: null,
    auteur: '',
    est_partage: true,
  });

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await epreuvesService.list();
        if (!mounted) return;
        setItems(toList(res));
      } catch (e) {
        console.error(e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [classes, modules, annees, semestres, formateurs] = await Promise.all([
          classesService.list().catch(() => []),
          modulesService.list().catch(() => []),
          anneesAcademiquesService.list().catch(() => []),
          semestresService.list().catch(() => []),
          formateursService.list().catch(() => []),
        ]);
        if (!mounted) return;
        setOptions({
          classes: toList(classes),
          modules: toList(modules),
          annees: toList(annees),
          semestres: toList(semestres),
          formateurs: toList(formateurs),
        });
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleEdit = (item) => {
    const matchingClass = options.classes?.find((c) => {
      const fil = c.filiere?.id || c.filiere;
      const niv = c.niveau?.id || c.niveau;
      return Number(fil) === Number(item.filiere) && Number(niv) === Number(item.niveau);
    });

    setFormData({
      nom: item.nom || '',
      description: item.description || '',
      classe: matchingClass?.id || '',
      module: item.module || (item.module && item.module.id) || item.module_id || '',
      annee_academique: item.annee_academique || (item.annee_academique && item.annee_academique.id) || item.annee_academique_id || '',
      semestre: item.semestre || (item.semestre && item.semestre.id) || item.semestre_id || '',
      type_epreuve: item.type_epreuve || 'EXAMEN',
      fichier: null,
      corrige: null,
      auteur: item.auteur || '',
      est_partage: Boolean(item.est_partage),
    });
    setSelectedEpreuve(item);
    setOpenImporter(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Confirmer la suppression de cette épreuve ?')) return;
    try {
      await epreuvesService.remove(id);
      await refreshItems();
      setToast({ open: true, message: 'Épreuve supprimée.', severity: 'success' });
    } catch (err) {
      setToast({ open: true, message: getApiErrorMessage(err, 'Erreur lors de la suppression.'), severity: 'error' });
    }
  };

  const download = (filePath) => {
    if (!filePath) return;
    window.open(getMediaUrl(filePath), '_blank');
  };

  const handlePreview = (filePath, title) => {
    if (!filePath) return;
    setPreviewDialog({ open: true, url: getMediaUrl(filePath), title });
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked, files } = event.target;
    if (type === 'file') {
      setFormData((prev) => ({ ...prev, [name]: files[0] || null }));
      return;
    }
    if (type === 'checkbox') {
      setFormData((prev) => ({ ...prev, [name]: checked }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value, ...(name === 'classe' ? { module: '' } : {}) }));
  };

  const handleSubmit = async () => {
    setError('');
    // When creating require fichier, when editing allow keeping existing fichier
    if (!formData.nom || !formData.classe || !formData.module || !formData.annee_academique || (!selectedEpreuve && !formData.fichier)) {
      setError('Veuillez renseigner le nom, la classe, le module, l’année académique et le fichier sujet.');
      return;
    }

    const selectedClass = options.classes?.find((item) => Number(item.id) === Number(formData.classe));
    const filiereId = selectedClass?.filiere?.id || selectedClass?.filiere;
    const niveauId = selectedClass?.niveau?.id || selectedClass?.niveau;

    if (!filiereId || !niveauId) {
      setError('La classe sélectionnée doit être liée à une filière et un niveau.');
      return;
    }

    setSaving(true);
    try {
      const payload = new FormData();
      payload.append('filiere', filiereId);
      payload.append('niveau', niveauId);
      Object.entries(formData).forEach(([key, value]) => {
        if (value === null || value === undefined || value === '') return;
        if (key === 'classe') return;
        payload.append(key, value);
      });

      if (selectedEpreuve) {
        await epreuvesService.patch(selectedEpreuve.id, payload);
        setToast({ open: true, message: 'Épreuve mise à jour.', severity: 'success' });
      } else {
        await epreuvesService.create(payload);
        setToast({ open: true, message: 'Épreuve importée avec succès.', severity: 'success' });
      }

      setOpenImporter(false);
      setSelectedEpreuve(null);
      setFormData({
        nom: '',
        description: '',
        module: '',
        classe: '',
        annee_academique: '',
        semestre: '',
        type_epreuve: 'EXAMEN',
        fichier: null,
        corrige: null,
        auteur: '',
        est_partage: true,
      });
      await refreshItems();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Erreur lors de l\'import de l\'épreuve.'));
    } finally {
      setSaving(false);
    }
  };

  const availableModules = React.useMemo(() => {
    if (!formData.classe) return [];
    const selectedClass = options.classes?.find((item) => Number(item.id) === Number(formData.classe));
    if (!selectedClass || !selectedClass.modules) return [];
    const classModuleIds = selectedClass.modules.map((m) => (typeof m === 'object' ? m.id : m)).map(Number);
    return options.modules.filter((module) => classModuleIds.includes(Number(module.id)));
  }, [formData.classe, options.classes, options.modules]);

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">Banque d&apos;épreuves (Administration)</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setSelectedEpreuve(null);
            setFormData({
              nom: '',
              description: '',
              module: '',
              classe: '',
              annee_academique: '',
              semestre: '',
              type_epreuve: 'EXAMEN',
              fichier: null,
              corrige: null,
              auteur: '',
              est_partage: true,
            });
            setOpenImporter(true);
          }}
        >
          Importer une épreuve
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={2}>
          {items.map((it) => (
            <Grid item xs={12} sm={6} md={4} key={it.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="subtitle1">{it.nom}</Typography>
                    <Chip label={it.type_epreuve} size="small" />
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {it.module_nom} — {it.filiere_nom} / {it.niveau_nom}
                  </Typography>
                  <Typography variant="caption" display="block">
                    Auteur: {it.auteur || '-'} — {it.annee_academique_libelle}
                  </Typography>
                  <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Button size="small" startIcon={<VisibilityIcon />} variant="outlined" onClick={() => handlePreview(it.fichier, `Sujet — ${it.nom}`)} disabled={!it.fichier}>
                      Voir Sujet
                    </Button>
                    <Button size="small" startIcon={<VisibilityIcon />} variant="outlined" color="success" onClick={() => handlePreview(it.corrige, `Corrigé — ${it.nom}`)} disabled={!it.corrige}>
                      Voir Corrigé
                    </Button>
                    <Button size="small" onClick={() => download(it.fichier)} disabled={!it.fichier}>
                      Télécharger Sujet
                    </Button>
                    <Button size="small" onClick={() => download(it.corrige)} disabled={!it.corrige}>
                      Télécharger Corrigé
                    </Button>
                    <Button size="small" onClick={() => handleEdit(it)}>Modifier</Button>
                    <Button size="small" color="error" onClick={() => handleDelete(it.id)}>Supprimer</Button>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
          {items.length === 0 && (
            <Grid item xs={12}>
              <Alert severity="info">Aucune épreuve disponible. Importez une épreuve pour commencer.</Alert>
            </Grid>
          )}
        </Grid>
      )}

      <Dialog open={openImporter} onClose={() => setOpenImporter(false)} maxWidth="md" fullWidth>
        <DialogTitle>Importer une épreuve</DialogTitle>
        <DialogContent dividers>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Nom de l&apos;épreuve"
                name="nom"
                value={formData.nom}
                onChange={handleInputChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Auteur (Formateur)</InputLabel>
                <Select
                  label="Auteur (Formateur)"
                  name="auteur"
                  value={formData.auteur}
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Sélectionner</MenuItem>
                  {options.formateurs?.map((f) => (
                    <MenuItem key={f.id} value={f.id}>
                      {f.nom || f.email || `Formateur ${f.id}`}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Classe</InputLabel>
                <Select
                  label="Classe"
                  name="classe"
                  value={formData.classe}
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Sélectionner</MenuItem>
                  {options.classes?.map((item) => (
                    <MenuItem key={item.id} value={item.id}>{item.nom || item.name || `Classe ${item.id}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Module</InputLabel>
                <Select
                  label="Module"
                  name="module"
                  value={formData.module}
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Sélectionner</MenuItem>
                  {availableModules.map((item) => (
                    <MenuItem key={item.id} value={item.id}>{item.nom}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Année académique</InputLabel>
                <Select
                  label="Année académique"
                  name="annee_academique"
                  value={formData.annee_academique}
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Sélectionner</MenuItem>
                  {options.annees.map((item) => (
                    <MenuItem key={item.id} value={item.id}>{item.libelle}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Semestre</InputLabel>
                <Select
                  label="Semestre"
                  name="semestre"
                  value={formData.semestre}
                  onChange={handleInputChange}
                >
                  <MenuItem value="">Aucun</MenuItem>
                  {options.semestres.map((item) => (
                    <MenuItem key={item.id} value={item.id}>{item.nom || item.libelle || `Semestre ${item.id}`}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Type d&apos;épreuve</InputLabel>
                <Select
                  label="Type d&apos;épreuve"
                  name="type_epreuve"
                  value={formData.type_epreuve}
                  onChange={handleInputChange}
                >
                  <MenuItem value="DEVOIR">Devoir</MenuItem>
                  <MenuItem value="EXAMEN">Examen</MenuItem>
                  <MenuItem value="RATTRAPAGE">Rattrapage</MenuItem>
                  <MenuItem value="TP">TP</MenuItem>
                  <MenuItem value="AUTRE">Autre</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.est_partage}
                    onChange={handleInputChange}
                    name="est_partage"
                  />
                }
                label="Rendre accessible aux étudiants"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button variant="outlined" component="label" fullWidth>
                Charger le sujet
                <input
                  type="file"
                  hidden
                  name="fichier"
                  accept=".pdf,.doc,.docx"
                  onChange={handleInputChange}
                />
              </Button>
              {formData.fichier && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{formData.fichier.name}</Typography>}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button variant="outlined" component="label" fullWidth>
                Charger le corrigé
                <input
                  type="file"
                  hidden
                  name="corrige"
                  accept=".pdf,.doc,.docx"
                  onChange={handleInputChange}
                />
              </Button>
              {formData.corrige && <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>{formData.corrige.name}</Typography>}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImporter(false)} color="inherit" disabled={saving}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}>
            {saving ? 'Importation...' : 'Importer'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewDialog.open} onClose={() => setPreviewDialog({ open: false, url: '', title: '' })} maxWidth="lg" fullWidth>
        <DialogTitle>{previewDialog.title}</DialogTitle>
        <DialogContent sx={{ p: 0, height: '75vh' }}>
          {previewDialog.url && (
            <iframe
              src={previewDialog.url}
              style={{ width: '100%', height: '100%', border: 'none' }}
              title={previewDialog.title}
            />
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => download(previewDialog.url)} variant="outlined">
            Télécharger
          </Button>
          <Button onClick={() => setPreviewDialog({ open: false, url: '', title: '' })} variant="contained">
            Fermer
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={3000}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        message={toast.message}
      />
    </Box>
  );
}
