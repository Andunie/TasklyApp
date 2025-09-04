using TasklyApp.Dtos.Comments;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public interface ICommentService
{
    Task<ServiceResponse<CommentFeedDto>> AddCommentToActivityAsync(int activityId, string authorId, string content);
    Task<ServiceResponse<CommentFeedDto>> AddReplyToCommentAsync(int parentCommentId, string authorId, string content);
}
