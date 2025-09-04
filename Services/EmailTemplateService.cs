namespace TasklyApp.Services
{
    public class EmailTemplateService : IEmailTemplateService
    {
        public async Task<string> GetConfirmationEmailBodyAsync(string fullName, string callbackUrl)
        {
            // Şablon dosyasının yolunu belirliyoruz.
            var templatePath = Path.Combine(AppContext.BaseDirectory, "EmailTemplates", "ConfirmAccount.html");

            if (!File.Exists(templatePath))
            {
                // Hata yönetimi: Şablon bulunamazsa ne olacak?
                throw new FileNotFoundException("Email template not found.", templatePath);
            }

            // Dosyayı oku
            var template = await File.ReadAllTextAsync(templatePath);

            // Placeholder'ları gerçek değerlerle değiştir
            template = template.Replace("{FullName}", fullName);
            template = template.Replace("{CallbackUrl}", callbackUrl);
            template = template.Replace("{Year}", DateTime.Now.Year.ToString());

            return template;
        }

        public async Task<string> GetTeamInvitationEmailBodyAsync(string teamName, string invitedUserName, string senderName, string acceptUrl)
        {
            var templatePath = Path.Combine(AppContext.BaseDirectory, "EmailTemplates", "TeamInvitation.html");
            if (!File.Exists(templatePath))
            {
                throw new FileNotFoundException("Team invitation email template not found.", templatePath);
            }

            var template = await File.ReadAllTextAsync(templatePath);

            // Placeholder'ları doldur
            template = template.Replace("{TeamName}", teamName);
            template = template.Replace("{InvitedUserName}", invitedUserName);
            template = template.Replace("{SenderName}", senderName);
            template = template.Replace("{AcceptUrl}", acceptUrl);
            template = template.Replace("{Year}", DateTime.Now.Year.ToString());

            return template;
        }
    }
}
