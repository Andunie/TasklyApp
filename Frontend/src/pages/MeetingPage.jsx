import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import JitsiMeeting from '../components/JitsiMeeting';
import { Box } from '@mui/material';

export default function MeetingPage() {
    const { roomName } = useParams();
    const navigate = useNavigate();

    const handleMeetingEnd = () => {
        // Toplantı bittiğinde kullanıcıyı bir önceki sayfaya veya ana sayfaya yönlendir
        navigate(-1); // Bir önceki sayfaya git
    };

    return (
        <Box sx={{ width: '100vw', height: '100vh', position: 'fixed', top: 0, left: 0, zIndex: 2000 }}>
            <JitsiMeeting 
                roomName={roomName} 
                onMeetingEnd={handleMeetingEnd}
            />
        </Box>
    );
}