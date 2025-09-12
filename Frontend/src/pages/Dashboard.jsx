import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Grid, Paper, Typography, CircularProgress, Alert, List, ListItem, ListItemButton, ListItemText, Divider, Avatar, Chip } from '@mui/material';
import { Doughnut, Bar, getElementAtEvent } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { dashboardService } from '../api/services';
import { useTeam } from '../context/TeamContext';

import { ArrowUpward, ArrowDownward, WarningAmber, EmojiEvents } from '@mui/icons-material';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const STATUS_COLOR_MAP = {
  ToDo: '#1976d2', InProgress: '#ff9800', InReview: '#9c27b0',
  Done: '#2e7d32', Cancelled: '#f44336'
};

const StatCard = ({ title, value, subtitle, color, onClick, children }) => (
  <Paper
    onClick={onClick}
    sx={{
      p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%',
      backgroundColor: color, cursor: onClick ? 'pointer' : 'default',
      transition: 'transform 0.2s, box-shadow 0.2s',
      '&:hover': { transform: onClick ? 'scale(1.03)' : 'none', boxShadow: onClick ? 3 : 1, },
    }}
  >
    <Typography variant="subtitle1" color="text.secondary">{title}</Typography>
    <Typography variant="h4" sx={{ my: 1 }}>{value ?? 0}</Typography>
    <Box sx={{ display: 'flex', alignItems: 'center', minHeight: '24px' }}>
      {children || <Typography variant="body2" color="text.secondary">{subtitle}</Typography>}
    </Box>
  </Paper>
);

export default function Dashboard() {
  const navigate = useNavigate();
  const { activeTeamId } = useTeam();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const doughnutChartRef = useRef();
  const completedTasksChartRef = useRef();
  const workloadChartRef = useRef();

  useEffect(() => {
    if (!activeTeamId) {
      setStats(null);
      setError('');
      return;
    }
    setLoading(true);
    setError('');
    dashboardService
      .getTeamStats(activeTeamId)
      .then((data) => setStats(data))
      .catch(() => setError('İstatistikler alınırken bir hata oluştu.'))
      .finally(() => setLoading(false));
  }, [activeTeamId]);
  
  const navigateToTasks = (queryParams) => {
    const searchParams = new URLSearchParams(queryParams).toString();
    navigate(`/app/team-tasks?${searchParams}`);
  };

  const handleChartClick = (ref, labels, queryParam, extraParams = {}) => (event) => {
    const element = getElementAtEvent(ref.current, event);
    if (!element.length) return;
    const { index } = element[0];
    const value = labels[index];
    navigateToTasks({ [queryParam]: value, ...extraParams });
  };
  
  if (!activeTeamId) return <Box sx={{ p: 3 }}><Alert severity="info">İstatistikleri görüntülemek için bir takım seçin.</Alert></Box>;
  if (loading) return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (error) return <Box sx={{ p: 3 }}><Alert severity="error">{error}</Alert></Box>;
  if (!stats) return null;

  const doughnutData = {
    labels: (stats.tasksByStatus ?? []).map((s) => s.label),
    datasets: [{ data: (stats.tasksByStatus ?? []).map((s) => s.value), backgroundColor: (stats.tasksByStatus ?? []).map(s => STATUS_COLOR_MAP[s.label] || '#757575'), }],
  };
  
  const completedTasksBarData = {
    labels: (stats.tasksPerUser ?? []).map((p) => p.label),
    datasets: [{ label: 'Tamamlanan Görevler', data: (stats.tasksPerUser ?? []).map((p) => p.value), backgroundColor: 'rgba(46, 125, 50, 0.7)', }],
  };
  
  const activeWorkloadBarData = {
    labels: (stats.activeTasksPerUser ?? []).map((p) => p.label),
    datasets: [{ label: 'Aktif Görevler', data: (stats.activeTasksPerUser ?? []).map((p) => p.value), backgroundColor: 'rgba(255, 152, 0, 0.7)', }],
  };

  const commonChartOptions = { responsive: true, maintainAspectRatio: false };

  return (
    <Box>
      <Typography variant="h4" gutterBottom>Takım Paneli</Typography>
      
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Takım Hızı" value={stats.tasksCompletedLast7Days} onClick={() => navigateToTasks({ completedLastDays: 7 })}>
            {stats.velocityChangePercentage != null && (
              <Box sx={{ display: 'flex', alignItems: 'center', color: stats.velocityChangePercentage >= 0 ? 'success.main' : 'error.main' }}>
                {stats.velocityChangePercentage >= 0 ? <ArrowUpward fontSize="small" /> : <ArrowDownward fontSize="small" />}
                <Typography variant="body2" sx={{ ml: 0.5 }}> {stats.velocityChangePercentage.toFixed(1)}% (Önceki 7 gün) </Typography>
              </Box>
            )}
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Riskteki Görevler" value={(stats.overdueTasks ?? 0) + (stats.staleTasksCount ?? 0)} color="error.light">
             <Typography variant="body2" color="text.secondary"> {stats.overdueTasks ?? 0} Gecikmiş, {stats.staleTasksCount ?? 0} Sıkışmış </Typography>
          </StatCard>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Devam Eden" value={stats.inProgressTasks} color="warning.light" onClick={() => navigateToTasks({ status: 'InProgress' })} />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Ort. Tamamlama Süresi" value={stats.averageCompletionTimeInHours ? `${stats.averageCompletionTimeInHours.toFixed(1)} sa` : 'N/A'} />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: 400 }}>
            <Doughnut ref={doughnutChartRef} data={doughnutData} options={{ ...commonChartOptions, plugins: { legend: { position: 'bottom' }, title: { display: true, text: 'Görev Durum Dağılımı' } } }} onClick={handleChartClick(doughnutChartRef, doughnutData.labels, 'status')} />
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
           <Paper sx={{ p: 2, height: 400 }}>
             <Bar ref={completedTasksChartRef} data={completedTasksBarData} options={{ ...commonChartOptions, plugins: { legend: { display: false }, title: { display: true, text: 'Kullanıcı Başına Tamamlanan Görevler' } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} onClick={handleChartClick(completedTasksChartRef, completedTasksBarData.labels, 'assignee', { status: 'Done' })} />
           </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
           <Paper sx={{ p: 2, height: 400 }}>
             <Bar ref={workloadChartRef} data={activeWorkloadBarData} options={{ ...commonChartOptions, plugins: { legend: { display: false }, title: { display: true, text: 'Aktif İş Yükü Dağılımı' } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } } } }} onClick={handleChartClick(workloadChartRef, activeWorkloadBarData.labels, 'assignee', { status: 'Active' })} />
           </Paper>
        </Grid>
      </Grid>
      
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}><WarningAmber color="error" sx={{ mr: 1 }} /> En Çok Geciken Görevler</Typography>
                {(stats.topOverdueTasks?.length > 0) ? (
                    <List dense>
                        {stats.topOverdueTasks.map((task, i) => (
                            <ListItemButton key={task.id} onClick={() => navigate(`/app/tasks/${task.id}`)} divider={i < stats.topOverdueTasks.length - 1}>
                                <ListItemText primary={task.title} secondary={`Atanan: ${task.assignedToUserName}`} />
                                <Chip label={`${task.daysOverdue} gün gecikti`} color="error" size="small" />
                            </ListItemButton>
                        ))}
                    </List>
                ) : (<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Gecikmiş görev bulunmamaktadır.</Typography>)}
            </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
            <Paper sx={{ p: 2 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}><EmojiEvents color="warning" sx={{ mr: 1 }} /> Liderlik Tablosu (Tamamlanan)</Typography>
                {(stats.topPerformers?.length > 0) ? (
                    <List dense>
                        {stats.topPerformers.map((user, i) => (
                            <ListItem key={user.userName} divider={i < stats.topPerformers.length - 1}>
                                <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>{i + 1}</Avatar>
                                <ListItemText primary={user.userName} />
                                <Chip label={`${user.completedTasksCount} görev`} color="primary" variant="outlined" size="small" />
                            </ListItem>
                        ))}
                    </List>
                ) : (<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Performans verisi bulunmamaktadır.</Typography>)}
            </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}