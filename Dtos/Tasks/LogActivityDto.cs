using System.ComponentModel.DataAnnotations;

namespace TasklyApp.Dtos.Tasks;

public class LogActivityDto
{
    [Required]
    [StringLength(500, MinimumLength = 10)]
    public string Description { get; set; }
    public IFormFile? ImageFile { get; set; } // Opsiyonel resim dosyası
}
