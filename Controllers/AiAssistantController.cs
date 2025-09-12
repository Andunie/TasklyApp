using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TasklyApp.Dtos.AI;
using TasklyApp.Services;

namespace TasklyApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AiAssistantController : ControllerBase
    {
        private readonly IAssistantService _assistantService;

        public AiAssistantController(IAssistantService assistantService)
        {
            _assistantService = assistantService;
        }

        [HttpPost("ask")]
        public async Task<IActionResult> Ask([FromBody] AskAssistantRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Question))
            {
                return BadRequest("Soru boş olamaz.");
            }

            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var response = await _assistantService.GetResponseAsync(request.Question, userId, request.TeamId);

            return Ok(new { Answer = response });
        }
    }
}
