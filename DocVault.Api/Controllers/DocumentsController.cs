using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
[HttpGet]
public async Task<IActionResult> List()
{
    var query = "SELECT * FROM c";
    var iterator = _cosmosContainer.GetItemQueryIterator<dynamic>(query);
    var results = new List<dynamic>();
    while (iterator.HasMoreResults)
        results.AddRange(await iterator.ReadNextAsync());
    return Ok(results);
}
