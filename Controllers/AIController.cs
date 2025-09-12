using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TasklyApp.Dtos.AI;
using TasklyApp.Dtos.Calendar;
using TasklyApp.Services;

namespace TasklyApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class AIController : ControllerBase
    {
        private readonly IAIService _aiService;
        public AIController(IAIService aiService)
        {
            _aiService = aiService;
        }

        /// <summary>
        /// Frontend'den gelen görev listesini alıp, bu listeye göre
        /// Gemini AI tarafından oluşturulmuş bir takvim özeti döndürür.
        /// </summary>
        /// <param ="tasks">Frontend'in takvimde gösterdiği görevlerin listesi.</param>
        /// <returns>AI tarafından üretilmiş bir özet metni.</returns>
        // POST: api/ai/calendar-summary
        [HttpPost("calendar-summary")]
        public async Task<IActionResult> GetCalendarSummary([FromBody] List<CalendarTaskDto> tasks)
        {
            // 1. Gelen veriyi kontrol et.
            //    tasks null olabilir ama boş bir liste ([]) de gelebilir, bu geçerlidir.
            if (tasks == null)
            {
                return BadRequest(new { Message = "Task list cannot be null." });
            }

            // 2. İşi AIService'e delege et.
            var response = await _aiService.GenerateCalendarSummaryAsync(tasks);

            // 3. Servisten gelen sonucu değerlendir.
            if (!response.IsSuccess)
            {
                // AI servisinden veya API anahtarından kaynaklanan bir hata varsa,
                // 500 Internal Server Error veya 503 Service Unavailable daha uygun olabilir.
                return StatusCode(500, new { Message = response.Message });
            }

            // 4. Başarılı sonucu frontend'e döndür.
            return Ok(new { Summary = response.Data });
        }
    }
}