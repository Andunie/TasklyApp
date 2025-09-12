import React, { useState } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Avatar, 
  Chip, 
  Divider, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText,
  Button,
  TextField,
  Alert,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { 
  Person, 
  Email, 
  Security, 
  Edit, 
  Save, 
  Cancel,
  Notifications,
  Language,
  Palette,
  Help
} from '@mui/icons-material';
import { useAuth } from '../context/AuthContext';
import { useThemeMode } from '../context/ThemeContext';
import Switch from '@mui/material/Switch';

export default function Settings() {
  const { user, logout } = useAuth();
  const { mode, toggleTheme } = useThemeMode();
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    fullName: user?.fullName || '',
    email: user?.email || ''
  });
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditForm({
        fullName: user?.fullName || '',
        email: user?.email || ''
      });
    }
    setIsEditing(!isEditing);
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    console.log('Saving user data:', editForm);
    setIsEditing(false);
  };

  const handleLogout = () => {
    logout();
    setShowLogoutDialog(false);
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case 'Admin':
        return 'Yönetici';
      case 'TeamLeader':
        return 'Takım Lideri';
      case 'User':
        return 'Kullanıcı';
      default:
        return role;
    }
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'Admin':
        return 'error';
      case 'TeamLeader':
        return 'primary';
      case 'User':
        return 'default';
      default:
        return 'default';
    }
  };

  if (!user) {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="warning">
          Kullanıcı bilgileri yüklenemedi. Lütfen tekrar giriş yapın.
        </Alert>
      </Box>
    );
  }

  return (
    <div className="container-fluid position-relative min-vh-100">
      <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
        alt="Mountain landscape"
        className="position-fixed top-0 start-0 w-100 h-100 object-fit-cover"
        style={{ zIndex: -1 }}
      />
      
      <Box sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom sx={{ color: 'text.primary', mb: 4 }}>
          Ayarlar
        </Typography>

        {/* Profil Bilgileri */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', color: 'text.primary' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
            <Avatar 
              sx={{ 
                width: 80, 
                height: 80, 
                bgcolor: 'primary.main',
                fontSize: '2rem',
                mr: 3
              }}
            >
              {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="h5" gutterBottom>
                {user.fullName}
              </Typography>
              <Chip 
                label={getRoleDisplayName(user.role)}
                color={getRoleColor(user.role)}
                size="medium"
              />
            </Box>
            <IconButton 
              onClick={handleEditToggle}
              color="primary"
              sx={{ ml: 2 }}
            >
              <Edit />
            </IconButton>
          </Box>

          {isEditing ? (
            <Box sx={{ mt: 2 }}>
              <TextField
                fullWidth
                label="Ad Soyad"
                value={editForm.fullName}
                onChange={(e) => setEditForm({ ...editForm, fullName: e.target.value })}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="E-posta"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                sx={{ mb: 2 }}
              />
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button 
                  variant="contained" 
                  onClick={handleSave}
                  startIcon={<Save />}
                >
                  Kaydet
                </Button>
                <Button 
                  variant="outlined" 
                  onClick={handleEditToggle}
                  startIcon={<Cancel />}
                >
                  İptal
                </Button>
              </Box>
            </Box>
          ) : (
            <List>
              <ListItem>
                <ListItemIcon>
                  <Person color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Ad Soyad" 
                  secondary={user.fullName}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Email color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="E-posta" 
                  secondary={user.email}
                />
              </ListItem>
              <Divider />
              <ListItem>
                <ListItemIcon>
                  <Security color="primary" />
                </ListItemIcon>
                <ListItemText 
                  primary="Kullanıcı ID" 
                  secondary={user.id}
                />
              </ListItem>
            </List>
          )}
        </Paper>

        {/* Uygulama Ayarları */}
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'background.paper', color: 'text.primary' }}>
          <Typography variant="h6" gutterBottom>
            Uygulama Ayarları
          </Typography>
          <List>
            <ListItem button>
              <ListItemIcon>
                <Notifications color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Bildirim Ayarları" 
                secondary="E-posta ve push bildirimleri"
              />
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemIcon>
                <Language color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Dil Ayarları" 
                secondary="Türkçe"
              />
            </ListItem>
            <Divider />
            <ListItem>
              <ListItemIcon>
                <Palette color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Tema Ayarları" 
                secondary={mode === 'dark' ? 'Koyu tema' : 'Açık tema'}
              />
              <Switch
                checked={mode === 'dark'}
                onChange={toggleTheme}
                color="primary"
                inputProps={{ 'aria-label': 'Koyu Tema' }}
              />
              <Typography sx={{ ml: 1 }}>{mode === 'dark' ? 'Koyu' : 'Açık'}</Typography>
            </ListItem>
            <Divider />
            <ListItem button>
              <ListItemIcon>
                <Help color="primary" />
              </ListItemIcon>
              <ListItemText 
                primary="Yardım ve Destek" 
                secondary="SSS ve iletişim"
              />
            </ListItem>
          </List>
        </Paper>

        {/* Hesap İşlemleri */}
        <Paper sx={{ p: 3, bgcolor: 'background.paper', color: 'text.primary' }}>
          <Typography variant="h6" gutterBottom color="error">
            Hesap İşlemleri
          </Typography>
          <Alert severity="warning" sx={{ mb: 2 }}>
            Bu işlemler geri alınamaz. Lütfen dikkatli olun.
          </Alert>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button 
              variant="outlined" 
              color="error"
              onClick={() => setShowLogoutDialog(true)}
            >
              Çıkış Yap
            </Button>
            <Button 
              variant="outlined" 
              color="error"
              disabled
            >
              Hesabı Sil
            </Button>
          </Box>
        </Paper>
      </Box>

      {/* Çıkış Dialog */}
      <Dialog open={showLogoutDialog} onClose={() => setShowLogoutDialog(false)}>
        <DialogTitle>Çıkış Yap</DialogTitle>
        <DialogContent>
          <Typography>
            Hesabınızdan çıkış yapmak istediğinizden emin misiniz?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowLogoutDialog(false)}>
            İptal
          </Button>
          <Button onClick={handleLogout} color="error" variant="contained">
            Çıkış Yap
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}



