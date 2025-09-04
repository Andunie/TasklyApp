using System.ComponentModel.DataAnnotations;

namespace TasklyApp.Dtos.Comments;

public class CreateCommentDto
{
    [Required]
    [StringLength(1000, MinimumLength = 1)]
    public string Content { get; set; }
}
