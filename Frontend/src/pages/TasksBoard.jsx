// TasksBoard.jsx
import React, { useEffect, useMemo, useState } from 'react';
import { Grid, Paper, Typography, Stack, Button, Chip, IconButton, Divider, Box, TextField, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import CreateTaskModal from '../components/CreateTaskModal';
import apiClient from '../api/client';
import { toast } from 'react-toastify';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import ReopenDialog from '../components/ReopenDialog';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useMyTasks } from '../hooks/useTasks';

export default function TasksBoard() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [reopenTaskId, setReopenTaskId] = useState(null);
  const queryClient = useQueryClient();

  // Filtre state'i
  const [filters, setFilters] = useState({
    searchTerm: '',
    priority: '',
  });

  // Filtre değişim handler'ı
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({ ...prev, [name]: value }));
  };

  // useMyTasks hook'u ile filtreli veri çek
  const { data: tasks = [], isFetching, refetch } = useMyTasks(filters);

  const tasksByStatus = useMemo(() => {
    // Backend contract: 0=ToDo, 1=InProgress, 2=InReview, 3=Done
    const grouped = { 0: [], 1: [], 2: [], 3: [] };
    for (const t of tasks) {
      const key = typeof t.status === 'number' ? t.status : 0;
      if (grouped[key] != null) grouped[key].push(t);
      else grouped[0].push(t);
    }
    return grouped;
  }, [tasks]);

  const columnOrder = [
    { id: 'todo', title: 'Yapılacak', status: 0 },
    { id: 'inprogress', title: 'Devam Ediyor', status: 1 },
    { id: 'inreview', title: 'İnceleniyor', status: 2 },
    { id: 'done', title: 'Tamamlandı', status: 3 },
  ];

  const updateStatus = useMutation({
    mutationFn: async ({ taskId, status }) => {
      await apiClient.put(`/api/Tasks/${taskId}/status`, { newStatus: status });
    },
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: ['myTasks'] });
      const prev = queryClient.getQueryData(['myTasks']);
      queryClient.setQueryData(['myTasks'], (old = []) => old.map((t) => (t.id === taskId ? { ...t, status } : t)));
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) queryClient.setQueryData(['myTasks'], ctx.prev);
      toast.error('Durum güncellenemedi');
    },
    onSuccess: () => toast.success('Görev durumu güncellendi'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['myTasks'] }),
  });

  const onDragEnd = async (result) => {
    const { destination, source, draggableId } = result;
    if (!destination) return;
    if (destination.droppableId === source.droppableId && destination.index === source.index) return;

    const sourceCol = columnOrder.find((c) => c.id === source.droppableId);
    const destCol = columnOrder.find((c) => c.id === destination.droppableId);
    if (!sourceCol || !destCol) return;

    // Role-based rules for Assignee board:
    // Allowed transitions:
    // - ToDo(0) -> InProgress(1)
    // - InProgress(1) -> ToDo(0) or InReview(2)
    // - InReview(2) -> InProgress(1)
    // Block Done(3) or Cancelled(4) for assignee
    const from = sourceCol.status;
    const to = destCol.status;
    const isAllowed =
      (from === 0 && to === 1) ||
      (from === 1 && (to === 0 || to === 2)) ||
      (from === 2 && to === 1);
    if (!isAllowed) {
      toast.info('Bu durum değişikliği için yetkiniz bulunmuyor.');
      return;
    }

    const taskId = Number(draggableId);
    updateStatus.mutate({ taskId, status: destCol.status });
  };

  const reopenTask = useMutation({
    mutationFn: async ({ taskId, comment }) => {
      await apiClient.put(`/api/Tasks/${taskId}/reopen`, { reopenToStatus: 1, comment });
    },
    onSuccess: () => toast.success('Görev geri açıldı'),
    onError: () => toast.error('Görev geri açılamadı'),
    onSettled: () => queryClient.invalidateQueries({ queryKey: ['myTasks'] }),
  });

  return (
    <div>
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">Görevlerim (Kanban)</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => refetch()} disabled={isFetching} aria-label="refresh">
            <RefreshIcon />
          </IconButton>
          <Button variant="contained" onClick={() => setIsCreateOpen(true)}>Yeni Görev</Button>
        </Stack>
      </Stack>
      {/* Filtreleme arayüzü */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <TextField
          name="searchTerm"
          label="Görevlerde Ara..."
          value={filters.searchTerm}
          onChange={handleFilterChange}
          size="small"
        />
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Öncelik</InputLabel>
          <Select
            name="priority"
            value={filters.priority}
            onChange={handleFilterChange}
            label="Öncelik"
          >
            <MenuItem value="">Tümü</MenuItem>
            <MenuItem value={0}>Düşük</MenuItem>
            <MenuItem value={1}>Orta</MenuItem>
            <MenuItem value={2}>Yüksek</MenuItem>
            <MenuItem value={3}>Acil</MenuItem>
          </Select>
        </FormControl>
      </Box>
      <DragDropContext onDragEnd={onDragEnd}>
        <Grid container spacing={2}>
          {columnOrder.map((col) => (
            <Grid item xs={12} md={3} key={col.id}>
              <Droppable droppableId={col.id}>
                {(provided) => (
                  <div ref={provided.innerRef} {...provided.droppableProps}>
                    <Column title={col.title}>
                      <Stack spacing={1.5}>
                        {(tasksByStatus[col.status] || []).map((task, index) => (
                          <Draggable key={String(task.id)} draggableId={String(task.id)} index={index}>
                            {(dp) => (
                              <div ref={dp.innerRef} {...dp.draggableProps} {...dp.dragHandleProps}>
                                <TaskItem task={task} onOpenReopen={() => setReopenTaskId(task.id)} />
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </Stack>
                    </Column>
                  </div>
                )}
              </Droppable>
            </Grid>
          ))}
        </Grid>
      </DragDropContext>

      <CreateTaskModal
        open={isCreateOpen}
        onClose={() => {
          setIsCreateOpen(false);
          // Oluşturma sonrası listeyi yenile
          queryClient.invalidateQueries({ queryKey: ['myTasks'] });
        }}
      />

      <ReopenDialog
        open={Boolean(reopenTaskId)}
        onClose={() => setReopenTaskId(null)}
        onConfirm={(comment) => {
          const id = reopenTaskId;
          setReopenTaskId(null);
          reopenTask.mutate({ taskId: id, comment });
        }}
      />
    </div>
  );
}

function Column({ title, children }) {
  return (
    <Paper elevation={1} sx={{ p: 2, minHeight: 300 }}>
      <Typography variant="subtitle1" sx={{ mb: 1 }}>{title}</Typography>
      {children}
    </Paper>
  );
}

function TaskItem({ task, onOpenReopen }) {
  const priorityLabel = getPriorityLabel(task.priority);
  const priorityColor = getPriorityColor(task.priority);
  const dueText = task.dueDate ? new Date(task.dueDate).toLocaleString() : '-';

  return (
    <Paper variant="outlined" sx={{ p: 1.5 }}>
      <Stack spacing={0.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="subtitle2">{task.title}</Typography>
          <Chip size="small" label={priorityLabel} color={priorityColor} />
        </Stack>
        {task.description && (
          <Typography variant="body2" color="text.secondary" sx={{ wordBreak: 'break-word' }}>
            {task.description}
          </Typography>
        )}
        <Divider sx={{ my: 0.5 }} />
        <Stack direction="row" spacing={1} flexWrap="wrap">
          <Chip size="small" variant="outlined" label={`Takım: ${task.teamName || task.teamId}`} />
          <Chip size="small" variant="outlined" label={`Bitiş: ${dueText}`} />
        </Stack>
        {/* Görevlerim sayfasında lider aksiyonları gösterilmez */}
      </Stack>
    </Paper>
  );
}

function getPriorityLabel(priority) {
  switch (Number(priority)) {
    case 0: return 'Düşük';
    case 1: return 'Orta';
    case 2: return 'Yüksek';
    case 3: return 'Acil';
    default: return 'Bilinmiyor';
  }
}

function getPriorityColor(priority) {
  switch (Number(priority)) {
    case 0: return 'default';
    case 1: return 'info';
    case 2: return 'warning';
    case 3: return 'error';
    default: return 'default';
  }
}