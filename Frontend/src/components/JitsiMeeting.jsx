import React from 'react';
import { JitsiMeeting as JitsiMeetingComponent } from '@jitsi/react-sdk';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress, Typography } from '@mui/material';

export default function JitsiMeeting({ roomName, onMeetingEnd }) {
  const { user } = useAuth();

  const configOverwrite = {
    prejoinPageEnabled: true,
    requireDisplayName: true,
    startWithAudioMuted: true,
    startWithVideoMuted: true,
    p2p: { enabled: false },
  };

  const interfaceConfigOverwrite = {
    SHOW_JITSI_WATERMARK: false,
    SHOW_WATERMARK_FOR_GUESTS: false,
    DEFAULT_LANGUAGE: 'tr',
    TOOLBAR_BUTTONS: [
        'camera', 'chat', 'desktop', 'fullscreen', 'hangup', 'microphone',
        'profile', 'raisehand', 'settings', 'tileview'
    ],
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <JitsiMeetingComponent
        // --- İŞTE EN ÖNEMLİ DÜZELTME BURADA ---
        // SDK'ya hangi sunucuyu kullanacağını açıkça belirtiyoruz.
        // Bu, ticari 8x8.vc servisine yönlendirilmesini engeller.
        serverURL="https://meet.jit.si"
        
        roomName={roomName}
        configOverwrite={configOverwrite}
        interfaceConfigOverwrite={interfaceConfigOverwrite}
        userInfo={{
          displayName: user?.fullName || 'Taskly User',
          email: user?.email,
        }}
        onReadyToClose={onMeetingEnd}
        
        spinner={() => (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', backgroundColor: '#222' }}>
            <CircularProgress />
            <Typography sx={{ ml: 2, color: 'white' }}>Toplantı odası hazırlanıyor...</Typography>
          </Box>
        )}
        
        getIFrameRef={(iframeRef) => {
          iframeRef.style.height = '100%';
          iframeRef.style.width = '100%';
          iframeRef.style.border = '0';
        }}
      />
    </Box>
  );
}