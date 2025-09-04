namespace TasklyApp.Dtos.Notifications;
/// <summary>
/// Bir bildirimin detaylarını frontend'e göndermek için kullanılır.
/// Hem API endpoint'leri hem de SignalR Hub'ı tarafından kullanılır.
/// </summary>
public class NotificationDto
{
    /// <summary>
    /// Bildirimin benzersiz kimliği.
    /// </summary>
    public int Id { get; set; }

    /// <summary>
    /// Kullanıcıya gösterilecek bildirim metni.
    /// </summary>
    public string Message { get; set; }

    /// <summary>
    /// Bildirime tıklandığında yönlendirilecek frontend rotası.
    /// Örn: "/tasks/123"
    /// </summary>
    public string? Link { get; set; }

    /// <summary>
    /// Bildirimin kullanıcı tarafından okunup okunmadığı durumu.
    /// </summary>
    public bool IsRead { get; set; }

    /// <summary>
    /// Bildirimin oluşturulduğu tarih ve saat.
    /// </summary>
    public DateTime CreatedAt { get; set; }
}