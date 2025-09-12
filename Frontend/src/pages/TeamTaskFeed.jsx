import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Stack, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import apiClient from '../api/client';
import ActivityCard from '../components/ActivityCard';
import { useAuth } from '../context/AuthContext';

export default function TeamTaskFeed() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['taskActivities', 'team', taskId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/activities/team-feed/${taskId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const sortedActivities = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return [...list].sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  }, [data]);

  const addComment = useMutation({
    mutationFn: async ({ activityId, content }) => {
      const res = await apiClient.post(`/api/comments/activity/${activityId}`,
        { content }
      );
      return res.data;
    },
    onSuccess: () => {
      toast.success('Yorum eklendi');
      queryClient.invalidateQueries({ queryKey: ['taskActivities', 'team', taskId] });
    },
    onError: () => toast.error('Yorum eklenemedi'),
  });

  // Takım sayfasında reply yetkisi yok, her zaman false
  const canReply = () => false;

  return (
    <Container maxWidth="md">
      <Typography variant="h6" sx={{ mb: 2 }}>Takım Görevleri</Typography>
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


