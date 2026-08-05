'use client';

import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import { usePathname, useRouter } from 'next/navigation';
import { formateurRoutes } from '../../config/routes';
import { ConfigContext } from '../../theme/ThemeRegistry';
import { getMediaUrl } from '../../services/api/client';
import { useSidebar } from '../../context/SidebarContext';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 70;

export default function FormateurSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const config = React.useContext(ConfigContext);
  const {
    isCollapsed,
    setIsCollapsed,
    mobileOpen,
    isMobile,
    closeMobileSidebar,
  } = useSidebar();

  const handleNavigate = (path) => {
    router.push(path);
    closeMobileSidebar();
  };

  const currentWidth = isMobile
    ? EXPANDED_WIDTH
    : isCollapsed
    ? COLLAPSED_WIDTH
    : EXPANDED_WIDTH;

  const drawerContent = (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Logo and Header Toggle */}
      <Box
        sx={{
          p: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed && !isMobile ? 'center' : 'space-between',
        }}
      >
        <Box
          sx={{
            backgroundColor: 'white',
            borderRadius: 2,
            p: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: isCollapsed && !isMobile ? 44 : '100%',
            height: isCollapsed && !isMobile ? 44 : 'auto',
            transition: 'all 0.3s ease',
          }}
        >
          <img
            src={getMediaUrl(config?.logo) || '/LOGO SMART CAMPUS.svg'}
            alt="Smart Campus Logo"
            style={{
              maxWidth: '100%',
              maxHeight: isCollapsed && !isMobile ? 32 : 55,
              objectFit: 'contain',
            }}
          />
        </Box>
        {!isMobile && (
          <IconButton
            onClick={() => setIsCollapsed(!isCollapsed)}
            sx={{
              color: 'white',
              ml: isCollapsed ? 0 : 1,
              p: 0.5,
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
              '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.2)' },
            }}
          >
            {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        )}
      </Box>

      {(!isCollapsed || isMobile) && (
        <Box sx={{ px: 3, py: 0.5 }}>
          <Typography variant="overline" color="rgba(255,255,255,0.5)">
            Portail Formateur
          </Typography>
        </Box>
      )}

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Routes List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <List sx={{ px: isCollapsed && !isMobile ? 1 : 2, mt: 2 }}>
          {formateurRoutes.map((route) => {
            const isActive =
              pathname === route.path ||
              (route.path !== '/formateur-portal' && pathname?.startsWith(route.path + '/'));
            const IconComponent = route.icon;

            return (
              <ListItem key={route.label} disablePadding sx={{ mb: 1 }}>
                <Tooltip
                  title={isCollapsed && !isMobile ? route.label : ''}
                  placement="right"
                  arrow
                >
                  <ListItemButton
                    onClick={() => handleNavigate(route.path)}
                    sx={{
                      borderRadius: 2,
                      minHeight: 44,
                      justifyContent: isCollapsed && !isMobile ? 'center' : 'initial',
                      px: isCollapsed && !isMobile ? 1.5 : 2,
                      backgroundColor: isActive ? 'rgba(255, 255, 255, 0.15)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.2)',
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: 'white',
                        minWidth: isCollapsed && !isMobile ? 'auto' : 40,
                        justifyContent: 'center',
                      }}
                    >
                      <IconComponent />
                    </ListItemIcon>
                    {(!isCollapsed || isMobile) && (
                      <ListItemText
                        primary={route.label}
                        primaryTypographyProps={{
                          fontSize: '0.9rem',
                          fontWeight: isActive ? 600 : 400,
                          whiteSpace: 'nowrap',
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Logout */}
      <Box sx={{ px: isCollapsed && !isMobile ? 1 : 2, mb: 2 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />
        <List disablePadding>
          <ListItem disablePadding>
            <Tooltip title={isCollapsed && !isMobile ? 'Déconnexion' : ''} placement="right" arrow>
              <ListItemButton
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('user');
                  localStorage.removeItem('user_role');
                  localStorage.removeItem('user_permissions');
                  localStorage.removeItem('is_formateur');
                  localStorage.removeItem('loginTime');
                  document.cookie = 'token=; Max-Age=-99999999; path=/';
                  handleNavigate('/login');
                }}
                sx={{
                  borderRadius: 2,
                  minHeight: 44,
                  justifyContent: isCollapsed && !isMobile ? 'center' : 'initial',
                  px: isCollapsed && !isMobile ? 1.5 : 2,
                }}
              >
                <ListItemIcon
                  sx={{
                    color: 'white',
                    minWidth: isCollapsed && !isMobile ? 'auto' : 40,
                    justifyContent: 'center',
                  }}
                >
                  <LogoutIcon />
                </ListItemIcon>
                {(!isCollapsed || isMobile) && (
                  <ListItemText primary="Déconnexion" primaryTypographyProps={{ fontSize: '0.9rem' }} />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        </List>
      </Box>
    </Box>
  );

  return (
    <Drawer
      variant={isMobile ? 'temporary' : 'permanent'}
      open={isMobile ? mobileOpen : true}
      onClose={closeMobileSidebar}
      ModalProps={{ keepMounted: true }}
      sx={{
        width: currentWidth,
        flexShrink: 0,
        whiteSpace: 'nowrap',
        boxSizing: 'border-box',
        transition: (theme) =>
          theme.transitions.create('width', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
        '& .MuiDrawer-paper': {
          width: currentWidth,
          boxSizing: 'border-box',
          backgroundColor: config?.couleur_primaire || '#1B3A5C',
          color: 'white',
          borderRight: 'none',
          overflowX: 'hidden',
          transition: (theme) =>
            theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
        },
      }}
    >
      {drawerContent}
    </Drawer>
  );
}
