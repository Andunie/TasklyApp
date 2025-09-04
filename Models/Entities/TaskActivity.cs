using System.ComponentModel.DataAnnotations;

namespace TasklyApp.Models.Entities;

public class TaskActivity
{
    public int Id { get; set; }

    [Required]
    public int TaskId { get; set; }
    public ProjectTask Task { get; set; }
    [Required]
    public string UserId { get; set; }
    public User User { get; set; }
    [Required]
    public string ActivityDescription { get; set; } // "Durumu 'In Progress' olarak değiştirdi.", "Yorum ekledi: 'Backend tamamlandı.'"

    public DateTime ActivityDate { get; set; } = DateTime.UtcNow;
    public string? ImageUrl { get; set; } // Aktiviteye eklenebilecek bir resim URL'si (isteğe bağlı)
    public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>(); // Aktivitenin ana yorumları
}

