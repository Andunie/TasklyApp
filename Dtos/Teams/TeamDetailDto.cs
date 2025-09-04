namespace TasklyApp.Dtos.Teams;

public class TeamDetailDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string TeamLeadId { get; set; }
    public string TeamLeadName { get; set; }

    public List<TeamMemberDto> Members { get; set; } = new List<TeamMemberDto>();
}
