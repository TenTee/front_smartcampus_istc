'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Button,
  Chip,
  Card,
  CardContent,
  CardActions,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import MenuBookIcon from '@mui/icons-material/MenuBook';
import { coursDocumentsService } from '../../../../services/api/services';

export default function CoursEtudiantsPage() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    coursDocumentsService.listForStudents()
      .then(data => setDocuments(Array.isArray(data) ? data : data?.results || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Documents de cours</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Retrouvez ici les supports de cours mis à disposition par vos formateurs.
      </Typography>

      {documents.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <MenuBookIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1 }} />
          <Typography color="text.secondary">Aucun document de cours disponible pour le moment.</Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {documents.map((doc) => (
            <Grid item xs={12} sm={6} md={4} key={doc.id}>
              <Card variant="outlined" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>{doc.titre}</Typography>
                  <Chip label={doc.module_nom} size="small" color="primary" variant="outlined" sx={{ mb: 1 }} />
                  {doc.description && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                      {doc.description}
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                    Ajouté le {new Date(doc.date_upload).toLocaleDateString('fr-FR')}
                  </Typography>
                </CardContent>
                <CardActions>
                  {doc.fichier_url && (
                    <Button
                      size="small"
                      startIcon={<DownloadIcon />}
                      component="a"
                      href={doc.fichier_url}
                      target="_blank"
                    >
                      Télécharger
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
}
