using System.Text.Json.Serialization;

namespace TasklyApp.Dtos.AI;

public class GeminiResponseDto
{
    [JsonPropertyName("candidates")]
    public List<Candidate> Candidates { get; set; }
}

public class Candidate
{
    [JsonPropertyName("content")]
    public Content Content { get; set; }
}