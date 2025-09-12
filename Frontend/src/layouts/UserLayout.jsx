import React, { useMemo, useState, Suspense, useEffect, useRef } from 'react';
import { Link as RouterLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
// DÜZELTME: useTheme burada import edildi.
import { Toolbar, Typography, Drawer, List, ListItemButton, ListItemText, ListItemIcon, Box, Button, Popover, Badge, Divider, Container, CircularProgress, useTheme, Fab, Tooltip } from '@mui/material';
import { Menu as MenuIcon, Calendar as CalendarIcon, ListChecks, Users, LayoutDashboard, ClipboardList, Activity, Settings, Bell, Video, Sparkles } from 'lucide-react';

import { notificationService } from '../api/services';
import { HubConnectionBuilder } from '@microsoft/signalr';
import { formatDistanceToNow } from 'date-fns';
import { tr } from 'date-fns/locale';
import CreateMeetingModal from '../components/CreateMeetingModal';
import AIAssistantModal from '../components/AIAssistantModal';

export default function UserLayout() {
  const { user, logout } = useAuth();
  const { isCurrentUserTeamLead, activeTeamId } = useTeam();  
  const theme = useTheme(); // Artık hata vermeyecek
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [meetingModalOpen, setMeetingModalOpen] = useState(false);

  // --- Bildirim Mantığı ---
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);

  const [assistantModalOpen, setAssistantModalOpen] = useState(false);

  useEffect(() => {
    notificationService.getNotifications()
      .then(data => setNotifications(data))
      .catch(err => console.error("Failed to fetch notifications:", err));
      
    const connection = new HubConnectionBuilder()
      .withUrl("https://localhost:7008/notificationHub", {
        accessTokenFactory: () => localStorage.getItem("auth_token")
      })
      .withAutomaticReconnect()
      .build();

    connection.start()
      .then(() => {
        console.log('Notification Hub Connected!');
        connection.on('ReceiveNewNotification', (newNotification) => {
          setNotifications(prev => [newNotification, ...prev]);
        });
      })
      .catch(e => console.error('Connection failed: ', e));

    return () => {
      connection.stop();
    };
  }, []);

  const handleNotificationPopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationPopoverClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = async (notification) => {
    handleNotificationPopoverClose();
    if (!notification.isRead) {
      try {
        const response = await notificationService.markOneAsRead(notification.id);
        setNotifications(prev => 
            prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        if (response.link) navigate(response.link);
      } catch (err) {
        if (notification.link) navigate(notification.link);
      }
    } else {
      if (notification.link) navigate(notification.link);
    }
  };
  
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const isNotificationPopoverOpen = Boolean(anchorEl);
  // --- Bildirim Mantığı Sonu ---

  const drawerWidth = 240;

  const isActive = useMemo(
    () => (path) => location.pathname.startsWith(path),
    [location.pathname]
  );
  
  const getListItemStyles = (path) => {
    // DÜZELTME: 'to' yerine, fonksiyona gelen 'path' değişkeni kullanıldı.
    const active = isActive(path) && (path === '/app' ? location.pathname === '/app' : true);
    return {
      '&:hover': { backgroundColor: theme.palette.action.hover },
      backgroundColor: active ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : 'transparent',
      color: active ? theme.palette.primary.main : 'inherit',
      '& .MuiListItemIcon-root': {
        minWidth: 36,
        color: active ? theme.palette.primary.main : theme.palette.text.secondary,
      },
    };
  };

  const navItems = (
    <List sx={{ py: 1 }}>
      {[
        { to: '/app', label: 'Calendar', icon: <CalendarIcon size={18} /> },
        { to: '/app/my-tasks', label: 'Görevlerim', icon: <ListChecks size={18} /> },
        { to: '/app/teams', label: 'Takımlar', icon: <Users size={18} /> },
        ...(isCurrentUserTeamLead ? [
          { to: '/app/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
          { to: '/app/team-tasks', label: 'Takım Görevleri', icon: <ClipboardList size={18} /> },
        ] : []),
        { to: '/app/activities/my', label: 'Aktivitelerim', icon: <Activity size={18} /> },
        { to: '/app/team-activities', label: 'Takım Aktiviteleri', icon: <Activity size={18} /> },
      ].map(({ to, label, icon }) => (
          <ListItemButton key={to} component={RouterLink} to={to} sx={getListItemStyles(to)}>
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={label} />
          </ListItemButton>
      ))}

      <ListItemButton onClick={() => setMeetingModalOpen(true)} disabled={!activeTeamId} sx={getListItemStyles('/app/meetings')}>
        <ListItemIcon><Video size={18} /></ListItemIcon>
        <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary="Toplantı Başlat" />
      </ListItemButton>

      <ListItemButton onClick={handleNotificationPopoverOpen} sx={getListItemStyles('/app/notifications')}>
        <ListItemIcon>
          <Badge color="error" badgeContent={unreadCount} max={9}>
            <Bell size={18} />
          </Badge>
        </ListItemIcon>
        <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary="Bildirimler" />
      </ListItemButton>

      <ListItemButton component={RouterLink} to="/app/settings" sx={getListItemStyles('/app/settings')}>
        <ListItemIcon><Settings size={18} /></ListItemIcon>
        <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary="Ayarlar" />
      </ListItemButton>
    </List>
  );

  const drawer = (
    <Box role="navigation" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2, py: 0 }}>
        <Button component={RouterLink} to="/app" aria-label="Taskly ana sayfa" sx={{ px: 0, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, letterSpacing: 1, background: 'linear-gradient(90deg, #009688, #607d8b)', WebkitBackgroundClip: 'text', backgroundClip: 'text', color: 'transparent', lineHeight: 1.2, }}>
            Taskly
          </Typography>
        </Button>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>{navItems}</Box>
      <Box sx={{ p: 2 }}>
        <Button variant="contained" color="error" fullWidth onClick={logout}>Çıkış Yap</Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="Kenar menü">
        <Drawer variant="temporary" open={mobileOpen} onClose={() => setMobileOpen(false)} ModalProps={{ keepMounted: true }} sx={{ display: { xs: 'block', md: 'none' }, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', boxShadow: 1 } }}>
          {drawer}
        </Drawer>
        <Drawer variant="permanent" sx={{ display: { xs: 'none', md: 'block' }, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', boxShadow: 1 } }} open>
          {drawer}
        </Drawer>
      </Box>

      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Container maxWidth={false} sx={{ py: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={<Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CircularProgress /></Box>}>
            <Outlet />
          </Suspense>
          <Box component="footer" sx={{ mt: 'auto', py: 2, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">© 2025 • <Button component={RouterLink} to="/app/settings" variant="text" size="small">Ayarlar</Button></Typography>
          </Box>
        </Container>
      </Box>

      <Popover
        open={isNotificationPopoverOpen}
        anchorEl={anchorEl}
        onClose={handleNotificationPopoverClose}
        anchorOrigin={{ vertical: 'center', horizontal: 'right' }}
        transformOrigin={{ vertical: 'center', horizontal: 'left' }}
        PaperProps={{ sx: { width: 360, maxHeight: 400, ml: 1, boxShadow: 3 } }}
      >
        <Box sx={{ p: 2 }}>
          <Typography variant="h6">Bildirimler</Typography>
        </Box>
        <Divider />
        <List sx={{ p: 0 }}>
          {notifications.length > 0 ? (
            notifications.map(notification => (
              <ListItemButton key={notification.id} onClick={() => handleNotificationClick(notification)}>
                <ListItemText
                  primary={notification.message}
                  secondary={formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true, locale: tr })}
                  primaryTypographyProps={{ fontWeight: notification.isRead ? 'normal' : 'bold' }}
                />
              </ListItemButton>
            ))
          ) : (
            <Typography sx={{ p: 3 }} color="text.secondary">Yeni bildiriminiz yok.</Typography>
          )}
        </List>
      </Popover>

      <CreateMeetingModal 
        open={meetingModalOpen} 
        handleClose={() => setMeetingModalOpen(false)} 
        teamId={activeTeamId} 
      />

      {/* Asistanı Tetikleyecek Buton (FAB) */}
      <Tooltip title="TasklyAI Asistanı'na Sor">
        <Fab
          color="primary"
          aria-label="Ask AI Assistant"
          onClick={() => setAssistantModalOpen(true)}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            // Daha parlak bir efekt için
            boxShadow: '0px 8px 24px rgba(0, 150, 136, 0.4)', 
            '&:hover': {
              transform: 'scale(1.05)',
              boxShadow: '0px 10px 28px rgba(0, 150, 136, 0.5)',
            }
          }}
        >
          <Sparkles />
        </Fab>
      </Tooltip>

      {/* Asistan Modal Component'i */}
      <AIAssistantModal 
        open={assistantModalOpen} 
        handleClose={() => setAssistantModalOpen(false)} 
      />
      
    </Box>
  );
} 