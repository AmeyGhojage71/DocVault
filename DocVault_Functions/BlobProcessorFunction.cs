using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using Microsoft.Azure.Cosmos;
using Azure.Storage.Blobs;
using System.Text;
using System.Text.Json;

namespace DocVault.Functions;

public class BlobProcessorFunction
{
    private readonly ILogger _logger;
    private readonly Container _cosmosContainer;
    private readonly BlobServiceClient _blobServiceClient;

    public BlobProcessorFunction(ILoggerFactory loggerFactory, IConfiguration config)
    {
        _logger = loggerFactory.CreateLogger<BlobProcessorFunction>();

        var cosmosEndpoint = config["CosmosDb:Endpoint"]
            ?? throw new InvalidOperationException("CosmosDb:Endpoint missing");
        var cosmosKey = config["CosmosDb:Key"]
            ?? throw new InvalidOperationException("CosmosDb:Key missing");
        var dbName = config["CosmosDb:DatabaseName"] ?? "docvault";
        var containerName = config["CosmosDb:ContainerName"] ?? "documents";

        var cosmosClient = new CosmosClient(cosmosEndpoint, cosmosKey);
        _cosmosContainer = cosmosClient.GetContainer(dbName, containerName);

        var storageConn = config["AzureWebJobsStorage"]
            ?? throw new InvalidOperationException("AzureWebJobsStorage missing");
        _blobServiceClient = new BlobServiceClient(storageConn);
    }

    [Function("BlobProcessor")]
    public async Task Run(
        [BlobTrigger("uploads/{documentId}/{fileName}", Connection = "AzureWebJobsStorage")]
        Stream blobStream,
        string documentId,
        string fileName,
        FunctionContext context)
    {
        _logger.LogInformation("BlobProcessor triggered for blob: {DocumentId}/{FileName} ({Size} bytes)",
            documentId, fileName, blobStream.Length);

        try
        {
            // 1. Determine content type from file extension
            var contentType = GetContentType(fileName);

            // 2. Extract text excerpt (first 500 chars from text-based files)
            var excerpt = await ExtractExcerptAsync(blobStream, contentType);

            // 3. Generate a thumbnail URL (for images — point to a resized version)
            var thumbnailUrl = GenerateThumbnailUrl(documentId, fileName, contentType);

            // 4. Find the Cosmos DB document by documentId
            // We use a cross-partition query since we don't know userId here
            var query = new QueryDefinition(
                "SELECT * FROM c WHERE c.id = @id")
                .WithParameter("@id", documentId);

            using var iterator = _cosmosContainer.GetItemQueryIterator<dynamic>(query);

            Document? doc = null;
            string? userId = null;

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                foreach (var item in response)
                {
                    doc = JsonSerializer.Deserialize<Document>(item.ToString());
                    userId = doc?.UserId;
                    break;
                }
                if (doc != null) break;
            }

            if (doc == null || userId == null)
            {
                _logger.LogWarning("No Cosmos DB document found for id {DocumentId}", documentId);
                return;
            }

            // 5. Update document with excerpt, thumbnail, and processed status
            doc.Excerpt = excerpt;
            doc.ThumbnailUrl = thumbnailUrl;
            doc.Status = "processed";

            await _cosmosContainer.UpsertItemAsync(doc, new PartitionKey(userId));
            _logger.LogInformation("Document {DocumentId} marked as processed. Excerpt length: {ExcerptLength}",
                documentId, excerpt.Length);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "BlobProcessor failed for {DocumentId}/{FileName}", documentId, fileName);

            // Attempt to mark document as failed
            try
            {
                await MarkDocumentFailedAsync(documentId);
            }
            catch (Exception markEx)
            {
                _logger.LogError(markEx, "Failed to mark document {DocumentId} as failed", documentId);
            }

            throw; // Re-throw to trigger Function retry policy
        }
    }

    private static async Task<string> ExtractExcerptAsync(Stream stream, string contentType)
    {
        if (!IsTextBased(contentType)) return string.Empty;

        try
        {
            using var reader = new StreamReader(stream, Encoding.UTF8, leaveOpen: true);
            var content = await reader.ReadToEndAsync();
            var cleaned = content
                .Replace("\r\n", " ")
                .Replace("\n", " ")
                .Replace("\t", " ");
            // Trim to first 500 characters
            return cleaned.Length > 500 ? cleaned[..500] : cleaned;
        }
        catch
        {
            return string.Empty;
        }
    }

    private static string GenerateThumbnailUrl(string documentId, string fileName, string contentType)
    {
        if (!contentType.StartsWith("image/")) return string.Empty;

        // In a full implementation, this triggers an image resize job.
        // For now we return the path where the thumbnail would be stored.
        var extension = Path.GetExtension(fileName);
        return $"thumbnails/{documentId}/thumb{extension}";
    }

    private async Task MarkDocumentFailedAsync(string documentId)
    {
        var query = new QueryDefinition("SELECT * FROM c WHERE c.id = @id")
            .WithParameter("@id", documentId);
        using var iterator = _cosmosContainer.GetItemQueryIterator<dynamic>(query);
        while (iterator.HasMoreResults)
        {
            var page = await iterator.ReadNextAsync();
            foreach (var item in page)
            {
                var doc = JsonSerializer.Deserialize<Document>(item.ToString());
                if (doc != null)
                {
                    doc.Status = "failed";
                    await _cosmosContainer.UpsertItemAsync(doc, new PartitionKey(doc.UserId));
                }
            }
        }
    }

    private static bool IsTextBased(string contentType) =>
        contentType.StartsWith("text/") ||
        contentType == "application/json" ||
        contentType == "application/xml" ||
        contentType == "application/csv";

    private static string GetContentType(string fileName) =>
        Path.GetExtension(fileName).ToLowerInvariant() switch
        {
            ".txt" => "text/plain",
            ".html" or ".htm" => "text/html",
            ".json" => "application/json",
            ".xml" => "application/xml",
            ".csv" => "text/csv",
            ".pdf" => "application/pdf",
            ".png" => "image/png",
            ".jpg" or ".jpeg" => "image/jpeg",
            ".gif" => "image/gif",
            ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            ".xlsx" => "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            _ => "application/octet-stream"
        };
}

// Shared model for Functions project (no project reference needed)
internal class Document
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string BlobUrl { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string UploadedAt { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string Excerpt { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string Status { get; set; } = "pending";
    public bool IsDeleted { get; set; } = false;
}
