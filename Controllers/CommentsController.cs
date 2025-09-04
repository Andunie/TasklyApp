// Controllers/CommentsController.cs
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TasklyApp.Dtos.Comments;
using TasklyApp.Services;

[Route("api/comments")]
[ApiController]
[Authorize]
public class CommentsController : ControllerBase
{
    private readonly ICommentService _commentService;

    public CommentsController(ICommentService commentService)
    {
        _commentService = commentService;
    }

    // Bir aktiviteye yorum yapmak için
    // POST: api/comments/activity/{activityId}
    [HttpPost("activity/{activityId}")]
    public async Task<IActionResult> PostCommentToActivity(int activityId, [FromBody] CreateCommentDto dto)
    {
        var authorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(authorId)) return Unauthorized();

        var response = await _commentService.AddCommentToActivityAsync(activityId, authorId, dto.Content);

        if (!response.IsSuccess) return BadRequest(new { Message = response.Message });

        return Ok(response.Data);
    }

    // Bir yoruma cevap vermek için
    // POST: api/comments/{commentId}/reply
    [HttpPost("{commentId}/reply")]
    public async Task<IActionResult> PostReplyToComment(int commentId, [FromBody] CreateCommentDto dto)
    {
        var authorId = User.FindFirstValue(ClaimTypes.NameIdentifier);
        if (string.IsNullOrEmpty(authorId)) return Unauthorized();

        var response = await _commentService.AddReplyToCommentAsync(commentId, authorId, dto.Content);

        if (!response.IsSuccess) return BadRequest(new { Message = response.Message });

        return Ok(response.Data);
    }
}