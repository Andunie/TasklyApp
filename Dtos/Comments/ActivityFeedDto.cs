namespace TasklyApp.Dtos.Comments;
/// <summary>
/// "Aktivitelerim" veya "Takım Görevleri" sayfaları için,
/// bir aktiviteyi ve ona bağlı tüm yorum hiyerarşisini temsil eder.
/// </summary>
public class ActivityFeedDto
{
    public int Id { get; set; }
    public string Description { get; set; }
    public DateTime ActivityDate { get; set; }

    // --- Görev Bilgileri (YENİ) ---
    public int TaskId { get; set; }
    public string TaskTitle { get; set; }
    // --- BİTİŞ ---

    public string UserId { get; set; }
    public string UserName { get; set; }
    public string? UserAvatarUrl { get; set; }

    public string? ImageUrl { get; set; }

    public List<CommentFeedDto> Comments { get; set; } = new List<CommentFeedDto>();
}