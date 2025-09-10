using System.ComponentModel.DataAnnotations;

namespace TasklyApp.Dtos.Notifications;

public class SendMeetingInvitationRequestDto
{
    [Required]
    public List<string> TargetUserIds { get; set; } = new();

    [Required]
    [StringLength(200)]
    public string MeetingTopic { get; set; }

    [Required]
    public string MeetingLink { get; set; } // Örn: /app/meeting/oda-adi
}
