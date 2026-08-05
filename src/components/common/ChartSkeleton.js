'use client';

import React from 'react';
import { Card, CardContent, Box, Skeleton } from '@mui/material';

/**
 * ChartSkeleton Component
 * Renders placeholder structure matching dashboard analytics charts during API fetching.
 */
export default function ChartSkeleton({ height = 300, titleWidth = '40%' }) {
  return (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Skeleton variant="text" width={titleWidth} height={28} />
          <Skeleton variant="rectangular" width={100} height={24} sx={{ borderRadius: 1 }} />
        </Box>
        <Skeleton variant="rectangular" width="100%" height={height} sx={{ borderRadius: 2 }} />
      </CardContent>
    </Card>
  );
}
