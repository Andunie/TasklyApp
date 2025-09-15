using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using TasklyApp.Dtos.Tasks;
using TasklyApp.Services;

namespace TasklyApp.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        // POST: api/tasks
        [HttpPost]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskDto createTaskDto)
        {
            var creatorUserId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(creatorUserId))
            {
                return Unauthorized();
            }

            var response = await _taskService.CreateTaskAsync(createTaskDto, creatorUserId);

            if (!response.IsSuccess)
            {
                return BadRequest(new { response.Message });
            }

            // Oluşturulan kaynağın konumunu belirtmek için CreatedAtAction kullanmak daha doğru bir REST pratiğidir.
            return CreatedAtAction(nameof(GetTaskById), new { id = response.Data.Id }, response.Data);
        }

        // Bu metod, CreatedAtAction'ın çalışması için gereklidir. Şimdilik boş bırakabiliriz.
        // GET: api/tasks/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetTaskById(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var response = await _taskService.GetTaskByIdAsync(id, userId);

            if (!response.IsSuccess)
            {
                // Task bulunamadıysa NotFound, yetki yoksa Forbid döndürmek daha doğru olabilir.
                // Şimdilik BadRequest genel bir çözüm.
                return BadRequest(new { response.Message });
            }

            if (response.Data == null)
            {
                return NotFound();
            }

            return Ok(response.Data);
        }

        // GET: api/tasks/mytasks
        [HttpGet("mytasks")]
        public async Task<IActionResult> GetMyTasks([FromQuery] TaskFilterDto filters)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // 'filters' nesnesini servise parametre olarak gönderiyoruz.
            var response = await _taskService.GetMyTasksAsync(userId, filters);

            return Ok(response.Data);
        }

        // POST: api/tasks/{taskId}/activities
        [HttpPost("{taskId}/activities")]
        public async Task<IActionResult> LogActivity(int taskId, [FromForm] LogActivityDto logActivityDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var response = await _taskService.LogActivityForTaskAsync(taskId, userId, logActivityDto);

            if (!response.IsSuccess)
            {
                // Forbid, kullanıcının kimliğinin bilindiğini ama yetkisinin olmadığını belirtir.
                return Forbid(response.Message);
            }

            return Ok(response.Data);
        }

        // PUT: api/tasks/{taskId}/status
        [HttpPut("{taskId}/status")]
        public async Task<IActionResult> UpdateTaskStatus(int taskId, [FromBody] UpdateTaskStatusDto statusDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var response = await _taskService.UpdateTaskStatusAsync(taskId, userId, statusDto.NewStatus);

            if (!response.IsSuccess)
            {
                // Forbid() yerine, 403 Forbidden durum kodu ile birlikte mesajı döndür.
                return StatusCode(StatusCodes.Status403Forbidden, new { Message = response.Message });
            }

            return Ok(response);
        }

        // --- YENİ ENDPOINT 2: Görevi Onaylama ---
        // PUT: api/tasks/{taskId}/approve
        [HttpPut("{taskId}/approve")]
        public async Task<IActionResult> ApproveTask(int taskId)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var response = await _taskService.ApproveTaskAsync(taskId, userId);

            if (!response.IsSuccess)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { Message = response.Message });
            }

            return Ok(response);
        }

        // --- YENİ ENDPOINT 3: Görevi Geri Açma ---
        // PUT: api/tasks/{taskId}/reopen
        [HttpPut("{taskId}/reopen")]
        public async Task<IActionResult> ReopenTask(int taskId, [FromBody] ReopenTaskDto reopenDto)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            var response = await _taskService.ReopenTaskAsync(taskId, userId, reopenDto);

            if (!response.IsSuccess)
            {
                return StatusCode(StatusCodes.Status403Forbidden, new { Message = response.Message });
            }

            return Ok(response);
        }

        // GET: api/tasks/team-tasks
        [HttpGet("team-tasks")]
        public async Task<IActionResult> GetTeamTasks([FromQuery] TaskFilterDto filters)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);
            if (string.IsNullOrEmpty(userId)) return Unauthorized();

            // 'filters' nesnesini servise parametre olarak gönderiyoruz.
            var response = await _taskService.GetTeamTasksForLeaderAsync(userId, filters);

            return Ok(response.Data);
        }
    }
}
