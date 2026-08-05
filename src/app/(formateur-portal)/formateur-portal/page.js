'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Avatar,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import ClassIcon from '@mui/icons-material/Class';
import GradeIcon from '@mui/icons-material/Grade';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import { useRouter } from 'next/navigation';
import { formateurPortalService } from '../../../services/api/services';

export default function FormateurDashboard() {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const dashboardData = await formateurPortalService.dashboard();
        setData(dashboardData);
      } catch {
        try {
          const [me, stats] = await Promise.all([
            formateurPortalService.me(),
            formateurPortalService.monSuivi(),
          ]);
          setData({
            profil: {
              id: me.id,
              nom: me.nom,
              email: me.email,
              type_formateur: me.type_formateur,
              specialites_nom: me.specialites_nom || [],
            },
            stats: {
              total_classes: stats.total_classes || 0,
              total_modules: stats.total_modules || 0,
              total_seances_semaine: stats.total_seances_semaine || 0,
              total_notes_saisies: stats.total_notes_saisies || 0,
              total_etudiants: 0,
            },
            prochaines_seances: [],
            classes_resume: (me.classes || []).map((cls) => ({
              classe_id: cls.id,
              classe_nom: cls.nom,
              effectif: 0,
              modules: [{ module_id: cls.module_id, module_nom: cls.module_nom }],
            })),
          });
        } catch (e2) {
          console.error(e2);
        }
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!data) {
    return (
      <Box sx={{ textAlign: 'center', mt: 10 }}>
        <Typography color="error">Impossible de charger le tableau de bord.</Typography>
      </Box>
    );
  }

  const { profil, stats, prochaines_seances, classes_resume } = data;

  const statCards = [
    {
      label: 'Classes',
      value: stats.total_classes,
      icon: <ClassIcon />,
      color: '#1976d2',
      path: '/formateur-portal/classes',
    },
    {
      label: 'Modules',
      value: stats.total_modules,
      icon: <SchoolIcon />,
      color: '#388e3c',
      path: '/formateur-portal/classes',
    },
    {
      label: 'Séances / semaine',
      value: stats.total_seances_semaine,
      icon: <AccessTimeIcon />,
      color: '#f57c00',
      path: '/formateur-portal/schedule',
    },
    {
      label: 'Notes saisies',
      value: stats.total_notes_saisies,
      icon: <GradeIcon />,
      color: '#7b1fa2',
      path: '/formateur-portal/notes',
    },
    {
      label: 'Étudiants',
      value: stats.total_etudiants,
      icon: <PeopleIcon />,
      color: '#00838f',
      path: '/formateur-portal/classes',
    },
  ];

  return (
    <Box>
      {/* Profile header */}
      <Paper sx={{ p: 3, mb: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
        <Avatar sx={{ width: 64, height: 64, bgcolor: '#1B3A5C', fontSize: '1.5rem' }}>
          {profil.nom?.charAt(0)?.toUpperCase() || 'F'}
        </Avatar>
        <Box>
          <Typography variant="h5" fontWeight="bold">{profil.nom}</Typography>
          <Typography variant="body2" color="text.secondary">{profil.email}</Typography>
          <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            <Chip
              label={profil.type_formateur === 'vacataire' ? 'Vacataire' : 'Permanent'}
              size="small"
              color="primary"
              variant="outlined"
            />
            {profil.specialites_nom?.map((s, i) => (
              <Chip key={i} label={s} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      </Paper>

      {/* Stats */}
      <Grid container spacing={3}>
        {statCards.map((card) => (
          <Grid item xs={12} sm={6} md={3} key={card.label}>
            <Paper
              sx={{
                p: 3,
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)', boxShadow: 4 },
              }}
              onClick={() => router.push(card.path)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: card.color, width: 48, height: 48 }}>
                  {card.icon}
                </Avatar>
                <Box>
                  <Typography variant="h4" fontWeight="bold">{card.value}</Typography>
                  <Typography variant="body2" color="text.secondary">{card.label}</Typography>
                </Box>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Prochaines séances */}
      {prochaines_seances?.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Prochaines Séances
          </Typography>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Jour</TableCell>
                  <TableCell>Horaire</TableCell>
                  <TableCell>Module</TableCell>
                  <TableCell>Classe</TableCell>
                  <TableCell>Salle</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {prochaines_seances.map((s, idx) => (
                  <TableRow key={idx}>
                    <TableCell sx={{ textTransform: 'capitalize' }}>{s.jour}</TableCell>
                    <TableCell>{s.heure_debut} - {s.heure_fin}</TableCell>
                    <TableCell>{s.module_nom}</TableCell>
                    <TableCell>{s.classe_nom}</TableCell>
                    <TableCell>{s.salle_nom}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      )}

      {/* Classes overview */}
      {classes_resume?.length > 0 && (
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" fontWeight="bold" gutterBottom>
            Mes Classes
          </Typography>
          <Grid container spacing={2}>
            {classes_resume.map((cls) => (
              <Grid item xs={12} sm={6} md={4} key={cls.classe_id}>
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <Typography fontWeight="bold">{cls.classe_nom}</Typography>
                  {cls.effectif > 0 && (
                    <Typography variant="body2" color="text.secondary">
                      {cls.effectif} étudiant{cls.effectif > 1 ? 's' : ''}
                    </Typography>
                  )}
                  <Box sx={{ mt: 1, display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {cls.modules.map((m) => (
                      <Chip key={m.module_id} label={m.module_nom} size="small" variant="outlined" />
                    ))}
                  </Box>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      )}
    </Box>
  );
}
