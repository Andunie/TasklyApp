namespace TasklyApp.Dtos.Dashboard
{
    /// <summary>
    /// En çok gecikmiş görevlerin detaylarını tutar. (YENİ EKLENDİ)
    /// </summary>
    public class OverdueTaskDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string AssignedToUserName { get; set; }
        public int DaysOverdue { get; set; }
    }
}
