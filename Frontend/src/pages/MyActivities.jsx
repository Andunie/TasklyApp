import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Container, Stack, Typography, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { toast } from 'react-toastify';
import apiClient from '../api/client';
import ActivityForm from '../components/ActivityForm';
import ActivityCard from '../components/ActivityCard';
import { useAuth } from '../context/AuthContext';

export default function MyActivities() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTaskId, setSelectedTaskId] = useState('');

  const { data: activities, isLoading } = useQuery({
    queryKey: ['myActivities'],
    queryFn: async () => {
      const res = await apiClient.get('/api/activities/my-activities');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const { data: myTasks } = useQuery({
    queryKey: ['myTasks'],
    queryFn: async () => {
      const res = await apiClient.get('/api/Tasks/mytasks');
      return Array.isArray(res.data) ? res.data : [];
    },
  });

  const sortedActivities = useMemo(() => {
    const list = Array.isArray(activities) ? activities : [];
    return [...list].sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  }, [activities]);

  const addActivity = useMutation({
    mutationFn: async ({ taskId, description, file }) => {
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
      queryClient.invalidateQueries({ queryKey: ['myActivities'] });
    },
    onError: () => toast.error('Aktivite eklenemedi'),
  });

  const replyToComment = useMutation({
    mutationFn: async ({ commentId, content }) => {
      const res = await apiClient.post(`/api/comments/${commentId}/reply`, { content });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myActivities'] });
    },
    onError: () => toast.error('Cevap gönderilemedi'),
  });

  const canReply = (comment, currentUserId) => comment.authorId !== currentUserId;

  const handleAddActivity = async ({ description, file }) => {
    if (!selectedTaskId) {
      toast.info('Lütfen bir görev seçin');
      return;
    }
    await addActivity.mutateAsync({ taskId: selectedTaskId, description, file });
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h6" sx={{ mb: 2 }}>Aktivitelerim</Typography>

      <Stack spacing={1.5} sx={{ mb: 2 }}>
        <FormControl fullWidth>
          <InputLabel id="task-select-label">Görev</InputLabel>
          <Select
            labelId="task-select-label"
            label="Görev"
            value={selectedTaskId}
            onChange={(e) => setSelectedTaskId(e.target.value)}
          >
            {(myTasks || []).map((t) => (
              <MenuItem key={t.id} value={t.id}>{t.title}</MenuItem>
            ))}
          </Select>
        </FormControl>
        <ActivityForm onSubmit={handleAddActivity} disabled={addActivity.isPending} />
      </Stack>

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
            enableCommentButton={false}
            onReplySubmit={(commentId, content) => replyToComment.mutateAsync({ commentId, content })}
            canReply={canReply}
          />
        ))}
      </Stack>
    </Container>
  );
}


