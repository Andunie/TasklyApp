namespace TasklyApp.Services
{
    public interface IEmailTemplateService
    {
        Task<string> GetConfirmationEmailBodyAsync(string fullName, string callbackUrl);
        Task<string> GetTeamInvitationEmailBodyAsync(string teamName, string invitedUserName, string senderName, string acceptUrl);
    }
}
