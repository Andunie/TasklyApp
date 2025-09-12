import React from 'react';
import { Typography, Button, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';

export default function AdminTasksTable() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Tüm Görevler</Typography>
        <Button variant="contained">Yeni Görev Oluştur</Button>
      </div>
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Başlık</TableCell>
              <TableCell>Atanan</TableCell>
              <TableCell>Bitiş Tarihi</TableCell>
              <TableCell>Öncelik</TableCell>
              <TableCell>Durum</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            <TableRow>
              <TableCell>Örnek Görev</TableCell>
              <TableCell>İlhan</TableCell>
              <TableCell>2025-08-09</TableCell>
              <TableCell>Yüksek</TableCell>
              <TableCell>Yapılacak</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
    </div>
  );
}


