import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  Avatar,
  Stack,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  DragDropContext,
  Droppable,
  Draggable,
} from '@hello-pangea/dnd';
import {
  MoreVert,
  Schedule,
  Person,
  Flag,
  CheckCircle,
  Undo,
} from '@mui/icons-material';
import { TaskStatus, TaskPriority } from '../api/services';
import { useAuth } from '../context/AuthContext';
import { useUpdateTaskStatus, useApproveTask, useReopenTask } from '../hooks/useTasks';
import ReopenDialog from './ReopenDialog';

const statusColumns = [
  { id: TaskStatus.ToDo, title: 'Yapılacak', color: '#1976d2' },
  { id: TaskStatus.InProgress, title: 'Devam Ediyor', color: '#ed6c02' },
  { id: TaskStatus.InReview, title: 'İnceleniyor', color: '#9c27b0' },
  { id: TaskStatus.Done, title: 'Tamamlandı', color: '#2e7d32' },
  { id: TaskStatus.Cancelled, title: 'İptal', color: '#757575' },
];

const priorityColors = {
  [TaskPriority.Low]: '#4caf50',
  [TaskPriority.Medium]: '#ff9800',
  [TaskPriority.High]: '#f44336',
  [TaskPriority.Critical]: '#d32f2f',
};

const priorityLabels = {
  [TaskPriority.Low]: 'Düşük',
  [TaskPriority.Medium]: 'Orta',
  [TaskPriority.High]: 'Yüksek',
  [TaskPriority.Critical]: 'Acil',
};

export default function KanbanBoard({ tasks, onTaskClick, isTeamLeaderView = false }) {
  const { user, isTeamLeader } = useAuth();
  const [anchorEl, setAnchorEl] = useState({});
  
  const updateTaskStatus = useUpdateTaskStatus();
  const approveTask = useApproveTask();
  const reopenTask = useReopenTask();

  const handleMenuOpen = (taskId, event) => {
    setAnchorEl(prev => ({ ...prev, [taskId]: event.currentTarget }));
  };

  const handleMenuClose = (taskId) => {
    setAnchorEl(prev => ({ ...prev, [taskId]: null }));
  };

  const groupTasksByStatus = () => {
    const grouped = {
      [TaskStatus.ToDo]: [],
      [TaskStatus.InProgress]: [],
      [TaskStatus.InReview]: [],
      [TaskStatus.Done]: [],
      [TaskStatus.Cancelled]: [],
    };

    tasks.forEach(task => {
      if (grouped[task.status] !== undefined) {
        grouped[task.status].push(task);
      }
    });

    return grouped;
  };

  const handleDragEnd = (result) => {
    const { destination, source, draggableId } = result;

    if (!destination) return;
    if (destination.droppableId === source.droppableId) return;

    const taskId = parseInt(draggableId);
    const newStatus = parseInt(destination.droppableId);

    // Check permissions
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Role-based authorization
    if (!isTeamLeaderView && task.assignedUserId !== user?.id) {
      return; // Normal user can only move their own tasks
    }

    // Role-based column restrictions for normal users
    if (!isTeamLeaderView) {
      const currentStatus = task.status;
      const isValidMove = checkValidStatusTransition(currentStatus, newStatus);
      if (!isValidMove) {
        return; // Block invalid moves for normal users
      }
    }

    updateTaskStatus.mutate({ taskId, data: { newStatus } });
  };

  // Check if status transition is valid for normal users
  const checkValidStatusTransition = (currentStatus, newStatus) => {
    const validTransitions = {
      [TaskStatus.ToDo]: [TaskStatus.InProgress],
      [TaskStatus.InProgress]: [TaskStatus.ToDo, TaskStatus.InReview],
      [TaskStatus.InReview]: [TaskStatus.InProgress],
      // Done and Cancelled are not allowed destinations for normal users
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  };

  // Check if a column should be disabled for dropping (for normal users)
  const isDropDisabled = (columnId) => {
    if (isTeamLeaderView) {
      return false; // Team leaders can drop to any column
    }
    
    // Normal users cannot drop to Done or Cancelled columns
    return columnId === TaskStatus.Done || columnId === TaskStatus.Cancelled;
  };

  const handleApprove = (taskId) => {
    approveTask.mutate(taskId);
    handleMenuClose(taskId);
  };

  const [reopenTaskId, setReopenTaskId] = useState(null);

  const handleReopen = (taskId) => {
    setReopenTaskId(taskId);
    handleMenuClose(taskId);
  };

  const handleReopenConfirm = (comment) => {
    if (reopenTaskId && comment && comment.trim()) {
      reopenTask.mutate({ 
        taskId: reopenTaskId, 
        data: { 
          comment: comment.trim(),
          reopenToStatus: TaskStatus.InProgress 
        }
      });
    }
    setReopenTaskId(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  };

  const isTaskOverdue = (dueDate) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
  };

  const groupedTasks = groupTasksByStatus();

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, overflowX: 'auto', p: 2 }}>
        {statusColumns.map(column => (
          <Paper
            key={column.id}
            sx={{
              minWidth: 400,
              maxWidth: 400,
              borderTop: `4px solid ${column.color}`,
            }}
          >
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" sx={{ color: column.color, fontWeight: 'bold' }}>
                {column.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {groupedTasks[column.id].length} görev
              </Typography>
            </Box>

            <Droppable 
              droppableId={column.id.toString()}
              isDropDisabled={isDropDisabled(column.id)}
            >
              {(provided, snapshot) => (
                <Box
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  sx={{
                    minHeight: 300, // Minimum height for the column of the Kanban board
                    p: 1,
                    backgroundColor: snapshot.isDraggingOver 
                      ? (isDropDisabled(column.id) ? 'error.light' : 'action.hover') 
                      : 'transparent',
                    opacity: isDropDisabled(column.id) ? 0.6 : 1,
                  }}
                >
                  {groupedTasks[column.id].map((task, index) => (
                    <Draggable
                      key={task.id}
                      draggableId={task.id.toString()}
                      index={index}
                      isDragDisabled={!isTeamLeaderView && task.assignedUserId !== user?.id}
                    >
                      {(provided, snapshot) => (
                        <Card
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          sx={{
                            mb: 1,
                            cursor: 'pointer',
                            transform: snapshot.isDragging ? 'rotate(5deg)' : 'none',
                            boxShadow: snapshot.isDragging ? 4 : 1,
                          }}
                          onClick={() => onTaskClick(task)}
                        >
                          <CardContent sx={{ pb: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', flex: 1 }}>
                                {task.title}
                              </Typography>
                              <IconButton
                                size="small"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMenuOpen(task.id, e);
                                }}
                              >
                                <MoreVert fontSize="small" />
                              </IconButton>
                            </Box>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                              {task.description && task.description.length > 100 
                                ? `${task.description.substring(0, 100)}...` 
                                : task.description || 'Açıklama yok'
                              }
                            </Typography>

                            <Stack direction="row" spacing={1} sx={{ mb: 1 }}>
                              <Chip
                                size="small"
                                label={priorityLabels[task.priority]}
                                sx={{
                                  backgroundColor: priorityColors[task.priority],
                                  color: 'white',
                                  fontWeight: 'bold',
                                }}
                              />
                              {task.dueDate && (
                                <Chip
                                  size="small"
                                  icon={<Schedule fontSize="small" />}
                                  label={formatDate(task.dueDate)}
                                  color={isTaskOverdue(task.dueDate) ? 'error' : 'default'}
                                  variant={isTaskOverdue(task.dueDate) ? 'filled' : 'outlined'}
                                />
                              )}
                            </Stack>

                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Person fontSize="small" color="action" />
                                <Avatar
                                  src={task.assignedUserAvatarUrl}
                                  sx={{ width: 24, height: 24 }}
                                >
                                  {task.assignedUserName?.charAt(0) || '?'}
                                </Avatar>
                                <Typography variant="caption">
                                  {task.assignedToUserName || 'Atanmamış'}
                                </Typography> 
                              </Box>
                              <Typography variant="caption" color="text.secondary">
                                {task.teamName || 'Takım Yok'}
                              </Typography>
                            </Box>
                          </CardContent>

                          {/* Team Leader Actions for InReview tasks */}
                          {isTeamLeaderView && task.status === TaskStatus.InReview && (
                            <CardActions sx={{ pt: 0, px: 2, pb: 2 }}>
                              <Button
                                size="small"
                                startIcon={<CheckCircle />}
                                color="success"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleApprove(task.id);
                                }}
                              >
                                Onayla
                              </Button>
                              <Button
                                size="small"
                                startIcon={<Undo />}
                                color="warning"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleReopen(task.id);
                                }}
                              >
                                Geri Aç
                              </Button>
                            </CardActions>
                          )}

                          {/* Task Menu */}
                          <Menu
                            anchorEl={anchorEl[task.id]}
                            open={Boolean(anchorEl[task.id])}
                            onClose={() => handleMenuClose(task.id)}
                          >
                            <MenuItem onClick={() => {
                              onTaskClick(task);
                              handleMenuClose(task.id);
                            }}>
                              Detayları Görüntüle
                            </MenuItem>
                            {isTeamLeaderView && task.status === TaskStatus.InReview && (
                              <MenuItem onClick={() => handleApprove(task.id)}>
                                Onayla
                              </MenuItem>
                            )}
                            {isTeamLeaderView && task.status === TaskStatus.InReview && (
                              <MenuItem onClick={() => handleReopen(task.id)}>
                                Geri Aç
                              </MenuItem>
                            )}
                          </Menu>
                        </Card>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </Box>
              )}
            </Droppable>
          </Paper>
        ))}
      </Box>

      {/* Reopen Task Dialog */}
      <ReopenDialog
        open={Boolean(reopenTaskId)}
        onClose={() => setReopenTaskId(null)}
        onConfirm={handleReopenConfirm}
      />
    </DragDropContext>
  );
}
