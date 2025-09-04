namespace TasklyApp.Dtos.Dashboard
{
    /// <summary>
    /// En iyi performans gösteren kullanıcıların bilgilerini tutar. (YENİ EKLENDİ)
    /// </summary>
    public class UserPerformanceDto
    {
        public string UserName { get; set; }
        public int CompletedTasksCount { get; set; }
    }
}
