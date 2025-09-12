import React, { useState } from 'react';
import { Paper, Stack, Typography, Avatar, Button, Divider, Chip, Box } from '@mui/material';
import CommentTree from './CommentTree';
import CommentForm from './CommentForm';

export default function ActivityCard({
  activity,
  currentUserId,
  enableCommentButton = false,
  onCommentSubmit,
  onReplySubmit,
  canReply,
}) {
  const [isCommentOpen, setIsCommentOpen] = useState(false);

  const handleComment = async (content) => {
    await onCommentSubmit?.(activity.id, content);
    setIsCommentOpen(false);
  };

  const normalizedImageUrls = (() => {
    const urls = [];
    const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7008';
    
    // Helper function to create full URL
    const createFullUrl = (url) => {
      if (!url) return null;
      // If already a full URL, return as is
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
      }
      // If relative path, prepend base URL
      return `${API_BASE_URL}${url.startsWith('/') ? url : '/' + url}`;
    };
    
    // Common shapes from backend
    if (typeof activity.imageUrl === 'string' && activity.imageUrl) {
      const fullUrl = createFullUrl(activity.imageUrl);
      if (fullUrl) urls.push(fullUrl);
    }
    if (typeof activity.imageURL === 'string' && activity.imageURL) {
      const fullUrl = createFullUrl(activity.imageURL);
      if (fullUrl) urls.push(fullUrl);
    }
    if (typeof activity.image === 'string' && activity.image) {
      const fullUrl = createFullUrl(activity.image);
      if (fullUrl) urls.push(fullUrl);
    }
    if (typeof activity.attachmentUrl === 'string' && activity.attachmentUrl) {
      const fullUrl = createFullUrl(activity.attachmentUrl);
      if (fullUrl) urls.push(fullUrl);
    }
    if (Array.isArray(activity.imageUrls)) {
      activity.imageUrls.filter(Boolean).forEach(url => {
        const fullUrl = createFullUrl(url);
        if (fullUrl) urls.push(fullUrl);
      });
    }
    if (Array.isArray(activity.attachments)) {
      for (const a of activity.attachments) {
        if (typeof a === 'string') {
          const fullUrl = createFullUrl(a);
          if (fullUrl) urls.push(fullUrl);
        } else if (a?.url) {
          const fullUrl = createFullUrl(a.url);
          if (fullUrl) urls.push(fullUrl);
        }
      }
    }
    // Deduplicate while preserving order
    return Array.from(new Set(urls));
  })();

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" spacing={1.5}>
        <Avatar src={activity.userAvatarUrl || undefined} alt={activity.userName} />
        <Stack spacing={0.5} sx={{ flex: 1 }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">{activity.userName}</Typography>
            <Typography variant="body2" color="text.secondary">
              {new Date(activity.activityDate).toLocaleString()}
            </Typography>
          </Stack>
          <Typography variant="body1">{activity.description}</Typography>
          {normalizedImageUrls.length > 0 && (
            <Stack direction="column" spacing={1} sx={{ mt: 1 }}>
              {normalizedImageUrls.map((src) => (
                <Box key={src} component="img" src={src} alt="activity" sx={{ width: '100%', maxHeight: 420, objectFit: 'contain', borderRadius: 1, border: 1, borderColor: 'divider' }} />
              ))}
            </Stack>
          )}
          {(activity.taskTitle || activity.taskId) && (
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
              <Chip size="small" label={`Görev: ${activity.taskTitle || activity.taskId}`} />
            </Stack>
          )}
        </Stack>
      </Stack>

      <Divider sx={{ my: 1.5 }} />

      <Stack spacing={1.5}>
        {(activity.comments || []).map((c) => (
          <CommentTree
            key={c.id}
            comment={c}
            currentUserId={currentUserId}
            onReplySubmit={onReplySubmit}
            canReply={canReply}
          />
        ))}
      </Stack>

      {enableCommentButton && (
        <>
          <Button
            size="small"
            sx={{ mt: 1.5 }}
            onClick={() => setIsCommentOpen((v) => !v)}
          >
            Yorum Yap
          </Button>
          {isCommentOpen && (
            <CommentForm onSubmit={handleComment} placeholder="Yorumunuzu yazın..." />
          )}
        </>
      )}
    </Paper>
  );
}


