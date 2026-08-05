'use client';

import React from 'react';
import { Alert, AlertTitle, Button, Box } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';

/**
 * ErrorState Component
 * Displays a clean error alert with a "Réessayer" button to retry API requests.
 */
export default function ErrorState({
  message = 'Une erreur est survenue lors du chargement des données.',
  onRetry,
  severity = 'error',
  title = 'Erreur de chargement',
  sx = {},
}) {
  return (
    <Alert
      severity={severity}
      sx={{
        borderRadius: 3,
        mb: 3,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        alignItems: 'center',
        ...sx,
      }}
      action={
        onRetry && (
          <Button
            color="inherit"
            size="small"
            onClick={onRetry}
            startIcon={<RefreshIcon />}
            sx={{ fontWeight: 'bold', textTransform: 'none' }}
          >
            Réessayer
          </Button>
        )
      }
    >
      {title && <AlertTitle fontStyle="normal">{title}</AlertTitle>}
      {message}
    </Alert>
  );
}
