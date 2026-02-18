using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;

[ApiController]
[Route("api/[controller]")]
public class DocumentsController : ControllerBase
{
    private readonly BlobContainerClient _container;
    private readonly Container _cosmos;

    public DocumentsController(BlobServiceClient blob, CosmosClient cosmos)
    {
        _container = blob.GetBlobContainerClient("documents");
        _container.CreateIfNotExists();

        _cosmos = cosmos.GetContainer("DocVaultDB", "Documents");
    }

    [HttpPost]
    public async Task<IActionResult> Upload(IFormFile file)
    {
        if (file == null) return BadRequest();

        var blob = _container.GetBlobClient(file.FileName);
        await blob.UploadAsync(file.OpenReadStream(), true);

        var doc = new
        {
            id = Guid.NewGuid().ToString(),
            fileName = file.FileName,
            uploaded = DateTime.UtcNow
        };

        await _cosmos.CreateItemAsync(doc, new PartitionKey(doc.id));

        return Ok(doc);
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var query = _cosmos.GetItemQueryIterator<dynamic>("SELECT * FROM c");
        var result = new List<dynamic>();

        while (query.HasMoreResults)
        {
            result.AddRange(await query.ReadNextAsync());
        }

        return Ok(result);
    }
}
