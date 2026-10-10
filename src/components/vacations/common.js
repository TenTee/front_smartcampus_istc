'use client';

import React from 'react';
import { Box, Chip, FormControl, InputLabel, MenuItem, Select, TextField } from '@mui/material';

export const MOIS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const STATUTS_RECAP = {
  ouvert: { label: 'En cours', color: 'default' },
  cloture: { label: 'Clôturé – en attente finance', color: 'info' },
  valide: { label: 'Validé', color: 'success' },
  rejete: { label: 'Rejeté – à corriger', color: 'error' },
  paye: { label: 'Payé', color: 'secondary' },
};

export function StatutRecapChip({ statut, size = 'small' }) {
  const s = STATUTS_RECAP[statut] || { label: statut || '—', color: 'default' };
  return <Chip label={s.label} color={s.color} size={size} variant={statut === 'ouvert' ? 'outlined' : 'filled'} />;
}

export function formatHeures(value) {
  const n = Number(value) || 0;
  const h = Math.floor(n);
  const m = Math.round((n - h) * 60);
  if (m === 0) return `${h} h`;
  return `${h} h ${String(m).padStart(2, '0')}`;
}

export function formatMontant(value) {
  return `${(Number(value) || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} FCFA`;
}

export function formatHeure(value) {
  return value ? String(value).slice(0, 5) : '—';
}

export function formatDateFr(value) {
  if (!value) return '';
  const [y, m, d] = String(value).split('-');
  if (!y || !m || !d) return value;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  return date.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: 'short' });
}

export function toList(data) {
  return Array.isArray(data) ? data : data?.results || [];
}

export function todayIso() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function MonthPicker({ mois, annee, onChange, sx }) {
  const currentYear = new Date().getFullYear();
  const years = [currentYear - 1, currentYear, currentYear + 1];
  return (
    <Box sx={{ display: 'flex', gap: 1.5, ...sx }}>
      <FormControl size="small" sx={{ minWidth: 140 }}>
        <InputLabel>Mois</InputLabel>
        <Select value={mois} label="Mois" onChange={(e) => onChange({ mois: Number(e.target.value), annee })}>
          {MOIS.map((m, i) => (
            <MenuItem key={m} value={i + 1}>{m}</MenuItem>
          ))}
        </Select>
      </FormControl>
      <FormControl size="small" sx={{ minWidth: 100 }}>
        <InputLabel>Année</InputLabel>
        <Select value={annee} label="Année" onChange={(e) => onChange({ mois, annee: Number(e.target.value) })}>
          {years.map((y) => (
            <MenuItem key={y} value={y}>{y}</MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

export function TimeInput({ value, onChange, disabled, label, error }) {
  return (
    <TextField
      type="time"
      size="small"
      label={label}
      value={value ? String(value).slice(0, 5) : ''}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      error={error}
      InputLabelProps={{ shrink: true }}
      inputProps={{ step: 300 }}
      sx={{ width: 120 }}
    />
  );
}
