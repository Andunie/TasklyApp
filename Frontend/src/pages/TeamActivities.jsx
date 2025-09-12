import React, { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Stack, Typography, Alert, Button } from '@mui/material';
import { toast } from 'react-toastify';
import apiClient from '../api/client';
import ActivityCard from '../components/ActivityCard';
import { useAuth } from '../context/AuthContext';
import { useTeam } from '../context/TeamContext';
import { Link as RouterLink } from 'react-router-dom';

export default function TeamActivities() {
  const { user } = useAuth();
  const { activeTeamId } = useTeam();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['teamActivities', activeTeamId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/activities/team-feed/${activeTeamId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: !!activeTeamId,
  });

  const sortedActivities = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return [...list].sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  }, [data]);

  const addComment = useMutation({
    mutationFn: async ({ activityId, content }) => {
      const res = await apiClient.post(`/api/comments/activity/${activityId}`, { content });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Yorum eklendi');
      queryClient.invalidateQueries({ queryKey: ['teamActivities', activeTeamId] });
    },
    onError: () => toast.error('Yorum eklenemedi'),
  });

  const canReply = () => false;

  if (!activeTeamId) {
    return (
      <Container maxWidth="md">
        <Alert severity="info" sx={{ mb: 2 }}>
          Lütfen bir aktif takım seçin. Takımlar sayfasından bir takımı "Aktif Yap" ile belirleyebilirsiniz.
        </Alert>
        <Button component={RouterLink} to="/app/teams" variant="contained">Takımlara Git</Button>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Typography variant="h6" sx={{ mb: 2 }}>Takım Aktiviteleri</Typography>
      <Stack spacing={2}>
        {isLoading && <Typography>Yükleniyor...</Typography>}
        {!isLoading && sortedActivities.length === 0 && (
          <Typography variant="body2" color="text.secondary">Henüz aktivite yok</Typography>
        )}
        {sortedActivities.map((a) => (
          <ActivityCard
            key={a.id}
            activity={a}
            currentUserId={user?.id}
            enableCommentButton={a.userId !== user?.id}
            onCommentSubmit={(activityId, content) => addComment.mutateAsync({ activityId, content })}
            onReplySubmit={undefined}
            canReply={canReply}
          />
        ))}
      </Stack>
    </Container>
  );
}


