'use client';

import React, { useEffect, useState } from 'react';
import { Box, Card, Typography, Avatar, CircularProgress } from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import { etudiantsService } from '../../services/api/services';

export default function PortalGuard({ children }) {
  const [situation, setSituation] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSituation = async () => {
    setLoading(true);
    try {
      const data = await etudiantsService.getSituation();
      setSituation(data);
    } catch (error) {
      console.error("Erreur situation:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSituation();

    const handleYearChange = () => {
      fetchSituation();
    };

    window.addEventListener('academicYearChanged', handleYearChange);
    return () => {
      window.removeEventListener('academicYearChanged', handleYearChange);
    };
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (situation && !situation.est_inscrit) {
    return (
      <Box sx={{ p: 4, textAlign: 'center', mt: 4 }}>
        <Card sx={{ borderRadius: 4, p: 4, maxWidth: 600, mx: 'auto', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Avatar sx={{ width: 80, height: 80, bgcolor: 'error.light' }}>
              <SchoolIcon sx={{ fontSize: 40, color: 'error.main' }} />
            </Avatar>
          </Box>
          <Typography variant="h5" fontWeight="bold" color="text.primary" gutterBottom>
            Inscription non trouvée
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Vous n&apos;êtes pas inscrit pour l&apos;année académique actuellement sélectionnée. 
            Veuillez sélectionner une autre année académique dans le menu ou contacter l&apos;administration pour régulariser votre situation.
          </Typography>
        </Card>
      </Box>
    );
  }

  return children;
}
