using Microsoft.EntityFrameworkCore;
using TasklyApp.Data;
using TasklyApp.Dtos.Comments;
using TasklyApp.Models.Entities;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public class ActivityService : IActivityService
{
    private readonly ApplicationDbContext _context;

    public ActivityService(ApplicationDbContext context)
    {
        _context = context;
    }

    public async Task<ServiceResponse<List<ActivityFeedDto>>> GetAllMyActivitiesAsync(string userId)
    {
        var response = new ServiceResponse<List<ActivityFeedDto>>();

        // 1. Veri Çekme: Bu kullanıcının oluşturduğu TÜM aktiviteleri çek.
        //    Performans için, aktiviteleri görev bazında gruplamak yerine doğrudan çekiyoruz.
        var activitiesFromDb = await _context.TaskActivities
            .Where(a => a.UserId == userId) // Filtre: Sadece bu kullanıcının aktiviteleri
            .Include(a => a.User)           // Aktiviteyi oluşturan kullanıcı (kendisi)
            .Include(a => a.Task)           // Her aktivitenin hangi göreve ait olduğu bilgisi
            .Include(a => a.Comments)
                .ThenInclude(c => c.Author)
            .Include(a => a.Comments)
                .ThenInclude(c => c.Replies)
                    .ThenInclude(r => r.Author)
            .OrderByDescending(a => a.ActivityDate) // En yeniden eskiye sırala
            .AsNoTracking()
            .ToListAsync();

        // 2. Veri Dönüştürme: Yardımcı metodumuz bu yeni veri yapısıyla da çalışır.
        //    Ancak, ActivityFeedDto'ya görev bilgisini de eklemek faydalı olabilir.
        response.Data = MapActivitiesToFeedDto(activitiesFromDb);
        response.Message = "All user activities retrieved successfully.";

        return response;
    }

    public async Task<ServiceResponse<List<ActivityFeedDto>>> GetMyActivitiesForTaskAsync(int taskId, string userId)
    {
        var response = new ServiceResponse<List<ActivityFeedDto>>();

        // 1. Güvenlik Kontrolü: Görev var mı ve istek yapan kişi göreve atanan kişi mi?
        var task = await _context.Tasks.AsNoTracking().FirstOrDefaultAsync(t => t.Id == taskId);
        if (task == null || task.AssignedToUserId != userId)
        {
            response.IsSuccess = false;
            response.Message = "You are not authorized to view activities for this task.";
            return response;
        }

        // 2. Veri Çekme: Göreve ait, bu kullanıcının oluşturduğu tüm aktiviteleri ve
        //    ilişkili tüm yorum/cevap/yazar verilerini tek bir sorguda çek.
        var activitiesFromDb = await _context.TaskActivities
            .Where(a => a.TaskId == taskId && a.UserId == userId)
            .Include(a => a.User) // Aktiviteyi oluşturan kullanıcı
            .Include(a => a.Comments)
                .ThenInclude(c => c.Author) // Ana yorumların yazarını yükle
            .Include(a => a.Comments)
                .ThenInclude(c => c.Replies) // Ana yorumların cevaplarını yükle
                    .ThenInclude(r => r.Author) // Cevapların yazarını yükle
            .OrderByDescending(a => a.ActivityDate)
            .AsNoTracking()
            .ToListAsync();

        // 3. Veri Dönüştürme: Çekilen düz listeyi, hiyerarşik DTO'lara dönüştür.
        response.Data = MapActivitiesToFeedDto(activitiesFromDb);
        response.Message = "Activities retrieved successfully.";

        return response;
    }

    public async Task<ServiceResponse<List<ActivityFeedDto>>> GetTeamActivityFeedAsync(int teamId, string userId)
    {
        var response = new ServiceResponse<List<ActivityFeedDto>>();

        // 1. Güvenlik Kontrolü: Takım var mı ve istek yapan kullanıcı bu takımın bir üyesi mi?
        var team = await _context.Teams
            .Include(t => t.Members)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == teamId);

        if (team == null)
        {
            response.IsSuccess = false;
            response.Message = "Team not found.";
            return response;
        }

        if (!team.Members.Any(m => m.Id == userId))
        {
            response.IsSuccess = false;
            response.Message = "You are not a member of this team.";
            return response;
        }

        // 2. Veri Çekme: Bu takıma ait tüm görevleri bul ve bu görevlere ait tüm aktiviteleri çek.
        // Bu sorgu, TaskActivities tablosunda "Bu aktivitenin görevi, bizim istediğimiz teamId'ye mi ait?"
        // kontrolünü yapar.
        var activitiesFromDb = await _context.TaskActivities
            .Where(activity => activity.Task.TeamId == teamId) // <-- EN KRİTİK FİLTRELEME
            .Include(a => a.User)           // Aktiviteyi oluşturan kullanıcı
            .Include(a => a.Task)           // Aktivitenin bağlı olduğu görev
            .Include(a => a.Comments)
                .ThenInclude(c => c.Author)
            .Include(a => a.Comments)
                .ThenInclude(c => c.Replies)
                    .ThenInclude(r => r.Author)
            .OrderByDescending(a => a.ActivityDate)
            .AsNoTracking()
            .ToListAsync();

        // 3. Veri Dönüştürme: Yardımcı metodumuz bu veriyi hiyerarşik DTO'lara dönüştürecek.
        response.Data = MapActivitiesToFeedDto(activitiesFromDb);
        response.Message = "Team activity feed retrieved successfully.";

        return response;
    }

    // --- Yardımcı Metodlar ---

    /// <summary>
    /// TaskActivity listesini, hiyerarşik ActivityFeedDto listesine dönüştürür.
    /// </summary>
    private List<ActivityFeedDto> MapActivitiesToFeedDto(List<TaskActivity> activities)
    {
        var activityFeedList = new List<ActivityFeedDto>();

        foreach (var activity in activities)
        {
            var activityDto = new ActivityFeedDto
            {
                Id = activity.Id,
                Description = activity.ActivityDescription,
                ActivityDate = activity.ActivityDate,
                TaskId = activity.Task.Id, // <-- YENİ
                TaskTitle = activity.Task.Title, // <-- YENİ
                UserId = activity.User.Id,
                UserName = activity.User.FullName,
                UserAvatarUrl = null, // İleride eklenebilir
                ImageUrl = activity.ImageUrl,
            };

            // Aktivitenin tüm yorumlarını al ve sadece ana yorumları (parent'ı olmayanları) bul.
            var allCommentsForActivity = activity.Comments.ToList();
            var topLevelComments = allCommentsForActivity.Where(c => c.ParentCommentId == null);

            foreach (var topLevelComment in topLevelComments)
            {
                // Her ana yorum için hiyerarşiyi oluştur ve DTO'ya ekle.
                activityDto.Comments.Add(MapCommentToCommentDto(topLevelComment, allCommentsForActivity));
            }

            activityFeedList.Add(activityDto);
        }

        return activityFeedList;
    }

    /// <summary>
    /// Tek bir TaskComment entity'sini ve onun alt cevaplarını özyinelemeli (recursive) olarak
    /// CommentFeedDto'ya dönüştürür.
    /// </summary>
    private CommentFeedDto MapCommentToCommentDto(TaskComment comment, List<TaskComment> allComments)
    {
        var commentDto = new CommentFeedDto
        {
            Id = comment.Id,
            Content = comment.Content,
            CreatedAt = comment.CreatedAt,
            AuthorId = comment.Author.Id,
            AuthorName = comment.Author.FullName,
            AuthorAvatarUrl = null // İleride eklenebilir
        };

        // Bu yoruma ait cevapları bul
        var replies = allComments.Where(c => c.ParentCommentId == comment.Id);

        foreach (var reply in replies)
        {
            // Her bir cevap için aynı işlemi tekrarla (özyineleme)
            commentDto.Replies.Add(MapCommentToCommentDto(reply, allComments));
        }

        return commentDto;
    }
}