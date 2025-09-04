using System.ComponentModel.DataAnnotations;

namespace TasklyApp.Dtos.Teams;

public class CreateTeamDto
{
    [Required]
    [StringLength(100, MinimumLength = 3)]
    public string Name { get; set; }
}
