import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Stack, Typography } from '@mui/material';
import { toast } from 'react-toastify';
import apiClient from '../api/client';
import ActivityForm from '../components/ActivityForm';
import ActivityCard from '../components/ActivityCard';
import { useAuth } from '../context/AuthContext';

export default function MyTaskActivities() {
  const { taskId } = useParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['taskActivities', 'mine', taskId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/activities/my-task-activities/${taskId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const sortedActivities = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return [...list].sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  }, [data]);

  const addActivity = useMutation({
    mutationFn: async ({ description, file }) => {
      const formData = new FormData();
      
      // Backend'in beklediği field isimleri: Description, ImageFile
      formData.append('Description', description);
      
      // Eğer dosya varsa ekle
      if (file) {
        formData.append('ImageFile', file);
      }
      
      // FormData için Content-Type header'ını manuel olarak kaldır
      const res = await apiClient.post(`/api/tasks/${taskId}/activities`, formData, {
        headers: {
          'Content-Type': undefined, // Axios'un otomatik multipart/form-data ayarlamasına izin ver
        },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Aktivite eklendi');
      queryClient.invalidateQueries({ queryKey: ['taskActivities', 'mine', taskId] });
    },
    onError: () => toast.error('Aktivite eklenemedi'),
  });

  const replyToComment = useMutation({
    mutationFn: async ({ commentId, content }) => {
      const res = await apiClient.post(`/api/comments/${commentId}/reply`, { content });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taskActivities', 'mine', taskId] });
    },
    onError: () => toast.error('Cevap gönderilemedi'),
  });

  const canReply = (comment, currentUserId) => comment.authorId !== currentUserId;

  return (
    <Container maxWidth="md">
      <Typography variant="h6" sx={{ mb: 2 }}>Aktivitelerim</Typography>
      <ActivityForm onSubmit={(data) => addActivity.mutateAsync(data)} disabled={addActivity.isPending} />

      <Stack spacing={2} sx={{ mt: 2 }}>
        {isLoading && <Typography>Yükleniyor...</Typography>}
        {!isLoading && sortedActivities.length === 0 && (
          <Typography variant="body2" color="text.secondary">Henüz aktivite yok</Typography>
        )}
        {sortedActivities.map((a) => (
          <ActivityCard
            key={a.id}
            activity={a}
            currentUserId={user?.id}
            enableCommentButton={false}
            onReplySubmit={(commentId, content) => replyToComment.mutateAsync({ commentId, content })}
            canReply={canReply}
          />
        ))}
      </Stack>
    </Container>
  );
}


