namespace TasklyApp.Dtos.Comments;

/// <summary>
/// Bir yorumu ve ona verilen cevapları (iç içe) temsil eder.
/// </summary>
public class CommentFeedDto
{
    public int Id { get; set; }
    public string Content { get; set; }
    public DateTime CreatedAt { get; set; }

    public string AuthorId { get; set; }
    public string AuthorName { get; set; }
    public string? AuthorAvatarUrl { get; set; }

    // Bu yoruma verilen cevapların listesi
    public List<CommentFeedDto> Replies { get; set; } = new List<CommentFeedDto>();
}
