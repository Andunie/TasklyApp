import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-toastify';
import { taskService, TaskStatus } from '../api/services';


// Get My Tasks - filters parametresi için varsayılan değer ekle
export const useMyTasks = (filters = {}) => {
  return useQuery({
    queryKey: ['myTasks', filters],
    queryFn: async () => {
      // filters nesnesinin her zaman var olmasını garanti altına al
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '' && value != null)
      );
      const params = new URLSearchParams(activeFilters);
      // taskService'i kullan
      return taskService.getMyTasks(params.toString());
    },
    keepPreviousData: true,
  });
};

// Get Team Tasks - filters parametresi için varsayılan değer ekle
export const useTeamTasks = (filters = {}) => {
  return useQuery({
    queryKey: ['teamTasks', filters],
    queryFn: async () => {
      const activeFilters = Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== '' && value != null)
      );
      const params = new URLSearchParams(activeFilters);
      // taskService'i kullan
      return taskService.getTeamTasks(params.toString());
    },
    keepPreviousData: true,
  });
};

// Create Task
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['teamTasks'] });
      toast.success('Görev başarıyla oluşturuldu');
    },
    onError: () => {
      toast.error('Görev oluşturulamadı');
    },
  });
};

// Update Task Status
export const useUpdateTaskStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }) =>
      taskService.updateTaskStatus(taskId, data),
    onMutate: async ({ taskId, data }) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['myTasks'] });
      await queryClient.cancelQueries({ queryKey: ['teamTasks'] });

      // Snapshot the previous values
      const previousMyTasks = queryClient.getQueryData(['myTasks']);
      const previousTeamTasks = queryClient.getQueryData(['teamTasks']);

      // Optimistically update both caches
      queryClient.setQueryData(['myTasks'], (old = []) =>
        old.map(task => 
          task.id === taskId 
            ? { ...task, status: data.newStatus }
            : task
        )
      );

      queryClient.setQueryData(['teamTasks'], (old = []) =>
        old.map(task => 
          task.id === taskId 
            ? { ...task, status: data.newStatus }
            : task
        )
      );

      return { previousMyTasks, previousTeamTasks };
    },
    onError: (err, variables, context) => {
      // Revert optimistic updates on error
      if (context?.previousMyTasks) {
        queryClient.setQueryData(['myTasks'], context.previousMyTasks);
      }
      if (context?.previousTeamTasks) {
        queryClient.setQueryData(['teamTasks'], context.previousTeamTasks);
      }
      toast.error('Görev durumu güncellenemedi');
    },
    onSuccess: () => {
      toast.success('Görev durumu güncellendi');
    },
    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['teamTasks'] });
    },
  });
};

// Approve Task
export const useApproveTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId) => taskService.approveTask(taskId),
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: ['teamTasks'] });
      const previousTeamTasks = queryClient.getQueryData(['teamTasks']);

      // Optimistically update to Done status
      queryClient.setQueryData(['teamTasks'], (old = []) =>
        old.map(task => 
          task.id === taskId 
            ? { ...task, status: TaskStatus.Done }
            : task
        )
      );

      return { previousTeamTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTeamTasks) {
        queryClient.setQueryData(['teamTasks'], context.previousTeamTasks);
      }
      toast.error('Görev onaylanamadı');
    },
    onSuccess: () => {
      toast.success('Görev onaylandı');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['teamTasks'] });
    },
  });
};

// Reopen Task
export const useReopenTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }) =>
      taskService.reopenTask(taskId, data),
    onMutate: async ({ taskId, data }) => {
      await queryClient.cancelQueries({ queryKey: ['teamTasks'] });
      const previousTeamTasks = queryClient.getQueryData(['teamTasks']);

      // Optimistically update to reopenToStatus (usually InProgress)
      queryClient.setQueryData(['teamTasks'], (old = []) =>
        old.map(task => 
          task.id === taskId 
            ? { ...task, status: data.reopenToStatus || TaskStatus.InProgress }
            : task
        )
      );

      return { previousTeamTasks };
    },
    onError: (err, variables, context) => {
      if (context?.previousTeamTasks) {
        queryClient.setQueryData(['teamTasks'], context.previousTeamTasks);
      }
      toast.error('Görev yeniden açılamadı');
    },
    onSuccess: () => {
      toast.success('Görev yeniden açıldı');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['teamTasks'] });
    },
  });
};

// Delete Task
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId) => taskService.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['myTasks'] });
      queryClient.invalidateQueries({ queryKey: ['teamTasks'] });
      toast.success('Görev silindi');
    },
    onError: () => {
      toast.error('Görev silinemedi');
    },
  });
};

// Utility function to group tasks by status
export const groupTasksByStatus = (tasks) => {
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
