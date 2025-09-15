namespace TasklyApp.Models.Enums;

public enum AssistantIntent
{
    Unknown,          // Niyet anlaşılamadığında
    MostActiveUser,   // "En çok kim çalışıyor?" gibi sorular için
    OverdueTasks,     // "Gecikmiş görevler var mı?" gibi sorular için
    UserSpecificTasks,
    TeamStatusSummary,
    UpcomingDeadlines,
    RecentCompletions,
    HighPriorityTasks
}
