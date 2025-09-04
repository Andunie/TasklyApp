using TasklyApp.Models.Enums;

namespace TasklyApp.Models.Entities;

public class Invitation
{
    public int Id { get; set; }
    public int TeamId { get; set; }
    public Team Team { get; set; }

    public string InvitedUserId { get; set; }
    public User InvitedUser { get; set; }

    public string SentByUserId { get; set; }
    public User SentByUser { get; set; }

    public DateTime SentAt { get; set; } = DateTime.UtcNow;
    public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
    public Guid Token { get; set; } = Guid.NewGuid(); // Daveti doğrulamak için benzersiz token
}
