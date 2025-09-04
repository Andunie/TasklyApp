using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using TasklyApp.Services;

namespace TasklyApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class InvitationsController : ControllerBase
    {
        private readonly IInvitationService _invitationService;


        public InvitationsController(IInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        // GET: api/invitations/accept?token=...
        [HttpGet("accept")]
        public async Task<IActionResult> Accept([FromQuery] Guid token)
        {
            var response = await _invitationService.AcceptInvitationAsync(token);

            if (!response.IsSuccess)
            {
                // Servisten gelen hata mesajını doğrudan BadRequest olarak döndür.
                return BadRequest(new { response.Message });
            }

            // Servisten gelen başarı mesajını Ok olarak döndür.
            return Ok(new { response.Message });
        }
    }
}