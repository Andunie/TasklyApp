using TasklyApp.Dtos.Notifications;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public interface INotificationService
{
    Task CreateAndSendNotificationsAsync(IEnumerable<string> targetUserIds, string excludedUserId, string message, string link);

    /// <summary>
    /// Belirli bir kullanıcının son bildirimlerini (okunmuş/okunmamış) getirir.
    /// </summary>
    /// <param> name = "userId" Bildirimleri getirilecek kullanıcının ID'si.</param>
    /// <returns>Bildirimlerin bir listesini içeren bir ServiceResponse.</returns>
    Task<ServiceResponse<List<NotificationDto>>> GetUserNotificationsAsync(string userId);

    /// <summary>
    /// Belirli bir kullanıcının okunmamış tüm bildirimlerini "okundu" olarak işaretler.
    /// </summary>
    /// <param> name = "userId" Bildirimleri işaretlenecek kullanıcının ID'si.</param>
    /// <returns>İşlemin başarılı olup olmadığını belirten bir ServiceResponse.</returns>
    Task<ServiceResponse<bool>> MarkAllAsReadAsync(string userId);
    // YENİ METOT
    Task<ServiceResponse<string>> MarkAsReadAsync(string userId, int notificationId);
}
