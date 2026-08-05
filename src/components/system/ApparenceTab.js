'use client';

import React, { useState } from 'react';
import { Box, Snackbar, Alert } from '@mui/material';
import EtablissementConfig from '../settings/EtablissementConfig';

export default function ApparenceTab() {
  const [toast, setToast] = useState({ open: false, message: '', severity: 'success' });

  return (
    <Box>
      <EtablissementConfig setToast={setToast} />

      <Snackbar open={toast.open} autoHideDuration={4000} onClose={() => setToast({ ...toast, open: false })}>
        <Alert severity={toast.severity} onClose={() => setToast({ ...toast, open: false })}>{toast.message}</Alert>
      </Snackbar>
    </Box>
  );
}
