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
            var intent = await DetermineIntent(question);

            // RAG (Retrieval-Augmented Generation) Prensibi:
            // 1. Veriyi Çek (Retrieval)
            // 2. Veriyle Prompt Oluştur ve Cevap Üret (Generation)
            string dataContext = await RetrieveDataContext(intent, userId, teamId);

            string finalPrompt = BuildPrompt(question, dataContext);

            // Mevcut IAIService'inizdeki Gemini'ı çağıran metodu kullanın.
            // Bu metodun adının GenerateTextAsync olduğunu varsayıyorum.
            return await _aiService.GenerateTextAsync(finalPrompt);
        }

        private async Task<AssistantIntent> DetermineIntent(string question)
        {
            // 1. Yapay zekaya sunacağımız seçenekleri (enum isimlerini) hazırlıyoruz.
            var intentOptions = string.Join(", ", Enum.GetNames(typeof(AssistantIntent)));

            // 2. Yapay zeka için özel bir "sınıflandırma prompt'u" oluşturuyoruz.
            var classificationPrompt = $"""
                You are an expert at classifying user requests. Analyze the user's question and determine the single most relevant category from the following list.
                Your response must be ONLY ONE WORD from this list, with no extra text or punctuation.

                Categories: [{intentOptions}]

                User Question: "{question}"

                Most Relevant Category:
                """;

            // 3. Yapay zekadan sınıflandırma yapmasını istiyoruz.
            string intentAsString = await _aiService.GenerateTextAsync(classificationPrompt);

            // 4. Gelen cevabı temizleyip enum'a çevirmeye çalışıyoruz.
            // Enum.TryParse, büyük/küçük harf duyarsız bir şekilde string'i enum'a çevirir.
            if (Enum.TryParse<AssistantIntent>(intentAsString.Trim(), true, out var determinedIntent))
            {
                return determinedIntent;
            }

            // Eğer yapay zeka beklenmedik bir cevap verirse (boşluk, açıklama vb.),
            // güvenli bir varsayılan değere dönüyoruz.
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

                case AssistantIntent.UpcomingDeadlines:
                    var upcomingTasks = await tasksQuery
                        .Where(t => t.Status != Task_Status.Done && t.Status != Task_Status.Cancelled && t.DueDate > DateTime.UtcNow && t.DueDate <= DateTime.UtcNow.AddDays(7))
                        .OrderBy(t => t.DueDate)
                        .Select(t => new { t.Title, t.DueDate, AssigneeName = t.AssignedTo.FullName ?? "Atanmamış" })
                        .Take(10)
                        .ToListAsync();

                    if (!upcomingTasks.Any()) return "Önümüzdeki 7 gün içinde teslim tarihi yaklaşan bir görev bulunmuyor.";

                    sb.AppendLine("Önümüzdeki 7 gün içinde teslim tarihi yaklaşan görevler:");
                    upcomingTasks.ForEach(t => sb.AppendLine($"- '{t.Title}' görevi ({t.AssigneeName}). Son tarih: {t.DueDate:dd MMMM}"));
                    break;

                case AssistantIntent.RecentCompletions:
                    var recentTasks = await tasksQuery
                        .Where(t => t.Status == Task_Status.Done && t.CompletedAt.HasValue && t.CompletedAt >= DateTime.UtcNow.AddDays(-7))
                        .OrderByDescending(t => t.CompletedAt)
                        .Select(t => new { t.Title, CompletedDate = t.CompletedAt.Value, AssigneeName = t.AssignedTo.FullName ?? "Atanmamış" })
                        .Take(10)
                        .ToListAsync();

                    if (!recentTasks.Any()) return "Son 7 gün içinde tamamlanmış bir görev bulunmuyor.";

                    sb.AppendLine("Son 7 gün içinde tamamlanan görevler:");
                    recentTasks.ForEach(t => sb.AppendLine($"- '{t.Title}' görevi ({t.AssigneeName}) {t.CompletedDate:dd MMMM} tarihinde tamamlandı."));
                    break;

                case AssistantIntent.HighPriorityTasks:
                    var highPriorityTasks = await tasksQuery
                        .Where(t => (t.Priority == PriortyLevel.High || t.Priority == PriortyLevel.Urgent) && t.Status != Task_Status.Done && t.Status != Task_Status.Cancelled)
                        .OrderBy(t => t.DueDate)
                        .Select(t => new { t.Title, t.Priority, AssigneeName = t.AssignedTo.FullName ?? "Atanmamış" })
                        .Take(10)
                        .ToListAsync();

                    if (!highPriorityTasks.Any()) return "Yüksek veya kritik önceliğe sahip aktif bir görev bulunmuyor.";

                    sb.AppendLine("Yüksek ve kritik öncelikli aktif görevler:");
                    highPriorityTasks.ForEach(t => sb.AppendLine($"- '{t.Title}' görevi ({t.AssigneeName}), Öncelik: {t.Priority}"));
                    break;

                // Eklemeleri yapıldıktan sonra bu kısımlar doldurulabilir.


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
