using TasklyApp.Dtos.Tasks;

namespace TasklyApp.Dtos.Dashboard;

public class DashboardStatsDto
{
    public int TotalTasks { get; set; }
    public int CompletedTasks { get; set; }
    public int InProgressTasks { get; set; }
    public int OverdueTasks { get; set; }
    public List<ChartDataDto> TasksByStatus { get; set; } = new List<ChartDataDto>();
    public List<ChartDataDto> TasksPerUser { get; set; } = new List<ChartDataDto>();
    public List<UpcomingTaskDto> UpcomingDeadlines { get; set; }

    public List<ChartDataDto> ActiveTasksPerUser { get; set; } // Aktif iş yükü
    public List<ChartDataDto> TasksByPriority { get; set; } // Öncelik dağılımı
    public int TasksCompletedLast7Days { get; set; } // Takım hızı
    public double? AverageCompletionTimeInHours { get; set; } // Ortalama tamamlama süresi

    /// <summary>
    /// Son 7 günde tamamlanan görev sayısının bir önceki 7 güne göre değişim yüzdesi.
    /// </summary>
    public double? VelocityChangePercentage { get; set; }

    /// <summary>
    /// Belirlenen süredir durumu değişmeyen ("sıkışmış") görevlerin sayısı.
    /// </summary>
    public int StaleTasksCount { get; set; }

    /// <summary>
    /// En çok gecikmiş ilk 5 görevin listesi.
    /// </summary>
    public List<OverdueTaskDto> TopOverdueTasks { get; set; } = new();

    /// <summary>
    /// Son dönemde en çok görev tamamlayan ilk 3 kullanıcı.
    /// </summary>
    public List<UserPerformanceDto> TopPerformers { get; set; } = new();

    public List<ActiveTaskDetailDto> ActiveTasksDetails { get; set; } = new();
}