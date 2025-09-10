using TasklyApp.Dtos.Meetings;
using TasklyApp.Utilities;

namespace TasklyApp.Services;

public interface IZoomService
{
    ServiceResponse<string> GenerateSignature(string meetingNumber, int role);
    Task<ServiceResponse<ZoomMeetingResponse>> CreateZoomMeetingAsync(CreateMeetingRequestDto request, string creatorEmail);
}
