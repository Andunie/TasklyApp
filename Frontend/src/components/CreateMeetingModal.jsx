import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { teamService, notificationService } from '../api/services';
import { Modal, Box, Typography, TextField, Button, Autocomplete, CircularProgress } from '@mui/material';

export default function CreateMeetingModal({ open, handleClose, teamId }) {
  const navigate = useNavigate();
  const [teamMembers, setTeamMembers] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const { control, handleSubmit, formState: { errors, isSubmitting } } = useForm({
      defaultValues: { topic: '', attendees: [] }
  });

  React.useEffect(() => {
    if (open && teamId) {
      setLoading(true);
      teamService.getTeamMembers(teamId)
        .then(data => setTeamMembers(data))
        .finally(() => setLoading(false));
    }
  }, [open, teamId]);

  const onSubmit = async (data) => {
    const topicSlug = data.topic.replace(/\s+/g, '-').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const roomName = `TasklyApp-${topicSlug}-${Date.now()}`;
    const meetingUrl = `/app/meeting/${roomName}`;

    try {
      await notificationService.sendMeetingInvitation({
        targetUserIds: data.attendees.map(a => a.id),
        meetingTopic: data.topic,
        meetingLink: meetingUrl
      });
      navigate(meetingUrl);
    } catch (error) {
      console.error("Failed to send invitations", error);
    }
  };

  const style = { position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 500, bgcolor: 'background.paper', boxShadow: 24, p: 4, borderRadius: 2 };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        <Typography variant="h6" component="h2">Anlık Toplantı Başlat</Typography>
        {loading ? <CircularProgress sx={{ mt: 2 }} /> : (
          <form onSubmit={handleSubmit(onSubmit)}>
            <Controller name="topic" control={control} rules={{ required: 'Toplantı konusu zorunludur' }} render={({ field }) => (
              <TextField {...field} label="Toplantı Konusu" fullWidth margin="normal" error={!!errors.topic} helperText={errors.topic?.message} />
            )} />
            <Controller name="attendees" control={control} render={({ field }) => (
              <Autocomplete multiple options={teamMembers.filter(m => m.id !== window.CURRENT_USER_ID)} getOptionLabel={(option) => option.fullName} onChange={(_, data) => field.onChange(data)}
                renderInput={(params) => <TextField {...params} label="Katılımcıları Davet Et" />} />
            )} />
            <Button type="submit" variant="contained" fullWidth sx={{ mt: 3 }} disabled={isSubmitting}>
              {isSubmitting ? <CircularProgress size={24} /> : 'Toplantı Başlat ve Davet Et'}
            </Button>
          </form>
        )}
      </Box>
    </Modal>
  );
}