using System.ComponentModel.DataAnnotations;
using TasklyApp.Models.Enums;

namespace TasklyApp.Dtos.Tasks;

public class UpdateTaskStatusDto
{
    [Required]
    public Task_Status NewStatus { get; set; }
}
