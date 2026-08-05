'use client';

import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Grid, TextField, Button, CircularProgress, Divider, Avatar, IconButton } from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import { configurationEtablissementService } from '../../services/api/services';
import { getMediaUrl } from '../../services/api/client';

export default function EtablissementConfig({ setToast }) {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const [logoEnteteFile, setLogoEnteteFile] = useState(null);
  const [logoEntetePreview, setLogoEntetePreview] = useState(null);

  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const data = await configurationEtablissementService.getCurrent();
      setConfig(data);
      if (data.logo) setLogoPreview(getMediaUrl(data.logo));
      if (data.logo_entete) setLogoEntetePreview(getMediaUrl(data.logo_entete));
      if (data.signature_directeur) setSignaturePreview(getMediaUrl(data.signature_directeur));
    } catch (error) {
      console.error(error);
      setToast({ open: true, message: "Erreur lors du chargement de la configuration", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setConfig((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleLogoEnteteChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoEnteteFile(file);
      setLogoEntetePreview(URL.createObjectURL(file));
    }
  };

  const handleSignatureChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSignatureFile(file);
      setSignaturePreview(URL.createObjectURL(file));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formData = new FormData();
      const excludedKeys = ['logo', 'logo_entete', 'signature_directeur', 'id', 'created_at', 'updated_at'];
      Object.keys(config).forEach(key => {
        if (!excludedKeys.includes(key) && config[key] !== null && config[key] !== undefined) {
          formData.append(key, config[key]);
        }
      });

      if (logoFile) {
        formData.append('logo', logoFile);
      }
      if (logoEnteteFile) {
        formData.append('logo_entete', logoEnteteFile);
      }
      if (signatureFile) {
        formData.append('signature_directeur', signatureFile);
      }

      await configurationEtablissementService.updateConfig(config.id, formData);
      setToast({ open: true, message: "Configuration de l'établissement sauvegardée avec succès", severity: "success" });
      
      // Reload config to get updated URLs
      loadConfig();
      
      // Notify the app that the config changed (to update themes)
      window.dispatchEvent(new Event('appConfigChanged'));
    } catch (error) {
      console.error(error);
      const errorData = error.response?.data;
      let errorMsg = "Erreur lors de la sauvegarde";
      
      if (errorData && typeof errorData === 'object') {
        // Formate les erreurs DRF (ex: { nom: ["Ce champ est requis"] })
        errorMsg = Object.entries(errorData)
          .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
          .join(' | ');
      }
      
      setToast({ open: true, message: errorMsg, severity: "error" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Paper sx={{ p: 3, borderRadius: 3, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Paper>
    );
  }

  if (!config) return null;

  return (
    <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Configuration de l'Établissement & Apparence Globale
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={4}>
        Modifiez les informations de contact, l'identité visuelle et les informations du directeur. Ces données s'appliqueront partout et sur les documents PDF générés.
      </Typography>

      <Grid container spacing={4}>
        {/* SECTION IDENTITE VISUELLE */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Identité Visuelle
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={logoPreview}
                variant="rounded"
                sx={{ width: 80, height: 80, bgcolor: 'grey.200' }}
              >
                Logo
              </Avatar>
              <Box>
                <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                  Logo principal
                  <input hidden accept="image/*" type="file" onChange={handleLogoChange} />
                </Button>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  Affiché dans la sidebar et l&apos;app
                </Typography>
              </Box>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                src={logoEntetePreview}
                variant="rounded"
                sx={{ width: 80, height: 80, bgcolor: 'grey.200' }}
              >
                Doc
              </Avatar>
              <Box>
                <Button variant="outlined" component="label" startIcon={<PhotoCamera />}>
                  Logo documents
                  <input hidden accept="image/*" type="file" onChange={handleLogoEnteteChange} />
                </Button>
                <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
                  Affiché en en-tête des relevés et certificats
                </Typography>
              </Box>
            </Box>
            
            <TextField
              label="Couleur Primaire"
              type="color"
              name="couleur_primaire"
              value={config.couleur_primaire || '#193A7F'}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Couleur Secondaire"
              type="color"
              name="couleur_secondaire"
              value={config.couleur_secondaire || '#2A52A1'}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Couleur Texte"
              type="color"
              name="couleur_texte"
              value={config.couleur_texte || '#333333'}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Typographie (CSS Font Family)"
              name="typographie"
              value={config.typographie || "'Inter', sans-serif"}
              onChange={handleChange}
              fullWidth
              helperText="Ex: 'Roboto', sans-serif"
            />
          </Box>
        </Grid>

        {/* SECTION INFOS CONTACT */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Informations de Contact
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nom de l'établissement"
              name="nom"
              value={config.nom || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Téléphone"
              name="telephone"
              value={config.telephone || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Email"
              name="email"
              type="email"
              value={config.email || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Adresse"
              name="adresse"
              value={config.adresse || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Ville"
              name="ville"
              value={config.ville || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Site Web"
              name="site_web"
              type="url"
              value={config.site_web || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Slogan / Devise"
              name="slogan"
              value={config.slogan || ''}
              onChange={handleChange}
              fullWidth
              helperText="Affiché en bas du relevé de notes"
            />
          </Box>
        </Grid>

        {/* SECTION DIRECTION */}
        <Grid item xs={12} md={4}>
          <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
            Direction
          </Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Nom du Directeur"
              name="nom_directeur"
              value={config.nom_directeur || ''}
              onChange={handleChange}
              fullWidth
            />
            <TextField
              label="Titre du Directeur"
              name="titre_directeur"
              value={config.titre_directeur || 'Le Directeur Général'}
              onChange={handleChange}
              fullWidth
            />

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Signature (affichée sur les documents)
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 1 }}>
                <Box
                  sx={{
                    width: 120,
                    height: 60,
                    border: '1px dashed grey',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden',
                    bgcolor: 'grey.50'
                  }}
                >
                  {signaturePreview ? (
                    <img src={signaturePreview} alt="Signature" style={{ maxWidth: '100%', maxHeight: '100%' }} />
                  ) : (
                    <Typography variant="caption" color="text.secondary">Aucune</Typography>
                  )}
                </Box>
                <Button variant="outlined" component="label" size="small" startIcon={<PhotoCamera />}>
                  Uploader
                  <input hidden accept="image/*" type="file" onChange={handleSignatureChange} />
                </Button>
              </Box>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
        <Button variant="contained" onClick={handleSave} disabled={saving} size="large">
          {saving ? <CircularProgress size={24} color="inherit" /> : 'Enregistrer la configuration'}
        </Button>
      </Box>
    </Paper>
  );
}
