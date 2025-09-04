using Microsoft.EntityFrameworkCore;
using TasklyApp.Data;
using TasklyApp.Dtos.Comments;
using TasklyApp.Models.Entities;
using TasklyApp.Services; // INotificationService için
using TasklyApp.Utilities;

namespace TasklyApp.Services
{
    public class CommentService : ICommentService
    {
        private readonly ApplicationDbContext _context;
        private readonly INotificationService _notificationService;

        public CommentService(ApplicationDbContext context, INotificationService notificationService)
        {
            _context = context;
            _notificationService = notificationService;
        }

        /// <summary>
        /// Bir aktiviteye ana yorum ekler ve ilgili taraflara bildirim gönderir.
        /// </summary>
        public async Task<ServiceResponse<CommentFeedDto>> AddCommentToActivityAsync(int activityId, string authorId, string content)
        {
            var response = new ServiceResponse<CommentFeedDto>();

            var activity = await _context.TaskActivities
                .Include(a => a.Task)
                    .ThenInclude(t => t.Team)
                .FirstOrDefaultAsync(a => a.Id == activityId);

            if (activity == null)
            {
                response.IsSuccess = false;
                response.Message = "Activity not found.";
                return response;
            }

            var teamMembers = await _context.Teams
                .Where(t => t.Id == activity.Task.TeamId)
                .SelectMany(t => t.Members)
                .ToListAsync();

            if (!teamMembers.Any(m => m.Id == authorId))
            {
                response.IsSuccess = false;
                response.Message = "You are not a member of this team.";
                return response;
            }

            if (activity.UserId == authorId)
            {
                response.IsSuccess = false;
                response.Message = "You cannot comment on your own activity, only reply to comments.";
                return response;
            }

            var author = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == authorId);
            if (author == null)
            {
                response.IsSuccess = false;
                response.Message = "Author not found.";
                return response;
            }

            var newComment = new TaskComment
            {
                Content = content,
                AuthorId = authorId,
                ParentActivityId = activityId
            };

            _context.TaskComments.Add(newComment);
            await _context.SaveChangesAsync();

            // Bildirim mantığını merkezi servise devret
            var task = activity.Task;
            var message = $"{author.FullName} commented on an activity in task '{task.Title}'.";
            var link = $"/tasks/{task.Id}";
            var targetUserIds = new List<string> { task.AssignedToUserId, task.Team.TeamLeadId };

            await _notificationService.CreateAndSendNotificationsAsync(targetUserIds, authorId, message, link);

            response.Data = new CommentFeedDto
            {
                Id = newComment.Id,
                Content = newComment.Content,
                CreatedAt = newComment.CreatedAt,
                AuthorId = author.Id,
                AuthorName = author.FullName,
                AuthorAvatarUrl = null,
                Replies = new List<CommentFeedDto>()
            };
            response.Message = "Comment added successfully.";

            return response;
        }

        /// <summary>
        /// Bir yoruma cevap ekler ve ilgili taraflara bildirim gönderir.
        /// </summary>
        public async Task<ServiceResponse<CommentFeedDto>> AddReplyToCommentAsync(int parentCommentId, string authorId, string content)
        {
            var response = new ServiceResponse<CommentFeedDto>();

            var parentComment = await _context.TaskComments
                .Include(c => c.ParentActivity.Task.Team)
                .Include(c => c.Author)
                .FirstOrDefaultAsync(c => c.Id == parentCommentId);

            if (parentComment == null || parentComment.ParentActivity?.Task?.Team == null)
            {
                response.IsSuccess = false;
                response.Message = "The comment or its associated task could not be found.";
                return response;
            }

            if (parentComment.ParentActivity.Task.AssignedToUserId != authorId)
            {
                response.IsSuccess = false;
                response.Message = "Only the user assigned to the task can reply to comments.";
                return response;
            }

            var replier = await _context.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == authorId);
            if (replier == null)
            {
                response.IsSuccess = false;
                response.Message = "Replying user not found.";
                return response;
            }

            var reply = new TaskComment
            {
                Content = content,
                AuthorId = authorId,
                ParentActivityId = parentComment.ParentActivityId,
                ParentCommentId = parentCommentId
            };

            _context.TaskComments.Add(reply);
            await _context.SaveChangesAsync();

            // Bildirim mantığını merkezi servise devret
            var task = parentComment.ParentActivity.Task;
            var message = $"{replier.FullName} replied to a comment in task '{task.Title}'.";
            var link = $"/tasks/{task.Id}";

            var targetUserIds = new List<string>
            {
                task.Team.TeamLeadId,         // Takım Lideri
                parentComment.AuthorId        // Cevap yazılan yorumun sahibi
            };

            await _notificationService.CreateAndSendNotificationsAsync(targetUserIds, authorId, message, link);

            response.Data = new CommentFeedDto
            {
                Id = reply.Id,
                Content = reply.Content,
                CreatedAt = reply.CreatedAt,
                AuthorId = replier.Id,
                AuthorName = replier.FullName,
                AuthorAvatarUrl = null,
                Replies = new List<CommentFeedDto>()
            };
            response.Message = "Reply added successfully.";

            return response;
        }
    }
}