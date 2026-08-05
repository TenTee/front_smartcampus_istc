'use client';

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Skeleton,
  Box,
} from '@mui/material';

/**
 * TableSkeleton Component
 * Renders skeleton placeholder rows matching real table structure during API loading.
 */
export default function TableSkeleton({
  rows = 5,
  columns = 5,
  hasActions = true,
  height = 40,
  sx = {},
}) {
  const rowArray = Array.from({ length: rows });
  const colArray = Array.from({ length: columns });

  return (
    <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.05)', ...sx }}>
      <Table>
        <TableHead sx={{ backgroundColor: '#F8FAFC' }}>
          <TableRow>
            {colArray.map((_, colIdx) => (
              <TableCell key={colIdx}>
                <Skeleton variant="text" width="70%" height={24} />
              </TableCell>
            ))}
            {hasActions && (
              <TableCell align="right">
                <Skeleton variant="text" width="50%" height={24} sx={{ ml: 'auto' }} />
              </TableCell>
            )}
          </TableRow>
        </TableHead>
        <TableBody>
          {rowArray.map((_, rowIdx) => (
            <TableRow key={rowIdx}>
              {colArray.map((_, colIdx) => (
                <TableCell key={colIdx}>
                  <Skeleton
                    variant="rectangular"
                    height={height}
                    sx={{ borderRadius: 1.5, opacity: 0.7 }}
                  />
                </TableCell>
              ))}
              {hasActions && (
                <TableCell align="right">
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                    <Skeleton variant="circular" width={32} height={32} />
                    <Skeleton variant="circular" width={32} height={32} />
                  </Box>
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
