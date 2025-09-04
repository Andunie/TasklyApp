using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using TasklyApp.Data;
using TasklyApp.Dtos.Teams;
using TasklyApp.Models.Entities;
using TasklyApp.Models.Enums;
using TasklyApp.Services;

namespace TasklyApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TeamsController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<User> _userManager;
        private readonly IEmailTemplateService _templateService;
        private readonly IEmailService _emailService;

        public TeamsController(ApplicationDbContext context, UserManager<User> userManager, IEmailTemplateService templateService, IEmailService emailService)
        {
            _context = context;
            _userManager = userManager;
            _templateService = templateService;
            _emailService = emailService;
        }

        // GET: api/teams
        [HttpGet]
        public async Task<IActionResult> GetMyTeams()
        {
            // Token'dan gelen kullanıcı kimliğini (ID) alıyoruz.
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            // Kullanıcının üye olduğu takımları veritabanından buluyoruz.
            var teams = await _context.Teams
                .Where(t => t.Members.Any(m => m.Id == userId))
                .Select(t => new TeamDto // DTO'ya dönüştürüyoruz
                {
                    Id = t.Id,
                    Name = t.Name,
                    CreatedAt = t.CreatedAt,
                    MemberEmails = t.Members.Select(m => m.Email).ToList()
                })
                .AsNoTracking().ToListAsync();

            return Ok(teams);
        }

        // POST: api/teams
        [HttpPost]
        public async Task<IActionResult> CreateTeam([FromBody] CreateTeamDto createTeamDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentUser = await _userManager.FindByIdAsync(userId);
            if (currentUser == null)
            {
                return Unauthorized();
            }

            var team = new Team
            {
                Name = createTeamDto.Name,
                CreatedAt = DateTime.UtcNow,
                TeamLeadId = currentUser.Id, // Takım lideri olarak şu anki kullanıcıyı atıyoruz
            };

            // Takımı oluşturan kişiyi otomatik olarak ilk üye yapıyoruz.
            team.Members.Add(currentUser);

            await _context.Teams.AddAsync(team);
            await _context.SaveChangesAsync();

            // Oluşturulan takımı göstermek için GetMyTeams'deki gibi bir DTO döndürebiliriz.
            var teamDto = new TeamDto
            {
                Id = team.Id,
                Name = team.Name,
                CreatedAt = team.CreatedAt,
                MemberEmails = new List<string> { currentUser.Email }
            };

            return CreatedAtAction(nameof(GetMyTeams), new { id = team.Id }, teamDto);
        }

        // POST: api/teams/{teamId}/invite
        [HttpPost("{teamId}/invite")]
        public async Task<IActionResult> InviteMemberToTeam(int teamId, [FromBody] AddMemberDto addMemberDto)
        {
            // 1. Gerekli varlıkları bul (Takım, Davet eden kullanıcı, Davet edilen kullanıcı)
            var team = await _context.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == teamId);
            if (team == null) return NotFound(new { Message = "Team not found." });

            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            var currentUser = await _userManager.FindByIdAsync(currentUserId);
            if (currentUser == null) return Unauthorized();

            var userToInvite = await _userManager.FindByEmailAsync(addMemberDto.Email);
            if (userToInvite == null) return NotFound(new { Message = $"User with email '{addMemberDto.Email}' not found." });

            // 2. Mantıksal kontroller
            if (!team.Members.Any(m => m.Id == currentUserId))
                return Forbid(); // Kullanıcı bu takımın üyesi değilse davet gönderemez.

            if (team.Members.Any(m => m.Id == userToInvite.Id))
                return BadRequest(new { Message = "User is already a member of this team." });

            var existingInvitation = await _context.Invitations
                .FirstOrDefaultAsync(i => i.TeamId == teamId && i.InvitedUserId == userToInvite.Id && i.Status == InvitationStatus.Pending);
            if (existingInvitation != null)
                return BadRequest(new { Message = "This user already has a pending invitation for this team." });

            // 3. Davet oluştur ve veritabanına kaydet
            var invitation = new Invitation
            {
                TeamId = teamId,
                InvitedUserId = userToInvite.Id,
                SentByUserId = currentUser.Id
            };

            await _context.Invitations.AddAsync(invitation);
            await _context.SaveChangesAsync();

            // 4. E-posta gönderimi için URL'leri ve gövdeyi hazırla
            try
            {
                // Bu URL, daveti kabul edecek olan endpoint'i işaret ediyor.
                // Bunu bir sonraki adımda yazacağımız 'InvitationsController'da oluşturacağız.
                var acceptUrl = Url.Action("Accept", "Invitations", new { token = invitation.Token }, Request.Scheme);

                var emailBody = await _templateService.GetTeamInvitationEmailBodyAsync(
                    team.Name,
                    userToInvite.FullName,
                    currentUser.FullName,
                    acceptUrl
                );

                await _emailService.SendEmailAsync(
                    userToInvite.Email,
                    $"Taskly'de '{team.Name}' Takımına Davet Edildiniz",
                    emailBody
                );
            }
            catch (Exception ex)
            {
                // Hata durumunda loglama yapılabilir. Davet yine de veritabanında kalır.
                // _logger.LogError(ex, "Failed to send team invitation email.");
                return StatusCode(500, new { Message = "Invitation created, but failed to send email." });
            }

            return Ok(new { Message = $"Invitation sent successfully to {userToInvite.Email}." });
        }

        // GET: api/teams/{teamId}/members
        [HttpGet("{teamId}/members")]
        public async Task<IActionResult> GetTeamMembers(int teamId)
        {
            // 1. Güvenlik ve veri çekme: İsteği yapan kullanıcının kimliğini al.
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // 2. İstenen takımı ve üyelerini veritabanından çek.
            // AsNoTracking() kullanıyoruz çünkü bu sadece bir okuma işlemi, performansı artırır.
            var team = await _context.Teams
                .Include(t => t.Members)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == teamId);

            // 3. Takım bulunamazsa 404 Not Found hatası döndür.
            if (team == null)
            {
                return NotFound(new { Message = "Team not found." });
            }

            // 4. GÜVENLİK KONTROLÜ: İsteği yapan kullanıcı, bu takımın bir üyesi mi?
            // Kullanıcıların üyesi olmadıkları takımların bilgilerini görmesini engeller.
            if (!team.Members.Any(m => m.Id == currentUserId))
            {
                // 403 Forbidden: Kullanıcı kimliği doğrulanmış ama bu kaynağa erişim yetkisi yok.
                return Forbid();
            }

            // 5. Takım üyelerini TeamMemberDto'ya dönüştür.
            var membersDto = team.Members.Select(member => new TeamMemberDto
            {
                Id = member.Id,
                FullName = member.FullName,
                Email = member.Email
            }).ToList();

            // 6. Başarılı yanıt olarak üye listesini döndür.
            return Ok(membersDto);
        }

        // GET: api/teams/5
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTeamById(int id)
        {
            var currentUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // 1. Takımı, liderini (TeamLeader) ve üyelerini (Members) birlikte çek.
            var team = await _context.Teams
                .Include(t => t.TeamLeader)
                .Include(t => t.Members)
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == id);

            if (team == null)
            {
                return NotFound(new { Message = "Team not found." });
            }

            // 2. Güvenlik Kontrolü: İsteği yapan kullanıcı bu takımın bir üyesi mi?
            if (!team.Members.Any(m => m.Id == currentUserId))
            {
                return Forbid(); // 403 Forbidden
            }

            // 3. Veriyi yeni TeamDetailDto'ya dönüştür.
            var teamDetailDto = new TeamDetailDto
            {
                Id = team.Id,
                Name = team.Name,
                TeamLeadId = team.TeamLeadId,
                TeamLeadName = team.TeamLeader?.FullName ?? "N/A",
                Members = team.Members.Select(member => new TeamMemberDto
                {
                    Id = member.Id,
                    FullName = member.FullName,
                    Email = member.Email
                }).ToList()
            };

            return Ok(teamDetailDto);
        }
    }
}
