'use client';

import React, { useEffect } from 'react';
import { Box } from '@mui/material';
import Sidebar from '../../components/layout/Sidebar';
import Header from '../../components/layout/Header';
import { useRouter, usePathname } from 'next/navigation';
import { AcademicYearProvider } from '../../context/AcademicYearContext';
import { SidebarProvider, useSidebar } from '../../context/SidebarContext';
import { hasReadAccess } from '../../utils/permissions';

const ROUTE_PERMISSION_MAP = {
  '/students': 'can_manage_etudiants',
  '/formateurs': 'can_manage_rh',
  '/pedagogy': 'can_manage_pedagogie',
  '/modules': 'can_manage_pedagogie',
  '/grades': ['can_manage_pedagogie', 'can_manage_etudiants'],
  '/schedule': 'can_manage_pedagogie',
  '/attendance': 'can_manage_pedagogie',
  '/exams-bank': 'can_manage_pedagogie',
  '/finances': 'can_manage_finance',
  '/inventory': 'can_manage_logistique',
  '/staff': 'can_manage_rh',
  '/leaves': 'can_manage_rh',
  '/salaires': 'can_manage_finance',
};

const ADMIN_ONLY_ROUTES = ['/users', '/roles', '/system', '/settings'];

function isRoutePermitted(pathname) {
  try {
    const permsStr = localStorage.getItem('user_permissions');
    if (!permsStr) return true;
    const perms = JSON.parse(permsStr);
    if (perms.is_superuser) return true;

    const role = (localStorage.getItem('user_role') || '').toLowerCase();
    const isSuperAdmin = ['admin', 'administrateur', 'adm', 'super admin', 'superadmin', 'super-admin'].includes(role);
    if (isSuperAdmin) return true;

    if (ADMIN_ONLY_ROUTES.some(r => pathname.startsWith(r))) return false;

    const hasAccess = (perm) => hasReadAccess(perm);

    for (const [route, permission] of Object.entries(ROUTE_PERMISSION_MAP)) {
      if (pathname.startsWith(route)) {
        if (Array.isArray(permission)) {
          return permission.some(p => hasAccess(perms[p]));
        }
        return hasAccess(perms[permission]);
      }
    }
  } catch (e) {}
  return true;
}

function DashboardLayoutContent({ children }) {
  const { isCollapsed, isMobile } = useSidebar();
  const mainWidth = isMobile
    ? '100%'
    : isCollapsed
    ? 'calc(100% - 70px)'
    : 'calc(100% - 260px)';

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F5F7FA' }}>
      <Sidebar />
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
        <Box sx={{ mt: 2, flex: 1 }}>{children}</Box>
      </Box>
    </Box>
  );
}

export default function DashboardLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('user_role');

    if (!token) {
      router.push('/login');
      return;
    }

    if (role === 'etudiant') {
      router.push('/portal');
      return;
    }

    const loginTime = localStorage.getItem('loginTime');
    if (loginTime) {
      const elapsed = Date.now() - parseInt(loginTime, 10);
      const sixHours = 6 * 60 * 60 * 1000;

      if (elapsed > sixHours) {
        localStorage.removeItem('token');
        localStorage.removeItem('loginTime');
        localStorage.removeItem('user_permissions');
        document.cookie = 'token=; Max-Age=0; path=/;';
        router.push('/login');
      } else {
        const remaining = sixHours - elapsed;
        const timeout = setTimeout(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('loginTime');
          localStorage.removeItem('user_permissions');
          document.cookie = 'token=; Max-Age=0; path=/;';
          router.push('/login');
        }, remaining);
        return () => clearTimeout(timeout);
      }
    }

    if (!isRoutePermitted(pathname)) {
      router.push('/dashboard');
    }
  }, [router, pathname]);

  return (
    <AcademicYearProvider>
      <SidebarProvider>
        <DashboardLayoutContent>{children}</DashboardLayoutContent>
      </SidebarProvider>
    </AcademicYearProvider>
  );
}
