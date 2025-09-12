import React, { useState } from 'react';
import { Stack, TextField, Button } from '@mui/material';

export default function CommentForm({ onSubmit, disabled, placeholder = 'Yorum yazın...' }) {
  const [value, setValue] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const content = value.trim();
    if (!content) return;
    await onSubmit?.(content);
    setValue('');
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={1}>
      <TextField
        placeholder={placeholder}
        multiline
        minRows={2}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        fullWidth
      />
      <Button type="submit" variant="contained" disabled={disabled}>Gönder</Button>
    </Stack>
  );
}


