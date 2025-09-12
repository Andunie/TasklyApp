namespace TasklyApp.Dtos.AI;

public class AskAssistantRequest
{
    public string? Question { get; set; }
    public int? TeamId { get; set; }
}