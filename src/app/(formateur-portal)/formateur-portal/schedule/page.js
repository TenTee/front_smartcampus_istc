'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  CircularProgress,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import RoomIcon from '@mui/icons-material/Room';
import { formateurPortalService } from '../../../../services/api/services';

const JOURS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function EmploiDuTempsPage() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    formateurPortalService.monEmploiDuTemps()
      .then(setSchedule)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  const scheduleByDay = {};
  JOURS.forEach(j => { scheduleByDay[j] = []; });
  schedule.forEach(s => {
    const jour = s.jour || s.jour_semaine;
    if (jour && scheduleByDay[jour]) {
      scheduleByDay[jour].push(s);
    }
  });

  Object.keys(scheduleByDay).forEach(jour => {
    scheduleByDay[jour].sort((a, b) => (a.heure_debut || '').localeCompare(b.heure_debut || ''));
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Mon Emploi du Temps</Typography>

      <Grid container spacing={2}>
        {JOURS.map(jour => (
          <Grid item xs={12} md={6} lg={4} key={jour}>
            <Paper sx={{ p: 2, minHeight: 150 }}>
              <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1, color: '#1B3A5C' }}>
                {jour}
              </Typography>
              {scheduleByDay[jour].length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                  Aucun cours prévu
                </Typography>
              ) : (
                scheduleByDay[jour].map((s, idx) => (
                  <Paper
                    key={idx}
                    variant="outlined"
                    sx={{ p: 1.5, mb: 1, borderLeft: '4px solid #1976d2' }}
                  >
                    <Typography variant="body2" fontWeight="bold">
                      {s.module_nom || s.module?.nom || 'Module'}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 0.5, flexWrap: 'wrap' }}>
                      <Chip
                        icon={<AccessTimeIcon />}
                        label={`${s.heure_debut} - ${s.heure_fin}`}
                        size="small"
                        variant="outlined"
                      />
                      {(s.salle_nom || s.salle?.nom) && (
                        <Chip
                          icon={<RoomIcon />}
                          label={s.salle_nom || s.salle?.nom}
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {s.classe_nom || s.classe?.nom || ''} {s.filiere_nom ? `- ${s.filiere_nom}` : ''}
                    </Typography>
                  </Paper>
                ))
              )}
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
