using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;

[ApiController]
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

        var doc = new
        {
            id = Guid.NewGuid().ToString(),
            fileName = file.FileName,
            url = blob.Uri.ToString(),
            uploadedOn = DateTime.UtcNow
        };

        await _container.CreateItemAsync(doc);

        return Ok(doc);
    }

    // ================= LIST =================

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var query = "SELECT * FROM c";
        var iterator = _container.GetItemQueryIterator<dynamic>(query);

        var results = new List<dynamic>();

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            results.AddRange(response.Resource);
        }

        return Ok(results);
    }
}
