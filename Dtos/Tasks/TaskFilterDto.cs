using Microsoft.AspNetCore.Mvc;
using TasklyApp.Models.Enums;

namespace TasklyApp.Dtos.Tasks;

public class TaskFilterDto
{
    [FromQuery(Name = "search")]
    public string? SearchTerm { get; set; }

    [FromQuery(Name = "priority")]
    public PriortyLevel? Priority { get; set; }

    [FromQuery(Name = "assigneeId")]
    public string? AssigneeId { get; set; }
}
