using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;
using TasklyApp.Data;
using TasklyApp.Dtos.Dashboard;
using TasklyApp.Dtos.Tasks;
using TasklyApp.Models.Enums;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public class DashboardService : IDashboardService
{
    private readonly ApplicationDbContext _context;

    public DashboardService(ApplicationDbContext context)
    {
        _context = context;
    }
    public async Task<ServiceResponse<DashboardStatsDto>> GetDashboardStatsForTeamAsync(int teamId, string userId)
    {
        var response = new ServiceResponse<DashboardStatsDto>();

        // 1. Yetkilendirme: Kullanıcının bu takımın lideri olup olmadığını kontrol et.
        var isTeamLead = await _context.Teams
            .AnyAsync(t => t.Id == teamId && t.TeamLeadId == userId);

        if (!isTeamLead)
        {
            response.IsSuccess = false;
            response.Message = "You are not authorized to view this team's dashboard.";
            return response;
        }

        var now = DateTime.UtcNow;
        var sevenDaysAgo = now.AddDays(-7);
        var fourteenDaysAgo = now.AddDays(-14);

        // 2. Tek Veritabanı Sorgusu: İhtiyacımız olan tüm veriyi tek seferde çekiyoruz.
        var tasksFromDb = await _context.Tasks
            .Where(t => t.TeamId == teamId)
            .AsNoTracking()
            .Select(t => new
            {
                t.Id,
                t.Title,
                t.Status,
                t.DueDate,
                t.Priority,
                t.CreatedAt,
                t.CompletedAt,
                t.UpdatedAt,
                AssignedToName = t.AssignedTo.FullName
            })
            .ToListAsync();

        // Eğer hiç görev yoksa, tüm listeleri başlatılmış boş bir DTO döndür.
        if (!tasksFromDb.Any())
        {
            response.Data = new DashboardStatsDto();
            return response;
        }

        // 3. Bellekte Hesaplama: Artık veritabanına tekrar gitmeden tüm istatistikleri hesapla.

        // --- Analiz için Ön Hesaplamalar ---

        // Trend Analizi (Velocity)
        int tasksCompletedLast7Days = tasksFromDb.Count(t => t.CompletedAt.HasValue && t.CompletedAt >= sevenDaysAgo);
        int tasksCompletedPrevious7Days = tasksFromDb.Count(t => t.CompletedAt.HasValue && t.CompletedAt >= fourteenDaysAgo && t.CompletedAt < sevenDaysAgo);

        double? velocityChangePercentage = null;
        if (tasksCompletedPrevious7Days > 0)
        {
            velocityChangePercentage = Math.Round(((double)(tasksCompletedLast7Days - tasksCompletedPrevious7Days) / tasksCompletedPrevious7Days) * 100, 2);
        }

        // Ortalama Tamamlama Süresi
        var completedTasksWithDuration = tasksFromDb
            .Where(t => t.Status == Task_Status.Done && t.CompletedAt.HasValue)
            .Select(t => (t.CompletedAt.Value - t.CreatedAt).TotalHours);

        // Tamamlanmış Görevlerin Kullanıcı Dağılımı (Performans için)
        var completedTasksPerUser = tasksFromDb
            .Where(t => t.Status == Task_Status.Done && t.AssignedToName != null)
            .GroupBy(t => t.AssignedToName)
            .Select(g => new ChartDataDto { Label = g.Key, Value = g.Count() })
            .ToList();

        // --- Nihai DTO'yu Oluştur ---
        var stats = new DashboardStatsDto
        {
            // Temel KPI'lar
            TotalTasks = tasksFromDb.Count,
            CompletedTasks = tasksFromDb.Count(t => t.Status == Task_Status.Done),
            InProgressTasks = tasksFromDb.Count(t => t.Status == Task_Status.InProgress),
            OverdueTasks = tasksFromDb.Count(t => t.DueDate < now && t.Status != Task_Status.Done && t.Status != Task_Status.Cancelled),

            // Grafik Verileri
            TasksByStatus = tasksFromDb.GroupBy(t => t.Status).Select(g => new ChartDataDto { Label = g.Key.ToString(), Value = g.Count() }).ToList(),
            TasksByPriority = tasksFromDb.Where(t => t.Status != Task_Status.Done && t.Status != Task_Status.Cancelled).GroupBy(t => t.Priority).Select(g => new ChartDataDto { Label = g.Key.ToString(), Value = g.Count() }).ToList(),
            ActiveTasksPerUser = tasksFromDb.Where(t => (t.Status == Task_Status.ToDo || t.Status == Task_Status.InProgress) && t.AssignedToName != null).GroupBy(t => t.AssignedToName).Select(g => new ChartDataDto { Label = g.Key, Value = g.Count() }).ToList(),
            TasksPerUser = completedTasksPerUser, // Tamamlananlar

            // Verimlilik Metrikleri
            TasksCompletedLast7Days = tasksCompletedLast7Days,
            AverageCompletionTimeInHours = completedTasksWithDuration.Any() ? Math.Round(completedTasksWithDuration.Average(), 2) : null,
            VelocityChangePercentage = velocityChangePercentage,

            // Risk Metrikleri
            StaleTasksCount = tasksFromDb.Count(t => (t.Status == Task_Status.InProgress || t.Status == Task_Status.InReview) && t.UpdatedAt < now.AddDays(-3)),
            UpcomingDeadlines = tasksFromDb.Where(t => t.Status != Task_Status.Done && t.Status != Task_Status.Cancelled && t.DueDate > now && t.DueDate <= now.AddDays(7)).OrderBy(t => t.DueDate).Select(t => new UpcomingTaskDto { Id = t.Id, Title = t.Title, DueDate = t.DueDate, AssignedToUserName = t.AssignedToName }).Take(5).ToList(),
            TopOverdueTasks = tasksFromDb.Where(t => t.DueDate < now && t.Status != Task_Status.Done && t.Status != Task_Status.Cancelled).OrderBy(t => t.DueDate).Take(5).Select(t => new OverdueTaskDto { Id = t.Id, Title = t.Title, AssignedToUserName = t.AssignedToName, DaysOverdue = (int)(now - t.DueDate).TotalDays }).ToList(),

            // Performans ve Tanıma Metrikleri
            TopPerformers = completedTasksPerUser.OrderByDescending(u => u.Value).Take(3).Select(u => new UserPerformanceDto { UserName = u.Label, CompletedTasksCount = u.Value }).ToList(),

            ActiveTasksDetails = tasksFromDb
                .Where(t => (t.Status == Task_Status.ToDo || t.Status == Task_Status.InProgress) && t.AssignedToName != null)
                .OrderBy(t => t.DueDate) // Yaklaşan tarihe göre sıralamak mantıklı olabilir
                .Select(t => new ActiveTaskDetailDto
                {
                    Id = t.Id,
                    Title = t.Title,
                    AssignedToUserName = t.AssignedToName,
                    DueDate = t.DueDate,
                    Priority = t.Priority
                })
                .ToList()
        };

        response.Data = stats;
        return response;
    }
}