using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Security.Claims;

namespace TasklyApp.Hubs;

// [Authorize] test edilecek
public class NotificationHub : Hub
{
    // Bu metod, bir istemci (tarayıcı) bağlandığında çalışır.
    public override async Task OnConnectedAsync()
    {
        // Kullanıcıyı, kendi özel grubuna ekleyebiliriz.
        // Bu sayede sadece o kullanıcıya özel bildirimler gönderebiliriz.
        var userId = Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.AddToGroupAsync(Context.ConnectionId, $"User_{userId}");
        }
        await base.OnConnectedAsync();
    }

    // İstemci bağlantısı kesildiğinde çalışır.
    public override async Task OnDisconnectedAsync(Exception exception)
    {
        var userId = Context.User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (!string.IsNullOrEmpty(userId))
        {
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"User_{userId}");
        }
        await base.OnDisconnectedAsync(exception);
    }
}
