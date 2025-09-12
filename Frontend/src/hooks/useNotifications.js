import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationService } from '../api/services';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';

export const useNotifications = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch notifications
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationService.getNotifications,
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds as fallback
    staleTime: 10000, // Consider data stale after 10 seconds
  });

  // Calculate unread count
  const unreadCount = notifications.filter(n => !n.isRead).length;

  // Mark all as read mutation
  const markAllAsReadMutation = useMutation({
    mutationFn: notificationService.markAllAsRead,
    onSuccess: () => {
      // Invalidate and refetch notifications
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Tüm bildirimler okundu olarak işaretlendi');
    },
    onError: (error) => {
      console.error('Error marking notifications as read:', error);
      toast.error('Bildirimler işaretlenirken hata oluştu');
    },
  });

  const markAllAsRead = () => {
    if (unreadCount > 0) {
      markAllAsReadMutation.mutate();
    }
  };

  return {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAllAsRead,
    isMarkingAsRead: markAllAsReadMutation.isPending,
    refetch,
  };
};

export default useNotifications;
