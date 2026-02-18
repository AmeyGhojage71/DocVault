using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using Azure.Storage.Blobs;

[ApiController]
[Route("api/[controller]")]
public class MyController : ControllerBase
{
    private readonly Container _cosmosContainer;
    private readonly BlobServiceClient _blobClient;

    public MyController(BlobServiceClient blobClient, Container cosmosContainer)
    {
        _blobClient = blobClient;
        _cosmosContainer = cosmosContainer;
    }

    [HttpGet]
    public async Task<IActionResult> List()
    {
        var query = "SELECT * FROM c";
        var iterator = _cosmosContainer.GetItemQueryIterator<dynamic>(query);
        var results = new List<dynamic>();

        try
        {
            while (iterator.HasMoreResults)
            
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response.Resource);
            }

            return Ok(results);
        }
        catch (CosmosException ex)
        {
            return StatusCode((int)ex.StatusCode, ex.Message);
        }
    }
}
