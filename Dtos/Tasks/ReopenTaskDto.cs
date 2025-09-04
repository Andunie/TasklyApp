using System.ComponentModel.DataAnnotations;
using TasklyApp.Models.Enums;

namespace TasklyApp.Dtos.Tasks;

public class ReopenTaskDto
{
    [Required]
    public Task_Status ReopenToStatus { get; set; } = Task_Status.InProgress;

    [Required]
    [StringLength(500)]
    public string Comment { get; set; }
}
