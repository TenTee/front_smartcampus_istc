'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  LinearProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  Divider
} from '@mui/material';
import { paiementsService } from '../../../../services/api/services';

const formatCurrency = (val) => `${Number(val || 0).toLocaleString('fr-FR')} FCFA`;

export default function StudentFinance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFinance = async () => {
      try {
        const res = await paiementsService.me();
        setData(res);
      } catch (error) {
        console.error("Erreur finance:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchFinance();
  }, []);

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box>;
  if (!data) return <Typography color="error">Erreur de chargement.</Typography>;

  const totalDu = data.inscription.du + data.formation.du;
  const totalPaye = data.inscription.paye + data.formation.paye;
  const percent = totalDu > 0? Math.round((totalPaye / totalDu) * 100) : 0;

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" color="primary" gutterBottom>Ma Situation Financière</Typography>
      
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={8}>
          <Card sx={{ borderRadius: 4, bgcolor: 'primary.main', color: 'white', p: 1 }}>
            <CardContent>
              <Typography variant="subtitle1">Progression de paiement scolarité globale</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 2, mb: 1 }}>
                <Box sx={{ flex: 1, mr: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={percent}
                    sx={{
                      height: 12,
                      borderRadius: 5,
                      bgcolor: 'rgba(255,255,255,0.2)',

                      '& .MuiLinearProgress-bar': {
                        bgcolor: '#4caf50' // vert
                      }
                    }}
                  />
                </Box>
                <Typography variant="h6">{percent}%</Typography>
              </Box>
              <Typography variant="body2" sx={{ opacity: 0.8 }}>
                Total payé : {formatCurrency(totalPaye)} / {formatCurrency(totalDu)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={4}>
          <Card sx={{ borderRadius: 4, height: '100%', display: 'flex', alignItems: 'center' }}>
            <CardContent sx={{ width: '100%' }}>
              <Typography variant="caption" color="text.secondary" uppercase>Reste à solder</Typography>
              <Typography variant="h5" fontWeight="bold" color="error.main">
                {formatCurrency(totalDu - totalPaye)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" gutterBottom>Détails par catégorie</Typography>
            <Divider sx={{ mb: 2 }} />
            <Stack spacing={2}>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Frais d'inscription</Typography>
                  <Chip 
                    label={data.inscription.reste <= 0 ? 'Soldé' : 'Partiel'} 
                    size="small" 
                    color={data.inscription.reste <= 0 ? 'success' : 'warning'} 
                  />
                </Box>
                <Typography variant="body1" fontWeight="bold">{formatCurrency(data.inscription.paye)} / {formatCurrency(data.inscription.du)}</Typography>
              </Box>
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">Frais de formation</Typography>
                  <Chip 
                    label={data.formation.reste <= 0 ? 'Soldé' : 'En cours'} 
                    size="small" 
                    color={data.formation.reste <= 0 ? 'success' : 'info'} 
                  />
                </Box>
                <Typography variant="body1" fontWeight="bold">{formatCurrency(data.formation.paye)} / {formatCurrency(data.formation.du)}</Typography>
              </Box>
            </Stack>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Typography variant="h6" sx={{ mb: 2 }}>Échéancier de paiement</Typography>
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: '#F5F7FA' }}>
                <TableRow>
                  <TableCell>Tranche</TableCell>
                  <TableCell>Date limite</TableCell>
                  <TableCell align="right">Montant</TableCell>
                  <TableCell align="center">Statut</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.echeances?.map((inst, idx) => (
                  <TableRow key={idx}>
                    <TableCell>{inst.label}</TableCell>
                    <TableCell>{new Date(inst.due_date).toLocaleDateString()}</TableCell>
                    <TableCell align="right">{formatCurrency(inst.amount_due)}</TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={inst.status === 'PAID' ? 'Payé' : inst.status === 'OVERDUE' ? 'Retard' : 'À venir'} 
                        size="small"
                        color={inst.status === 'PAID' ? 'success' : inst.status === 'OVERDUE' ? 'error' : 'default'}
                        variant={inst.status === 'PAID' ? 'filled' : 'outlined'}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>
      </Grid>
    </Box>
  );
}

// Minimal Stack component for simplicity if not using MUI Stack directly
function Stack({ children, spacing = 2 }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: spacing }}>
      {children}
    </Box>
  );
}
