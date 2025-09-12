import React from 'react';
import { Typography, Button, Stack } from '@mui/material';

export default function AdminReports() {
  return (
    <div>
      <Typography variant="h6" gutterBottom>Raporlar</Typography>
      <Stack direction="row" spacing={1}>
        <Button variant="outlined">Haftalık Performans Raporu</Button>
        <Button variant="outlined">Aylık Görev Durum Raporu</Button>
      </Stack>
      <Button sx={{ mt: 2 }} variant="contained">Seçili Raporu İndir (.xlsx / .pdf)</Button>
    </div>
  );
}


