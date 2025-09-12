import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { HubConnectionBuilder, LogLevel, HubConnectionState } from '@microsoft/signalr';
import { toast } from 'react-toastify';
import { useQueryClient } from '@tanstack/react-query';
import { useAuth } from './AuthContext';

const SignalRContext = createContext(null);

export function SignalRProvider({ children }) {
  const [connection, setConnection] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://localhost:7008';

  const connect = useCallback(async () => {
    // Don't create new connection if one already exists and is connected
    if (connection && connection.state === HubConnectionState.Connected) {
      return;
    }

    try {
      const newConnection = new HubConnectionBuilder()
        .withUrl(`${API_BASE_URL}/notificationHub`, {
          withCredentials: true,
        })
        .withAutomaticReconnect([0, 2000, 10000, 30000])
        .configureLogging(LogLevel.Information)
        .build();

      // Event handlers
      newConnection.onclose(() => {
        setIsConnected(false);
      });

      newConnection.onreconnecting(() => {
        setIsConnected(false);
      });

      newConnection.onreconnected(() => {
        setIsConnected(true);
      });

      // Clear any existing handlers and listen for notifications
      newConnection.off('ReceiveNotification'); // Remove old handlers
      newConnection.off('ReceiveNewNotification'); // Remove old handlers
      
      // Handle both event names for compatibility
      const handleNotification = (notificationData) => {
        // Handle both string and NotificationDto object notifications
        let message = '';
        let type = 'default';
        let notificationDto = null;
        
        if (typeof notificationData === 'string') {
          // Legacy: Backend sends direct string message
          message = notificationData;
          
          // Try to detect type from message content
          if (message.includes('commented') || message.includes('yorum')) {
            type = 'CommentAdded';
          } else if (message.includes('assigned') || message.includes('atandı') || message.includes('atanan')) {
            type = 'TaskAssigned';
          } else if (message.includes('status') || message.includes('durum')) {
            type = 'TaskStatusChanged';
          } else if (message.includes('activity') || message.includes('aktivite')) {
            type = 'ActivityAdded';
          } else if (message.includes('invite') || message.includes('davet')) {
            type = 'TeamInvitation';
          }
        } else if (notificationData && typeof notificationData === 'object') {
          // New: Backend sends NotificationDto object
          notificationDto = notificationData;
          message = notificationData.message || notificationData.Message || '';
          type = notificationData.type || notificationData.Type || 'default';
          
          // Detect type from message content if not provided
          if (!type || type === 'default') {
            if (message.includes('yorum') || message.includes('commented')) {
              type = 'CommentAdded';
            } else if (message.includes('atandı') || message.includes('assigned')) {
              type = 'TaskAssigned';
            } else if (message.includes('durum') || message.includes('status')) {
              type = 'TaskStatusChanged';
            } else if (message.includes('aktivite') || message.includes('activity')) {
              type = 'ActivityAdded';
            } else if (message.includes('davet') || message.includes('invite')) {
              type = 'TeamInvitation';
            }
          }
        }
        
        // Show toast notification based on type
        const showToast = (msg, notificationType) => {
          const toastOptions = {
            position: 'top-right',
            autoClose: 5000,
            hideProgressBar: false,
            closeOnClick: true,
            pauseOnHover: true,
            draggable: true,
          };

          switch (notificationType) {
            case 'TaskAssigned':
              toast.info(`🎯 ${msg}`, toastOptions);
              break;
            case 'TaskStatusChanged':
              toast.success(`✅ ${msg}`, toastOptions);
              break;
            case 'CommentAdded':
              toast.info(`💬 ${msg}`, toastOptions);
              break;
            case 'ActivityAdded':
              toast.info(`📝 ${msg}`, toastOptions);
              break;
            case 'TeamInvitation':
              toast.warning(`👥 ${msg}`, toastOptions);
              break;
            default:
              toast.info(`📢 ${msg}`, toastOptions);
          }
        };

        if (message) {
          showToast(message, type);
        }

        // CRITICAL: Always invalidate notifications first to update the notification center
        // This ensures the bell icon and dropdown get updated immediately
        queryClient.invalidateQueries({ queryKey: ['notifications'] });

        // Invalidate relevant React Query caches based on detected type
        if (type === 'CommentAdded' || type === 'ActivityAdded') {
          // Invalidate activity feeds
          queryClient.invalidateQueries({ queryKey: ['myActivities'] });
          queryClient.invalidateQueries({ queryKey: ['teamActivityFeed'] });
          queryClient.invalidateQueries({ queryKey: ['taskActivities'] });
          queryClient.invalidateQueries({ queryKey: ['myTaskActivities'] });
        }

        if (type === 'TaskAssigned' || type === 'TaskStatusChanged') {
          // Invalidate task lists
          queryClient.invalidateQueries({ queryKey: ['myTasks'] });
          queryClient.invalidateQueries({ queryKey: ['teamTasks'] });
        }

        if (type === 'TeamInvitation') {
          // Invalidate team data
          queryClient.invalidateQueries({ queryKey: ['myTeams'] });
          queryClient.invalidateQueries({ queryKey: ['teamInvitations'] });
        }

        // Log for debugging
        console.log('SignalR notification received:', {
          type,
          message,
          isNotificationDto: !!notificationDto,
          notificationDto
        });
      };

      // Listen for both possible event names
      newConnection.on('ReceiveNotification', handleNotification);
      newConnection.on('ReceiveNewNotification', handleNotification);

      await newConnection.start();
      setConnection(newConnection);
      setIsConnected(true);

    } catch (error) {
      setIsConnected(false);
    }
  }, [API_BASE_URL, queryClient]);

  const disconnect = useCallback(async () => {
    if (connection) {
      try {
        await connection.stop();
      } catch (error) {
        // Silent error handling
      } finally {
        setConnection(null);
        setIsConnected(false);
      }
    }
  }, [connection]);

  // Auto-connect when user is authenticated
  useEffect(() => {
    if (user && !connection) {
      connect();
    } else if (!user && connection) {
      disconnect();
    }
  }, [user, connection]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (connection) {
        connection.stop().catch(() => {});
      }
    };
  }, []);

  const value = {
    connection,
    isConnected,
    connect,
    disconnect,
  };

  return <SignalRContext.Provider value={value}>{children}</SignalRContext.Provider>;
}

export function useSignalR() {
  const context = useContext(SignalRContext);
  if (!context) {
    throw new Error('useSignalR must be used within a SignalRProvider');
  }
  return context;
}
