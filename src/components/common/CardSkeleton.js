'use client';

import React from 'react';
import { Card, CardContent, Box, Skeleton, Grid } from '@mui/material';

/**
 * Single CardSkeleton Component
 */
export function StatCardSkeleton() {
  return (
    <Card sx={{ height: '100%', borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', p: 3 }}>
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" width="50%" height={20} sx={{ mb: 1 }} />
          <Skeleton variant="rectangular" width="40%" height={36} sx={{ borderRadius: 1, mb: 1 }} />
          <Skeleton variant="text" width="30%" height={16} />
        </Box>
        <Skeleton variant="rectangular" width={48} height={48} sx={{ borderRadius: 2 }} />
      </CardContent>
    </Card>
  );
}

/**
 * Grid of StatCardSkeletons Component
 */
export default function CardSkeletonGrid({ count = 4, xs = 12, sm = 6, md = 3 }) {
  const cards = Array.from({ length: count });
  return (
    <Grid container spacing={3}>
      {cards.map((_, idx) => (
        <Grid item xs={xs} sm={sm} md={md} key={idx}>
          <StatCardSkeleton />
        </Grid>
      ))}
    </Grid>
  );
}
