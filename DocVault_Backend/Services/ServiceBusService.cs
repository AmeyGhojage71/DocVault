using Azure.Messaging.ServiceBus;
using System.Text.Json;

namespace DocVault.Api.Services;

public interface IServiceBusService
{
    Task SendDocumentProcessingJobAsync(string documentId, string userId, string blobUrl, string contentType);
}

public class ServiceBusService : IServiceBusService
{
    private readonly ServiceBusSender _sender;
    private readonly ILogger<ServiceBusService> _logger;

    public ServiceBusService(IConfiguration config, ILogger<ServiceBusService> logger)
    {
        _logger = logger;
        var connectionString = config["ServiceBus:ConnectionString"]
            ?? throw new InvalidOperationException("ServiceBus:ConnectionString is not configured");
        var queueName = config["ServiceBus:QueueName"] ?? "document-processing";

        var client = new ServiceBusClient(connectionString);
        _sender = client.CreateSender(queueName);
    }

    public async Task SendDocumentProcessingJobAsync(
        string documentId, string userId, string blobUrl, string contentType)
    {
        var job = new
        {
            documentId,
            userId,
            blobUrl,
            contentType,
            enqueuedAt = DateTime.UtcNow.ToString("o")
        };

        var messageBody = JsonSerializer.Serialize(job);
        var message = new ServiceBusMessage(messageBody)
        {
            MessageId = documentId,
            ContentType = "application/json",
            Subject = "document-processing-job"
        };

        _logger.LogInformation("Sending document processing job to Service Bus for document {DocumentId}", documentId);
        await _sender.SendMessageAsync(message);
    }
}
