using System.ComponentModel.DataAnnotations;
using TasklyApp.Models.Enums;

namespace TasklyApp.Dtos.Tasks;

public class CreateTaskDto
{
    [Required]
    public string Title { get; set; }
    public string? Description { get; set; }
    [Required]
    public DateTime StartDate { get; set; }
    [Required]
    public DateTime DueDate { get; set; }
    public PriortyLevel Priority { get; set; } = PriortyLevel.Medium;
    // Görevin hangi takıma ait olduğu
    [Required]
    public int TeamId { get; set; }
    [Required]
    public string AssignedToUserId { get; set; }
}
