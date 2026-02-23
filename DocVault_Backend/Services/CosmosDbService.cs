using Microsoft.Azure.Cosmos;
using DocVault.Api.Models;

namespace DocVault.Api.Services;

public interface ICosmosDbService
{
    Task<Document> CreateAsync(Document document);
    Task<List<Document>> GetByUserAsync(string userId);
    Task<Document?> GetByIdAsync(string id, string userId);
    Task<List<Document>> SearchAsync(string userId, string query);
    Task<Document?> SoftDeleteAsync(string id, string userId);
    Task UpdateAsync(Document document);
}

public class CosmosDbService : ICosmosDbService
{
    private readonly Container _container;
    private readonly ILogger<CosmosDbService> _logger;

    public CosmosDbService(IConfiguration config, ILogger<CosmosDbService> logger)
    {
        _logger = logger;

        var connectionString = config["Cosmos:ConnectionString"];
        var databaseName = config["Cosmos:Database"] ?? "docvaultdb";
        var containerName = config["Cosmos:Container"] ?? "documents";

        CosmosClient cosmosClient;
        if (!string.IsNullOrEmpty(connectionString))
        {
            cosmosClient = new CosmosClient(connectionString, new CosmosClientOptions
            {
                SerializerOptions = new CosmosSerializationOptions
                {
                    PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
                }
            });
        }
        else
        {
            var endpoint = config["CosmosDb:Endpoint"]
                ?? throw new InvalidOperationException("Cosmos:ConnectionString or CosmosDb:Endpoint must be configured");
            var key = config["CosmosDb:Key"]
                ?? throw new InvalidOperationException("CosmosDb:Key is not configured");

            cosmosClient = new CosmosClient(endpoint, key, new CosmosClientOptions
            {
                SerializerOptions = new CosmosSerializationOptions
                {
                    PropertyNamingPolicy = CosmosPropertyNamingPolicy.CamelCase
                }
            });
        }

        _container = cosmosClient.GetContainer(databaseName, containerName);
    }

    public async Task<Document> CreateAsync(Document document)
    {
        _logger.LogInformation("Creating document {DocumentId} for user {UserId}", document.Id, document.UserId);
        var response = await _container.CreateItemAsync(document, new PartitionKey(document.UserId));
        return response.Resource;
    }

    public async Task<List<Document>> GetByUserAsync(string userId)
    {
        var query = new QueryDefinition(
            "SELECT * FROM c WHERE c.userId = @userId AND (NOT IS_DEFINED(c.isDeleted) OR c.isDeleted = false) ORDER BY c.uploadedAt DESC")
            .WithParameter("@userId", userId);

        var results = new List<Document>();
        using var iterator = _container.GetItemQueryIterator<Document>(query,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(userId) });

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            results.AddRange(response);
        }

        return results;
    }

    public async Task<Document?> GetByIdAsync(string id, string userId)
    {
        try
        {
            var response = await _container.ReadItemAsync<Document>(id, new PartitionKey(userId));
            var doc = response.Resource;
            return doc.IsDeleted ? null : doc;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }

    public async Task<List<Document>> SearchAsync(string userId, string query)
    {
        var lowerQuery = query.ToLowerInvariant();
        var cosmosQuery = new QueryDefinition(
            @"SELECT * FROM c WHERE c.userId = @userId 
              AND (NOT IS_DEFINED(c.isDeleted) OR c.isDeleted = false)
              AND (CONTAINS(LOWER(c.fileName), @q) OR CONTAINS(LOWER(c.excerpt), @q))")
            .WithParameter("@userId", userId)
            .WithParameter("@q", lowerQuery);

        var results = new List<Document>();
        using var iterator = _container.GetItemQueryIterator<Document>(cosmosQuery,
            requestOptions: new QueryRequestOptions { PartitionKey = new PartitionKey(userId) });

        while (iterator.HasMoreResults)
        {
            var response = await iterator.ReadNextAsync();
            results.AddRange(response);
        }

        return results;
    }

    public async Task<Document?> SoftDeleteAsync(string id, string userId)
    {
        var doc = await GetByIdAsync(id, userId);
        if (doc == null) return null;

        doc.IsDeleted = true;
        await _container.UpsertItemAsync(doc, new PartitionKey(userId));
        _logger.LogInformation("Soft-deleted document {DocumentId}", id);
        return doc;
    }

    public async Task UpdateAsync(Document document)
    {
        _logger.LogInformation("Updating document {DocumentId}", document.Id);
        await _container.UpsertItemAsync(document, new PartitionKey(document.UserId));
    }
}
