import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Stack } from '@mui/material';

export default function ReopenDialog({ open, onClose, onConfirm, pending = false }) {
  const [reason, setReason] = useState('');

  const handleConfirm = () => {
    const value = reason.trim();
    if (!value) return;
    onConfirm?.(value);
    setReason('');
  };

  const handleClose = () => {
    if (pending) return;
    setReason('');
    onClose?.();
  };

  return (
    <Dialog open={open} onClose={handleClose} fullWidth maxWidth="xs">
      <DialogTitle>Geri Aç</DialogTitle>
      <DialogContent>
        <Stack spacing={1} sx={{ mt: 1 }}>
          <TextField
            label="Sebep"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={pending}>İptal</Button>
        <Button onClick={handleConfirm} disabled={pending} variant="contained">Gönder</Button>
      </DialogActions>
    </Dialog>
  );
}



