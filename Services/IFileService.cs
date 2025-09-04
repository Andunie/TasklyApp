namespace TasklyApp.Services;

public interface IFileService
{
    Task<string> SaveActivityImageAsync(IFormFile imageFile);
}
