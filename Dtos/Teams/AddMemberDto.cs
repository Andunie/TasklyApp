using System.ComponentModel.DataAnnotations;

namespace TasklyApp.Dtos.Teams;

public class AddMemberDto
{
    /// <summary>
    /// Takıma eklenecek kullanıcının e-posta adresi.
    /// </summary>
    [Required(ErrorMessage = "Email address is required.")]
    [EmailAddress(ErrorMessage = "Invalid email address format.")]
    public string Email { get; set; }
}
