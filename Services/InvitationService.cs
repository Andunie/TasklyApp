using Microsoft.EntityFrameworkCore;
using TasklyApp.Data;
using TasklyApp.Models.Enums;
using TasklyApp.Utilities;

namespace TasklyApp.Services
{
    public class InvitationService : IInvitationService
    {
        private readonly ApplicationDbContext _context;

        public InvitationService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ServiceResponse<string>> AcceptInvitationAsync(Guid token)
        {
            var response = new ServiceResponse<string>();

            var invitation = await _context.Invitations
                .Include(i => i.Team)
                    .ThenInclude(t => t.Members)
                .Include(i => i.InvitedUser)
                .FirstOrDefaultAsync(i => i.Token == token && i.Status == InvitationStatus.Pending);

            if (invitation == null)
            {
                response.IsSuccess = false;
                response.Message = "Invalid or expired invitation token.";
                return response;
            }

            if (invitation.Team.Members.Any(m => m.Id == invitation.InvitedUserId))
            {
                invitation.Status = InvitationStatus.Accepted;
                await _context.SaveChangesAsync();

                response.Message = "You are already a member of this team.";
                return response;
            }

            invitation.Team.Members.Add(invitation.InvitedUser);
            invitation.Status = InvitationStatus.Accepted;

            await _context.SaveChangesAsync();

            response.Message = $"Welcome! You have successfully joined the '{invitation.Team.Name}' team.";
            response.Data = invitation.TeamId.ToString(); // İleride yönlendirme için takım ID'sini dönebiliriz.
            return response;
        }
    }
}
