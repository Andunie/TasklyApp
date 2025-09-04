using System.ComponentModel.DataAnnotations;

namespace TasklyApp.Models.Entities;

public class Team
{
    public int Id { get; set; }

    [Required]
    [StringLength(100)]
    public string Name { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    [Required]
    public string TeamLeadId { get; set; }
    public User TeamLeader { get; set; } // Navigation property
    
    // Navigation Properties
    public ICollection<User> Members { get; set; } = new List<User>(); // Takımın üyeleri
    public ICollection<ProjectTask> Tasks { get; set; } = new List<ProjectTask>(); // Takıma atanan görevler
}
