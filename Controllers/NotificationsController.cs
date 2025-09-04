using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TasklyApp.Services;

namespace TasklyApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class NotificationsController : ControllerBase
    {
        private readonly INotificationService _notificationService;
        public NotificationsController(INotificationService notificationService)
        {
            _notificationService = notificationService;
        }

        // GET: api/notifications
        [HttpGet]
        public async Task<IActionResult> GetMyNotifications()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var response = await _notificationService.GetUserNotificationsAsync(userId);

            // Servis zaten ServiceResponse<T> döndürdüğü için, 
            // başarılı olup olmadığını kontrol etmeden doğrudan datayı dönebiliriz.
            // Frontend, response.Data boş bir liste ise "bildirim yok" mesajını gösterebilir.
            return Ok(response.Data);
        }

        // POST: api/notifications/mark-as-read
        [HttpPost("mark-as-read")]
        public async Task<IActionResult> MarkAllAsRead()
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var response = await _notificationService.MarkAllAsReadAsync(userId);

            if (!response.IsSuccess)
            {
                // Genellikle bu işlem hata vermez ama olası bir veritabanı
                // hatasına karşı bir kontrol eklemek iyidir.
                return BadRequest(new { Message = response.Message });
            }

            // Başarılı olduğunda 200 OK ve bir başarı mesajı döndürelim.
            return Ok(new { Message = "All notifications marked as read." });
        }

        [HttpPost("{notificationId}/mark-as-read")]
        public async Task<IActionResult> MarkOneAsRead(int notificationId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId))
            {
                return Unauthorized();
            }

            var response = await _notificationService.MarkAsReadAsync(userId, notificationId);

            if (!response.IsSuccess)
            {
                // Eğer bildirim bulunamazsa veya kullanıcıya ait değilse 404 Not Found döndürmek daha doğru.
                return NotFound(new { Message = response.Message });
            }

            // Başarılı olduğunda, 200 OK ile birlikte yönlendirme linkini döndür.
            // Frontend bu linki kullanarak yönlendirme yapacak.
            return Ok(new { link = response.Data });
        }
    }
}
