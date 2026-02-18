using Microsoft.Azure.Cosmos;

public class CosmosService
{
    private readonly Container _container;

    public CosmosService(IConfiguration config)
    {
        var client = new CosmosClient(
            config["Cosmos:Endpoint"],
            config["Cosmos:Key"]);

        _container = client
            .GetDatabase(config["Cosmos:Database"])
            .GetContainer(config["Cosmos:Container"]);
    }

    public async Task AddAsync(Document doc)
    {
        await _container.CreateItemAsync(doc,
            new PartitionKey(doc.UserId));
    }

    public async Task<List<Document>> GetAllAsync(string userId)
    {
        var q = new QueryDefinition(
            "SELECT * FROM c WHERE c.UserId=@u")
            .WithParameter("@u", userId);

        var result = new List<Document>();
        var iterator = _container.GetItemQueryIterator<Document>(q);

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            result.AddRange(response);
        }

        return result;
    }
}
