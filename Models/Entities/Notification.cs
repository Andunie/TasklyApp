using System.ComponentModel.DataAnnotations;

namespace TasklyApp.Models.Entities;

public class Notification
{
    public int Id { get; set; }

    [Required]
    public string Message { get; set; } // "İlhan, 'X' görevine yorum yaptı."

    // Bildirimin hedefi olan kullanıcı
    [Required]
    public string TargetUserId { get; set; }
    public User TargetUser { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public bool IsRead { get; set; } = false; // "Görüldü" durumu

    // İsteğe bağlı: Bildirime tıklandığında nereye yönlendirilecek?
    // Örn: "/tasks/123" veya "/activities/feed/1"
    public string? Link { get; set; }
}
