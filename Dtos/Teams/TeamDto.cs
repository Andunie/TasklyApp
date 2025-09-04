namespace TasklyApp.Dtos.Teams;

public class TeamDto
{
    public int Id { get; set; }
    public string Name { get; set; }
    public DateTime CreatedAt { get; set; }
    public List<string> MemberEmails { get; set; } = new List<string>();
}
