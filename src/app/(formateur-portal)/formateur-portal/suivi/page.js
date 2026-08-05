'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Avatar,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import ClassIcon from '@mui/icons-material/Class';
import SchoolIcon from '@mui/icons-material/School';
import GradeIcon from '@mui/icons-material/Grade';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { formateurPortalService } from '../../../../services/api/services';

export default function MonSuiviPage() {
  const [suivi, setSuivi] = useState(null);
  const [classes, setClasses] = useState([]);
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      formateurPortalService.monSuivi(),
      formateurPortalService.mesClasses(),
      formateurPortalService.monEmploiDuTemps(),
    ]).then(([s, c, sch]) => {
      setSuivi(s);
      setClasses(c);
      setSchedule(sch);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  const totalEtudiants = classes.reduce((sum, c) => sum + c.effectif, 0);

  const stats = [
    { label: 'Classes affectées', value: suivi?.total_classes || 0, icon: <ClassIcon />, color: '#1976d2' },
    { label: 'Modules enseignés', value: suivi?.total_modules || 0, icon: <SchoolIcon />, color: '#388e3c' },
    { label: 'Séances / semaine', value: suivi?.total_seances_semaine || 0, icon: <AccessTimeIcon />, color: '#f57c00' },
    { label: 'Notes saisies', value: suivi?.total_notes_saisies || 0, icon: <GradeIcon />, color: '#7b1fa2' },
  ];

  const jourCount = {};
  schedule.forEach(s => {
    const j = s.jour || s.jour_semaine || 'Inconnu';
    jourCount[j] = (jourCount[j] || 0) + 1;
  });

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Mon Suivi</Typography>

      {/* Stats grid */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: stat.color, width: 48, height: 48 }}>{stat.icon}</Avatar>
              <Box>
                <Typography variant="h4" fontWeight="bold">{stat.value}</Typography>
                <Typography variant="body2" color="text.secondary">{stat.label}</Typography>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      {/* Effectifs par classe */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Effectifs par classe ({totalEtudiants} étudiants au total)
            </Typography>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Classe</strong></TableCell>
                    <TableCell><strong>Module</strong></TableCell>
                    <TableCell align="center"><strong>Effectif</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {classes.map((cls, idx) => (
                    <TableRow key={idx}>
                      <TableCell>{cls.classe_nom}</TableCell>
                      <TableCell>{cls.module_nom}</TableCell>
                      <TableCell align="center">
                        <Chip label={cls.effectif} size="small" color="primary" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>

        {/* Répartition par jour */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Répartition des séances par jour
            </Typography>
            {Object.entries(jourCount).map(([jour, count]) => (
              <Box key={jour} sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">{jour}</Typography>
                  <Typography variant="body2" fontWeight="bold">{count} séance(s)</Typography>
                </Box>
                <LinearProgress
                  variant="determinate"
                  value={Math.min((count / (suivi?.total_seances_semaine || 1)) * 100, 100)}
                  sx={{ height: 8, borderRadius: 4 }}
                />
              </Box>
            ))}
            {Object.keys(jourCount).length === 0 && (
              <Typography variant="body2" color="text.secondary">Aucune séance programmée.</Typography>
            )}
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
