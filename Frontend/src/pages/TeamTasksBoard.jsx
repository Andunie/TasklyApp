// TeamTasksBoard.jsx
import React, { useState, useEffect } from 'react';
import {
  Container, Typography, Box, CircularProgress, Alert,
  TextField, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import KanbanBoard from '../components/KanbanBoard';
import TaskDetailModal from '../components/TaskDetailModal';
import { useTeamTasks } from '../hooks/useTasks';
import { useDebounce } from '../hooks/useDebounce';

export default function TeamTasksBoard() {
  const [selectedTask, setSelectedTask] = useState(null);

  // Filtrelerin tamamını tutan ana state
  const [filters, setFilters] = useState({
    searchTerm: '',
    priority: '',
    assigneeId: '',
  });

  // Arama kutusunun anlık değerini tutan ayrı bir state
  const [searchTermInput, setSearchTermInput] = useState('');
  // Anlık değeri 500ms gecikmeyle debounce et
  const debouncedSearchTerm = useDebounce(searchTermInput, 500);

  // Sadece 'debounced' değer değiştiğinde ana 'filters' state'ini güncelle
  useEffect(() => {
    setFilters(prevFilters => ({ ...prevFilters, searchTerm: debouncedSearchTerm }));
  }, [debouncedSearchTerm]);

  // Takım üyeleri için (assigneeId dropdown)
  // Not: Takım üyelerini API'den çekmek gerekebilir. Burada örnek olarak boş bırakıyoruz.
  const teamMembers = [];

  // useTeamTasks hook'u artık filters state'i ile çağrılıyor
  const { data: tasks = [], isLoading, error } = useTeamTasks(filters);

  // Arama kutusunun onChange handler'ı artık anlık state'i günceller
  const handleSearchChange = (event) => {
    setSearchTermInput(event.target.value);
  };

  // Dropdown'lar için handler aynı kalabilir
  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
  };

  if (isLoading) {
    return (
      <Container maxWidth="xl" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ mt: 2 }}>
        <Alert severity="error">
          Takım görevleri yüklenirken bir hata oluştu: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
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
        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel>Atanan Kişi</InputLabel>
          <Select
            name="assigneeId"
            value={filters.assigneeId}
            onChange={handleFilterChange}
            label="Atanan Kişi"
          >
            <MenuItem value="">Tümü</MenuItem>
            {/* Takım üyeleri burada listelenmeli */}
            {teamMembers.map((member) => (
              <MenuItem key={member.id} value={member.id}>{member.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Takım Görevleri
        </Typography>
      </Box>

      {tasks.length === 0 ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            minHeight: '40vh',
            textAlign: 'center',
          }}
        >
          <Typography variant="h6" color="text.secondary" gutterBottom>
            Henüz takımınıza atanmış görev yok
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Takım üyeleriniz görev oluşturduğunda burada görünecektir
          </Typography>
        </Box>
      ) : (
        <KanbanBoard
          tasks={tasks}
          onTaskClick={handleTaskClick}
          isTeamLeaderView={true}
        />
      )}

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={Boolean(selectedTask)}
          onClose={handleCloseTaskModal}
        />
      )}
    </Container>
  );
}