import React, { useMemo, useState } from 'react';
import { 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions, 
  Button, 
  Stack, 
  TextField, 
  Typography, 
  Box, 
  Chip, 
  Divider,
  Paper,
  Avatar
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '../api/client';
import { toast } from 'react-toastify';
import ActivityCard from './ActivityCard';
import { useAuth } from '../context/AuthContext';
import { TaskPriority } from '../api/services';

export default function TaskDetailModal({ task, open, onClose }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);
  
  const taskId = task?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['myTaskActivities', taskId],
    queryFn: async () => {
      const res = await apiClient.get(`/api/activities/my-task-activities/${taskId}`);
      return Array.isArray(res.data) ? res.data : [];
    },
    enabled: open && !!taskId,
  });

  const sortedActivities = useMemo(() => {
    const list = Array.isArray(data) ? data : [];
    return [...list].sort((a, b) => new Date(b.activityDate) - new Date(a.activityDate));
  }, [data]);

  const addActivity = useMutation({
    mutationFn: async () => {
      const form = new FormData();
      form.append('Description', description.trim());
      if (file) form.append('ImageFile', file);
      await apiClient.post(`/api/tasks/${taskId}/activities`, form);
    },
    onSuccess: () => {
      toast.success('Aktivite eklendi');
      setDescription('');
      setFile(null);
      queryClient.invalidateQueries({ queryKey: ['myTaskActivities', taskId] });
      queryClient.invalidateQueries({ queryKey: ['teamActivityFeed'] });
    },
    onError: () => toast.error('Aktivite eklenemedi'),
  });

  const replyToComment = useMutation({
    mutationFn: async ({ commentId, content }) => {
      await apiClient.post(`/api/comments/${commentId}/reply`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTaskActivities', taskId] });
    },
    onError: () => toast.error('Cevap gönderilemedi'),
  });

  const canReply = (comment, currentUserId) => comment.authorId !== currentUserId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!description.trim()) {
      toast.info('Açıklama zorunludur');
      return;
    }
    await addActivity.mutateAsync();
  };

  const handleClose = () => {
    if (addActivity.isPending) return;
    onClose?.();
  };

  const priorityColors = {
    [TaskPriority.Low]: '#4caf50',
    [TaskPriority.Medium]: '#ff9800',
    [TaskPriority.High]: '#f44336',
    [TaskPriority.Critical]: '#d32f2f',
  };

  const priorityLabels = {
    [TaskPriority.Low]: 'Düşük',
    [TaskPriority.Medium]: 'Orta',
    [TaskPriority.High]: 'Yüksek',
    [TaskPriority.Critical]: 'Kritik',
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!task) return null;

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
      <DialogTitle>{task.title}</DialogTitle>
      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {/* Task Information */}
          <Paper sx={{ p: 2 }} variant="outlined">
            <Typography variant="h6" gutterBottom>Görev Bilgileri</Typography>
            <Stack spacing={2}>
              <Typography variant="body1">{task.description || 'Açıklama bulunmuyor'}</Typography>
              
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                <Chip
                  label={priorityLabels[task.priority]}
                  sx={{
                    backgroundColor: priorityColors[task.priority],
                    color: 'white',
                    fontWeight: 'bold',
                  }}
                />
                {task.dueDate && (
                  <Chip 
                    label={`Bitiş: ${formatDate(task.dueDate)}`} 
                    variant="outlined"
                    color={new Date(task.dueDate) < new Date() ? 'error' : 'default'}
                  />
                )}
              </Box>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">Atanan:</Typography>
                <Avatar 
                  src={task.assignedUserAvatarUrl} 
                  sx={{ width: 24, height: 24 }}
                >
                  {task.assignedUserName?.charAt(0) || '?'}
                </Avatar>
                <Typography variant="body2">{task.assignedToUserName || 'Atanmamış'}</Typography>
              </Box>

              <Box>
                <Typography variant="body2" color="text.secondary">
                  Takım: {task.teamName || 'Takım Yok'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Oluşturulma: {task.createdAt ? formatDate(task.createdAt) : 'Bilinmiyor'}
                </Typography>
              </Box>
            </Stack>
          </Paper>

          <Divider />
          <Typography variant="subtitle2">Yeni Aktivite</Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} component="form" onSubmit={handleSubmit} alignItems={{ sm: 'center' }}>
            <TextField
              label="Açıklama"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={2}
            />
            <Button
              component="label"
              variant="outlined"
              size="small"
              sx={{ whiteSpace: 'nowrap' }}
            >
              {file ? file.name : 'Resim Seç'}
              <input
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </Button>
            <Button 
              type="submit" 
              variant="contained" 
              disabled={addActivity.isPending}
              sx={{ whiteSpace: 'nowrap' }}
            >
              {addActivity.isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </Stack>

          <Typography variant="subtitle2">Aktiviteler</Typography>
          {isLoading && <Typography>Yükleniyor...</Typography>}
          {!isLoading && sortedActivities.length === 0 && (
            <Typography variant="body2" color="text.secondary">Henüz aktivite yok</Typography>
          )}
          <Stack spacing={2}>
            {sortedActivities.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                currentUserId={user?.id}
                enableCommentButton={a.userId !== user?.id}
                onCommentSubmit={async (activityId, content) => {
                  try {
                    await apiClient.post(`/api/comments/activity/${activityId}`, { content });
                    queryClient.invalidateQueries({ queryKey: ['myTaskActivities', taskId] });
                    toast.success('Yorum eklendi');
                  } catch (error) {
                    toast.error('Yorum eklenemedi');
                  }
                }}
                onReplySubmit={(commentId, content) => replyToComment.mutateAsync({ commentId, content })}
                canReply={canReply}
              />
            ))}
          </Stack>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose}>Kapat</Button>
      </DialogActions>
    </Dialog>
  );
}


