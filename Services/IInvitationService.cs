using TasklyApp.Utilities;

namespace TasklyApp.Services
{
    public interface IInvitationService
    {
        Task<ServiceResponse<string>> AcceptInvitationAsync(Guid token);
    }
}
