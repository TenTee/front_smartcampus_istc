'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
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
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import LockIcon from '@mui/icons-material/Lock';
import AddIcon from '@mui/icons-material/Add';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { vacationsService } from '../../../../services/api/services';
import { getApiErrorMessage } from '../../../../services/api/client';
import {
  MOIS,
  MonthPicker,
  StatutRecapChip,
  TimeInput,
  formatDateFr,
  formatHeures,
  formatMontant,
  toList,
  todayIso,
} from '../../../../components/vacations/common';
import PointagesTable from '../../../../components/vacations/PointagesTable';

const maintenant = () => {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const decalerDate = (iso, jours) => {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d + jours);
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
};

const cleLigne = (ligne) => (ligne.seance_id ? `s${ligne.seance_id}` : `p${ligne.pointage?.id}`);

const brouillonDepuis = (ligne) => {
  const p = ligne.pointage;
  return {
    statut: p?.statut || 'present',
    heure_arrivee: p?.heure_arrivee ? p.heure_arrivee.slice(0, 5) : '',
    heure_fin: p?.heure_fin ? p.heure_fin.slice(0, 5) : '',
    heures_corrigees: p?.heures_corrigees ?? '',
    commentaire: p?.commentaire || '',
  };
};

// ---------------------------------------------------------------------------
// Onglet 1 : pointage du jour
// ---------------------------------------------------------------------------
function PointageDuJour({ filiere, enseignants, notify }) {
  const [date, setDate] = useState(todayIso());
  const [lignes, setLignes] = useState([]);
  const [brouillons, setBrouillons] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState({});
  const [openAjout, setOpenAjout] = useState(false);
  const estAujourdhui = date === todayIso();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vacationsService.seances({ date, ...(filiere ? { filiere } : {}) });
      const data = res?.seances || [];
      setLignes(data);
      setBrouillons(Object.fromEntries(data.map((l) => [cleLigne(l), brouillonDepuis(l)])));
    } catch (e) {
      notify(getApiErrorMessage(e, 'Impossible de charger les séances.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [date, filiere, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const majBrouillon = (cle, champ, valeur) =>
    setBrouillons((prev) => ({ ...prev, [cle]: { ...prev[cle], [champ]: valeur } }));

  const enregistrer = async (ligne) => {
    const cle = cleLigne(ligne);
    const b = brouillons[cle];
    if (b.statut === 'present' && !b.heure_arrivee) {
      notify("Saisissez l'heure d'arrivée (ou marquez l'enseignant absent).", 'warning');
      return;
    }
    const payload = {
      statut: b.statut,
      heure_arrivee: b.statut === 'present' ? b.heure_arrivee || null : null,
      heure_fin: b.statut === 'present' ? b.heure_fin || null : null,
      heures_corrigees: b.heures_corrigees === '' || b.heures_corrigees === null ? null : Number(b.heures_corrigees),
      commentaire: b.commentaire || '',
    };
    setSaving((s) => ({ ...s, [cle]: true }));
    try {
      if (ligne.pointage?.id) {
        await vacationsService.pointages.patch(ligne.pointage.id, payload);
      } else {
        await vacationsService.pointages.create({ ...payload, seance: ligne.seance_id, date });
      }
      notify(`Pointage enregistré pour ${ligne.formateur_nom}.`, 'success');
      load();
    } catch (e) {
      notify(getApiErrorMessage(e, "Erreur lors de l'enregistrement."), 'error');
    } finally {
      setSaving((s) => ({ ...s, [cle]: false }));
    }
  };

  const supprimer = async (ligne) => {
    if (!ligne.pointage?.id) return;
    if (!window.confirm(`Supprimer le pointage de ${ligne.formateur_nom} ?`)) return;
    try {
      await vacationsService.pointages.remove(ligne.pointage.id);
      notify('Pointage supprimé.', 'success');
      load();
    } catch (e) {
      notify(getApiErrorMessage(e, 'Suppression impossible.'), 'error');
    }
  };

  const nbPointes = lignes.filter((l) => l.pointage).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton onClick={() => setDate(decalerDate(date, -1))}><ChevronLeftIcon /></IconButton>
          <TextField
            type="date"
            size="small"
            value={date}
            onChange={(e) => e.target.value && setDate(e.target.value)}
            inputProps={{ max: todayIso() }}
          />
          <IconButton onClick={() => setDate(decalerDate(date, 1))} disabled={estAujourdhui}><ChevronRightIcon /></IconButton>
          {!estAujourdhui && <Button size="small" onClick={() => setDate(todayIso())}>Aujourd&apos;hui</Button>}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 1, textTransform: 'capitalize' }}>
            {formatDateFr(date)} · {nbPointes}/{lignes.length} pointée(s)
          </Typography>
        </Box>
        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => setOpenAjout(true)}>
          Séance non planifiée
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : lignes.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">
            Aucune séance planifiée ce jour dans l&apos;emploi du temps. Utilisez « Séance non planifiée » pour un rattrapage.
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: '#F5F7FA' }}>
              <TableRow>
                <TableCell>Prévu</TableCell>
                <TableCell>Enseignant</TableCell>
                <TableCell>Cours</TableCell>
                <TableCell>Présence</TableCell>
                <TableCell>Arrivée</TableCell>
                <TableCell>Fin</TableCell>
                <TableCell>Heures</TableCell>
                <TableCell>Commentaire</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {lignes.map((ligne) => {
                const cle = cleLigne(ligne);
                const b = brouillons[cle] || brouillonDepuis(ligne);
                const verrouille = Boolean(ligne.pointage?.est_verrouille);
                const absent = b.statut === 'absent';
                return (
                  <TableRow key={cle} sx={absent ? { bgcolor: 'rgba(211,47,47,0.04)' } : undefined}>
                    <TableCell sx={{ whiteSpace: 'nowrap' }}>
                      {ligne.heure_debut_prevue ? `${ligne.heure_debut_prevue} – ${ligne.heure_fin_prevue}` : '—'}
                      {!ligne.planifiee && <Chip label="Hors planning" size="small" variant="outlined" sx={{ display: 'flex', mt: 0.5 }} />}
                    </TableCell>
                    <TableCell>
                      <Typography fontWeight={600} variant="body2">{ligne.formateur_nom}</Typography>
                      <Chip
                        label={ligne.type_formateur === 'vacataire' ? 'Vacataire' : 'Permanent'}
                        size="small"
                        variant="outlined"
                        color={ligne.type_formateur === 'vacataire' ? 'warning' : 'default'}
                        sx={{ height: 20, fontSize: '0.7rem' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{ligne.module_nom}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {ligne.classe_nom}{ligne.salle_nom ? ` · ${ligne.salle_nom}` : ''}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={b.statut}
                        disabled={verrouille}
                        onChange={(_, v) => v && majBrouillon(cle, 'statut', v)}
                      >
                        <ToggleButton value="present" color="success">Présent</ToggleButton>
                        <ToggleButton value="absent" color="error">Absent</ToggleButton>
                      </ToggleButtonGroup>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimeInput
                          value={b.heure_arrivee}
                          disabled={verrouille || absent}
                          onChange={(v) => majBrouillon(cle, 'heure_arrivee', v)}
                        />
                        {estAujourdhui && !verrouille && !absent && (
                          <Tooltip title="Arrivé maintenant">
                            <IconButton size="small" onClick={() => majBrouillon(cle, 'heure_arrivee', maintenant())}>
                              <LoginIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <TimeInput
                          value={b.heure_fin}
                          disabled={verrouille || absent}
                          onChange={(v) => majBrouillon(cle, 'heure_fin', v)}
                        />
                        {estAujourdhui && !verrouille && !absent && (
                          <Tooltip title="Terminé maintenant">
                            <IconButton size="small" onClick={() => majBrouillon(cle, 'heure_fin', maintenant())}>
                              <LogoutIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                    <TableCell sx={{ minWidth: 110 }}>
                      {ligne.pointage ? (
                        <Typography variant="body2" fontWeight={600}>{formatHeures(ligne.pointage.heures_retenues)}</Typography>
                      ) : (
                        <Typography variant="caption" color="text.secondary">Non pointé</Typography>
                      )}
                      {!absent && (
                        <TextField
                          size="small"
                          type="number"
                          placeholder="Corriger"
                          value={b.heures_corrigees}
                          disabled={verrouille}
                          onChange={(e) => majBrouillon(cle, 'heures_corrigees', e.target.value)}
                          inputProps={{ min: 0, step: 0.25 }}
                          sx={{ width: 95, mt: 0.5 }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <TextField
                        size="small"
                        value={b.commentaire}
                        disabled={verrouille}
                        onChange={(e) => majBrouillon(cle, 'commentaire', e.target.value)}
                        placeholder="Retard, motif…"
                        sx={{ minWidth: 140 }}
                      />
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                      {verrouille ? (
                        <Tooltip title="Récap du mois clôturé : rouvrez-le pour modifier">
                          <LockIcon color="disabled" />
                        </Tooltip>
                      ) : (
                        <>
                          <Tooltip title="Enregistrer">
                            <span>
                              <IconButton color="primary" onClick={() => enregistrer(ligne)} disabled={saving[cle]}>
                                {saving[cle] ? <CircularProgress size={18} /> : <SaveIcon />}
                              </IconButton>
                            </span>
                          </Tooltip>
                          {ligne.pointage && (
                            <Tooltip title="Supprimer le pointage">
                              <IconButton color="error" onClick={() => supprimer(ligne)}><DeleteIcon /></IconButton>
                            </Tooltip>
                          )}
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <AjoutSeanceDialog
        open={openAjout}
        onClose={() => setOpenAjout(false)}
        date={date}
        enseignants={enseignants}
        notify={notify}
        onSaved={() => {
          setOpenAjout(false);
          load();
        }}
      />
    </Box>
  );
}

function AjoutSeanceDialog({ open, onClose, date, enseignants, notify, onSaved }) {
  const vide = { formateur: '', cours: '', date, heure_debut_prevue: '', heure_fin_prevue: '', heure_arrivee: '', heure_fin: '', commentaire: '' };
  const [form, setForm] = useState(vide);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setForm({ ...vide, date });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, date]);

  const enseignant = enseignants.find((e) => e.id === form.formateur);
  const cours = enseignant?.cours || [];

  const submit = async () => {
    const c = cours[Number(form.cours)];
    if (!form.formateur || !c || !form.heure_arrivee) {
      notify("Enseignant, cours et heure d'arrivée sont obligatoires.", 'warning');
      return;
    }
    setSaving(true);
    try {
      await vacationsService.pointages.create({
        formateur: form.formateur,
        module: c.module_id,
        classe: c.classe_id,
        date: form.date,
        heure_debut_prevue: form.heure_debut_prevue || null,
        heure_fin_prevue: form.heure_fin_prevue || null,
        heure_arrivee: form.heure_arrivee,
        heure_fin: form.heure_fin || null,
        statut: 'present',
        commentaire: form.commentaire,
      });
      notify('Séance ajoutée.', 'success');
      onSaved();
    } catch (e) {
      notify(getApiErrorMessage(e, "Erreur lors de l'ajout."), 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Séance non planifiée (rattrapage, séance supplémentaire)</DialogTitle>
      <DialogContent dividers>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <FormControl fullWidth size="small">
              <InputLabel>Enseignant</InputLabel>
              <Select
                label="Enseignant"
                value={form.formateur}
                onChange={(e) => setForm({ ...form, formateur: e.target.value, cours: '' })}
              >
                {enseignants.map((e) => (
                  <MenuItem key={e.id} value={e.id}>{e.nom} {e.type_formateur === 'vacataire' ? '(vacataire)' : ''}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth size="small" disabled={!enseignant}>
              <InputLabel>Cours (module · classe)</InputLabel>
              <Select label="Cours (module · classe)" value={form.cours} onChange={(e) => setForm({ ...form, cours: e.target.value })}>
                {cours.map((c, i) => (
                  <MenuItem key={`${c.module_id}-${c.classe_id}`} value={String(i)}>
                    {c.module_nom}{c.classe_nom ? ` · ${c.classe_nom}` : ''}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth size="small" type="date" label="Date" InputLabelProps={{ shrink: true }}
              value={form.date} inputProps={{ max: todayIso() }}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TimeInput label="Début prévu" value={form.heure_debut_prevue} onChange={(v) => setForm({ ...form, heure_debut_prevue: v })} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TimeInput label="Fin prévue" value={form.heure_fin_prevue} onChange={(v) => setForm({ ...form, heure_fin_prevue: v })} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TimeInput label="Arrivée *" value={form.heure_arrivee} onChange={(v) => setForm({ ...form, heure_arrivee: v })} />
          </Grid>
          <Grid item xs={6} sm={4}>
            <TimeInput label="Fin" value={form.heure_fin} onChange={(v) => setForm({ ...form, heure_fin: v })} />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth size="small" label="Commentaire" value={form.commentaire}
              onChange={(e) => setForm({ ...form, commentaire: e.target.value })}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Annuler</Button>
        <Button variant="contained" onClick={submit} disabled={saving}>
          {saving ? <CircularProgress size={20} /> : 'Ajouter'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Onglet 2 : enseignants de la filière
// ---------------------------------------------------------------------------
function ListeEnseignants({ enseignants, loading }) {
  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>;
  if (enseignants.length === 0) {
    return <Alert severity="info">Aucun enseignant n&apos;est affecté ou planifié dans cette filière pour l&apos;année en cours.</Alert>;
  }
  return (
    <TableContainer component={Paper} variant="outlined">
      <Table size="small">
        <TableHead sx={{ bgcolor: '#F5F7FA' }}>
          <TableRow>
            <TableCell>Enseignant</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Taux horaire</TableCell>
            <TableCell>Contact</TableCell>
            <TableCell>Cours à assurer</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {enseignants.map((e) => (
            <TableRow key={e.id}>
              <TableCell sx={{ fontWeight: 600 }}>{e.nom}</TableCell>
              <TableCell>
                <Chip
                  size="small"
                  label={e.type_formateur === 'vacataire' ? 'Vacataire' : 'Permanent'}
                  color={e.type_formateur === 'vacataire' ? 'warning' : 'default'}
                  variant="outlined"
                />
              </TableCell>
              <TableCell>{e.type_formateur === 'vacataire' ? `${formatMontant(e.taux_horaire)}/h` : '—'}</TableCell>
              <TableCell>
                <Typography variant="body2">{e.contact}</Typography>
                <Typography variant="caption" color="text.secondary">{e.email}</Typography>
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {e.cours.map((c) => (
                    <Chip key={`${c.module_id}-${c.classe_id}`} size="small" label={`${c.module_nom}${c.classe_nom ? ` · ${c.classe_nom}` : ''}`} />
                  ))}
                </Box>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

// ---------------------------------------------------------------------------
// Onglet 3 : récapitulatif mensuel
// ---------------------------------------------------------------------------
function RecapMensuel({ filiere, notify }) {
  const now = new Date();
  const [periode, setPeriode] = useState({ mois: now.getMonth() + 1, annee: now.getFullYear() });
  const [data, setData] = useState({ recaps: [], mois_termine: false });
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState(null);
  const [detailPointages, setDetailPointages] = useState([]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await vacationsService.recapsCoordonnateur({ ...periode, ...(filiere ? { filiere } : {}) });
      setData(res);
    } catch (e) {
      notify(getApiErrorMessage(e, 'Impossible de charger le récapitulatif.'), 'error');
    } finally {
      setLoading(false);
    }
  }, [periode, filiere, notify]);

  useEffect(() => {
    load();
  }, [load]);

  const action = async (fn, message) => {
    try {
      await fn();
      notify(message, 'success');
      load();
    } catch (e) {
      notify(getApiErrorMessage(e, 'Action impossible.'), 'error');
    }
  };

  const ouvrirDetail = async (recap) => {
    setDetail(recap);
    setDetailPointages([]);
    try {
      const res = await vacationsService.pointages.list({
        formateur: recap.formateur, filiere: recap.filiere, mois: recap.mois, annee: recap.annee,
      });
      setDetailPointages(toList(res).sort((a, b) => (a.date < b.date ? -1 : 1)));
    } catch (e) {
      notify(getApiErrorMessage(e, 'Impossible de charger le détail.'), 'error');
    }
  };

  const totaux = useMemo(() => data.recaps.reduce(
    (acc, r) => ({ heures: acc.heures + Number(r.total_heures), montant: acc.montant + Number(r.montant) }),
    { heures: 0, montant: 0 },
  ), [data.recaps]);
  const aCloturer = data.recaps.filter((r) => ['ouvert', 'rejete'].includes(r.statut)).length;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <MonthPicker mois={periode.mois} annee={periode.annee} onChange={setPeriode} />
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Total : <strong>{formatHeures(totaux.heures)}</strong> · <strong>{formatMontant(totaux.montant)}</strong>
          </Typography>
          <Button
            variant="contained"
            disabled={!data.mois_termine || aCloturer === 0}
            onClick={() => {
              if (window.confirm(`Clôturer les ${aCloturer} récapitulatif(s) de ${MOIS[periode.mois - 1]} ${periode.annee} et les transmettre à la finance ?`)) {
                action(() => vacationsService.cloturerTout({ ...periode, ...(filiere ? { filiere } : {}) }), 'Récapitulatifs clôturés et transmis à la finance.');
              }
            }}
          >
            Tout clôturer ({aCloturer})
          </Button>
        </Box>
      </Box>

      {!data.mois_termine && (
        <Alert severity="info" sx={{ mb: 2 }}>
          Le mois n&apos;est pas terminé : les heures sont provisoires. La clôture sera possible à partir du dernier jour du mois.
        </Alert>
      )}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}><CircularProgress /></Box>
      ) : data.recaps.length === 0 ? (
        <Paper variant="outlined" sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="text.secondary">Aucun pointage pour cette période.</Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper} variant="outlined">
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
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.recaps.map((r) => (
                <TableRow key={r.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight={600}>{r.formateur_nom}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {r.type_formateur === 'vacataire' ? `Vacataire · ${formatMontant(r.taux_horaire)}/h` : 'Permanent'}
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
                  <TableCell align="right" sx={{ whiteSpace: 'nowrap' }}>
                    <Tooltip title="Détail des pointages">
                      <IconButton size="small" onClick={() => ouvrirDetail(r)}><VisibilityIcon fontSize="small" /></IconButton>
                    </Tooltip>
                    {['ouvert', 'rejete'].includes(r.statut) && (
                      <Button
                        size="small"
                        disabled={!data.mois_termine}
                        onClick={() => action(() => vacationsService.cloturerRecap(r.id), `Récapitulatif de ${r.formateur_nom} clôturé.`)}
                      >
                        Clôturer
                      </Button>
                    )}
                    {r.statut === 'cloture' && (
                      <Button size="small" color="warning" onClick={() => action(() => vacationsService.rouvrirRecap(r.id), 'Récapitulatif rouvert.')}>
                        Rouvrir
                      </Button>
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
          {detail?.formateur_nom} – {detail ? `${MOIS[detail.mois - 1]} ${detail.annee}` : ''} ({detail?.filiere_nom})
        </DialogTitle>
        <DialogContent dividers>
          <PointagesTable pointages={detailPointages} />
        </DialogContent>
        <DialogActions><Button onClick={() => setDetail(null)}>Fermer</Button></DialogActions>
      </Dialog>
    </Box>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function CoordinationPage() {
  const [filieres, setFilieres] = useState([]);
  const [filiere, setFiliere] = useState('');
  const [tab, setTab] = useState(0);
  const [enseignants, setEnseignants] = useState([]);
  const [loadingEns, setLoadingEns] = useState(false);
  const [accesRefuse, setAccesRefuse] = useState(false);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const notify = useCallback((message, severity = 'success') => setToast({ open: true, message, severity }), []);

  useEffect(() => {
    vacationsService
      .mesFilieres()
      .then((res) => {
        const list = Array.isArray(res) ? res : [];
        setFilieres(list);
        if (list.length === 1) setFiliere(list[0].id);
      })
      .catch((e) => {
        if (e?.response?.status === 403) setAccesRefuse(true);
      });
  }, []);

  const loadEnseignants = useCallback(async () => {
    if (accesRefuse) return;
    setLoadingEns(true);
    try {
      const res = await vacationsService.enseignants(filiere ? { filiere } : {});
      setEnseignants(Array.isArray(res) ? res : []);
    } catch {
      setEnseignants([]);
    } finally {
      setLoadingEns(false);
    }
  }, [filiere, accesRefuse]);

  useEffect(() => {
    loadEnseignants();
  }, [loadEnseignants]);

  if (accesRefuse) {
    return <Alert severity="warning">Vous n&apos;êtes coordonnateur d&apos;aucune filière. Contactez l&apos;administration.</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2, mb: 2 }}>
        <Box>
          <Typography variant="h5" fontWeight="bold">Coordination de filière</Typography>
          <Typography variant="body2" color="text.secondary">
            Pointage des enseignants (arrivée / fin) et récapitulatif mensuel des heures.
          </Typography>
        </Box>
        {filieres.length > 1 && (
          <FormControl size="small" sx={{ minWidth: 220 }}>
            <InputLabel>Filière</InputLabel>
            <Select label="Filière" value={filiere} onChange={(e) => setFiliere(e.target.value)}>
              <MenuItem value="">Toutes mes filières</MenuItem>
              {filieres.map((f) => <MenuItem key={f.id} value={f.id}>{f.nom}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        {filieres.length === 1 && <Chip color="primary" label={filieres[0].nom} />}
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="scrollable">
          <Tab label="Pointage du jour" />
          <Tab label={`Enseignants (${enseignants.length})`} />
          <Tab label="Récapitulatif mensuel" />
        </Tabs>
      </Paper>

      {tab === 0 && <PointageDuJour filiere={filiere} enseignants={enseignants} notify={notify} />}
      {tab === 1 && <ListeEnseignants enseignants={enseignants} loading={loadingEns} />}
      {tab === 2 && <RecapMensuel filiere={filiere} notify={notify} />}

      <Snackbar
        open={toast.open}
        autoHideDuration={4000}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert severity={toast.severity} onClose={() => setToast((t) => ({ ...t, open: false }))} variant="filled">
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
