using System.Text.Json.Serialization;

namespace TasklyApp.Dtos.AI;

public class GroqRequestDto
{
    [JsonPropertyName("messages")]
    public List<GroqMessage> Messages { get; set; }

    [JsonPropertyName("model")]
    public string Model { get; set; }
}

public class GroqMessage
{
    [JsonPropertyName("role")]
    public string Role { get; set; }

    [JsonPropertyName("content")]
    public string Content { get; set; }
}