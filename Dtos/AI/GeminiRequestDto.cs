using Google.Cloud.AIPlatform.V1;
using System.Text.Json.Serialization;

namespace TasklyApp.Dtos.AI;

public class GeminiRequestDto
{
    [JsonPropertyName("contents")]
    public List<Content> Contents { get; set; }
}

public class Content
{
    [JsonPropertyName("parts")]
    public List<Part> Parts { get; set; }
}

public class Part
{
    [JsonPropertyName("text")]
    public string Text { get; set; }
}