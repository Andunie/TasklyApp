using TasklyApp.Dtos.Calendar;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public interface IAIService
{
    Task<ServiceResponse<string>> GenerateCalendarSummaryAsync(List<CalendarTaskDto> tasks);
    Task<string> GenerateTextAsync(string prompt);
}
