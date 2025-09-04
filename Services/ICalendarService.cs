using Microsoft.EntityFrameworkCore;
using TasklyApp.Dtos.Calendar;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public interface ICalendarService
{
    Task<ServiceResponse<List<CalendarTaskDto>>> GetTasksForCalendarAsync(int teamId, string userId, bool isTeamLead, DateTime startDate, DateTime endDate);
}
