using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using System.Text.Encodings.Web;
using TasklyApp.Dtos.Auth;
using TasklyApp.Models.Entities;
using TasklyApp.Services;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;

namespace TasklyApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly UserManager<User> _userManager;
        private readonly IConfiguration _configuration;
        private readonly IEmailService _emailService;
        private readonly ILogger<AuthController> _logger;
        private readonly IEmailTemplateService _templateService;

        public AuthController(UserManager<User> userManager, IConfiguration configuration, IEmailService emailService, ILogger<AuthController> logger,
            IEmailTemplateService templateService)
        {
            _userManager = userManager;
            _configuration = configuration;
            _emailService = emailService;
            _logger = logger;
            _templateService = templateService;
        }

        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            // HttpContext.User.Identity.Name'den kullanıcıyı bulabiliriz
            // veya daha iyisi, claim'lerden ID'yi almak
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (userId == null)
            {
                return Unauthorized();
            }

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
            {
                return Unauthorized();
            }

            return Ok(new
            {
                UserId = user.Id,
                FullName = user.FullName,
                Email = user.Email,
                Role = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "User"
            });
        }

        // POST: api/auth/register (Güncellenmiş Hali)
        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterDto registerDto)
        {
            var userExists = await _userManager.FindByEmailAsync(registerDto.Email);
            if (userExists != null)
                return StatusCode(StatusCodes.Status409Conflict, new { Message = "User already exists!" });

            var user = new User
            {
                Email = registerDto.Email,
                SecurityStamp = Guid.NewGuid().ToString(),
                UserName = registerDto.Email,
                FullName = registerDto.FullName,
                EmailConfirmed = false // E-posta başlangıçta onaysız
            };

            var result = await _userManager.CreateAsync(user, registerDto.Password);
            if (!result.Succeeded)
                return StatusCode(StatusCodes.Status500InternalServerError, new { Message = "User creation failed!", Errors = result.Errors });

            // --- E-POSTA GÖNDERME KISMI ---
            try
            {
                var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
                var callbackUrl = Url.Action(nameof(ConfirmEmail), "Auth", new { userId = user.Id, token = token }, Request.Scheme);

                var emailBody = await _templateService.GetConfirmationEmailBodyAsync(user.FullName, callbackUrl);

                await _emailService.SendEmailAsync(user.Email, "Taskly Hesap Doğrulama", emailBody);
            }
            catch (Exception ex)
            {
                // E-posta gönderilemezse ne olacak?
                // Şimdilik loglayıp geçebiliriz, kullanıcı daha sonra tekrar isteyebilir.
                _logger.LogError($"Email to {user.Email} failed to send: {ex.Message}");
            }

            return Ok(new { Message = "User created successfully! Please check your email to confirm your account." });
        }

        // GET: api/auth/confirm-email
        [HttpGet("confirm-email")]
        public async Task<IActionResult> ConfirmEmail(string userId, string token)
        {
            if (string.IsNullOrWhiteSpace(userId) || string.IsNullOrWhiteSpace(token))
                return BadRequest("Invalid user or token");

            var user = await _userManager.FindByIdAsync(userId);
            if (user == null)
                return NotFound("User not found");

            var result = await _userManager.ConfirmEmailAsync(user, token);
            if (result.Succeeded)
            {
                // Kullanıcıyı bir "Başarıyla doğrulandı" sayfasına yönlendirebiliriz.
                // Şimdilik basit bir mesaj dönelim.
                return Ok(new { Message = "Email confirmed successfully! You can now log in." });
            }

            return BadRequest("Email could not be confirmed.");
        }

        // Login metodunu da e-posta onayı kontrol edecek şekilde güncelleyelim.
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto loginDto)
        {
            var user = await _userManager.FindByEmailAsync(loginDto.Email);
            if (user == null) return Unauthorized(new { Message = "Invalid credentials" });
            if (!user.EmailConfirmed) return Unauthorized(new { Message = "Email not confirmed. Please check your inbox." });

            if (await _userManager.CheckPasswordAsync(user, loginDto.Password))
            {
                var tokenString = GenerateJwtToken(user);

                var cookieOptions = new CookieOptions
                {
                    HttpOnly = true,
                    Secure = true,               // HTTPS şart
                    SameSite = SameSiteMode.None, // Cross-site için gerekli
                    IsEssential = true,          // CookiePolicy varsa gerekli olabilir
                    Path = "/",
                    Expires = loginDto.RememberMe
                        ? DateTimeOffset.UtcNow.AddDays(7)
                        : DateTimeOffset.UtcNow.AddHours(2)
                };

                Response.Cookies.Append("auth_token", tokenString, cookieOptions);

                return Ok(new
                {
                    UserId = user.Id,
                    Email = user.Email,
                    FullName = user.FullName,
                    Role = (await _userManager.GetRolesAsync(user)).FirstOrDefault() ?? "User",
                });
            }

            return Unauthorized(new { Message = "Invalid credentials" });
        }

        [HttpPost("logout")]
        public IActionResult Logout()
        {
            Response.Cookies.Delete("auth_token", new CookieOptions
            {
                Secure = true,
                SameSite = SameSiteMode.None,
                Path = "/"
            });
            return Ok(new { message = "Çıkış başarılı." });
        }

        private string GenerateJwtToken(User user)
        {
            // 1. Claims (Token içinde taşıyacağımız bilgiler) oluşturuluyor.
            // Bu bilgiler daha sonra token'ı doğruladığımızda okunabilir.
            var authClaims = new List<Claim>
            {
                new Claim(ClaimTypes.NameIdentifier, user.Id), // Kullanıcının benzersiz ID'si
                new Claim(ClaimTypes.Email, user.Email),       // Kullanıcının e-postası
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()), // Token için benzersiz bir kimlik
            };

            // İleride roller eklendiğinde bu kısım da aktif edilebilir:
            // var userRoles = await _userManager.GetRolesAsync(user);
            // foreach (var userRole in userRoles)
            // {
            //     authClaims.Add(new Claim(ClaimTypes.Role, userRole));
            // }

            // 2. appsettings.json'dan gizli anahtar (secret key) alınıyor.
            var authSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["JWT:Key"]));

            // 3. Token'ın kendisi oluşturuluyor.
            var token = new JwtSecurityToken(
                issuer: _configuration["JWT:Issuer"],
                audience: _configuration["JWT:Audience"],
                expires: DateTime.Now.AddHours(3), // Token'ın geçerlilik süresi
                claims: authClaims,
                signingCredentials: new SigningCredentials(authSigningKey, SecurityAlgorithms.HmacSha256)
                );

            // 4. Token, string formatına dönüştürülüp döndürülüyor.
            return new JwtSecurityTokenHandler().WriteToken(token);
        }
    }
}
