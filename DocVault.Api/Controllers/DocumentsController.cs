using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;


[Authorize]
[ApiController]
[Authorize]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly BlobServiceClient _blobClient;
    private readonly Container _container;

    public DocumentsController(BlobServiceClient blobClient, Container container)
    {
        _blobClient = blobClient;
        _container = container;
    }

    // ================= UPLOAD =================

    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        var blobContainer = _blobClient.GetBlobContainerClient("documents");
        await blobContainer.CreateIfNotExistsAsync();

        var blob = blobContainer.GetBlobClient(file.FileName);

        using var stream = file.OpenReadStream();
        await blob.UploadAsync(stream, true);

        var doc = new DocumentRecord
        {
            Id = Guid.NewGuid().ToString(),
            FileName = file.FileName,
            FileSize = file.Length,
            FileType = Path.GetExtension(file.FileName).TrimStart('.').ToUpper(),
            Url = blob.Uri.ToString(),
            UploadedOn = DateTime.UtcNow
        };

        await _container.CreateItemAsync(doc, new PartitionKey(doc.Id));

        return Ok(doc);
    }

    // ================= LIST =================

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var query = "SELECT * FROM c ORDER BY c._ts DESC";
        var iterator = _container.GetItemQueryIterator<DocumentRecord>(query);

        var results = new List<DocumentRecord>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            results.AddRange(response.Resource);
        }

        return Ok(results);
    }

    // ================= SEARCH =================

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string q)
    {
        if (string.IsNullOrWhiteSpace(q))
            return BadRequest(new { message = "Search query cannot be empty." });

        var query = "SELECT * FROM c ORDER BY c._ts DESC";
        var iterator = _container.GetItemQueryIterator<DocumentRecord>(query);

        var results = new List<DocumentRecord>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            results.AddRange(response.Resource);
        }

        var filtered = results
            .Where(d => d.FileName.Contains(q, StringComparison.OrdinalIgnoreCase))
            .ToList();

        return Ok(filtered);
    }

    // ================= DELETE =================

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(string id, [FromQuery] string fileName)
    {
        // Delete from Cosmos
        await _container.DeleteItemAsync<DocumentRecord>(id, new PartitionKey(id));

        // Delete from Blob Storage
        if (!string.IsNullOrEmpty(fileName))
        {
            var blobContainer = _blobClient.GetBlobContainerClient("documents");
            var blob = blobContainer.GetBlobClient(fileName);
            await blob.DeleteIfExistsAsync();
        }

        return NoContent();
    }
}
