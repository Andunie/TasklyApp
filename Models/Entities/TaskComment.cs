using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace TasklyApp.Models.Entities;

public class TaskComment
{
    public int Id { get; set; }
    public string Content { get; set; }
    public string AuthorId { get; set; }
    public User Author { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // YENİ YAPI: Bu yorum neye yapıldı?
    // Sadece biri dolu olacak.
    public int? ParentActivityId { get; set; }
    [ForeignKey("ParentActivityId")]
    public TaskActivity ParentActivity { get; set; }

    // Bu yorum, başka bir yorumun cevabı mı?
    public int? ParentCommentId { get; set; }
    [ForeignKey("ParentCommentId")]
    public TaskComment ParentComment { get; set; }

    // Bu yorumun alt cevapları (threaded replies)
    public ICollection<TaskComment> Replies { get; set; } = new List<TaskComment>();
}
