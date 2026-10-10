'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { vacationsService } from '../../../../services/api/services';
import { getApiErrorMessage } from '../../../../services/api/client';
import {
  MOIS,
  MonthPicker,
  StatutRecapChip,
  formatDateFr,
  formatHeure,
  formatHeures,
  formatMontant,
} from '../../../../components/vacations/common';

function Kpi({ label, value, hint, color = '#193A7F' }) {
  return (
    <Paper sx={{ p: 2.5, height: '100%', borderTop: `3px solid ${color}` }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h5" fontWeight="bold" sx={{ mt: 0.5 }}>{value}</Typography>
      {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
    </Paper>
  );
}

export default function MesHeuresPage() {
  const now = new Date();
  const [periode, setPeriode] = useState({ mois: now.getMonth() + 1, annee: now.getFullYear() });
  const [data, setData] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [res, hist] = await Promise.all([
        vacationsService.mesHeures(periode),
        vacationsService.historique().catch(() => []),
      ]);
      setData(res);
      setHistorique(Array.isArray(hist) ? hist : []);
    } catch (e) {
      setError(getApiErrorMessage(e, 'Impossible de charger vos heures.'));
    } finally {
      setLoading(false);
    }
  }, [periode]);

  useEffect(() => {
    load();
  }, [load]);

  const estVacataire = data?.formateur?.type_formateur === 'vacataire';

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Mes heures</Typography>
          <Typography variant="body2" color="text.secondary">
            Heures pointées par le coordonnateur de chaque filière et récapitulatif mensuel.
          </Typography>
        </Box>
        <MonthPicker mois={periode.mois} annee={periode.annee} onChange={setPeriode} />
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>
      ) : data && (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6} md={3}>
              <Kpi label="Heures effectuées" value={formatHeures(data.totaux.heures)} hint={`${MOIS[data.mois - 1]} ${data.annee}`} />
            </Grid>
            <Grid item xs={6} md={3}>
              <Kpi label="Séances assurées" value={data.totaux.seances} color="#2e7d32" />
            </Grid>
            <Grid item xs={6} md={3}>
              <Kpi label="Absences" value={data.totaux.absences} color={data.totaux.absences > 0 ? '#d32f2f' : '#9e9e9e'} />
            </Grid>
            <Grid item xs={6} md={3}>
              {estVacataire ? (
                <Kpi
                  label="Montant estimé"
                  value={formatMontant(data.totaux.montant_estime)}
                  hint={`Validé : ${formatMontant(data.totaux.montant_valide)} · ${formatMontant(data.formateur.taux_horaire)}/h`}
                  color="#ed6c02"
                />
              ) : (
                <Kpi label="Statut" value="Permanent" hint="Heures suivies à titre informatif" color="#ed6c02" />
              )}
            </Grid>
          </Grid>

          <Paper sx={{ p: 2.5, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Récapitulatif par filière</Typography>
            {data.recaps.length === 0 ? (
              <Typography color="text.secondary">Aucune heure pointée pour cette période.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Filière</TableCell>
                      <TableCell align="right">Séances</TableCell>
                      <TableCell align="right">Absences</TableCell>
                      <TableCell align="right">Heures</TableCell>
                      {estVacataire && <TableCell align="right">Montant</TableCell>}
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recaps.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.filiere_nom}</TableCell>
                        <TableCell align="right">{r.nombre_seances}</TableCell>
                        <TableCell align="right">{r.nombre_absences}</TableCell>
                        <TableCell align="right" sx={{ fontWeight: 600 }}>{formatHeures(r.total_heures)}</TableCell>
                        {estVacataire && <TableCell align="right">{formatMontant(r.montant)}</TableCell>}
                        <TableCell>
                          <StatutRecapChip statut={r.statut} />
                          {r.statut === 'rejete' && r.motif_rejet && (
                            <Typography variant="caption" color="error" display="block">{r.motif_rejet}</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          <Paper sx={{ p: 2.5, mb: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>Détail des pointages</Typography>
            {data.pointages.length === 0 ? (
              <Typography color="text.secondary">Aucun pointage.</Typography>
            ) : (
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Date</TableCell>
                      <TableCell>Filière / Classe</TableCell>
                      <TableCell>Cours</TableCell>
                      <TableCell>Prévu</TableCell>
                      <TableCell>Arrivée</TableCell>
                      <TableCell>Fin</TableCell>
                      <TableCell align="right">Heures</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.pointages.map((p) => (
                      <TableRow key={p.id} sx={p.statut === 'absent' ? { bgcolor: 'rgba(211,47,47,0.04)' } : undefined}>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{formatDateFr(p.date)}</TableCell>
                        <TableCell>
                          {p.filiere_nom}
                          {p.classe_nom && <Typography variant="caption" color="text.secondary" display="block">{p.classe_nom}</Typography>}
                        </TableCell>
                        <TableCell>
                          {p.module_nom || '—'}
                          {!p.seance && <Chip label="Hors planning" size="small" variant="outlined" sx={{ ml: 1 }} />}
                        </TableCell>
                        <TableCell>
                          {p.heure_debut_prevue ? `${formatHeure(p.heure_debut_prevue)} – ${formatHeure(p.heure_fin_prevue)}` : '—'}
                        </TableCell>
                        {p.statut === 'absent' ? (
                          <TableCell colSpan={2}><Chip label="Absent" color="error" size="small" /></TableCell>
                        ) : (
                          <>
                            <TableCell>{formatHeure(p.heure_arrivee)}</TableCell>
                            <TableCell>{formatHeure(p.heure_fin)}</TableCell>
                          </>
                        )}
                        <TableCell align="right" sx={{ fontWeight: 600 }}>
                          {formatHeures(p.heures_retenues)}
                          {p.heures_corrigees !== null && p.heures_corrigees !== undefined && (
                            <Typography variant="caption" color="text.secondary" display="block">corrigé</Typography>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>

          {historique.length > 0 && (
            <Paper sx={{ p: 2.5 }}>
              <Typography variant="h6" fontWeight="bold" gutterBottom>Historique</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Mois</TableCell>
                      <TableCell align="right">Heures</TableCell>
                      {estVacataire && <TableCell align="right">Montant</TableCell>}
                      <TableCell>Statut</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {historique.map((h) => (
                      <TableRow
                        key={`${h.annee}-${h.mois}`}
                        hover
                        sx={{ cursor: 'pointer' }}
                        onClick={() => setPeriode({ mois: h.mois, annee: h.annee })}
                      >
                        <TableCell>{MOIS[h.mois - 1]} {h.annee}</TableCell>
                        <TableCell align="right">{formatHeures(h.heures)}</TableCell>
                        {estVacataire && <TableCell align="right">{formatMontant(h.montant)}</TableCell>}
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {h.statuts.map((s) => <StatutRecapChip key={s} statut={s} />)}
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}
        </>
      )}
    </Box>
  );
}
