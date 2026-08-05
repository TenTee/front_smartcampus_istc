'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  CircularProgress,
  Chip,
  Divider,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PersonIcon from '@mui/icons-material/Person';
import { emploiDuTempsService } from '../../../../services/api/services';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

export default function StudentSchedule() {
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      try {
        // me() is a custom action we added
        const res = await emploiDuTempsService.me();
        setSchedule(res);
      } catch (error) {
        console.error("Erreur emploi du temps:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;

  const getSessionsForDay = (day) => {
    return schedule
      .filter(s => s.jour === day)
      .sort((a, b) => a.heure_debut.localeCompare(b.heure_debut));
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>Mon Emploi du Temps</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 4 }}>
        Planning hebdomadaire des cours et activités.
      </Typography>

      <Grid container spacing={3}>
        {DAYS.map((day) => {
          const sessions = getSessionsForDay(day);
          return (
            <Grid item xs={12} md={6} lg={4} key={day}>
              <Paper sx={{ p: 2, borderRadius: 3, height: '100%', bgcolor: sessions.length > 0 ? 'white' : '#F8F9FA' }}>
                <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>{day}</Typography>
                <Divider sx={{ mb: 2 }} />
                
                {sessions.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {sessions.map((session, idx) => (
                      <CardSession key={idx} session={session} />
                    ))}
                  </Box>
                ) : (
                  <Box sx={{ py: 4, textAlign: 'center', opacity: 0.5 }}>
                    <Typography variant="body2">Aucun cours prévu</Typography>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
}

function CardSession({ session }) {
  return (
    <Box 
      sx={{ 
        p: 2, 
        borderRadius: 2, 
        borderLeft: '4px solid',
        borderColor: 'primary.main',
        bgcolor: 'rgba(25, 58, 127, 0.03)',
        transition: 'transform 0.2s',
        '&:hover': { transform: 'scale(1.02)' }
      }}
    >
      <Typography variant="subtitle2" fontWeight="bold" gutterBottom>{session.module_nom}</Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <AccessTimeIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">
          {session.heure_debut.substring(0, 5)} - {session.heure_fin.substring(0, 5)}
        </Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
        <LocationOnIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">{session.salle_nom || session.salle}</Typography>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <PersonIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
        <Typography variant="caption" color="text.secondary">{session.formateur_nom}</Typography>
      </Box>
    </Box>
  );
}
