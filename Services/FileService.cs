
namespace TasklyApp.Services;

public class FileService : IFileService
{
    private readonly IWebHostEnvironment _webHostEnvironment;

    public FileService(IWebHostEnvironment webHostEnvironment)
    {
        _webHostEnvironment = webHostEnvironment;
    }

    public async Task<string> SaveActivityImageAsync(IFormFile imageFile)
    {
        if (imageFile == null || imageFile.Length == 0) return null;

        var uploadsFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "activities");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        var uniqueFileName = Guid.NewGuid().ToString() + "_" + imageFile.FileName;
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        using (var fileStream = new FileStream(filePath, FileMode.Create))
        {
            await imageFile.CopyToAsync(fileStream);
        }

        // Veritabanına kaydedilecek ve frontend'in erişeceği yolu döndür
        return "/uploads/activities/" + uniqueFileName;
    }
}
