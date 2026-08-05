'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Collapse,
  IconButton,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { formateurPortalService } from '../../../../services/api/services';

export default function MesClassesPage() {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    formateurPortalService.mesClasses()
      .then(setClasses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  const toggleExpand = (idx) => {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Mes Classes & Étudiants</Typography>

      {classes.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Aucune affectation trouvée pour cette année académique.</Typography>
        </Paper>
      ) : (
        classes.map((cls, idx) => (
          <Paper key={idx} sx={{ mb: 2 }}>
            <Box
              sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
              onClick={() => toggleExpand(idx)}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Typography fontWeight="bold">{cls.classe_nom}</Typography>
                <Chip label={cls.module_nom} size="small" color="primary" variant="outlined" />
                <Chip label={`${cls.effectif} étudiants`} size="small" />
              </Box>
              <IconButton size="small">
                {expanded[idx] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            </Box>
            <Collapse in={expanded[idx]}>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell><strong>Matricule</strong></TableCell>
                      <TableCell><strong>Nom complet</strong></TableCell>
                      <TableCell><strong>Email</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {cls.etudiants.map((et) => (
                      <TableRow key={et.id}>
                        <TableCell>{et.matricule}</TableCell>
                        <TableCell>{et.nom}</TableCell>
                        <TableCell>{et.email}</TableCell>
                      </TableRow>
                    ))}
                    {cls.etudiants.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={3} align="center">Aucun étudiant inscrit</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Collapse>
          </Paper>
        ))
      )}
    </Box>
  );
}
