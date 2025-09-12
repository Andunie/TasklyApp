import React, { useMemo, useState, Suspense } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { Toolbar, Typography, Drawer, List, ListItemButton, ListItemText, ListItemIcon, Box, Button, IconButton, Divider, useTheme, useMediaQuery, Container, CircularProgress } from '@mui/material';
import NotificationBell from '../components/NotificationBell';
import { Menu as MenuIcon, Gauge, ClipboardList, Users as UsersIcon, BarChart3, Settings, LayoutDashboard, ListChecks, Activity, Bell, Video } from 'lucide-react';

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const { isCurrentUserTeamLead } = useTeam();
  const theme = useTheme();
  const location = useLocation();
  const isMdUp = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerWidth = 260;

  const isActive = useMemo(
    () => (path) => location.pathname.startsWith(path),
    [location.pathname]
  );

  const navItems = (
    <List sx={{ py: 1 }}>
      {[
        { to: '/admin', label: 'Admin Dashboard', icon: <Gauge size={18} /> },
        { to: '/admin/tasks', label: 'Tüm Görevler', icon: <ClipboardList size={18} /> },
        { to: '/admin/users', label: 'Kullanıcılar', icon: <UsersIcon size={18} /> },
        { to: '/admin/reports', label: 'Raporlar', icon: <BarChart3 size={18} /> },
        { to: '/admin/settings', label: 'Admin Ayarlar', icon: <Settings size={18} /> },
        'divider',
        { to: '/app', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
        { to: '/app/my-tasks', label: 'Görevlerim', icon: <ListChecks size={18} /> },
        { to: '/app/meetings/new', label: 'Toplantı Planla', icon: <Video size={18} /> },
        ...(isCurrentUserTeamLead ? [
          { to: '/app/team-tasks', label: 'Takım Görevleri', icon: <ClipboardList size={18} /> },
        ] : []),
        { to: '/app/activities/my', label: 'Aktivitelerim', icon: <Activity size={18} /> },
        ...(isCurrentUserTeamLead ? [
          { to: '/app/team-activities', label: 'Takım Aktiviteleri', icon: <Activity size={18} /> },
        ] : []),
      ].map((item) => {
        if (item === 'divider') return <Divider key="divider" />;
        const { to, label, icon } = item;
        const active = isActive(to) && (to === '/admin' || to === '/app' ? location.pathname === to : true);
        return (
          <ListItemButton
            key={to}
            component={RouterLink}
            to={to}
            sx={{
              '&:hover': { backgroundColor: theme.palette.action.hover },
              backgroundColor: active ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : 'transparent',
              color: active ? theme.palette.primary.main : 'inherit',
              '& .MuiListItemIcon-root': {
                minWidth: 36,
                color: active ? theme.palette.primary.main : theme.palette.text.secondary,
              },
            }}
          >
            <ListItemIcon>{icon}</ListItemIcon>
            <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary={label} />
          </ListItemButton>
        );
      })}

      <ListItemButton component={RouterLink} to="/app/notifications" sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}>
        <ListItemIcon><Bell size={18} /></ListItemIcon>
        <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary="Bildirimler" />
      </ListItemButton>

      <ListItemButton component={RouterLink} to="/app/settings" sx={{ '&:hover': { backgroundColor: theme.palette.action.hover }, backgroundColor: isActive('/app/settings') ? (theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)') : 'transparent', color: isActive('/app/settings') ? theme.palette.primary.main : 'inherit', '& .MuiListItemIcon-root': { minWidth: 36, color: isActive('/app/settings') ? theme.palette.primary.main : theme.palette.text.secondary } }}>
        <ListItemIcon><Settings size={18} /></ListItemIcon>
        <ListItemText primaryTypographyProps={{ variant: 'body2' }} primary="Ayarlar" />
      </ListItemButton>
    </List>
  );

  const drawer = (
    <Box role="navigation" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Toolbar sx={{ px: 2, py: 0 }}>
        <Button component={RouterLink} to="/app" aria-label="Taskly ana sayfa" sx={{ px: 0, minWidth: 0 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 800,
              letterSpacing: 1,
              background: 'linear-gradient(90deg, #009688, #607d8b)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              color: 'transparent',
              lineHeight: 1.2,
            }}
          >
            Taskly
          </Typography>
        </Button>
      </Toolbar>
      <Divider />
      <Box sx={{ overflow: 'auto', flexGrow: 1 }}>{navItems}</Box>
      {/* Bottom Logout Button */}
      <Box sx={{ p: 2 }}>
        <Button variant="contained" color="error" fullWidth onClick={logout}>Çıkış Yap</Button>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: 'background.default' }}>
      {/* Responsive Sidebar */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }} aria-label="Kenar menü">
        {/* Temporary drawer for mobile */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: 'block', md: 'none' }, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', boxShadow: 1 } }}
        >
          {drawer}
        </Drawer>
        {/* Permanent drawer for md+ */}
        <Drawer
          variant="permanent"
          sx={{ display: { xs: 'none', md: 'block' }, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', boxShadow: 1 } }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>

        <Container maxWidth={false} className="container" sx={{ py: 3, flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
          <Suspense fallback={
            <Box className="page-placeholder d-flex align-items-center justify-content-center" sx={{ flex: 1 }}>
              <CircularProgress />
            </Box>
          }>
            <Outlet />
          </Suspense>
          {/* Footer */}
          <Box component="footer" sx={{ mt: 'auto', py: 2, textAlign: 'center', color: 'text.secondary' }}>
            <Typography variant="body2">© 2025 xAI • <Button component={RouterLink} to="/app/settings" variant="text" size="small">Ayarlar</Button></Typography>
          </Box>
        </Container>
      </Box>
    </Box>
  );
}


