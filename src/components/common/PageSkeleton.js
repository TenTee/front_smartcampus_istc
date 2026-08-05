'use client';

import React from 'react';
import { Box, Paper, Skeleton, Grid } from '@mui/material';
import TableSkeleton from './TableSkeleton';
import CardSkeletonGrid from './CardSkeleton';

/**
 * PageSkeleton Component
 * Full layout skeleton loader combining filter header, metric cards, and table skeleton.
 */
export default function PageSkeleton({
  hasCards = true,
  cardCount = 4,
  tableRows = 6,
  tableCols = 5,
}) {
  return (
    <Box sx={{ animation: 'fadeIn 0.3s ease-in-out' }}>
      {/* Header Banner Skeleton */}
      <Paper sx={{ p: 3, mb: 3, borderRadius: 3 }}>
        <Skeleton variant="text" width="30%" height={32} sx={{ mb: 1 }} />
        <Skeleton variant="text" width="50%" height={20} />
      </Paper>

      {/* KPI Cards Skeleton (Optional) */}
      {hasCards && (
        <Box sx={{ mb: 4 }}>
          <CardSkeletonGrid count={cardCount} />
        </Box>
      )}

      {/* Filter Row Skeleton */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Skeleton variant="rectangular" width={220} height={40} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" width={180} height={40} sx={{ borderRadius: 2 }} />
        <Skeleton variant="rectangular" width={180} height={40} sx={{ borderRadius: 2 }} />
      </Box>

      {/* Main Table Skeleton */}
      <TableSkeleton rows={tableRows} columns={tableCols} />
    </Box>
  );
}
