using Microsoft.EntityFrameworkCore;
using System.Linq;
using System.Text;
using TasklyApp.Data;
using TasklyApp.Models.Entities;
using TasklyApp.Models.Enums;

namespace TasklyApp.Services
{
    public class AssistantService : IAssistantService
    {
        private readonly ApplicationDbContext _context;
        private readonly IAIService _aiService; // Mevcut AI servisinizi kullanıyoruz

        public AssistantService(ApplicationDbContext context, IAIService aiService)
        {
            _context = context;
            _aiService = aiService;
        }

        public async Task<string> GetResponseAsync(string question, string userId, int? teamId)
        {
            var intent = DetermineIntent(question);

            // RAG (Retrieval-Augmented Generation) Prensibi:
            // 1. Veriyi Çek (Retrieval)
            // 2. Veriyle Prompt Oluştur ve Cevap Üret (Generation)
            string dataContext = await RetrieveDataContext(intent, userId, teamId);

            string finalPrompt = BuildPrompt(question, dataContext);

            // Mevcut IAIService'inizdeki Gemini'ı çağıran metodu kullanın.
            // Bu metodun adının GenerateTextAsync olduğunu varsayıyorum.
            return await _aiService.GenerateTextAsync(finalPrompt);
        }

        private AssistantIntent DetermineIntent(string question)
        {
            var q = question.ToLowerInvariant();

            if (q.Contains("en aktif") || q.Contains("en çok çalışan") || q.Contains("en meşgul") || q.Contains("en çok görev"))
            {
                return AssistantIntent.MostActiveUser;
            }
            if (q.Contains("vadesi geçmiş") || q.Contains("gecikmiş görevler") || q.Contains("gecikti mi"))
            {
                return AssistantIntent.OverdueTasks;
            }

            return AssistantIntent.Unknown;
        }

        private async Task<string> RetrieveDataContext(AssistantIntent intent, string userId, int? teamId)
        {
            IQueryable<ProjectTask> tasksQuery = _context.Tasks;

            if (teamId.HasValue)
            {
                // Belirli bir takım seçiliyse, sadece o takımdaki görevleri sorgula
                tasksQuery = _context.Tasks.Where(t => t.TeamId == teamId.Value);
            }
            else
            {
                // Takım seçili değilse, kullanıcının üye olduğu TÜM takımlardaki görevleri sorgula
                var userTeamIds = await _context.Users
                    .Where(u => u.Id == userId)
                    .SelectMany(u => u.Teams.Select(t => t.Id))
                    .ToListAsync();

                if (!userTeamIds.Any())
                {
                    return "Kullanıcı hiçbir takıma ait değil.";
                }
                tasksQuery = _context.Tasks.Where(t => userTeamIds.Contains(t.TeamId.Value));
            }


            var sb = new StringBuilder();
            switch (intent)
            {
                case AssistantIntent.MostActiveUser:
                    var userTaskCounts = await tasksQuery
                        .Where(t => t.Status != Task_Status.Done && t.Status != Task_Status.Cancelled && t.AssignedToUserId != null)
                        .GroupBy(t => t.AssignedTo.FullName)
                        .Select(g => new { UserName = g.Key, TaskCount = g.Count() })
                        .OrderByDescending(x => x.TaskCount)
                        .Take(5)
                        .ToListAsync();

                    if (!userTaskCounts.Any()) return "Analiz edilecek aktif görev bulunmuyor.";

                    sb.AppendLine("Takımdaki en aktif (üzerinde en çok atanmış görev olan) kişiler:");
                    userTaskCounts.ForEach(u => sb.AppendLine($"- {u.UserName}: {u.TaskCount} aktif görev"));
                    break;

                case AssistantIntent.OverdueTasks:
                    var overdueTasks = await tasksQuery
                        .Where(t => t.DueDate < DateTime.UtcNow && t.Status != Task_Status.Done && t.Status != Task_Status.Cancelled)
                        .OrderBy(t => t.DueDate)
                        .Select(t => new { t.Title, t.DueDate, AssigneeName = t.AssignedTo.FullName })
                        .Take(10)
                        .ToListAsync();

                    if (!overdueTasks.Any()) return "Vadesi geçmiş hiçbir görev bulunmuyor.";

                    sb.AppendLine("Vadesi geçmiş görevlerin listesi:");
                    overdueTasks.ForEach(t => sb.AppendLine($"- '{t.Title}' görevi ({t.AssigneeName}). Son tarih: {t.DueDate:dd MMMM}"));
                    break;

                default: // Unknown Intent
                    sb.AppendLine("Kullanıcıya genel bilgi ver. İşte mevcut takım(lar) hakkında bazı temel istatistikler:");
                    var totalTasks = await tasksQuery.CountAsync();
                    var completedTasks = await tasksQuery.CountAsync(t => t.Status == Task_Status.Done);
                    sb.AppendLine($"- Toplam Görev Sayısı: {totalTasks}");
                    sb.AppendLine($"- Tamamlanmış Görev Sayısı: {completedTasks}");
                    break;
            }

            return sb.ToString();
        }

        private string BuildPrompt(string question, string dataContext)
        {
            return $"""
            Sen TasklyApp içinde çalışan, TasklyAI adında yardımsever bir proje yönetimi asistanısın.
            Sana aşağıda bir veri özeti ve kullanıcının sorusu verilecek.
            Bu veriyi kullanarak, kullanıcıya sanki bir insan gibi, doğal ve samimi bir dilde cevap ver.
            Cevabında "Sana verilen bilgiye göre..." gibi ifadeler KULLANMA. Doğrudan veriyi yorumlayarak konuş.
            
            --- VERİ ÖZETİ ---
            {dataContext}
            --- BİTTİ ---
            
            Kullanıcının Sorusu: "{question}"
            
            Cevabın:
            """;
        }
    }
}
