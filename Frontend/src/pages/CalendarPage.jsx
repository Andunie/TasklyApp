import React from 'react';
import { Typography, Paper, Box, Chip, Alert } from '@mui/material';
import Calendar from '../components/Calendar';
import { useTeam } from '../context/TeamContext';

export default function CalendarPage() {
  const { activeTeam, isLoadingTeam, isCurrentUserTeamLead } = useTeam();

  return (
    <div className="container-fluid position-relative min-vh-100">
      <img
        src="https://images.unsplash.com/photo-1506905925346-21bda4d32df4?q=80&w=2070&auto=format&fit=crop"
        alt="Mountain landscape"
        className="position-fixed top-0 start-0 w-100 h-100 object-fit-cover"
        style={{ zIndex: -1 }}
      />
      
      <Typography variant="h5" gutterBottom sx={{ color: 'text.primary', pt: 4, pl: 4 }}>
        Hoş geldin!
      </Typography>

      <Box sx={{ px: 4, mb: 3 }}>
        {isLoadingTeam ? (
          <Paper sx={{ p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
            <Typography variant="body2">Takım bilgileri yükleniyor...</Typography>
          </Paper>
        ) : activeTeam ? (
          <Paper sx={{ p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
            <Typography variant="h6" gutterBottom>
              Aktif Takım: {activeTeam.name}
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}>
              <Typography variant="body2">Rolünüz:</Typography>
              <Chip 
                label={isCurrentUserTeamLead ? "Takım Lideri" : "Takım Üyesi"} 
                color={isCurrentUserTeamLead ? "primary" : "default"}
                size="small"
              />
            </Box>
            {isCurrentUserTeamLead && (
              <Alert severity="info" sx={{ mt: 1 }}>
                Takım lideri olarak tüm takım yönetim özelliklerine erişiminiz var.
              </Alert>
            )}
          </Paper>
        ) : (
          <Paper sx={{ p: 2, bgcolor: 'background.paper', color: 'text.primary' }}>
            <Typography variant="body2" color="text.secondary">
              Henüz bir takım seçilmemiş. Takımlar sayfasından bir takım seçin.
            </Typography>
          </Paper>
        )}
      </Box>

      <div className="px-4 pb-4">
        <Calendar />
      </div>
    </div>
  );
}