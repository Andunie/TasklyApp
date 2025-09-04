namespace TasklyApp.Dtos.Calendar;

public class CalendarTaskDto
{
    public int Id { get; set; }
    public string Title { get; set; }
    public DateTime Start { get; set; } // Görevin başlangıç tarihi
    public DateTime End { get; set; }   // Görevin bitiş tarihi
    public string Color { get; set; }   // Frontend'in kullanacağı renk kodu (örn: "bg-danger")
    public string AssigneeName { get; set; } // Görevin kime atandığı
    public string AssigneeId { get; set; }   // Filtreleme için kullanıcının ID'si
    public string Status { get; set; }       // Görevin durumu (ToDo, InProgress...)
}