using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TasklyApp.Services;

namespace TasklyApp.Controllers
{
    [Route("api/activities")]
    [ApiController]
    [Authorize] // Controller'ın tamamı yetkilendirme gerektirir.
    public class ActivitiesController : ControllerBase
    {
        private readonly IActivityService _activityService;

        public ActivitiesController(IActivityService activityService)
        {
            _activityService = activityService;
        }

        // "Aktivitelerim" sayfası için endpoint
        // GET: api/activities/my-task-activities/{taskId}
        [HttpGet("my-activities")] // Rota artık daha genel
        public async Task<IActionResult> GetMyActivities() // taskId parametresi kaldırıldı
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // Servis metodunu yeni ismine göre güncelliyoruz.
            var response = await _activityService.GetAllMyActivitiesAsync(userId);

            if (!response.IsSuccess)
            {
                // Servisten bir hata dönerse (genellikle dönmez ama iyi bir pratiktir)
                return BadRequest(response.Message);
            }

            return Ok(response.Data);
        }

        // "Takım Görevleri" sayfası için endpoint
        // GET: api/activities/team-feed/{taskId}
        [HttpGet("team-feed/{teamId}")] // Artık teamId alıyor
        public async Task<IActionResult> GetTeamActivityFeed(int teamId) // Parametre teamId oldu
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var response = await _activityService.GetTeamActivityFeedAsync(teamId, userId);

            if (!response.IsSuccess)
            {
                return Forbid(response.Message);
            }

            return Ok(response.Data);
        }
    }
}