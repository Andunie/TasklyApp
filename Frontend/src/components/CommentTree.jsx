import React, { useState } from 'react';
import { Stack, Paper, Typography, Button } from '@mui/material';
import CommentForm from './CommentForm';

export default function CommentTree({ comment, currentUserId, onReplySubmit, canReply }) {
  const [isReplyOpen, setIsReplyOpen] = useState(false);
  const allowReply = canReply?.(comment, currentUserId);

  const handleReply = async (content) => {
    await onReplySubmit?.(comment.id, content);
    setIsReplyOpen(false);
  };

  return (
    <Stack spacing={1} sx={{ pl: 1.5, borderLeft: '2px solid', borderColor: 'divider' }}>
      <Paper variant="outlined" sx={{ p: 1.5 }}>
        <Typography variant="subtitle2">{comment.authorName}</Typography>
        <Typography variant="body2" color="text.secondary">
          {new Date(comment.createdAt).toLocaleString()}
        </Typography>
        <Typography variant="body1" sx={{ mt: 0.5 }}>{comment.content}</Typography>
        {allowReply && (
          <Button size="small" onClick={() => setIsReplyOpen((v) => !v)} sx={{ mt: 0.5 }}>
            Cevapla
          </Button>
        )}
        {isReplyOpen && (
          <CommentForm onSubmit={handleReply} placeholder="Cevabınızı yazın..." />
        )}
      </Paper>

      {(comment.replies || []).map((child) => (
        <CommentTree
          key={child.id}
          comment={child}
          currentUserId={currentUserId}
          onReplySubmit={onReplySubmit}
          canReply={canReply}
        />
      ))}
    </Stack>
  );
}


