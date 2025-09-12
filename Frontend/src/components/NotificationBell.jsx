import React, { useState } from 'react';
import {
  IconButton,
  Badge,
  Menu,
  MenuItem,
  Typography,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsNone as NotificationsNoneIcon,
} from '@mui/icons-material';
import { useNotifications } from '../hooks/useNotifications';
import { useNavigate } from 'react-router-dom';

export default function NotificationBell() {
  const [anchorEl, setAnchorEl] = useState(null);
  const { 
    notifications, 
    unreadCount, 
    markAllAsRead, 
    isMarkingAsRead, 
    isLoading, 
    error 
  } = useNotifications();
  const navigate = useNavigate();
  const open = Boolean(anchorEl);

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    if (notification.link) {
      // Handle both absolute and relative paths
      if (notification.link.startsWith('http')) {
        window.open(notification.link, '_blank');
      } else {
        navigate(notification.link);
      }
    }
    handleClose();
  };

  const handleMarkAllAsRead = () => {
    markAllAsRead();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Şimdi';
    if (diffMins < 60) return `${diffMins} dk önce`;
    if (diffHours < 24) return `${diffHours} saat önce`;
    if (diffDays < 7) return `${diffDays} gün önce`;
    return date.toLocaleDateString('tr-TR');
  };

  return (
    <>
      <IconButton color="inherit" onClick={handleClick}>
        <Badge badgeContent={unreadCount} color="error">
          {unreadCount > 0 ? <NotificationsIcon /> : <NotificationsNoneIcon />}
        </Badge>
      </IconButton>

      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 400,
            maxHeight: 500,
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6">
              Bildirimler {unreadCount > 0 && `(${unreadCount})`}
            </Typography>
            {unreadCount > 0 && (
              <Button 
                size="small" 
                onClick={handleMarkAllAsRead}
                disabled={isMarkingAsRead}
                startIcon={isMarkingAsRead ? <CircularProgress size={16} /> : null}
                variant="outlined"
              >
                Tümünü Okundu İşaretle
              </Button>
            )}
          </Box>
        </Box>

        {isLoading ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <CircularProgress size={24} />
            <Typography variant="body2" sx={{ mt: 1 }}>
              Bildirimler yükleniyor...
            </Typography>
          </Box>
        ) : error ? (
          <Box sx={{ p: 2 }}>
            <Alert severity="error" size="small">
              Bildirimler yüklenirken hata oluştu
            </Alert>
          </Box>
        ) : notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography color="textSecondary">
              Henüz bildirim bulunmuyor
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0, maxHeight: 350, overflow: 'auto' }}>
            {notifications.slice(0, 15).map((notification, index) => (
              <React.Fragment key={notification.id}>
                <ListItem
                  button
                  onClick={() => handleNotificationClick(notification)}
                  sx={{
                    backgroundColor: notification.isRead ? 'transparent' : 'action.hover',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                    borderLeft: notification.isRead ? 'none' : '3px solid',
                    borderLeftColor: 'primary.main',
                  }}
                >
                  <ListItemText
                    primary={notification.message}
                    secondary={formatDate(notification.createdAt)}
                    primaryTypographyProps={{
                      fontWeight: notification.isRead ? 'normal' : 'bold',
                      fontSize: '0.9rem',
                      color: notification.isRead ? 'text.primary' : 'text.primary',
                    }}
                    secondaryTypographyProps={{
                      fontSize: '0.75rem',
                    }}
                  />
                  {!notification.isRead && (
                    <ListItemSecondaryAction>
                      <Box
                        sx={{
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          backgroundColor: 'primary.main',
                        }}
                      />
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
                {index < notifications.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </Menu>
    </>
  );
}
