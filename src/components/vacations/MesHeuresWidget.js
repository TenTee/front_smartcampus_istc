'use client';

import React, { useEffect, useState } from 'react';
import { Box, Button, Paper, Typography, Grid } from '@mui/material';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import { useRouter } from 'next/navigation';
import { vacationsService } from '../../services/api/services';
import { MOIS, StatutRecapChip, formatHeures, formatMontant } from './common';

/** Récap du mois en cours affiché sur le tableau de bord de l'enseignant. */
export default function MesHeuresWidget() {
  const router = useRouter();
  const [data, setData] = useState(null);

  useEffect(() => {
    vacationsService.mesHeures().then(setData).catch(() => setData(null));
  }, []);

  if (!data) return null;

  const estVacataire = data.formateur?.type_formateur === 'vacataire';
  const statuts = [...new Set((data.recaps || []).map((r) => r.statut))];

  return (
    <Paper sx={{ p: 3, mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PendingActionsIcon color="primary" /> Mes heures – {MOIS[data.mois - 1]} {data.annee}
        </Typography>
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {statuts.map((s) => <StatutRecapChip key={s} statut={s} />)}
        </Box>
      </Box>
      <Grid container spacing={2}>
        <Grid item xs={6} md={3}>
          <Typography variant="body2" color="text.secondary">Heures pointées</Typography>
          <Typography variant="h5" fontWeight="bold">{formatHeures(data.totaux.heures)}</Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <Typography variant="body2" color="text.secondary">Séances</Typography>
          <Typography variant="h5" fontWeight="bold">{data.totaux.seances}</Typography>
        </Grid>
        <Grid item xs={6} md={3}>
          <Typography variant="body2" color="text.secondary">Absences</Typography>
          <Typography variant="h5" fontWeight="bold" color={data.totaux.absences > 0 ? 'error' : 'inherit'}>
            {data.totaux.absences}
          </Typography>
        </Grid>
        {estVacataire && (
          <Grid item xs={6} md={3}>
            <Typography variant="body2" color="text.secondary">Montant estimé</Typography>
            <Typography variant="h5" fontWeight="bold">{formatMontant(data.totaux.montant_estime)}</Typography>
          </Grid>
        )}
      </Grid>
      <Box sx={{ mt: 2, textAlign: 'right' }}>
        <Button size="small" onClick={() => router.push('/formateur-portal/mes-heures')}>Voir le détail</Button>
      </Box>
    </Paper>
  );
}
