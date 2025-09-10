using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;

namespace TasklyApp.Dtos.Meetings
{
    public class CreateMeetingRequestDto
    {
        [Required]
        [StringLength(200, MinimumLength = 3)]
        public string Topic { get; set; }
        public string? Agenda { get; set; }
        [Required]
        public DateTime StartTime { get; set; }
        [Required]
        [Range(15, 480)]
        public int DurationInMinutes { get; set; }
        [Required]
        public int TeamId { get; set; }
        public List<string> AttendeeIds { get; set; } = new();
    }

    public class ZoomTokenResponse { [JsonPropertyName("access_token")] public string AccessToken { get; set; } }
    public class ZoomMeetingResponse { [JsonPropertyName("id")] public long Id { get; set; } [JsonPropertyName("start_url")] public string StartUrl { get; set; } [JsonPropertyName("join_url")] public string JoinUrl { get; set; } }
}