namespace TasklyApp.Dtos.Auth;

public class AuthResponseDto
{
    public string UserId { get; set; }
    public string Email { get; set; }
    public string FullName { get; set; }
    public string Token { get; set; }
    public string Role { get; set; }
}
