'use client';

import React, { useState } from 'react';
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
  Collapse,
  Tooltip,
  IconButton,
} from '@mui/material';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import LogoutIcon from '@mui/icons-material/Logout';
import { usePathname, useRouter } from 'next/navigation';
import { routes, bottomRoutes } from '../../config/routes';
import { ConfigContext } from '../../theme/ThemeRegistry';
import { getMediaUrl } from '../../services/api/client';
import { useSidebar } from '../../context/SidebarContext';
import { hasReadAccess } from '../../utils/permissions';

const EXPANDED_WIDTH = 260;
const COLLAPSED_WIDTH = 70;

export default function Sidebar() {
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

  const [openMenus, setOpenMenus] = useState({});
  const [userRole, setUserRole] = useState(null);
  const [userPermissions, setUserPermissions] = useState(null);

  React.useEffect(() => {
    const updateRoleInfo = () => {
      const roleStr = localStorage.getItem('user_role');
      if (roleStr) setUserRole(roleStr.toLowerCase());

      const permsStr = localStorage.getItem('user_permissions');
      if (permsStr) {
        try {
          setUserPermissions(JSON.parse(permsStr));
        } catch (e) {}
      } else {
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const decoded = JSON.parse(jsonPayload);
            const role =
              decoded.role ||
              decoded.role_code ||
              decoded.user_role ||
              (decoded.user && decoded.user.role);
            if (role) setUserRole(String(role).toLowerCase());
            if (decoded.permissions) {
              const permsToStore = { ...decoded.permissions };
              if (decoded.is_superuser) permsToStore.is_superuser = true;
              setUserPermissions(permsToStore);
              localStorage.setItem('user_permissions', JSON.stringify(permsToStore));
            } else if (decoded.is_superuser) {
              setUserPermissions({ is_superuser: true });
            }
          }
        } catch (e) {}
      }
    };

    updateRoleInfo();
    window.addEventListener('userRolesUpdated', updateRoleInfo);
    return () => window.removeEventListener('userRolesUpdated', updateRoleInfo);
  }, []);

  const isRouteAllowed = (route) => {
    if (!userRole && !userPermissions) return false;
    const role = userRole || '';
    const perms = userPermissions || {};
    const isSuperAdmin =
      ['admin', 'administrateur', 'adm', 'super admin', 'superadmin', 'super-admin'].includes(role) ||
      (userPermissions && userPermissions.is_superuser);

    if (isSuperAdmin) return true;

    if (['Paramètres', 'Système', 'Utilisateurs', 'Rôles'].includes(route.label)) return false;

    if (route.label === 'Tableau de bord') return true;

    const hasAccess = (perm) => hasReadAccess(perm);

    if (Object.keys(perms).length > 0) {
      if (route.label === 'Étudiants') return hasAccess(perms.can_manage_etudiants);
      if (route.label === 'Enseignants') return hasAccess(perms.can_manage_rh);

      const pGroup = [
        'Pédagogie',
        'Structure Académique',
        'Formations',
        'Cours',
        'Emploi du temps',
        'Assiduité',
        "Banque d'épreuves",
      ];
      if (pGroup.includes(route.label)) return hasAccess(perms.can_manage_pedagogie);

      if (route.label === 'Notes')
        return hasAccess(perms.can_manage_pedagogie) || hasAccess(perms.can_manage_etudiants);

      const fGroup = [
        'Finances',
        'Aperçu global',
        'Préinscriptions',
        'Scolarité',
        'Salaires Personnel',
        'Salaires Formateurs',
      ];
      if (fGroup.includes(route.label)) return hasAccess(perms.can_manage_finance);

      if (route.label === 'Inventaire') return hasAccess(perms.can_manage_logistique);

      const rGroup = ['Personnel', 'Liste du personnel', 'Congés et absences'];
      if (rGroup.includes(route.label)) return hasAccess(perms.can_manage_rh);

      return false;
    }

    if (role.includes('secretaire') || role === 'sec') {
      const allowedLabels = [
        'Tableau de bord',
        'Pédagogie',
        'Formations',
        'Cours',
        'Emploi du temps',
        'Assiduité',
        'Finances',
      ];
      return allowedLabels.includes(route.label);
    }

    return false;
  };

  const handleToggle = (label) => {
    if (isCollapsed && !isMobile) {
      setIsCollapsed(false);
    }
    setOpenMenus((prev) => ({ ...prev, [label]: !prev[label] }));
  };

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
      {/* Header section with Logo and Toggle Button */}
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

      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)' }} />

      {/* Navigation List */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <List sx={{ px: isCollapsed && !isMobile ? 1 : 2, mt: 2 }}>
          {routes.filter(isRouteAllowed).map((route) => {
            const allowedChildren = route.children ? route.children.filter(isRouteAllowed) : null;
            const hasChildren = allowedChildren && allowedChildren.length > 0;
            const isParentActive = hasChildren
              ? allowedChildren.some(
                  (child) => pathname === child.path || pathname?.startsWith(child.path + '/')
                )
              : pathname === route.path || pathname?.startsWith(route.path + '/');
            const IconComponent = route.icon;

            return (
              <React.Fragment key={route.label}>
                <ListItem disablePadding sx={{ mb: 1 }}>
                  <Tooltip
                    title={isCollapsed && !isMobile ? route.label : ''}
                    placement="right"
                    arrow
                  >
                    <ListItemButton
                      onClick={() =>
                        hasChildren ? handleToggle(route.label) : handleNavigate(route.path)
                      }
                      sx={{
                        borderRadius: 2,
                        minHeight: 44,
                        justifyContent: isCollapsed && !isMobile ? 'center' : 'initial',
                        px: isCollapsed && !isMobile ? 1.5 : 2,
                        backgroundColor:
                          isParentActive && !hasChildren
                            ? 'rgba(255, 255, 255, 0.15)'
                            : 'transparent',
                        '&:hover': {
                          backgroundColor: 'rgba(255, 255, 255, 0.2)',
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          color: 'white',
                          minWidth: isCollapsed && !isMobile ? 'auto' : 40,
                          mr: isCollapsed && !isMobile ? 0 : 0,
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
                            fontWeight: isParentActive ? 600 : 400,
                            whiteSpace: 'nowrap',
                          }}
                        />
                      )}
                      {(!isCollapsed || isMobile) && hasChildren ? (
                        openMenus[route.label] || isParentActive ? (
                          <ExpandLess />
                        ) : (
                          <ExpandMore />
                        )
                      ) : null}
                    </ListItemButton>
                  </Tooltip>
                </ListItem>

                {hasChildren && (!isCollapsed || isMobile) && (
                  <Collapse
                    in={openMenus[route.label] || isParentActive}
                    timeout="auto"
                    unmountOnExit
                  >
                    <List component="div" disablePadding sx={{ pl: 2 }}>
                      {allowedChildren.map((child) => {
                        const isChildActive =
                          pathname === child.path || pathname?.startsWith(child.path + '/');
                        const ChildIconComponent = child.icon;
                        return (
                          <ListItem key={child.label} disablePadding sx={{ mb: 1 }}>
                            <ListItemButton
                              onClick={() => handleNavigate(child.path)}
                              sx={{
                                borderRadius: 2,
                                backgroundColor: isChildActive
                                  ? 'rgba(255, 255, 255, 0.15)'
                                  : 'transparent',
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                },
                              }}
                            >
                              <ListItemIcon sx={{ color: 'white', minWidth: 40 }}>
                                <ChildIconComponent fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={child.label}
                                primaryTypographyProps={{
                                  fontSize: '0.85rem',
                                  fontWeight: isChildActive ? 600 : 400,
                                }}
                              />
                            </ListItemButton>
                          </ListItem>
                        );
                      })}
                    </List>
                  </Collapse>
                )}
              </React.Fragment>
            );
          })}
        </List>
      </Box>

      {/* Bottom Routes & Logout */}
      <Box sx={{ px: isCollapsed && !isMobile ? 1 : 2, mb: 2 }}>
        <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 1 }} />
        <List disablePadding>
          {bottomRoutes.filter(isRouteAllowed).map((route) => {
            const isParentActive = pathname === route.path || pathname?.startsWith(route.path + '/');
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
                      backgroundColor: isParentActive
                        ? 'rgba(255, 255, 255, 0.15)'
                        : 'transparent',
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
                          fontWeight: isParentActive ? 600 : 400,
                          whiteSpace: 'nowrap',
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            );
          })}
          <ListItem disablePadding>
            <Tooltip
              title={isCollapsed && !isMobile ? 'Déconnexion' : ''}
              placement="right"
              arrow
            >
              <ListItemButton
                onClick={() => {
                  localStorage.removeItem('token');
                  localStorage.removeItem('refreshToken');
                  localStorage.removeItem('user');
                  localStorage.removeItem('user_role');
                  localStorage.removeItem('user_permissions');
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
          backgroundColor: config?.couleur_primaire || '#193A7F',
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
