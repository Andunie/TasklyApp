using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TasklyApp.Services;

namespace TasklyApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class DashboardController : ControllerBase
    {
        private readonly IDashboardService _dashboardService;

        public DashboardController(IDashboardService dashboardService)
        {
            _dashboardService = dashboardService;
        }

        // GET: api/dashboard/stats?teamId=1
        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats([FromQuery] int teamId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var response = await _dashboardService.GetDashboardStatsForTeamAsync(teamId, userId);

            if (!response.IsSuccess)
            {
                // Kullanıcı takım lideri değilse 403 Forbidden döndür
                return Forbid(response.Message);
            }

            return Ok(response.Data);
        }
    }
}
