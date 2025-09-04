using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TasklyApp.Data;
using TasklyApp.Services;

namespace TasklyApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class CalendarController : ControllerBase
    {
        private readonly ICalendarService _calendarService;
        private readonly ApplicationDbContext _context;

        public CalendarController(ICalendarService calendarService, ApplicationDbContext context)
        {
            _calendarService = calendarService;
            _context = context;
        }
            
        // GET: api/calendar/team-tasks?teamId=1
        [HttpGet("team-tasks")]
        public async Task<IActionResult> GetTeamTasksForCalendar([FromQuery] int teamId, [FromQuery] DateTime startDate, [FromQuery] DateTime endDate)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // endDate'i, belirtilen günün sonunu (23:59:59.999...) kapsayacak şekilde bir sonraki günün 00:00:00'ına ayarlıyoruz.
            // Örneğin, endDate 31.08.2025 00:00:00 ise, adjustedEndDate 01.09.2025 00:00:00 olacak.
            // Bu, servis katmanında '< adjustedEndDate' sorgusu ile 31.08.2025'in tamamının alınmasını sağlar.
            var adjustedEndDate = endDate.Date.AddDays(1); // .Date ile saati sıfırlayıp öyle ekliyoruz.

            // Lider miyiz? Bu bilgiyi servise göndereceğiz.
            var isTeamLead = await _context.Teams.AnyAsync(t => t.Id == teamId && t.TeamLeadId == userId);

            var response = await _calendarService.GetTasksForCalendarAsync(teamId, userId, isTeamLead, startDate, endDate);

            if (!response.IsSuccess)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { Message = response.Message });
            }

            return Ok(response.Data);
        }
    }
}
