'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CircularProgress,
  InputAdornment,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import PhoneIcon from '@mui/icons-material/Phone';
import { preinscriptionsService } from '../../../../services/api/services';
import { getApiErrorMessage } from '../../../../services/api/client';
import ValidatePreinscriptionModal from '../../../../components/finances/ValidatePreinscriptionModal';

function toList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

export default function PreinscriptionsPage() {
  const [preinscriptions, setPreinscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [openModal, setOpenModal] = useState(false);
  const [selectedPreinscription, setSelectedPreinscription] = useState(null);
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  const fetchPreinscriptions = async () => {
    setLoading(true);
    try {
      const response = await preinscriptionsService.list();
      setPreinscriptions(toList(response));
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, 'Erreur de chargement'), severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPreinscriptions();
  }, []);

  const filteredPreinscriptions = useMemo(() => {
    return preinscriptions.filter((item) => {
      const fullname = [item.nom_candidat, item.prenom_candidat].filter(Boolean).join(' ').toLowerCase();
      const needle = searchTerm.toLowerCase();
      return (
        fullname.includes(needle) ||
        (item.telephone || '').toLowerCase().includes(needle) ||
        (item.email || '').toLowerCase().includes(needle) ||
        (item.filiere_souhaitee_nom || '').toLowerCase().includes(needle)
      );
    });
  }, [preinscriptions, searchTerm]);

  const handleApprove = async (payload) => {
    if (!selectedPreinscription) return;
    setSubmitting(true);
    try {
      await preinscriptionsService.approve(selectedPreinscription.id, payload);
      setToast({ open: true, message: 'Pré-inscription approuvée avec succès.', severity: 'success' });
      setOpenModal(false);
      await fetchPreinscriptions();
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, 'Approbation impossible'), severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async (item) => {
    setSubmitting(true);
    try {
      await preinscriptionsService.reject(item.id);
      setToast({ open: true, message: 'Pré-inscription désapprouvée.', severity: 'success' });
      await fetchPreinscriptions();
    } catch (error) {
      setToast({ open: true, message: getApiErrorMessage(error, 'Désapprobation impossible'), severity: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Gestion des pré-inscriptions
        </Typography>
      </Box>

      <Card sx={{ mb: 3, p: 2, borderRadius: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Rechercher nom, téléphone, email..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ minWidth: 320 }}
        />
      </Card>

      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F5F7FA' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Candidat</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Téléphone</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Formation</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Niveau</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Date</TableCell>
              <TableCell align="right" sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : filteredPreinscriptions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((item) => (
                <TableRow key={item.id} hover>
                  <TableCell>{[item.nom_candidat, item.prenom_candidat].filter(Boolean).join(' ')}</TableCell>
                  <TableCell>
                    {item.telephone ? (
                      <a href={`tel:${item.telephone.replace(/\s/g, '')}`} style={{ textDecoration: 'none', color: '#1976d2', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <PhoneIcon sx={{ fontSize: 16 }} />
                        {item.telephone}
                      </a>
                    ) : '-'}
                  </TableCell>
                  <TableCell>{item.email || '-'}</TableCell>
                  <TableCell>{item.formation_souhaitee_nom || item.filiere_souhaitee_nom || '-'}</TableCell>
                  <TableCell>{item.niveau_souhaite_nom || '-'}</TableCell>
                  <TableCell>{item.created_at ? new Date(item.created_at).toLocaleDateString('fr-FR') : '-'}</TableCell>
                  <TableCell align="right">
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        disabled={submitting}
                        onClick={() => {
                          setSelectedPreinscription(item);
                          setOpenModal(true);
                        }}
                      >
                        Approuver
                      </Button>
                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        startIcon={<CancelIcon />}
                        disabled={submitting}
                        onClick={() => handleReject(item)}
                      >
                        Désapprouver
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            {!loading && filteredPreinscriptions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  Aucune pré-inscription trouvée.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[20, 50, 100]}
          component="div"
          count={filteredPreinscriptions.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(_event, newPage) => setPage(newPage)}
          onRowsPerPageChange={(event) => {
            setRowsPerPage(parseInt(event.target.value, 10));
            setPage(0);
          }}
        />
      </TableContainer>

      <ValidatePreinscriptionModal
        key={`${selectedPreinscription?.id || 'none'}-${openModal ? 'open' : 'closed'}`}
        open={openModal}
        onClose={() => setOpenModal(false)}
        onSave={handleApprove}
        submitting={submitting}
        preinscription={selectedPreinscription}
      />

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast((current) => ({ ...current, open: false }))}>
        <Alert severity={toast.severity}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
