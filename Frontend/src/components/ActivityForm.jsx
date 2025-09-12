import React, { useState } from 'react';
import { Stack, TextField, Button, Typography, Box } from '@mui/material';

export default function ActivityForm({ onSubmit, disabled, includeImageFields = true }) {
  const [description, setDescription] = useState('');
  const [file, setFile] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const desc = description.trim();
    
    // Backend validation: minimum 10 karakter gerekli
    if (!desc) {
      alert('Aktivite açıklaması zorunludur.');
      return;
    }
    if (desc.length < 10) {
      alert('Aktivite açıklaması en az 10 karakter olmalıdır.');
      return;
    }
    if (desc.length > 500) {
      alert('Aktivite açıklaması en fazla 500 karakter olabilir.');
      return;
    }
    
    await onSubmit?.({ description: desc, file });
    setDescription('');
    setFile(null);
  };

  return (
    <Stack component="form" onSubmit={handleSubmit} spacing={1}>
      <TextField
        label="Aktivite açıklaması"
        multiline
        minRows={3}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        fullWidth
        helperText={`${description.length}/500 karakter (minimum 10)`}
        error={description.length > 0 && description.length < 10}
      />
      {includeImageFields && (
        <Box>
          <Button
            component="label"
            variant="outlined"
            fullWidth
            sx={{ mb: 1, textTransform: 'none' }}
          >
            {file ? `Seçilen dosya: ${file.name}` : 'Resim Seç (Opsiyonel)'}
            <input
              type="file"
              accept="image/*"
              name="imageFile"
              hidden
              onChange={(e) => setFile(e.target.files?.[0] || null)}
            />
          </Button>
          {file && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Dosya boyutu: {(file.size / 1024 / 1024).toFixed(2)} MB
            </Typography>
          )}
        </Box>
      )}
      <Button type="submit" variant="contained" disabled={disabled}>Aktivite Ekle</Button>
    </Stack>
  );
}


