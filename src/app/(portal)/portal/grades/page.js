'use client';

import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  FormControl,
  Select,
  MenuItem,
  InputLabel
} from '@mui/material';
import { notesService } from '../../../../services/api/services';

export default function StudentGrades() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState('Semestre 1');

  useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const data = await notesService.me({ session });
        setNotes(data);
      } catch (error) {
        console.error("Erreur notes:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchNotes();
  }, [session]);

  const getStatusColor = (note) => {
    if (note === null || note === undefined) return 'default';
    if (note < 50) return 'error';
    if (note < 60) return 'warning';
    return 'success';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">Mes Résultats Académiques</Typography>
        
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Session</InputLabel>
          <Select
            value={session}
            label="Session"
            onChange={(e) => setSession(e.target.value)}
          >
            <MenuItem value="Semestre 1">Semestre 1</MenuItem>
            <MenuItem value="Semestre 2">Semestre 2</MenuItem>
            <MenuItem value="Rattrapage">Rattrapage</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#F5F7FA' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Module / Matière</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Coef.</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>CC</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>SN</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Finale</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Statut</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  <CircularProgress size={24} />
                </TableCell>
              </TableRow>
            ) : notes.length > 0 ? (
              notes.map((note) => (
                <TableRow key={note.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{note.module_nom}</TableCell>
                  <TableCell align="center">{note.coefficient}</TableCell>
                  <TableCell align="center">{note.note_cc ?? '-'}</TableCell>
                  <TableCell align="center">{note.note_sn ?? '-'}</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                    {note.note_finale ?? '-'}
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      const statusVal = note.note_finale;
                      const label = statusVal == null ? 'En attente' : (statusVal >= 50 ? 'Validé' : 'À rattraper');
                      const color = getStatusColor(statusVal);
                      return <Chip label={label} color={color} size="small" />;
                    })()}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                  Aucune note publiée pour cette session. Vos résultats
                  apparaîtront ici après validation par l'administration.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
