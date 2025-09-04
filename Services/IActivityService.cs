using TasklyApp.Dtos.Comments;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public interface IActivityService
{
    Task<ServiceResponse<List<ActivityFeedDto>>> GetMyActivitiesForTaskAsync(int taskId, string userId);
    Task<ServiceResponse<List<ActivityFeedDto>>> GetTeamActivityFeedAsync(int teamId, string userId);
    Task<ServiceResponse<List<ActivityFeedDto>>> GetAllMyActivitiesAsync(string userId);

}
