'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckIcon from '@mui/icons-material/CheckCircleOutline';
import CloseIcon from '@mui/icons-material/HighlightOff';
import { useRouter } from 'next/navigation';
import { vacationsService } from '../../../../services/api/services';
import { getApiErrorMessage } from '../../../../services/api/client';
import { useUserPermissions } from '../../../../utils/permissions';
import {
  MOIS,
  MonthPicker,
  STATUTS_RECAP,
  StatutRecapChip,
  formatHeures,
  formatMontant,
  toList,
} from '../../../../components/vacations/common';
import PointagesTable from '../../../../components/vacations/PointagesTable';

function Kpi({ label, value, color }) {
  return (
    <Paper sx={{ p: 2, borderLeft: `4px solid ${color}` }}>
      <Typography variant="body2" color="text.secondary">{label}</Typography>
      <Typography variant="h6" fontWeight="bold">{value}</Typography>
    </Paper>
  );
}

export default function HeuresVacatairesPage() {
  const router = useRouter();
  const { canWrite } = useUserPermissions();
  const canValidate = canWrite('can_manage_finance');

  const now = new Date();
  const moisPrecedent = now.getMonth() === 0 ? { mois: 12, annee: now.getFullYear() - 1 } : { mois: now.getMonth(), annee: now.getFullYear() };
  const [periode, setPeriode] = useState(moisPrecedent);
  const [statut, setStatut] = useState('');
  const [recaps, setRecaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [detailPointages, setDetailPointages] = useState([]);
  const [rejet, setRejet] = useState(null);
  const [motif, setMotif] = useState('');
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });
  const notify = (message, severity = 'success') => setToast({ open: true, message, severity });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vacationsService.recaps({ ...periode, ...(statut ? { statut } : {}) });
      setRecaps(toList(res));
    } catch (e) {
      notify(getApiErrorMessage(e, 'Chargement impossible.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [periode, statut]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const sum = (list, k) => list.reduce((a, r) => a + Number(r[k] || 0), 0);
    const vac = recaps.filter((r) => r.type_formateur === 'vacataire');
    return {
      aValider: recaps.filter((r) => r.statut === 'cloture').length,
      enCours: recaps.filter((r) => ['ouvert', 'rejete'].includes(r.statut)).length,
      heures: sum(recaps, 'total_heures'),
      montantValide: sum(vac.filter((r) => ['valide', 'paye'].includes(r.statut)), 'montant'),
      montantTotal: sum(vac, 'montant'),
    };
  }, [recaps]);

  const ouvrirDetail = async (r) => {
    setDetail(r);
    setDetailPointages([]);
    try {
      setDetailPointages(toList(await vacationsService.recapPointages(r.id)));
    } catch (e) {
      notify(getApiErrorMessage(e, 'Détail indisponible.'), 'error');
    }
  };

  const valider = async (r) => {
    try {
      await vacationsService.validerRecap(r.id);
      notify(`Récapitulatif de ${r.formateur_nom} validé.`);
      setDetail(null);
      load();
    } catch (e) {
      notify(getApiErrorMessage(e, 'Validation impossible.'), 'error');
    }
  };

  const validerTout = async () => {
    const aValider = recaps.filter((r) => r.statut === 'cloture');
    if (!window.confirm(`Valider les ${aValider.length} récapitulatif(s) clôturé(s) ?`)) return;
    let ok = 0;
    for (const r of aValider) {
      try {
        await vacationsService.validerRecap(r.id);
        ok += 1;
      } catch {
        // on continue avec les suivants
      }
    }
    notify(`${ok}/${aValider.length} récapitulatif(s) validé(s).`, ok === aValider.length ? 'success' : 'warning');
    load();
  };

  const confirmerRejet = async () => {
    if (!motif.trim()) {
      notify('Indiquez le motif du rejet.', 'warning');
      return;
    }
    try {
      await vacationsService.rejeterRecap(rejet.id, motif.trim());
      notify('Récapitulatif renvoyé au coordonnateur.');
      setRejet(null);
      setDetail(null);
      load();
    } catch (e) {
      notify(getApiErrorMessage(e, 'Rejet impossible.'), 'error');
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Heures des enseignants vacataires</Typography>
          <Typography variant="body2" color="text.secondary">
            Récapitulatifs mensuels clôturés par les coordonnateurs. Les heures validées sont reprises automatiquement dans la campagne de paie.
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
          <MonthPicker mois={periode.mois} annee={periode.annee} onChange={setPeriode} />
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Statut</InputLabel>
            <Select label="Statut" value={statut} onChange={(e) => setStatut(e.target.value)}>
              <MenuItem value="">Tous</MenuItem>
              {Object.entries(STATUTS_RECAP).map(([k, v]) => <MenuItem key={k} value={k}>{v.label}</MenuItem>)}
            </Select>
          </FormControl>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} md={3}><Kpi label="À valider" value={stats.aValider} color="#0288d1" /></Grid>
        <Grid item xs={6} md={3}><Kpi label="Non clôturés par les coordonnateurs" value={stats.enCours} color="#9e9e9e" /></Grid>
        <Grid item xs={6} md={3}><Kpi label="Heures pointées" value={formatHeures(stats.heures)} color="#193A7F" /></Grid>
        <Grid item xs={6} md={3}>
          <Kpi label="Montant validé / total" value={`${formatMontant(stats.montantValide)} / ${formatMontant(stats.montantTotal)}`} color="#2e7d32" />
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, mb: 1.5 }}>
        <Button onClick={() => router.push('/finances/salaires-formateurs')}>Aller à la paie formateurs</Button>
        {canValidate && (
          <Button variant="contained" color="success" disabled={stats.aValider === 0} onClick={validerTout}>
            Valider tous les récaps clôturés ({stats.aValider})
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F5F7FA' }}>
              <TableRow>
                <TableCell>Enseignant</TableCell>
                <TableCell>Filière</TableCell>
                <TableCell align="right">Séances</TableCell>
                <TableCell align="right">Absences</TableCell>
                <TableCell align="right">Heures</TableCell>
                <TableCell align="right">Montant</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Clôturé par</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recaps.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                    Aucun récapitulatif pour {MOIS[periode.mois - 1]} {periode.annee}.
                  </TableCell>
                </TableRow>
              )}
              {recaps.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{r.formateur_nom}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.type_formateur === 'vacataire' ? `Vacataire · ${formatMontant(r.taux_horaire)}/h` : 'Permanent (non payé à l’heure)'}
                    </Typography>
                  </TableCell>
                  <TableCell>{r.filiere_nom}</TableCell>
                  <TableCell align="right">{r.nombre_seances}</TableCell>
                  <TableCell align="right">{r.nombre_absences}</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>{formatHeures(r.total_heures)}</TableCell>
                  <TableCell align="right">{r.type_formateur === 'vacataire' ? formatMontant(r.montant) : '—'}</TableCell>
                  <TableCell>
                    <StatutRecapChip statut={r.statut} />
                    {r.statut === 'rejete' && r.motif_rejet && (
                      <Typography variant="caption" color="error" display="block">{r.motif_rejet}</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{r.cloture_par_nom || '—'}</Typography>
                    {r.commentaire_coordonnateur && (
                      <Typography variant="caption" color="text.secondary">{r.commentaire_coordonnateur}</Typography>
                    )}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Détail">
                      <IconButton size="small" onClick={() => ouvrirDetail(r)}><VisibilityIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    {canValidate && r.statut === 'cloture' && (
                      <Tooltip title="Valider">
                        <IconButton size="small" color="success" onClick={() => valider(r)}><CheckIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                    {canValidate && ['cloture', 'valide'].includes(r.statut) && !r.bulletin && (
                      <Tooltip title="Rejeter (renvoyer au coordonnateur)">
                        <IconButton size="small" color="error" onClick={() => { setRejet(r); setMotif(''); }}><CloseIcon fontSize="small" /></IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={Boolean(detail)} onClose={() => setDetail(null)} maxWidth="md" fullWidth>
        <DialogTitle>
          {detail?.formateur_nom} – {detail ? `${MOIS[detail.mois - 1]} ${detail.annee}` : ''} · {detail?.filiere_nom}
        </DialogTitle>
        <DialogContent dividers>
          {detail && (
            <Box sx={{ display: 'flex', gap: 3, mb: 2, flexWrap: 'wrap' }}>
              <Typography>Heures : <strong>{formatHeures(detail.total_heures)}</strong></Typography>
              <Typography>Montant : <strong>{formatMontant(detail.montant)}</strong></Typography>
              <StatutRecapChip statut={detail.statut} />
            </Box>
          )}
          <PointagesTable pointages={detailPointages} />
        </DialogContent>
        <DialogActions>
          {canValidate && detail?.statut === 'cloture' && (
            <>
              <Button color="error" onClick={() => { setRejet(detail); setMotif(''); }}>Rejeter</Button>
              <Button variant="contained" color="success" onClick={() => valider(detail)}>Valider</Button>
            </>
          )}
          <Button onClick={() => setDetail(null)}>Fermer</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(rejet)} onClose={() => setRejet(null)} maxWidth="sm" fullWidth>
        <DialogTitle>Rejeter le récapitulatif de {rejet?.formateur_nom}</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Le récapitulatif sera renvoyé au coordonnateur pour correction des pointages.
          </Typography>
          <TextField
            autoFocus fullWidth multiline minRows={3} label="Motif du rejet *"
            value={motif} onChange={(e) => setMotif(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejet(null)}>Annuler</Button>
          <Button variant="contained" color="error" onClick={confirmerRejet}>Rejeter</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((t) => ({ ...t, open: false }))}>
        <Alert severity={toast.severity} variant="filled" onClose={() => setToast((t) => ({ ...t, open: false }))}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
