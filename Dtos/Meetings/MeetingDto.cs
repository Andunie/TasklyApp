namespace TasklyApp.Dtos.Meetings
{
    public class MeetingDto
    {
        public int Id { get; set; }
        public string Topic { get; set; }
        public DateTime StartTime { get; set; }
        public string JoinUrl { get; set; }
    }
}
