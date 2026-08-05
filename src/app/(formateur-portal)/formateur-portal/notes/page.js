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
  TextField,
  Button,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Alert,
  Snackbar,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { formateurPortalService } from '../../../../services/api/services';

export default function SaisieNotesPage() {
  const [classes, setClasses] = useState([]);
  const [selectedClasse, setSelectedClasse] = useState('');
  const [selectedModule, setSelectedModule] = useState('');
  const [notes, setNotes] = useState([]);
  const [etudiants, setEtudiants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    formateurPortalService.mesClasses()
      .then(setClasses)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedClasse || !selectedModule) return;

    const cls = classes.find(c => c.classe_id === parseInt(selectedClasse) && c.module_id === parseInt(selectedModule));
    if (cls) {
      setEtudiants(cls.etudiants);

      formateurPortalService.mesNotes({ classe_id: selectedClasse, module_id: selectedModule })
        .then((existingNotes) => {
          const noteMap = {};
          existingNotes.forEach(n => {
            noteMap[n.etudiant_id] = n;
          });

          const initialNotes = cls.etudiants.map(et => ({
            etudiant_id: et.id,
            etudiant_nom: et.nom,
            matricule: et.matricule,
            module_id: parseInt(selectedModule),
            classe_id: parseInt(selectedClasse),
            note_cc: noteMap[et.id]?.note_cc ?? '',
            note_sn: noteMap[et.id]?.note_sn ?? '',
            note_rattrapage: noteMap[et.id]?.note_rattrapage ?? '',
          }));
          setNotes(initialNotes);
        })
        .catch(console.error);
    }
  }, [selectedClasse, selectedModule, classes]);

  const handleNoteChange = (idx, field, value) => {
    const val = value === '' ? '' : Math.min(20, Math.max(0, parseFloat(value) || 0));
    setNotes(prev => {
      const copy = [...prev];
      copy[idx] = { ...copy[idx], [field]: val };
      return copy;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const notesToSave = notes
        .filter(n => n.note_cc !== '' || n.note_sn !== '' || n.note_rattrapage !== '')
        .map(n => ({
          etudiant_id: n.etudiant_id,
          module_id: n.module_id,
          classe_id: n.classe_id,
          note_cc: n.note_cc === '' ? null : n.note_cc,
          note_sn: n.note_sn === '' ? null : n.note_sn,
          note_rattrapage: n.note_rattrapage === '' ? null : n.note_rattrapage,
        }));

      const result = await formateurPortalService.saisirNotes({ notes: notesToSave });
      setSnackbar({
        open: true,
        message: `${result.created} créées, ${result.updated} mises à jour.${result.errors?.length ? ` Erreurs: ${result.errors.length}` : ''}`,
        severity: result.errors?.length ? 'warning' : 'success',
      });
    } catch (e) {
      setSnackbar({ open: true, message: 'Erreur lors de la sauvegarde.', severity: 'error' });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>;
  }

  const uniqueClasses = [...new Map(classes.map(c => [c.classe_id, c])).values()];
  const modulesForClasse = classes.filter(c => c.classe_id === parseInt(selectedClasse));

  return (
    <Box>
      <Typography variant="h5" fontWeight="bold" gutterBottom>Saisie des Notes</Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Classe</InputLabel>
            <Select
              value={selectedClasse}
              label="Classe"
              onChange={(e) => {
                setSelectedClasse(e.target.value);
                setSelectedModule('');
                setNotes([]);
              }}
            >
              {uniqueClasses.map(c => (
                <MenuItem key={c.classe_id} value={c.classe_id}>{c.classe_nom}</MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl sx={{ minWidth: 200 }}>
            <InputLabel>Module</InputLabel>
            <Select
              value={selectedModule}
              label="Module"
              onChange={(e) => setSelectedModule(e.target.value)}
              disabled={!selectedClasse}
            >
              {modulesForClasse.map(c => (
                <MenuItem key={c.module_id} value={c.module_id}>{c.module_nom}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Paper>

      {notes.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Matricule</strong></TableCell>
                  <TableCell><strong>Nom & Prénom</strong></TableCell>
                  <TableCell align="center"><strong>CC (/20)</strong></TableCell>
                  <TableCell align="center"><strong>Examen (/20)</strong></TableCell>
                  <TableCell align="center"><strong>Rattrapage (/20)</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notes.map((note, idx) => (
                  <TableRow key={note.etudiant_id}>
                    <TableCell>{note.matricule}</TableCell>
                    <TableCell>{note.etudiant_nom}</TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={note.note_cc}
                        onChange={(e) => handleNoteChange(idx, 'note_cc', e.target.value)}
                        inputProps={{ min: 0, max: 20, step: 0.25 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={note.note_sn}
                        onChange={(e) => handleNoteChange(idx, 'note_sn', e.target.value)}
                        inputProps={{ min: 0, max: 20, step: 0.25 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                    <TableCell align="center">
                      <TextField
                        type="number"
                        size="small"
                        value={note.note_rattrapage}
                        onChange={(e) => handleNoteChange(idx, 'note_rattrapage', e.target.value)}
                        inputProps={{ min: 0, max: 20, step: 0.25 }}
                        sx={{ width: 80 }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SaveIcon />}
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? 'Enregistrement...' : 'Enregistrer les notes'}
            </Button>
          </Box>
        </Paper>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
