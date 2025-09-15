using TasklyApp.Models.Enums;

namespace TasklyApp.Dtos.Tasks;

public class TaskDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string? Description { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime DueDate { get; set; }
    public PriortyLevel Priority { get; set; }
    public Task_Status Status { get; set; }
    public DateTime CreatedAt { get; set; }
    public int TeamId { get; set; }
    public string TeamName { get; set; }
    public string TeamLeadId { get; set; }
    public string TeamLeaderUserName { get; set; }
    public string AssignedToUserId { get; set; }
    public string AssignedToUserName { get; set; }
}
