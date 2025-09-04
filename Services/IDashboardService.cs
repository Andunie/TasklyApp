using TasklyApp.Dtos.Dashboard;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public interface IDashboardService
{
    Task<ServiceResponse<DashboardStatsDto>> GetDashboardStatsForTeamAsync(int teamId, string userId);
}