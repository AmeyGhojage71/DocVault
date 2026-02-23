using Azure;
using Azure.Messaging.EventGrid;

namespace DocVault.Api.Services;

public interface IEventGridService
{
    Task PublishDocumentUploadedAsync(string documentId, string userId, string fileName, string contentType);
}

public class EventGridService : IEventGridService
{
    private readonly EventGridPublisherClient _client;
    private readonly ILogger<EventGridService> _logger;

    public EventGridService(IConfiguration config, ILogger<EventGridService> logger)
    {
        _logger = logger;
        var endpoint = config["EventGrid:TopicEndpoint"]
            ?? throw new InvalidOperationException("EventGrid:TopicEndpoint is not configured");
        var key = config["EventGrid:TopicKey"]
            ?? throw new InvalidOperationException("EventGrid:TopicKey is not configured");

        _client = new EventGridPublisherClient(new Uri(endpoint), new AzureKeyCredential(key));
    }

    public async Task PublishDocumentUploadedAsync(
        string documentId, string userId, string fileName, string contentType)
    {
        var eventData = new
        {
            documentId,
            userId,
            fileName,
            contentType,
            uploadedAt = DateTime.UtcNow.ToString("o")
        };

        var gridEvent = new EventGridEvent(
            subject: $"docvault/documents/{documentId}",
            eventType: "DocVault.Document.Uploaded",
            dataVersion: "1.0",
            data: BinaryData.FromObjectAsJson(eventData));

        _logger.LogInformation("Publishing DocumentUploaded event for document {DocumentId}", documentId);
        await _client.SendEventAsync(gridEvent);
    }
}
