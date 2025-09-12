import React from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  Box, 
  Chip, 
  Alert, 
  Button, 
  Divider,
  List,
  ListItem,
  ListItemText,
  CircularProgress
} from '@mui/material';
import { useTeam } from '../context/TeamContext';
import { useAuth } from '../context/AuthContext';

export default function TeamContextTest() {
  const { user } = useAuth();
  const { 
    activeTeamId, 
    setActiveTeamId, 
    activeTeam, 
    isLoadingTeam, 
    isCurrentUserTeamLead 
  } = useTeam();

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" gutterBottom>
        TeamContext Test Sayfası
      </Typography>
      
      {/* Kullanıcı Bilgileri */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Kullanıcı Bilgileri</Typography>
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip label={`ID: ${user?.id || 'N/A'}`} />
          <Chip label={`Ad: ${user?.fullName || 'N/A'}`} />
          <Chip label={`Rol: ${user?.role || 'N/A'}`} />
        </Box>
      </Paper>

      {/* Takım Seçimi */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Takım Seçimi</Typography>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Button 
            variant="outlined" 
            onClick={() => setActiveTeamId(1)}
            disabled={activeTeamId === 1}
          >
            Takım 1'i Seç
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setActiveTeamId(2)}
            disabled={activeTeamId === 2}
          >
            Takım 2'yi Seç
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => setActiveTeamId(null)}
            disabled={!activeTeamId}
          >
            Takım Seçimini Kaldır
          </Button>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Aktif Takım ID: {activeTeamId || 'Seçilmemiş'}
        </Typography>
      </Paper>

      {/* Takım Detayları */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Takım Detayları</Typography>
        
        {isLoadingTeam ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
            <CircularProgress />
          </Box>
        ) : activeTeam ? (
          <Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2 }}>
              <Chip label={`Takım ID: ${activeTeam.id}`} />
              <Chip label={`Takım Adı: ${activeTeam.name}`} />
              <Chip label={`Takım Lideri ID: ${activeTeam.teamLeadId}`} />
            </Box>
            
            <Divider sx={{ my: 2 }} />
            
            <Typography variant="subtitle1" gutterBottom>Üyeler:</Typography>
            <List dense>
              {activeTeam.members?.map((member, index) => (
                <ListItem key={index}>
                  <ListItemText 
                    primary={member.email || member.name} 
                    secondary={`ID: ${member.id || member.userId}`}
                  />
                </ListItem>
              )) || (
                <ListItem>
                  <ListItemText primary="Üye bilgisi bulunamadı" />
                </ListItem>
              )}
            </List>
          </Box>
        ) : (
          <Alert severity="info">
            Henüz bir takım seçilmemiş veya takım bilgileri yüklenememiş.
          </Alert>
        )}
      </Paper>

      {/* Rol Kontrolü */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Rol Kontrolü</Typography>
        
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip 
            label={`Kullanıcı ID: ${user?.id || 'N/A'}`} 
            color="primary"
          />
          <Chip 
            label={`Takım Lideri ID: ${activeTeam?.teamLeadId || 'N/A'}`} 
            color="secondary"
          />
        </Box>
        
        <Divider sx={{ my: 2 }} />
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
          <Chip 
            label={`Takım Lideri mi? ${isCurrentUserTeamLead ? 'Evet' : 'Hayır'}`} 
            color={isCurrentUserTeamLead ? "success" : "default"}
            variant={isCurrentUserTeamLead ? "filled" : "outlined"}
          />
        </Box>
        
        {isCurrentUserTeamLead && (
          <Alert severity="success" sx={{ mt: 2 }}>
            Bu kullanıcı seçili takımın lideridir! Liderlere özel özelliklere erişim sağlanabilir.
          </Alert>
        )}
      </Paper>

      {/* Context Değerleri */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>Context Değerleri (Debug)</Typography>
        <Box sx={{ bgcolor: 'grey.100', p: 2, borderRadius: 1 }}>
          <pre style={{ margin: 0, fontSize: '12px', overflow: 'auto' }}>
            {JSON.stringify({
              activeTeamId,
              activeTeam: activeTeam ? {
                id: activeTeam.id,
                name: activeTeam.name,
                teamLeadId: activeTeam.teamLeadId,
                membersCount: activeTeam.members?.length || 0
              } : null,
              isLoadingTeam,
              isCurrentUserTeamLead,
              user: {
                id: user?.id,
                fullName: user?.fullName,
                role: user?.role
              }
            }, null, 2)}
          </pre>
        </Box>
      </Paper>
    </Container>
  );
}
