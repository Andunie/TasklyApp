import React, { useState } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  Fab,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import KanbanBoard from '../components/KanbanBoard';
import TaskDetailModal from '../components/TaskDetailModal';
import CreateTaskModal from '../components/CreateTaskModal';
import { useMyTasks } from '../hooks/useTasks';

export default function MyTasks() {
  const [selectedTask, setSelectedTask] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { data: tasks = [], isLoading, error } = useMyTasks();

  const handleTaskClick = (task) => {
    setSelectedTask(task);
  };

  const handleCloseTaskModal = () => {
    setSelectedTask(null);
  };

  const handleOpenCreateModal = () => {
    setIsCreateModalOpen(true);
  };

  const handleCloseCreateModal = () => {
    setIsCreateModalOpen(false);
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
          Görevler yüklenirken bir hata oluştu: {error.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
          Görevlerim
        </Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleOpenCreateModal}
          size="large"
        >
          Yeni Görev
        </Button>
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
            Henüz hiç göreviniz yok
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            İlk görevinizi oluşturmak için "Yeni Görev" butonuna tıklayın
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenCreateModal}
          >
            İlk Görevinizi Oluşturun
          </Button>
        </Box>
      ) : (
        <KanbanBoard
          tasks={tasks}
          onTaskClick={handleTaskClick}
          isTeamLeaderView={false}
        />
      )}

      {/* Floating Action Button for mobile */}
      <Fab
        color="primary"
        aria-label="add task"
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          display: { xs: 'flex', md: 'none' }, // Only show on mobile
        }}
        onClick={handleOpenCreateModal}
      >
        <Add />
      </Fab>

      {/* Task Detail Modal */}
      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          open={Boolean(selectedTask)}
          onClose={handleCloseTaskModal}
        />
      )}

      {/* Create Task Modal */}
      <CreateTaskModal
        open={isCreateModalOpen}
        onClose={handleCloseCreateModal}
      />
    </Container>
  );
}
