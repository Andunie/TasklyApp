using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using TasklyApp.Models.Enums;

namespace TasklyApp.Models.Entities;

public class ProjectTask
{
    public int Id { get; set; }

    [Required]
    [StringLength(200)]
    public string Title { get; set; }

    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }
    public PriortyLevel Priority { get; set; } = PriortyLevel.Medium;
    public Task_Status Status { get; set; } = Task_Status.ToDo;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? CompletedAt { get; set; } // Görev tamamlandığında dolacak

    // Kime atandı? (Foreign Key)
    public string? AssignedToUserId { get; set; }
    [ForeignKey("AssignedToUserId")]
    public User? AssignedTo { get; set; } // Navigation property

    // Hangi takıma ait? (Foreign Key)
    public int? TeamId { get; set; }
    [ForeignKey("TeamId")]
    public Team? Team { get; set; } // Navigation property
    public ICollection<TaskActivity> Activities { get; set; } = new List<TaskActivity>();
}
