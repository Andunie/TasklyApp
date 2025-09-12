using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using TasklyApp.Dtos.AI;
using TasklyApp.Dtos.Calendar;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public class AIService : IAIService
{
    private readonly string _apiKey;
    private readonly string _groqApiKey;

    private readonly IHttpClientFactory _httpClientFactory;
    private const string GeminiApiUrl = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
    private const string GroqApiUrl = "https://api.groq.com/openai/v1/chat/completions";
    private const string GroqModel = "meta-llama/llama-4-scout-17b-16e-instruct";
    private readonly ILogger<AIService> _logger;

    public AIService(IConfiguration configuration, IHttpClientFactory httpClientFactory, ILogger<AIService> logger)
    {
        _apiKey = configuration["Gemini:ApiKey"];
        _groqApiKey = configuration["Groq:ApiKey"];
        _httpClientFactory = httpClientFactory;
        _logger = logger;
        _logger=logger;
    }


    // --- SOHBET ASİSTANI (GROQ İLE ÇALIŞACAK ŞEKİLDE YENİDEN YAZILDI) ---
    public async Task<string> GenerateTextAsync(string prompt)
    {
        if (string.IsNullOrEmpty(_groqApiKey))
        {
            _logger.LogError("Groq API key is not configured.");
            return "Üzgünüm, AI servisi şu anda yapılandırılmamış. Lütfen yönetici ile iletişime geçin.";
        }

        var requestDto = new GroqRequestDto
        {
            Model = GroqModel,
            Messages = new List<GroqMessage>
            {
                // Prompt'un tamamını kullanıcı mesajı olarak gönderiyoruz.
                // Groq'un sistem talimatlarını anlaması için bu yeterli.
                new GroqMessage { Role = "user", Content = prompt }
            }
        };

        try
        {
            var client = _httpClientFactory.CreateClient();
            client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _groqApiKey);

            var jsonContent = JsonSerializer.Serialize(requestDto);
            var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

            var httpResponse = await client.PostAsync(GroqApiUrl, httpContent);

            if (!httpResponse.IsSuccessStatusCode)
            {
                var errorBody = await httpResponse.Content.ReadAsStringAsync();
                _logger.LogError("Error from Groq API. Status: {StatusCode}, Body: {ErrorBody}", httpResponse.StatusCode, errorBody);
                throw new HttpRequestException($"Error from Groq API: {httpResponse.ReasonPhrase}");
            }

            var jsonResponse = await httpResponse.Content.ReadAsStringAsync();
            var groqResponse = JsonSerializer.Deserialize<GroqResponseDto>(jsonResponse);

            var resultText = groqResponse?.Choices?.FirstOrDefault()?.Message?.Content;

            return string.IsNullOrWhiteSpace(resultText)
                ? "Üzgünüm, bir cevap üretemedim. Lütfen sorunuzu farklı bir şekilde sormayı deneyin."
                : resultText.Trim();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred while calling Groq API in GenerateTextAsync.");
            return "Üzgünüm, AI asistanı ile iletişim kurarken bir hata oluştu.";
        }
    }

    public async Task<ServiceResponse<string>> GenerateCalendarSummaryAsync(List<CalendarTaskDto> tasks)
    {
        var response = new ServiceResponse<string>();

        if (string.IsNullOrEmpty(_apiKey))
        {
            response.IsSuccess = false;
            response.Message = "Gemini API key is not configured.";
            return response;
        }

        var prompt = BuildPrompt(tasks);
        var requestDto = new GeminiRequestDto
        {
            Contents = new List<Content>
            {
                new Content { Parts = new List<Part> { new Part { Text = prompt } } }
            }
        };

        var client = _httpClientFactory.CreateClient();
        var requestUrl = $"{GeminiApiUrl}?key={_apiKey}";
        var jsonContent = JsonSerializer.Serialize(requestDto);
        var httpContent = new StringContent(jsonContent, Encoding.UTF8, "application/json");

        try
        {
            var httpResponse = await client.PostAsync(requestUrl, httpContent);

            if (!httpResponse.IsSuccessStatusCode)
            {
                var errorBody = await httpResponse.Content.ReadAsStringAsync();
                _logger.LogError("Error from Gemini API. Status: {StatusCode}, Body: {ErrorBody}", httpResponse.StatusCode, errorBody);
                response.IsSuccess = false;
                response.Message = $"Error from Gemini API: {httpResponse.ReasonPhrase} - {errorBody}";
                return response;
            }

            var jsonResponse = await httpResponse.Content.ReadAsStringAsync();
            var geminiResponse = JsonSerializer.Deserialize<GeminiResponseDto>(jsonResponse);

            // Yanıttan metni çıkar
            var summary = geminiResponse?.Candidates?.FirstOrDefault()?.Content?.Parts?.FirstOrDefault()?.Text;

            if (string.IsNullOrWhiteSpace(summary))
            {
                response.IsSuccess = false;
                response.Message = "AI generated an empty summary.";
            }
            else
            {
                response.Data = summary.Trim();
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "An unexpected error occurred in AIService.");
            response.IsSuccess = false;
            response.Message = $"An error occurred while communicating with the AI service: {ex.Message}";
        }

        return response;
    }

    private string BuildPrompt(List<CalendarTaskDto> tasks)
    {
        if (tasks == null || !tasks.Any())
        {
            return "You are a friendly and encouraging assistant. The user has no tasks in their calendar for this period. Write a short, uplifting message suggesting what they could do with their free time, like planning ahead or taking a break. Be creative and concise.";
        }

        var tasksString = string.Join("\n", tasks.Select(t => $"- Task: '{t.Title}', Due: {t.End:MMMM dd}, Assigned to: {t.AssigneeName}"));

        return $@"
                You are Taskly, a smart and helpful project management assistant.
                You will be given a list of tasks from a user's calendar. Your job is to analyze these tasks and provide a short, insightful, and friendly summary (max 2-3 sentences).
                - Be encouraging and positive.
                - Highlight the most important or urgent task if there is one.
                - If there are many tasks, comment on how busy the period looks.
                - Address the user directly.
                - Keep it concise and conversational.

                Here are the tasks:
                {tasksString}

                Now, provide the summary.
            ";
    }
}