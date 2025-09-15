using TasklyApp.Models.Enums;

namespace TasklyApp.Dtos.Dashboard
{
    public class ActiveTaskDetailDto
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string AssignedToUserName { get; set; }
        public DateTime DueDate { get; set; }
        public PriortyLevel Priority { get; set; }
    }
}
