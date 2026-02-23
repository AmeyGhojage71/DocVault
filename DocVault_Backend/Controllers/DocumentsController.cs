using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.ApplicationInsights;
using DocVault.Api.Models;
using DocVault.Api.Services;
using System.Security.Claims;
using System.Diagnostics;

namespace DocVault.Api.Controllers;

[ApiController]
[Route("api/documents")]
[Authorize]
public class DocumentsController : ControllerBase
{
    private readonly IBlobStorageService _blobService;
    private readonly ICosmosDbService _cosmosService;
    private readonly IEventGridService _eventGridService;
    private readonly IServiceBusService _serviceBusService;
    private readonly TelemetryClient _telemetryClient;
    private readonly ILogger<DocumentsController> _logger;

    public DocumentsController(
        IBlobStorageService blobService,
        ICosmosDbService cosmosService,
        IEventGridService eventGridService,
        IServiceBusService serviceBusService,
        TelemetryClient telemetryClient,
        ILogger<DocumentsController> logger)
    {
        _blobService = blobService;
        _cosmosService = cosmosService;
        _eventGridService = eventGridService;
        _serviceBusService = serviceBusService;
        _telemetryClient = telemetryClient;
        _logger = logger;
    }

    private string GetUserId()
    {
        return User.FindFirstValue("oid")
            ?? User.FindFirstValue(ClaimTypes.NameIdentifier)
            ?? "anonymous";
    }

    // POST /api/documents
    [HttpPost]
    [RequestSizeLimit(100 * 1024 * 1024)] // 100 MB limit
    public async Task<IActionResult> Upload([FromForm] IFormFile file, [FromForm] string? tags)
    {
        if (file == null || file.Length == 0)
            return BadRequest(new { error = "No file uploaded" });

        var userId = GetUserId();
        var sw = Stopwatch.StartNew();

        try
        {
            _logger.LogInformation("Upload started: {FileName} ({Size} bytes) for user {UserId}",
                file.FileName, file.Length, userId);

            // 1. Upload to Blob Storage
            string blobUrl;
            using (var stream = file.OpenReadStream())
            {
                blobUrl = await _blobService.UploadAsync(stream, file.FileName, file.ContentType);
            }

            // 2. Parse tags
            var tagList = tags?.Split(',', StringSplitOptions.RemoveEmptyEntries)
                              .Select(t => t.Trim())
                              .ToList() ?? new List<string>();

            // 3. Write metadata to Cosmos DB
            var document = new Document
            {
                Id = Guid.NewGuid().ToString(),
                UserId = userId,
                FileName = file.FileName,
                BlobUrl = blobUrl,
                ContentType = file.ContentType,
                SizeBytes = file.Length,
                UploadedAt = DateTime.UtcNow.ToString("o"),
                Tags = tagList,
                Status = "pending"
            };

            var created = await _cosmosService.CreateAsync(document);
            sw.Stop();

            // 4. Track custom metric in Application Insights
            _telemetryClient.TrackMetric("DocumentUploadDurationMs", sw.ElapsedMilliseconds);
            _telemetryClient.TrackEvent("DocumentUploaded", new Dictionary<string, string>
            {
                { "documentId", created.Id },
                { "userId", userId },
                { "contentType", file.ContentType },
                { "fileName", file.FileName }
            });

            // 5. Publish DocumentUploaded event to Event Grid (decoupled from processing)
            try
            {
                await _eventGridService.PublishDocumentUploadedAsync(
                    created.Id, userId, created.FileName, created.ContentType);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Event Grid publish failed for document {DocumentId} — non-fatal", created.Id);
            }

            // 6. Send processing job to Service Bus queue
            try
            {
                await _serviceBusService.SendDocumentProcessingJobAsync(
                    created.Id, userId, blobUrl, file.ContentType);
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Service Bus message send failed for document {DocumentId} — non-fatal", created.Id);
            }

            var response = MapToResponse(created, null);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Upload failed for user {UserId}", userId);
            _telemetryClient.TrackException(ex);
            return StatusCode(500, new { error = "Upload failed", detail = ex.Message });
        }
    }

    // GET /api/documents
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var userId = GetUserId();
        try
        {
            var docs = await _cosmosService.GetByUserAsync(userId);
            var responses = docs.Select(d => MapToResponse(d, _blobService.GenerateSasUrl(d.BlobUrl))).ToList();
            return Ok(new { items = responses, count = responses.Count });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "List failed for user {UserId}", userId);
            return StatusCode(500, new { error = "Failed to retrieve documents" });
        }
    }

    // GET /api/documents/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(string id)
    {
        var userId = GetUserId();
        try
        {
            var doc = await _cosmosService.GetByIdAsync(id, userId);
            if (doc == null) return NotFound(new { error = "Document not found" });

            // Generate a fresh SAS URL (time-limited, never return raw blobUrl)
            var sasUrl = _blobService.GenerateSasUrl(doc.BlobUrl);
            return Ok(MapToResponse(doc, sasUrl));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "GetById failed for document {DocumentId}", id);
            return StatusCode(500, new { error = "Failed to retrieve document" });
        }
    }

    // DELETE /api/documents/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id)
    {
        var userId = GetUserId();
        try
        {
            var doc = await _cosmosService.SoftDeleteAsync(id, userId);
            if (doc == null) return NotFound(new { error = "Document not found" });

            _telemetryClient.TrackEvent("DocumentDeleted", new Dictionary<string, string>
            {
                { "documentId", id }, { "userId", userId }
            });

            return Ok(new { message = "Document deleted", id });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Delete failed for document {DocumentId}", id);
            return StatusCode(500, new { error = "Delete failed" });
        }
    }

    // GET /api/documents/search?q=term
    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { error = "Query parameter 'q' is required" });

        var userId = GetUserId();
        try
        {
            var docs = await _cosmosService.SearchAsync(userId, q);
            var responses = docs.Select(d => MapToResponse(d, _blobService.GenerateSasUrl(d.BlobUrl))).ToList();

            _telemetryClient.TrackEvent("DocumentSearch", new Dictionary<string, string>
            {
                { "query", q }, { "userId", userId }, { "resultCount", responses.Count.ToString() }
            });

            return Ok(new SearchResult { Items = responses, TotalCount = responses.Count, Query = q });
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Search failed for user {UserId} query '{Query}'", userId, q);
            return StatusCode(500, new { error = "Search failed" });
        }
    }

    private static DocumentResponse MapToResponse(Document doc, string? downloadUrl)
    {
        return new DocumentResponse
        {
            Id = doc.Id,
            UserId = doc.UserId,
            FileName = doc.FileName,
            ContentType = doc.ContentType,
            SizeBytes = doc.SizeBytes,
            UploadedAt = doc.UploadedAt,
            Tags = doc.Tags,
            Excerpt = doc.Excerpt,
            ThumbnailUrl = doc.ThumbnailUrl,
            Status = doc.Status,
            DownloadUrl = downloadUrl ?? string.Empty
        };
    }
}
