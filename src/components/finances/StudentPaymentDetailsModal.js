import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  Paper,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
} from '@mui/material';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import AddCardIcon from '@mui/icons-material/AddCard';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonIcon from '@mui/icons-material/Person';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

import { paiementsService, studentScheduleService } from '@/services/api/services';
import { getMediaUrl } from '@/services/api/client';
import { formatDate } from '@/utils/formatters';

function formatFCFA(val) {
  return `${Number(val || 0).toLocaleString('fr-FR')} FCFA`;
}

export default function StudentPaymentDetailsModal({
  open,
  onClose,
  student,
  onOpenPayment,
}) {
  const [currentTab, setCurrentTab] = useState(0);
  const [payments, setPayments] = useState([]);
  const [scheduleData, setScheduleData] = useState(null);
  const [loadingPayments, setLoadingPayments] = useState(true);
  const [loadingSchedule, setLoadingSchedule] = useState(true);

  useEffect(() => {
    if (open && student?.etudiant) {
      fetchStudentDetails(student.etudiant);
    }
  }, [open, student]);

  const fetchStudentDetails = async (etudiantId) => {
    setLoadingPayments(true);
    setLoadingSchedule(true);
    try {
      const [paymentsRes, scheduleRes] = await Promise.all([
        paiementsService.list({ etudiant: etudiantId }).catch(() => []),
        studentScheduleService.get(etudiantId).catch(() => null),
      ]);
      setPayments(Array.isArray(paymentsRes) ? paymentsRes : paymentsRes?.results || []);
      setScheduleData(scheduleRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPayments(false);
      setLoadingSchedule(false);
    }
  };

  if (!student) return null;

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ fontWeight: 700, color: 'primary.main', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PersonIcon color="primary" />
          <span>Fiche Financière & Historique des Paiements</span>
        </Box>
        {onOpenPayment && (Number(student.solde_restant) || 0) > 0 && (
          <Button
            variant="contained"
            color="success"
            size="small"
            startIcon={<AddCardIcon />}
            onClick={() => {
              onClose();
              onOpenPayment(student);
            }}
          >
            Enregistrer un paiement
          </Button>
        )}
      </DialogTitle>
      <DialogContent dividers>
        {/* Banner Étudiant & Synthèse */}
        <Paper variant="outlined" sx={{ p: 2, mb: 3, borderRadius: 2, bgcolor: '#f8fafc' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="caption" color="text.secondary" fontWeight={700}>ÉTUDIANT & FORMATION</Typography>
              <Typography variant="h6" fontWeight={700} color="primary.dark">
                {student.etudiant_nom}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Class / Formation: <strong>{student.formation_nom}</strong>
              </Typography>
              {student.type_reduction && student.type_reduction !== 'NONE' && (
                <Box sx={{ mt: 1 }}>
                  <Chip
                    label={
                      student.type_reduction === 'BOURSE'
                        ? `Bourse ${student.bourse_code ? `(${student.bourse_code})` : ''} -${formatFCFA(student.montant_reduction)}`
                        : student.type_reduction === 'PERCENT_10'
                        ? `Réduction 10% (-${formatFCFA(student.montant_reduction)})`
                        : `Réduction libre (-${formatFCFA(student.montant_reduction)})`
                    }
                    color="secondary"
                    size="small"
                    sx={{ fontWeight: 700 }}
                  />
                </Box>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <Grid container spacing={1}>
                <Grid item xs={4}>
                  <Card variant="outlined" sx={{ bgcolor: '#fff', textCenter: 'center', p: 1 }}>
                    <Typography variant="caption" color="text.secondary">TOTAL DÛ</Typography>
                    <Typography variant="body2" fontWeight={700}>{formatFCFA(student.montant_du)}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined" sx={{ bgcolor: '#f0fdf4', textCenter: 'center', p: 1, borderColor: '#bbf7d0' }}>
                    <Typography variant="caption" color="success.main">PAYÉ</Typography>
                    <Typography variant="body2" fontWeight={700} color="success.main">{formatFCFA(student.montant_paye_total)}</Typography>
                  </Card>
                </Grid>
                <Grid item xs={4}>
                  <Card variant="outlined" sx={{ bgcolor: '#fef2f2', textCenter: 'center', p: 1, borderColor: '#fecaca' }}>
                    <Typography variant="caption" color="error.main">SOLDE</Typography>
                    <Typography variant="body2" fontWeight={700} color="error.main">{formatFCFA(student.solde_restant)}</Typography>
                  </Card>
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Paper>

        <Tabs value={currentTab} onChange={(e, v) => setCurrentTab(v)} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Tab icon={<ReceiptLongIcon fontSize="small" />} iconPosition="start" label={`Historique & Reçus (${payments.length})`} />
          <Tab icon={<CalendarMonthIcon fontSize="small" />} iconPosition="start" label="Échéancier des Tranches" />
        </Tabs>

        {/* TAB 0: HISTORIQUE DES PAIEMENTS & JUSTIFICATIFS */}
        {currentTab === 0 && (
          <Box>
            {loadingPayments ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : payments.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell><strong>Date & Heure</strong></TableCell>
                      <TableCell><strong>Type</strong></TableCell>
                      <TableCell><strong>Montant Payé</strong></TableCell>
                      <TableCell><strong>Mode</strong></TableCell>
                      <TableCell align="center"><strong>Justificatif / Reçu de paiement</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {payments.map((p) => (
                      <TableRow key={p.id} hover>
                        <TableCell>{p.date_paiement ? new Date(p.date_paiement).toLocaleString('fr-FR') : '-'}</TableCell>
                        <TableCell>
                          <Chip
                            label={p.paiement_type === 'INSCRIPTION' ? "Frais d'inscription" : "Frais de formation"}
                            color={p.paiement_type === 'INSCRIPTION' ? 'info' : 'primary'}
                            size="small"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell sx={{ fontWeight: 700, color: 'success.main' }}>
                          {formatFCFA(p.montant_paye)}
                        </TableCell>
                        <TableCell sx={{ textTransform: 'capitalize' }}>{p.moyen_paiement || 'Cash'}</TableCell>
                        <TableCell align="center">
                          {p.justificatif ? (
                            <Button
                              variant="outlined"
                              color="primary"
                              size="small"
                              startIcon={<AttachFileIcon />}
                              endIcon={<OpenInNewIcon fontSize="small" />}
                              component="a"
                              href={getMediaUrl(p.justificatif)}
                              target="_blank"
                              rel="noopener noreferrer"
                              sx={{ textTransform: 'none', py: 0.2 }}
                            >
                              Voir le justificatif
                            </Button>
                          ) : (
                            <Chip label="Aucun justificatif" size="small" variant="outlined" color="default" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                Aucun paiement n&apos;a été effectué pour cet étudiant.
              </Typography>
            )}
          </Box>
        )}

        {/* TAB 1: ÉCHÉANCIER DE REGLEMENT */}
        {currentTab === 1 && (
          <Box>
            {loadingSchedule ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress size={28} />
              </Box>
            ) : scheduleData?.installments?.length > 0 ? (
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                    <TableRow>
                      <TableCell><strong>Ordre</strong></TableCell>
                      <TableCell><strong>Tranche / Libellé</strong></TableCell>
                      <TableCell><strong>Date Échéance</strong></TableCell>
                      <TableCell><strong>Montant Dû</strong></TableCell>
                      <TableCell><strong>Montant Payé</strong></TableCell>
                      <TableCell><strong>Reste à Payer</strong></TableCell>
                      <TableCell><strong>Statut</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {scheduleData.installments.map((inst, idx) => (
                      <TableRow key={idx} hover>
                        <TableCell>{inst.order}</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>{inst.label}</TableCell>
                        <TableCell>{formatDate(inst.due_date)}</TableCell>
                        <TableCell>{formatFCFA(inst.amount_due)}</TableCell>
                        <TableCell sx={{ color: 'success.main', fontWeight: 600 }}>{formatFCFA(inst.amount_paid)}</TableCell>
                        <TableCell sx={{ color: Number(inst.balance_due) > 0 ? 'error.main' : 'text.secondary', fontWeight: 700 }}>
                          {formatFCFA(inst.balance_due)}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={
                              inst.status === 'PAID'
                                ? 'Payée'
                                : inst.status === 'PARTIAL'
                                ? 'Partielle'
                                : inst.status === 'OVERDUE'
                                ? 'En retard'
                                : 'En attente'
                            }
                            color={
                              inst.status === 'PAID'
                                ? 'success'
                                : inst.status === 'PARTIAL'
                                ? 'warning'
                                : inst.status === 'OVERDUE'
                                ? 'error'
                                : 'default'
                            }
                            size="small"
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3 }}>
                Aucun échéancier configuré pour cette classe ou cet étudiant.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="contained" color="primary">
          Fermer
        </Button>
      </DialogActions>
    </Dialog>
  );
}
