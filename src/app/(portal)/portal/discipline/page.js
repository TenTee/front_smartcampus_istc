'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Alert,
  Divider
} from '@mui/material';
import GavelIcon from '@mui/icons-material/Gavel';
import { etudiantsService } from '../../../../services/api/services';

export default function StudentDiscipline() {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDiscipline = async () => {
      try {
        const res = await etudiantsService.me();
        setStudent(res);
      } catch (error) {
        console.error("Erreur discipline:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDiscipline();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  if (!student) return <Typography color="error">Erreur de chargement.</Typography>;

  const activeSanctions = student.sanctions?.filter(s => s.active) || [];

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>État Disciplinaire</Typography>
      
      {activeSanctions.length > 0 ? (
        <Alert severity="warning" sx={{ mb: 4, borderRadius: 3 }}>
          Vous avez {activeSanctions.length} sanction(s) active(s) au dossier.
        </Alert>
      ) : (
        <Alert severity="success" sx={{ mb: 4, borderRadius: 3 }}>
          Votre dossier disciplinaire est exemplaire. Aucune sanction active.
        </Alert>
      )}

      <Card sx={{ borderRadius: 4, mb: 4, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
            <GavelIcon color="primary" />
            <Typography variant="h6" fontWeight="bold">Historique des Sanctions</Typography>
          </Box>
          <Divider sx={{ mb: 3 }} />
          
          <TableContainer component={Box}>
            <Table>
              <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Motif</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Durée</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {student.sanctions?.length > 0 ? (
                  student.sanctions.map((sanction) => (
                    <TableRow key={sanction.id} hover>
                      <TableCell>{new Date(sanction.date_sanction).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">{sanction.type_sanction}</Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 300 }}>{sanction.motif}</TableCell>
                      <TableCell>{sanction.duree || '-'}</TableCell>
                      <TableCell align="center">
                        <Chip 
                          label={sanction.active ? 'Active' : 'Levée'} 
                          size="small"
                          color={sanction.active ? 'error' : 'default'}
                          variant={sanction.active ? 'filled' : 'outlined'}
                        />
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">Aucune sanction enregistrée.</Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      <Typography variant="caption" color="text.secondary">
        Note : Les sanctions disciplinaires peuvent affecter l'obtention de certains certificats ou la participation à des activités du campus.
      </Typography>
    </Box>
  );
}
