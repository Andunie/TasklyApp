using Microsoft.AspNetCore.Identity;
using System.ComponentModel.DataAnnotations;

namespace TasklyApp.Models.Entities;

public class User : IdentityUser
{
    [StringLength(100)]
    public string? FullName { get; set; }

    // Navigation Properties (İlişkisel veritabanı bağlantıları)
    public ICollection<Team> Teams { get; set; } = new List<Team>(); // Kullanıcının üye olduğu takımlar
    public ICollection<ProjectTask> AssignedTasks { get; set; } = new List<ProjectTask>(); // Kullanıcıya atanan görevler
    public ICollection<TaskComment> Comments { get; set; } = new List<TaskComment>(); // Kullanıcının yaptığı yorumlar
    public ICollection<TaskActivity> Activities { get; set; } = new List<TaskActivity>(); // Kullanıcının yaptığı aktiviteler
    public ICollection<Notification> Notifications { get; set; } = new List<Notification>(); // Kullanıcının bildirimleri

}
