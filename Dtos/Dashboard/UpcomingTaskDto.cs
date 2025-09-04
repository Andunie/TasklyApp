namespace TasklyApp.Dtos.Dashboard;

public class UpcomingTaskDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public DateTime DueDate { get; set; }
    public string AssignedToUserName { get; set; }
}
