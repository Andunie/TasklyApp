
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TasklyApp.Data;
using TasklyApp.Dtos.Notifications;
using TasklyApp.Hubs;
using TasklyApp.Models.Entities;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public class NotificationService : INotificationService
{
    private readonly ApplicationDbContext _context;
    private readonly IHubContext<NotificationHub> _hubContext;

    public NotificationService(ApplicationDbContext context, IHubContext<NotificationHub> hubContext)
    {
        _context = context;
        _hubContext = hubContext;
    }

    public async Task CreateAndSendNotificationsAsync(IEnumerable<string> targetUserIds, string excludedUserId, string message, string link)
    {
        // Tekrarlanan ID'leri ve eylemi yapan kişinin kendi ID'sini listeden çıkar.
        var finalTargetIds = targetUserIds.Distinct().Where(id => id != excludedUserId).ToList();

        if (!finalTargetIds.Any()) return;

        // Toplu kayıt için bildirim listesi oluştur
        var notifications = finalTargetIds.Select(targetId => new Notification
        {
            TargetUserId = targetId,
            Message = message,
            Link = link
        }).ToList();

        // 1. Veritabanına toplu olarak kaydet (daha verimli)
        await _context.Notifications.AddRangeAsync(notifications);
        await _context.SaveChangesAsync();

        // 2. Anlık olarak SignalR ile gönder
        foreach (var notification in notifications)
        {
            // Frontend'in anlık güncelleme yapabilmesi için yeni bildirimin DTO'sunu gönderelim.
            var notificationDto = new NotificationDto
            {
                Id = notification.Id,
                Message = notification.Message,
                Link = notification.Link,
                IsRead = notification.IsRead,
                CreatedAt = notification.CreatedAt
            };
            await _hubContext.Clients.Group($"User_{notification.TargetUserId}")
                .SendAsync("ReceiveNewNotification", notificationDto);
        }
    }

    public async Task<ServiceResponse<List<NotificationDto>>> GetUserNotificationsAsync(string userId)
    {
        var response = new ServiceResponse<List<NotificationDto>>();

        // Kullanıcının son 15 bildirimini, en yeniden eskiye doğru sıralayarak çekiyoruz.
        var notifications = await _context.Notifications
            .Where(n => n.TargetUserId == userId)
            .OrderByDescending(n => n.CreatedAt)
            .Take(15) // Performans için bir limit koymak çok önemlidir.
            .Select(n => new NotificationDto
            {
                Id = n.Id,
                Message = n.Message,
                Link = n.Link,
                IsRead = n.IsRead,
                CreatedAt = n.CreatedAt
            })
            .AsNoTracking()
            .ToListAsync();

        response.Data = notifications;
        response.Message = "Notifications retrieved successfully.";

        return response;
    }

    public async Task<ServiceResponse<bool>> MarkAllAsReadAsync(string userId)
    {
        var response = new ServiceResponse<bool>();

        // Kullanıcının okunmamış tüm bildirimlerini bul.
        var unreadNotifications = await _context.Notifications
            .Where(n => n.TargetUserId == userId && !n.IsRead)
            .ToListAsync();

        if (unreadNotifications.Any())
        {
            // Hepsini "okundu" olarak işaretle.
            foreach (var notification in unreadNotifications)
            {
                notification.IsRead = true;
            }

            // Değişiklikleri veritabanına kaydet.
            await _context.SaveChangesAsync();
        }

        response.Data = true; // İşlem başarılı.
        response.Message = "All notifications marked as read.";

        return response;
    }

    public async Task<ServiceResponse<string>> MarkAsReadAsync(string userId, int notificationId)
    {
        var response = new ServiceResponse<string>();

        var notification = await _context.Notifications
            .FirstOrDefaultAsync(n => n.Id == notificationId && n.TargetUserId == userId);

        if (notification == null)
        {
            response.IsSuccess = false;
            response.Message = "Notification not found or you are not authorized to access it.";
            return response;
        }

        // Eğer zaten okunmuşsa, tekrar işlem yapma ama linki yine de döndür.
        if (notification.IsRead)
        {
            response.Data = notification.Link;
            response.Message = "Notification was already marked as read.";
            return response;
        }

        notification.IsRead = true;
        await _context.SaveChangesAsync();

        // Başarılı olduğunda, yönlendirme linkini data olarak döndür.
        response.Data = notification.Link;
        response.Message = "Notification marked as read.";

        return response;
    }
}
