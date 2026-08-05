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
  Grid,
  Card,
  CardContent
} from '@mui/material';
import { assiduiteService } from '../../../../services/api/services';
import { formatDate } from '../../../../utils/formatters';

export default function StudentAttendancePage() {
  const [absences, setAbsences] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        // We might need a .me() endpoint or filtered list for assiduite
        const data = await assiduiteService.list(); 
        // Note: Filtered by user on backend is expected if it's a student login
        setAbsences(Array.isArray(data) ? data : data.results || []);
      } catch (error) {
        console.error("Erreur assiduité:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAttendance();
  }, []);

  const stats = absences ? {
    total: absences.length,
    justified: absences.filter(a => a.justifie).length,
    unjustified: absences.filter(a => !a.justifie).length,
  } : { total: 0, justified: 0, unjustified: 0 };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
        Mon Assiduité
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Consultez l'historique de vos absences et leur état de justification.
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, bgcolor: '#193A7F', color: 'white' }}>
            <CardContent>
              <Typography variant="overline">Total Absences</Typography>
              <Typography variant="h3" fontWeight="bold">{stats.total}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, borderLeft: '6px solid #4CAF50' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Justifiées</Typography>
              <Typography variant="h3" fontWeight="bold" color="success.main">{stats.justified}</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={4}>
          <Card sx={{ borderRadius: 3, borderLeft: '6px solid #F44336' }}>
            <CardContent>
              <Typography variant="overline" color="text.secondary">Non Justifiées</Typography>
              <Typography variant="h3" fontWeight="bold" color="error.main">{stats.unjustified}</Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8f9fa' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Module / Cours</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>État</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Justification</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {absences.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  Félicitations ! Aucune absence enregistrée.
                </TableCell>
              </TableRow>
            ) : (
              absences.map((abs) => (
                <TableRow key={abs.id}>
                  <TableCell>{formatDate(abs.date)}</TableCell>
                  <TableCell>{abs.module_nom || 'N/A'}</TableCell>
                  <TableCell>{abs.type_absence || 'Absence'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={abs.justifie ? "Justifiée" : "Non Justifiée"} 
                      color={abs.justifie ? "success" : "error"}
                      size="small"
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>
                    {abs.motif_justification || '-'}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
