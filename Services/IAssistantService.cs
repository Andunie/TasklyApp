namespace TasklyApp.Services;

public interface IAssistantService
{
    Task<string> GetResponseAsync(string question, string userId, int? teamId);
}
