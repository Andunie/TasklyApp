using Microsoft.EntityFrameworkCore;
using TasklyApp.Data;
using TasklyApp.Dtos.Calendar;
using TasklyApp.Models.Enums;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public class CalendarService : ICalendarService
{
    private readonly ApplicationDbContext _context;

    public CalendarService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResponse<List<CalendarTaskDto>>> GetTasksForCalendarAsync(int teamId, string userId, bool isTeamLead, DateTime startDate, DateTime endDate)
    {
        var response = new ServiceResponse<List<CalendarTaskDto>>();

        // 1. Güvenlik Kontrolü: Takım var mı ve kullanıcı bu takımın üyesi mi?
        var isMember = await _context.Teams
            .AnyAsync(t => t.Id == teamId && t.Members.Any(m => m.Id == userId));

        if (!isMember)
        {
            response.IsSuccess = false;
            response.Message = "You are not a member of this team.";
            return response;
        }

        // 2. Veri Çekme: Takımdaki tüm görevleri çek.
        var tasksQuery = _context.Tasks
            .Where(t => t.TeamId == teamId)
            .Where(t => t.StartDate <= endDate && t.DueDate >= startDate)
            .Include(t => t.AssignedTo)
            .AsNoTracking();

        // 3. ROL BAZLI FİLTRELEME: Eğer kullanıcı lider DEĞİLSE, sadece kendi görevlerini al.
        if (!isTeamLead)
        {
            tasksQuery = tasksQuery.Where(t => t.AssignedToUserId == userId);
        }

        var tasks = await tasksQuery.ToListAsync();

        // 4. Veriyi DTO'ya dönüştür.
        response.Data = tasks.Select(task => new CalendarTaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Start = task.StartDate,
            End = task.DueDate,     // Bitiş olarak DueDate
            Color = GetColorForPriorty(task.Priority), // Duruma göre renk belirle
            AssigneeName = task.AssignedTo?.FullName ?? "Unassigned",
            AssigneeId = task.AssignedToUserId,
            Status = task.Status.ToString()
        }).ToList();

        return response;
    }   

    private string GetColorForPriorty(PriortyLevel priorty)
    {
        return priorty switch
        {
            PriortyLevel.Low => "bg-secondary",
            PriortyLevel.Medium => "bg-primary",
            PriortyLevel.High => "bg-warning",
            PriortyLevel.Urgent => "bg-danger",
            _ => "bg-light",
        };
    }
}
