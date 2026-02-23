using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using Microsoft.Azure.Cosmos;

namespace DocVault.Functions;

/// <summary>
/// Processes document jobs from the Service Bus queue.
/// This handles heavy/long-running processing tasks decoupled from the upload API.
/// </summary>
public class ServiceBusProcessorFunction
{
    private readonly ILogger _logger;
    private readonly Container _cosmosContainer;

    public ServiceBusProcessorFunction(ILoggerFactory loggerFactory, IConfiguration config)
    {
        _logger = loggerFactory.CreateLogger<ServiceBusProcessorFunction>();

        var endpoint = config["CosmosDb:Endpoint"] ?? string.Empty;
        var key = config["CosmosDb:Key"] ?? string.Empty;
        if (!string.IsNullOrEmpty(endpoint) && !string.IsNullOrEmpty(key))
        {
            var cosmos = new CosmosClient(endpoint, key);
            _cosmosContainer = cosmos.GetContainer(
                config["CosmosDb:DatabaseName"] ?? "docvault",
                config["CosmosDb:ContainerName"] ?? "documents");
        }
        else
        {
            throw new InvalidOperationException("Cosmos DB configuration missing in ServiceBusProcessorFunction");
        }
    }

    [Function("ServiceBusProcessor")]
    public async Task Run(
        [ServiceBusTrigger("document-processing", Connection = "ServiceBusConnection")]
        string messageBody,
        FunctionContext context)
    {
        _logger.LogInformation("ServiceBusProcessor received message: {MessageBody}", messageBody);

        ProcessingJob? job;
        try
        {
            job = JsonSerializer.Deserialize<ProcessingJob>(messageBody,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Invalid message format in Service Bus queue");
            return; // Dead-letter by not throwing — message consumed
        }

        if (job == null)
        {
            _logger.LogWarning("Null job deserialized from Service Bus message");
            return;
        }

        _logger.LogInformation("Processing job for document {DocumentId}, userId {UserId}",
            job.DocumentId, job.UserId);

        try
        {
            // Simulate heavy processing (virus scan, OCR, indexing, etc.)
            await Task.Delay(100);

            // Fetch the document from Cosmos DB
            var doc = await GetDocumentAsync(job.DocumentId, job.UserId);
            if (doc == null)
            {
                _logger.LogWarning("Document {DocumentId} not found in Cosmos DB", job.DocumentId);
                return;
            }

            // Here you would run additional processing:
            // - Virus scanning (e.g., ClamAV / Defender)
            // - OCR for scanned PDFs (e.g., Azure AI Document Intelligence)
            // - Full-text indexing (e.g., Azure Cognitive Search)
            // - Metadata extraction for Office documents

            // For now: verify the document status is updated
            if (doc.Status == "pending")
            {
                doc.Status = "processed";
                await _cosmosContainer.UpsertItemAsync(doc, new PartitionKey(doc.UserId));
                _logger.LogInformation("Document {DocumentId} status updated to 'processed' via Service Bus job",
                    job.DocumentId);
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "ServiceBusProcessor failed for document {DocumentId}", job.DocumentId);
            throw; // Re-throw triggers dead-letter after maxDeliveryCount exceeded
        }
    }

    private async Task<Document?> GetDocumentAsync(string documentId, string userId)
    {
        try
        {
            var response = await _cosmosContainer.ReadItemAsync<Document>(
                documentId, new PartitionKey(userId));
            return response.Resource;
        }
        catch (CosmosException ex) when (ex.StatusCode == System.Net.HttpStatusCode.NotFound)
        {
            return null;
        }
    }
}

internal record ProcessingJob(
    string DocumentId,
    string UserId,
    string BlobUrl,
    string ContentType,
    string EnqueuedAt);
