using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using TasklyApp.Data;
using TasklyApp.Dtos.Tasks;
using TasklyApp.Hubs;
using TasklyApp.Models.Entities;
using TasklyApp.Models.Enums;
using TasklyApp.Utilities;

namespace TasklyApp.Services;
public class TaskService : ITaskService
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<User> _userManager;
    private readonly IFileService _fileService;
    private readonly IHubContext<NotificationHub> _hubContext;
    private readonly INotificationService _notificationService;

    public TaskService(ApplicationDbContext context, UserManager<User> userManager, IFileService fileService, IHubContext<NotificationHub> hubContext, INotificationService notificationService)
    {
        _context = context;
        _userManager = userManager;
        _fileService = fileService;
        _hubContext = hubContext;
        _notificationService = notificationService;
    }

    public async Task<ServiceResponse<TaskDto>> ApproveTaskAsync(int taskId, string userId)
    {
        var response = new ServiceResponse<TaskDto>();
        var task = await _context.Tasks.Include(t => t.Team).FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null) 
        {
            response.IsSuccess = false;
            response.Message = "Task not found.";
            return response;
        }

        // Güvenlik: Sadece takım lideri onaylayabilir.
        if (task.Team.TeamLeadId != userId)
        {
            response.IsSuccess = false;
            response.Message = "Only the team lead can approve tasks.";
            return response;
        }

        // İş Kuralı: Görev sadece "InReview" durumundaysa onaylanabilir.
        if (task.Status != Task_Status.InReview)
        {
            response.IsSuccess = false;
            response.Message = "Task must be in 'In Review' status to be approved.";
            return response;
        }

        task.Status = Task_Status.Done;
        await _context.SaveChangesAsync();

        var leader = await _userManager.FindByIdAsync(userId);
        var message = $"Your task '{task.Title}' has been approved by {leader.FullName}.";
        var link = $"/tasks/{task.Id}";
        await _notificationService.CreateAndSendNotificationsAsync(
            new List<string> { task.AssignedToUserId },
            userId,
            message,
            link);

        response.Message = "Task approved and marked as Done.";
        return response;
    }

    public async Task<ServiceResponse<TaskDto>> CreateTaskAsync(CreateTaskDto createTaskDto, string creatorUserId)
    {
        var response = new ServiceResponse<TaskDto>();

        // 1. Gerekli varlıkları ve ilişkileri kontrol et
        var team = await _context.Teams.Include(t => t.Members).FirstOrDefaultAsync(t => t.Id == createTaskDto.TeamId);
        if (team == null)
        {
            response.IsSuccess = false;
            response.Message = "Team not found.";
            return response;
        }

        // 2. Güvenlik: Görevi oluşturan kişi, o takımın üyesi mi?
        if (!team.Members.Any(m => m.Id == creatorUserId))
        {
            response.IsSuccess = false;
            response.Message = "You are not authorized to create a task for this team.";
            return response;
        }

        // 3. Güvenlik: Görev atanan kişi, o takımın üyesi mi?
        var assignedUser = await _userManager.FindByIdAsync(createTaskDto.AssignedToUserId);
        if (assignedUser == null || !team.Members.Any(m => m.Id == assignedUser.Id))
        {
            response.IsSuccess = false;
            response.Message = "The user you are trying to assign the task to is not a member of this team.";
            return response;
        }

        // 4. Yeni görev nesnesini oluştur
        var newTask = new ProjectTask
        {
            Title = createTaskDto.Title,
            Description = createTaskDto.Description,
            StartDate = createTaskDto.StartDate,
            DueDate = createTaskDto.DueDate,
            Priority = createTaskDto.Priority,
            Status = Models.Enums.Task_Status.ToDo, // Varsayılan durum
            CreatedAt = DateTime.UtcNow,
            TeamId = createTaskDto.TeamId,
            AssignedToUserId = createTaskDto.AssignedToUserId
        };

        // 5. Veritabanına ekle ve kaydet
        await _context.Tasks.AddAsync(newTask);
        await _context.SaveChangesAsync();

        // 6. --- EN TEMİZ SİGNALR MANTIĞI ---

        // Kural: Bir kişi bir görevi başkasına atıyorsa, atanan kişiye bildirim gönder.
        // Liderin görevi kendisine ataması durumunda bildirim gönderilmez.
        var creator = await _userManager.FindByIdAsync(creatorUserId);
        var message = $"{creator.FullName} assigned you a new task: '{newTask.Title}'.";
        var link = $"/tasks/{newTask.Id}";
        await _notificationService.CreateAndSendNotificationsAsync(
            new List<string> { newTask.AssignedToUserId },
            creatorUserId,
            message,
            link);

        // 7. Başarılı yanıtı hazırla (TaskDto'ya dönüştürerek)
        response.Data = new TaskDto
        {
            Id = newTask.Id,
            Title = newTask.Title,
            Description = newTask.Description,
            StartDate = newTask.StartDate,
            DueDate = newTask.DueDate,
            Priority = newTask.Priority,
            Status = newTask.Status,
            CreatedAt = newTask.CreatedAt,
            TeamId = team.Id,
            TeamName = team.Name,
            TeamLeadId = team.TeamLeadId,
            AssignedToUserId = assignedUser.Id,
            AssignedToUserName = assignedUser.FullName
        };
        response.Message = "Task created successfully.";

        return response;
    }

    public async Task<ServiceResponse<List<TaskDto>>> GetMyTasksAsync(string userId, TaskFilterDto filters)
    {
        var response = new ServiceResponse<List<TaskDto>>();

        // 1. Temel sorguyu IQueryable olarak başlat.
        var query = _context.Tasks
            .Where(t => t.AssignedToUserId == userId)
            .AsQueryable();

        // 2. Filtreleri dinamik olarak uygula.
        if (!string.IsNullOrWhiteSpace(filters.SearchTerm))
        {
            var searchTerm = filters.SearchTerm.ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(searchTerm) || (t.Description != null && t.Description.ToLower().Contains(searchTerm)));
        }
        if (filters.Priority.HasValue)
        {
            query = query.Where(t => t.Priority == filters.Priority.Value);
        }
        // (assigneeId filtresi burada anlamsız)

        // 3. Filtrelenmiş sorguyu çalıştır ve DTO'ya dönüştür.
        var tasks = await query
            .Include(t => t.Team)
            .Include(t => t.AssignedTo)
            .AsNoTracking()
            .OrderBy(t => t.DueDate)
            .Select(task => new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                StartDate = task.StartDate,
                DueDate = task.DueDate,
                Priority = task.Priority,
                Status = task.Status,
                CreatedAt = task.CreatedAt,
                TeamId = task.Team.Id,
                TeamName = task.Team.Name,
                TeamLeadId = task.Team.TeamLeadId,
                AssignedToUserId = task.AssignedTo.Id,
                AssignedToUserName = task.AssignedTo.FullName
            })
            .ToListAsync();

        response.Data = tasks;
        return response;
    }

    public async Task<ServiceResponse<TaskDto>> GetTaskByIdAsync(int taskId, string userId)
    {
        var response = new ServiceResponse<TaskDto>();

        var task = await _context.Tasks
            .Include(t => t.Team)
                .ThenInclude(team => team.Members) // Güvenlik kontrolü için üyeleri de yüklüyoruz
            .Include(t => t.AssignedTo)
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            response.IsSuccess = false;
            response.Message = "Task not found.";
            return response;
        }

        // Güvenlik Kontrolü: İsteği yapan kullanıcı, bu görevin ait olduğu takımın bir üyesi mi?
        if (!task.Team.Members.Any(m => m.Id == userId))
        {
            response.IsSuccess = false;
            response.Message = "You are not authorized to view this task.";
            return response;
        }

        // Görevi TaskDto'ya dönüştür
        response.Data = new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            StartDate = task.StartDate,
            DueDate = task.DueDate,
            Priority = task.Priority,
            Status = task.Status,
            CreatedAt = task.CreatedAt,
            TeamId = task.Team.Id,
            TeamName = task.Team.Name,
            TeamLeadId = task.Team.TeamLeadId,
            AssignedToUserId = task.AssignedTo.Id,
            AssignedToUserName = task.AssignedTo.FullName
        };

        return response;
    }

    public async Task<ServiceResponse<List<TaskDto>>> GetTeamTasksForLeaderAsync(string userId, TaskFilterDto filters)
    {
        var response = new ServiceResponse<List<TaskDto>>();
        var ledTeamIds = await _context.Teams
            .Where(t => t.TeamLeadId == userId)
            .Select(t => t.Id)
            .ToListAsync();

        if (!ledTeamIds.Any())
        {
            response.Data = new List<TaskDto>();
            return response;
        }

        // 1. Temel sorguyu IQueryable olarak başlat.
        var query = _context.Tasks
            .Where(t => t.TeamId.HasValue && ledTeamIds.Contains(t.TeamId.Value))
            .AsQueryable();

        // 2. Filtreleri dinamik olarak uygula.
        if (!string.IsNullOrWhiteSpace(filters.SearchTerm))
        {
            query = query.Where(t => t.Title.ToLower().Contains(filters.SearchTerm));
        }
        if (filters.Priority.HasValue)
        {
            query = query.Where(t => t.Priority == filters.Priority.Value);
        }
        if (!string.IsNullOrWhiteSpace(filters.AssigneeId))
        {
            query = query.Where(t => t.AssignedToUserId == filters.AssigneeId);
        }

        // 3. Filtrelenmiş sorguyu çalıştır ve DTO'ya dönüştür.
        var tasks = await query
            .Include(t => t.Team)
            .Include(t => t.AssignedTo)
            .AsNoTracking()
            .OrderBy(t => t.Status).ThenBy(t => t.DueDate)
            .Select(task => new TaskDto
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                StartDate = task.StartDate,
                DueDate = task.DueDate,
                Priority = task.Priority,
                Status = task.Status,
                CreatedAt = task.CreatedAt,
                TeamId = task.Team.Id,
                TeamName = task.Team.Name,
                TeamLeadId = task.Team.TeamLeadId,
                AssignedToUserId = task.AssignedTo.Id,
                AssignedToUserName = task.AssignedTo.FullName
            })
            .ToListAsync();

        response.Data = tasks;
        return response;
    }

    public async Task<ServiceResponse<TaskActivityDto>> LogActivityForTaskAsync(int taskId, string userId, LogActivityDto dto)
    {
        var response = new ServiceResponse<TaskActivityDto>();
        var task = await _context.Tasks.FindAsync(taskId);

        if (task == null || task.AssignedToUserId != userId)
        {
            response.IsSuccess = false;
            response.Message = "You are not authorized to log an activity for this task.";
            return response;
        }

        // --- YENİ MANTIK BURADA BAŞLIYOR ---

        // 1. Dosya varsa, IFileService kullanarak kaydet ve yolunu al.
        string imageUrl = null;
        if (dto.ImageFile != null)
        {
            // Varsayımsal olarak IFileService'in bu metodu var.
            imageUrl = await _fileService.SaveActivityImageAsync(dto.ImageFile);
        }

        // 2. Aktiviteyi, hem açıklama hem de resim yolu ile oluştur.
        var activity = new TaskActivity
        {
            TaskId = taskId,
            UserId = userId,
            ActivityDescription = dto.Description,
            ImageUrl = imageUrl // <-- Yeni alan burada kullanılıyor.
        };

        await _context.TaskActivities.AddAsync(activity);
        await _context.SaveChangesAsync();

        // 3. Dönen DTO'yu da yeni bilgilerle doldur.
        var user = await _userManager.FindByIdAsync(userId);
        response.Data = new TaskActivityDto
        {
            Id = activity.Id,
            Description = activity.ActivityDescription,
            ActivityDate = activity.ActivityDate,
            UserId = activity.UserId,
            UserName = user.FullName,
            ImageUrl = activity.ImageUrl // <-- Frontend'e resim yolunu gönder.
        };
        response.Message = "Activity logged successfully.";
        return response;
    }

    // Görev reddetme işlemi
    public async Task<ServiceResponse<TaskDto>> ReopenTaskAsync(int taskId, string userId, ReopenTaskDto reopenDto)
    {
        var response = new ServiceResponse<TaskDto>();
        var task = await _context.Tasks.Include(t => t.Team).FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            response.IsSuccess = false;
            response.Message = "Task not found.";
            return response;
        }

        // Güvenlik: Sadece takım lideri geri açabilir.
        if (task.Team.TeamLeadId != userId)
        {
            response.IsSuccess = false;
            response.Message = "Only the team lead can reopen tasks.";
            return response;
        }

        // İş Kuralı: Görev sadece "InReview" durumundaysa geri açılabilir.
        if (task.Status != Task_Status.InReview)
        {
            response.IsSuccess = false;
            response.Message = "Task must be in 'In Review' status to be reopened.";
            return response;
        }

        // Durumu güncelle
        task.Status = reopenDto.ReopenToStatus;

        // --- DEĞİŞİKLİK BURADA: YORUM YERİNE AKTİVİTE OLUŞTURUYORUZ ---
        // Bu, hem daha mantıklı hem de mevcut modelimize uygun.
        var activity = new TaskActivity
        {
            TaskId = taskId,
            UserId = userId, // Aktiviteyi yapan kişi (Takım Lideri)
            ActivityDescription = $"Task was reopened. Reason: \"{reopenDto.Comment}\""
        };
        await _context.TaskActivities.AddAsync(activity);

        await _context.SaveChangesAsync();

        // SignalR bildirimi
        var leader = await _userManager.FindByIdAsync(userId);
        var message = $"Your task '{task.Title}' was reopened by {leader.FullName}. Reason: \"{reopenDto.Comment}\"";
        var link = $"/tasks/{task.Id}";
        await _notificationService.CreateAndSendNotificationsAsync(
            new List<string> { task.AssignedToUserId },
            userId,
            message,
            link);

        response.Message = "Task has been reopened and an activity was logged.";
        return response;
    }

    public async Task<ServiceResponse<TaskDto>> UpdateTaskStatusAsync(int taskId, string userId, Task_Status newStatus)
    {
        var response = new ServiceResponse<TaskDto>();

        // DÜZELTME: Artık doğru entity olan ProjectTask'ı kullanıyoruz.
        var task = await _context.Tasks
            .Include(t => t.Team)
            .Include(t => t.AssignedTo)
            .FirstOrDefaultAsync(t => t.Id == taskId);

        if (task == null)
        {
            response.IsSuccess = false;
            response.Message = "Task not found.";
            return response;
        }

        bool isTeamLead = task.Team.TeamLeadId == userId;
        bool isAssignee = task.AssignedToUserId == userId;

        if (!isAssignee && !isTeamLead)
        {
            response.IsSuccess = false;
            response.Message = "You are not authorized to change the status of this task.";
            return response;
        }

        if (task.Status == newStatus)
        {
            response.Message = "Task status is already set to the requested value.";
            response.Data = MapTaskToDto(task);
            return response;
        }

        if (isAssignee && !isTeamLead)
        {
            if (newStatus != Task_Status.InProgress && newStatus != Task_Status.InReview)
            {
                response.IsSuccess = false;
                response.Message = "As the assigned user, you can only change the status to 'In Progress' or 'In Review'.";
                return response;
            }
        }

        var oldStatus = task.Status;

        // Artık bu alanlar ProjectTask modelinde var olduğu için hata vermeyecek.
        task.UpdatedAt = DateTime.UtcNow;

        if (newStatus == Task_Status.Done && oldStatus != Task_Status.Done)
        {
            task.CompletedAt = DateTime.UtcNow;
        }
        else if (oldStatus == Task_Status.Done && newStatus != Task_Status.Done)
        {
            task.CompletedAt = null;
        }

        task.Status = newStatus;
        await _context.SaveChangesAsync();

        if (isAssignee && newStatus == Task_Status.InReview)
        {
            var user = await _userManager.FindByIdAsync(userId);
            var message = $"{user?.FullName ?? "A user"} submitted the task '{task.Title}' for review.";
            var link = $"/app/team-tasks";
            await _notificationService.CreateAndSendNotificationsAsync(
                new List<string> { task.Team.TeamLeadId },
                userId,
                message,
                link);
        }

        response.Message = "Task status updated successfully.";
        response.Data = MapTaskToDto(task);
        return response;
    }

    private TaskDto MapTaskToDto(ProjectTask task) // DÜZELTME
    {
        return new TaskDto
        {
            Id = task.Id,
            Title = task.Title,
            Description = task.Description,
            DueDate = task.DueDate,
            Priority = task.Priority,
            Status = task.Status,
            CreatedAt = task.CreatedAt,
            TeamId = task.Team?.Id ?? 0,
            TeamName = task.Team?.Name,
            TeamLeadId = task.Team?.TeamLeadId,
            AssignedToUserId = task.AssignedToUserId,
            AssignedToUserName = task.AssignedTo?.FullName
        };
    }
}