using TasklyApp.Dtos.Tasks;
using TasklyApp.Models.Enums;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public interface ITaskService
{
    Task<ServiceResponse<TaskDto>> CreateTaskAsync(CreateTaskDto createTaskDto, string creatorUserId);
    Task<ServiceResponse<TaskDto>> GetTaskByIdAsync(int taskId, string userId);
    Task<ServiceResponse<List<TaskDto>>> GetMyTasksAsync(string userId, TaskFilterDto filters);
    Task<ServiceResponse<TaskActivityDto>> LogActivityForTaskAsync(int taskId, string userId, LogActivityDto dto);
    Task<ServiceResponse<TaskDto>> UpdateTaskStatusAsync(int taskId, string userId, Task_Status newStatus);
    Task<ServiceResponse<TaskDto>> ApproveTaskAsync(int taskId, string userId);
    Task<ServiceResponse<TaskDto>> ReopenTaskAsync(int taskId, string userId, ReopenTaskDto reopenDto);
    Task<ServiceResponse<List<TaskDto>>> GetTeamTasksForLeaderAsync(string userId, TaskFilterDto filters);
}
