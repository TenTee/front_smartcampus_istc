'use client';

import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import StudentSidebar from '../../components/layout/StudentSidebar';
import Header from '../../components/layout/Header';
import { useRouter } from 'next/navigation';
import { AcademicYearProvider } from '../../context/AcademicYearContext';
import PortalGuard from '../../components/layout/PortalGuard';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';

function PortalLayoutContent({ children }) {
  const { isCollapsed, isMobile } = useSidebar();
  const mainWidth = isMobile
    ? '100%'
    : isCollapsed
    ? 'calc(100% - 70px)'
    : 'calc(100% - 260px)';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F0F2F5' }}>
      <StudentSidebar />
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          width: mainWidth,
          p: { xs: 2, md: 3 },
          transition: (theme) =>
            theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        }}
      >
        <Header />
        <Box sx={{ mt: 2, flex: 1 }}>
          <PortalGuard>{children}</PortalGuard>
        </Box>
      </Box>
    </Box>
  );
}

export default function PortalLayout({ children }) {
  const router = useRouter();

  useEffect(() => {
    // Basic session check
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    }
  }, [router]);

  return (
    <AcademicYearProvider>
      <SidebarProvider>
        <PortalLayoutContent>{children}</PortalLayoutContent>
      </SidebarProvider>
    </AcademicYearProvider>
  );
}
