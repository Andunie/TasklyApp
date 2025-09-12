import React, { useEffect, useMemo, useState } from 'react';
import { Container, Paper, Typography, TextField, Button, Stack, Grid, Chip, Divider, IconButton } from '@mui/material';
import PersonAddAlt1Icon from '@mui/icons-material/PersonAddAlt1';
import RefreshIcon from '@mui/icons-material/Refresh';
import { toast } from 'react-toastify';
import apiClient from '../api/client';
import { useTeam } from '../context/TeamContext';

export default function Teams() {
  const [teams, setTeams] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [createName, setCreateName] = useState('');
  const [inviteEmailByTeamId, setInviteEmailByTeamId] = useState({});
  const { activeTeamId, setActiveTeamId } = useTeam();

  const sortedTeams = useMemo(() => {
    return [...teams].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }, [teams]);

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.get('/api/Teams');
      setTeams(res.data || []);
    } catch (err) {
      toast.error('Takımlar yüklenemedi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeams();
  }, []);

  const handleCreateTeam = async () => {
    if (!createName.trim()) {
      toast.info('Lütfen takım adı girin');
      return;
    }
    try {
      await apiClient.post('/api/Teams', { name: createName.trim() });
      toast.success('Takım oluşturuldu');
      setCreateName('');
      await loadTeams();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Takım oluşturulamadı';
      toast.error(msg);
    }
  };

  const handleInvite = async (teamId) => {
    const email = (inviteEmailByTeamId[teamId] || '').trim();
    if (!email) {
      toast.info('Lütfen e-posta girin');
      return;
    }
    try {
      await apiClient.post(`/api/Teams/${teamId}/invite`, { email });
      toast.success('Davet gönderildi');
      setInviteEmailByTeamId((prev) => ({ ...prev, [teamId]: '' }));
      await loadTeams();
    } catch (err) {
      const msg = err?.response?.data?.message || 'Davet gönderilemedi';
      toast.error(msg);
    }
  };

  return (
    <Container maxWidth="lg">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h5">Takımlarım</Typography>
        <IconButton onClick={loadTeams} disabled={isLoading} aria-label="refresh">
          <RefreshIcon />
        </IconButton>
      </Stack>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>Yeni Takım Oluştur</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
          <TextField
            label="Takım Adı"
            value={createName}
            onChange={(e) => setCreateName(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleCreateTeam} disabled={isLoading}>Oluştur</Button>
        </Stack>
      </Paper>

      <Grid container spacing={2}>
        {sortedTeams.map((team) => (
          <Grid item xs={12} md={6} key={team.id}>
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack>
                  <Typography variant="h6">{team.name}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    Oluşturulma: {new Date(team.createdAt).toLocaleString()}
                  </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant={activeTeamId === team.id ? 'contained' : 'outlined'}
                    onClick={() => {
                      setActiveTeamId(team.id);
                      toast.success('Aktif takım güncellendi');
                      window.location.reload(); // Sayfayı yenile
                    }}
                  >
                    {activeTeamId === team.id ? 'Aktif' : 'Aktif Yap'}
                  </Button>
                </Stack>
              </Stack>

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ mb: 1 }}>Üyeler</Typography>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                {(team.memberEmails || []).length === 0 && (
                  <Typography variant="body2" color="text.secondary">Henüz üye yok</Typography>
                )}
                {(team.memberEmails || []).map((email) => (
                  <Chip key={email} size="small" label={email} />
                ))}
              </Stack>

              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" gutterBottom>Üye Davet Et</Typography>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
                <TextField
                  placeholder="user@example.com"
                  type="email"
                  value={inviteEmailByTeamId[team.id] || ''}
                  onChange={(e) => setInviteEmailByTeamId((prev) => ({ ...prev, [team.id]: e.target.value }))}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  startIcon={<PersonAddAlt1Icon />}
                  onClick={() => handleInvite(team.id)}
                  disabled={isLoading}
                >
                  Davet Gönder
                </Button>
              </Stack>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
}




