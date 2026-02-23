using Microsoft.AspNetCore.Mvc;

namespace DocVault.Api.Controllers;

[ApiController]
[Route("api/health")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get()
    {
        return Ok(new
        {
            status = "Healthy",
            service = "DocVault API",
            version = "1.0.0",
            timestamp = DateTime.UtcNow.ToString("o")
        });
    }
}
