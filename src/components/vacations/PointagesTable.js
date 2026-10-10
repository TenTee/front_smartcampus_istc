'use client';

import React from 'react';
import { Chip, Table, TableBody, TableCell, TableHead, TableRow, Typography } from '@mui/material';
import { formatDateFr, formatHeure, formatHeures } from './common';

/** Tableau détaillé des pointages d'un enseignant (utilisé par le coordonnateur et la finance). */
export default function PointagesTable({ pointages }) {
  if (!pointages.length) return <Typography color="text.secondary">Aucun pointage.</Typography>;
  return (
    <Table size="small">
      <TableHead>
        <TableRow>
          <TableCell>Date</TableCell>
          <TableCell>Cours</TableCell>
          <TableCell>Prévu</TableCell>
          <TableCell>Arrivée</TableCell>
          <TableCell>Fin</TableCell>
          <TableCell align="right">Heures</TableCell>
          <TableCell>Commentaire</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {pointages.map((p) => (
          <TableRow key={p.id}>
            <TableCell sx={{ textTransform: 'capitalize', whiteSpace: 'nowrap' }}>{formatDateFr(p.date)}</TableCell>
            <TableCell>
              {p.module_nom || '—'}
              <Typography variant="caption" color="text.secondary" display="block">
                {p.classe_nom}{!p.seance ? ' · hors planning' : ''}
              </Typography>
            </TableCell>
            <TableCell>{p.heure_debut_prevue ? `${formatHeure(p.heure_debut_prevue)} – ${formatHeure(p.heure_fin_prevue)}` : '—'}</TableCell>
            {p.statut === 'absent' ? (
              <TableCell colSpan={2}><Chip label="Absent" size="small" color="error" /></TableCell>
            ) : (
              <>
                <TableCell>{formatHeure(p.heure_arrivee)}</TableCell>
                <TableCell>{formatHeure(p.heure_fin)}</TableCell>
              </>
            )}
            <TableCell align="right" sx={{ fontWeight: 600 }}>
              {formatHeures(p.heures_retenues)}
              {p.heures_corrigees !== null && p.heures_corrigees !== undefined && (
                <Typography variant="caption" color="text.secondary" display="block">
                  corrigé (calculé {formatHeures(p.heures_calculees)})
                </Typography>
              )}
            </TableCell>
            <TableCell>{p.commentaire}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
