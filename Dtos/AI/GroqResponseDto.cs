using System.Text.Json.Serialization;

namespace TasklyApp.Dtos.AI;

public class GroqResponseDto
{
    [JsonPropertyName("choices")]
    public List<GroqChoice> Choices { get; set; }
}

public class GroqChoice
{
    [JsonPropertyName("message")]
    public GroqResponseMessage Message { get; set; }
}

public class GroqResponseMessage
{
    [JsonPropertyName("content")]
    public string Content { get; set; }
}
