'use client';

import React, { useState } from 'react';
import { Box, Typography, Tabs, Tab } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import GroupIcon from '@mui/icons-material/Group';
import SecurityIcon from '@mui/icons-material/Security';
import PaletteIcon from '@mui/icons-material/Palette';
import ParametresGlobaux from '../../../components/system/ParametresGlobaux';
import UsersTab from '../../../components/system/UsersTab';
import RolesTab from '../../../components/system/RolesTab';
import ApparenceTab from '../../../components/system/ApparenceTab';

export default function SystemAdminPage() {
  const [tabValue, setTabValue] = useState(0);

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" fontWeight="bold" color="primary">
          Administration Système
        </Typography>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={(e, newValue) => setTabValue(newValue)}
          variant="scrollable"
          scrollButtons="auto"
        >
          <Tab icon={<SettingsIcon />} iconPosition="start" label="Paramètres Globaux" />
          <Tab icon={<GroupIcon />} iconPosition="start" label="Utilisateurs" />
          <Tab icon={<SecurityIcon />} iconPosition="start" label="Rôles" />
          <Tab icon={<PaletteIcon />} iconPosition="start" label="Apparence & École" />
        </Tabs>
      </Box>

      {tabValue === 0 && <ParametresGlobaux />}
      {tabValue === 1 && <UsersTab />}
      {tabValue === 2 && <RolesTab />}
      {tabValue === 3 && <ApparenceTab />}
    </Box>
  );
}
