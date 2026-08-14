'use client';

import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  InputBase,
  Badge,
  Avatar,
  Menu,
  MenuItem,
  Select,
  ListItemIcon,
  Divider,
  List,
  ListItem,
  ListItemText,
  Tooltip,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';
import LogoutIcon from '@mui/icons-material/Logout';
import PersonIcon from '@mui/icons-material/Person';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import InfoIcon from '@mui/icons-material/Info';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import MenuIcon from '@mui/icons-material/Menu';
import { useRouter } from 'next/navigation';
import { useAcademicYear } from '../../context/AcademicYearContext';
import { useSidebar } from '../../context/SidebarContext';
import { usersService, rolesService, revenusService, depensesService, demandesService, preinscriptionsService } from '../../services/api/services';
import { ConfigContext } from '../../theme/ThemeRegistry';

export default function Header() {
  const { toggleSidebar } = useSidebar();
  const router = useRouter();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [notifAnchorEl, setNotifAnchorEl] = React.useState(null);
  const [userInfo, setUserInfo] = React.useState({ username: 'Utilisateur', role: '' });
  const [notifications, setNotifications] = React.useState([]);
  const { academicYears, selectedYear, changeYear, yearError, clearYearError } = useAcademicYear();
  const config = React.useContext(ConfigContext);
  const primaryColor = config?.couleur_primaire || '#193A7F';

  async function fetchNotifications() {
    const role = localStorage.getItem('user_role');
    if (role === 'etudiant') return; // Don't fetch admin notifications for students

    try {
        const [revs, deps, dems, preins] = await Promise.all([
            revenusService.list().catch(() => []),
            depensesService.list().catch(() => []),
            demandesService.list().catch(() => []),
            preinscriptionsService.list().catch(() => [])
        ]);

        let notifs = [];

        // Revenus
        (Array.isArray(revs) ? revs : revs?.results || []).forEach(r => {
            const dateStr = r.date_entree || r.created_at;
            if (!dateStr) return;
            const valid = r.statut === 'Validé';
            const attente = r.statut === 'En attente';
            notifs.push({
                id: `rev-${r.id}`,
                title: valid ? `Revenu validé` : attente ? `Revenu en attente` : `Revenu annulé/rejeté`,
                desc: `${r.libelle} (${Number(r.montant).toLocaleString()} FCFA)`,
                date: new Date(dateStr),
                type: valid ? 'success' : attente ? 'info' : 'error'
            });
        });

        // Depenses
        (Array.isArray(deps) ? deps : deps?.results || []).forEach(d => {
            const dateStr = d.date_depense || d.created_at;
            if (!dateStr) return;
            const valid = d.statut === 'Validée';
            const attente = d.statut === 'En attente';
            notifs.push({
                id: `dep-${d.id}`,
                title: valid ? `Dépense validée` : attente ? `Dépense en attente` : `Dépense rejetée`,
                desc: `${d.libelle} (${Number(d.montant).toLocaleString()} FCFA)`,
                date: new Date(dateStr),
                type: valid ? 'success' : attente ? 'info' : 'error'
            });
        });

        // Demandes
        (Array.isArray(dems) ? dems : dems?.results || []).forEach(d => {
            const dateStr = d.date_demande || d.created_at;
            if (!dateStr) return;
            const valid = d.statut === 'Approuvée';
            const attente = d.statut === 'En attente';
            notifs.push({
                id: `dem-${d.id}`,
                title: valid ? `Demande approuvée` : attente ? `Nouvelle demande` : `Demande refusée`,
                desc: `Réf: ${d.reference || d.id} par ${d.demandeur_nom || 'Inconnu'}`,
                date: new Date(dateStr),
                type: valid ? 'success' : attente ? 'info' : 'error'
            });
        });

        // Preinscriptions
        (Array.isArray(preins) ? preins : preins?.results || []).forEach(p => {
            const dateStr = p.date_creation || p.created_at;
            if (!dateStr) return;
            const valid = p.statut === 'APPROUVEE';
            const attente = p.statut === 'EN_ATTENTE';
            notifs.push({
                id: `prein-${p.id}`,
                title: valid ? `Pré-inscription approuvée` : attente ? `Nouvelle pré-inscription` : `Pré-inscription rejetée`,
                desc: `${p.nom_candidat} ${p.prenom_candidat}`,
                date: new Date(dateStr),
                type: valid ? 'success' : attente ? 'info' : 'error'
            });
        });

        notifs.sort((a, b) => b.date - a.date);
        setNotifications(notifs.slice(0, 15));
    } catch(e) {
        console.error("Erreur notifications", e);
    }
  }

  React.useEffect(() => {
    let username = 'Utilisateur';
    let role = '';
    
    // Try user directly from localStorage if saved
    try {
      const savedUserStr = localStorage.getItem('user');
      if (savedUserStr) {
        const u = JSON.parse(savedUserStr);
        username = u.noms ? `${u.noms} ${u.prenoms || ''}` : (u.username || 'Utilisateur');
        role = u.role || localStorage.getItem('user_role') || '';
      }
    } catch(e) {}

    // Parse from token
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
        const decoded = JSON.parse(jsonPayload);
        
        let shouldFetch = false;

        if (decoded.username || decoded.noms) {
          username = decoded.noms ? `${decoded.noms} ${decoded.prenoms || ''}` : decoded.username;
        } else if (decoded.user_id && !localStorage.getItem('user')) {
          username = `Membre (${decoded.user_id})`;
          shouldFetch = true;
        }
         
        role = role || decoded.role || decoded.role_code || decoded.user_role || (decoded.user && decoded.user.role) || localStorage.getItem('user_role') || '';
        
        if (!role || role === 'N/A' || role === 'n/a' || String(role).toLowerCase() === 'null') {
            role = 'SUPER ADMIN';
            username = 'Administrateur';
        } else if (decoded.is_superuser || decoded.username === 'admin' || String(username).toLowerCase() === 'admin' || String(username).toLowerCase() === 'super admin') {
            role = 'SUPER ADMIN';
        }
       

        if (shouldFetch && decoded.user_id) {
           Promise.all([
             usersService.detail(decoded.user_id),
             rolesService.list().catch(() => []) // Handle potential errors gracefully
           ]).then(([userData, rolesList]) => {
              if (userData) {
                 const fetchedUsername = userData.noms ? `${userData.noms} ${userData.prenoms || ''}` : (userData.username || 'Utilisateur');
                 
                 let fetchedRole = userData.role_details || userData.role || '';
                 let matchingRole = null;
                 
                 // Try mapping ID or Code to real Libelle
                 if (rolesList && rolesList.length > 0) {
                     matchingRole = rolesList.find(r => 
                        String(r.id) === String(userData.role) || String(r.code) === String(userData.role)
                     );
                     if (matchingRole && matchingRole.libelle) {
                         fetchedRole = matchingRole.libelle;
                     }
                 }

                 localStorage.setItem('user', JSON.stringify(userData));
                 localStorage.setItem('user_role', fetchedRole);
                 localStorage.setItem('user_permissions', JSON.stringify(matchingRole || {}));
                 setUserInfo({ username: fetchedUsername.trim(), role: String(fetchedRole).toUpperCase() });
                 window.dispatchEvent(new Event('userRolesUpdated'));
              }
           }).catch(err => console.error("Erreur de recuperation de l'utilisateur:", err));
        }
      }
    } catch(e) {}
    
    setUserInfo({ 
      username: username.trim() || 'Utilisateur', 
      role: role ? String(role).toUpperCase() : 'N/A' 
    });

    if (role && /^\d+$/.test(role)) {
       rolesService.list().then(rolesList => {
           if (rolesList && rolesList.length > 0) {
               const matchingRole = rolesList.find(r => String(r.id) === String(role) || String(r.code) === String(role));
               if (matchingRole && matchingRole.libelle) {
                   const libelle = String(matchingRole.libelle).toUpperCase();
                   setUserInfo(prev => ({ ...prev, role: libelle }));
                   localStorage.setItem('user_role', matchingRole.libelle);
                   localStorage.setItem('user_permissions', JSON.stringify(matchingRole));
                   window.dispatchEvent(new Event('userRolesUpdated'));
               }
           }
       }).catch(e => console.error(e));
    }
    
    // Fetch notifications
    fetchNotifications();
  }, []);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleNotifMenu = (event) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  
  const handleNotifClose = () => {
    setNotifAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    localStorage.removeItem('user_role');
    localStorage.removeItem('user_permissions');
    localStorage.removeItem('loginTime');
    document.cookie = 'token=; Max-Age=-99999999; path=/';
    router.push('/login');
  };

  const getNotifIcon = (type) => {
    switch(type) {
        case 'success': return <CheckCircleIcon color="success" />;
        case 'error': return <CancelIcon color="error" />;
        default: return <InfoIcon color="info" />;
    }
  };

  // Nouveautés: filtrer les infos à la vue
  const unreadCount = notifications.filter(n => n.type === 'info').length;

  return (
    <AppBar
      position="static"
      sx={{
        backgroundColor: 'transparent',
        boxShadow: 'none',
        color: '#333',
        paddingY: 1,
      }}
    >
      <Toolbar>
        <Tooltip title="Menu principal">
          <IconButton
            color="inherit"
            aria-label="open sidebar"
            onClick={toggleSidebar}
            sx={{
              mr: 2,
              backgroundColor: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              '&:hover': { backgroundColor: '#f0f0f0' },
            }}
          >
            <MenuIcon sx={{ color: primaryColor }} />
          </IconButton>
        </Tooltip>
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: primaryColor }}>
          {config?.nom ? config.nom : (userInfo.role === 'ETUDIANT' ? 'Espace Étudiant' : "Vue d'ensemble")}
        </Typography>

        <Box sx={{ flexGrow: 1 }} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Année Académique Selector */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: 'white',
              borderRadius: 4,
              px: 2,
              py: 0.5,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              border: '1px solid #eef2f6'
            }}
          >
            <CalendarMonthIcon sx={{ color: primaryColor, mr: 1, fontSize: 20 }} />
            <Select
              value={selectedYear?.id || ''}
              onChange={(e) => {
                const changed = changeYear(e.target.value);
                if (changed) {
                  clearYearError();
                  router.refresh();
                }
              }}
              variant="standard"
              disableUnderline
              sx={{ 
                fontSize: '0.85rem', 
                fontWeight: 600, 
                color: primaryColor,
                '& .MuiSelect-select': { py: 0, minWidth: 100 }
              }}
            >
              {academicYears.map(year => (
                <MenuItem key={year.id} value={year.id} sx={{ fontSize: '0.85rem' }}>
                  Année {year.libelle} {year.est_active ? '(Active)' : ''}
                </MenuItem>
              ))}
            </Select>
          </Box>

          {yearError ? (
            <Box
              sx={{
                px: 2,
                py: 1,
                borderRadius: 3,
                backgroundColor: '#fdecea',
                border: '1px solid #f5c2c7',
                color: '#842029',
                maxWidth: 320,
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {yearError}
              </Typography>
            </Box>
          ) : null}
          <IconButton
            color="inherit"
            aria-label="notifications"
            onClick={handleNotifMenu}
            sx={{
              backgroundColor: 'white',
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              '&:hover': { backgroundColor: '#f5f5f0' },
            }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon sx={{ color: primaryColor }} />
            </Badge>
          </IconButton>

          <Menu
            anchorEl={notifAnchorEl}
            open={Boolean(notifAnchorEl)}
            onClose={handleNotifClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            PaperProps={{
              sx: { width: 350, maxHeight: 400 }
            }}
          >
            <Box sx={{ px: 2, py: 1.5 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                Notifications Récentes
              </Typography>
            </Box>
            <Divider />
            {notifications.length === 0 ? (
                <MenuItem disabled>Aucune notification de réussite/échec</MenuItem>
            ) : (
                <List sx={{ pt: 0, pb: 0 }}>
                    {notifications.map((notif) => (
                        <React.Fragment key={notif.id}>
                            <ListItem alignItems="flex-start" sx={{ py: 1 }}>
                                <ListItemIcon sx={{ minWidth: 40 }}>
                                    {getNotifIcon(notif.type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={notif.title}
                                    secondary={
                                        <React.Fragment>
                                            <Typography component="span" variant="body2" color="text.primary">
                                                {notif.desc}
                                            </Typography>
                                            <br/>
                                            {notif.date.toLocaleDateString('fr-FR')} - {notif.date.toLocaleTimeString('fr-FR', {hour: '2-digit', minute:'2-digit'})}
                                        </React.Fragment>
                                    }
                                />
                            </ListItem>
                            <Divider component="li" />
                        </React.Fragment>
                    ))}
                </List>
            )}
            <Box sx={{ textAlign: 'center', p: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ cursor:'pointer' }}>
                    Voir tout l&apos;historique
                </Typography>
            </Box>
          </Menu>


          <Box
            onClick={handleMenu}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              backgroundColor: 'white',
              borderRadius: 4,
              px: 1.5,
              py: 0.5,
              boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
              cursor: 'pointer',
              '&:hover': {
                backgroundColor: '#f5f5f5'
              }
            }}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: primaryColor, fontSize: '0.9rem' }}>
              {userInfo.username.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Typography variant="body2" fontWeight="bold" sx={{ lineHeight: 1.1 }}>
                {userInfo.username}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                {userInfo.role}
              </Typography>
            </Box>
          </Box>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            sx={{ mt: 1 }}
          >
            <Box sx={{ px: 2, py: 1.5, minWidth: 200 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {userInfo.username}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Rôle: {userInfo.role}
              </Typography>
            </Box>
            <Divider />
            <MenuItem onClick={handleClose}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              Mon profil
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <Typography color="error">Déconnexion</Typography>
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
