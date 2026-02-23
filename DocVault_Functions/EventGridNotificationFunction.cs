using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;
using System.Text.Json;

namespace DocVault.Functions;

/// <summary>
/// Subscribes to the Event Grid "DocVault.Document.Uploaded" event.
/// This is the notification handler — it can fan out to email, Teams, etc.
/// </summary>
public class EventGridNotificationFunction
{
    private readonly ILogger _logger;

    public EventGridNotificationFunction(ILoggerFactory loggerFactory)
    {
        _logger = loggerFactory.CreateLogger<EventGridNotificationFunction>();
    }

    [Function("EventGridNotification")]
    public void Run(
        [EventGridTrigger] MyEvent gridEvent,
        FunctionContext context)
    {
        _logger.LogInformation("Event Grid notification received.");
        _logger.LogInformation("  Event Type   : {EventType}", gridEvent.EventType);
        _logger.LogInformation("  Event Subject: {Subject}", gridEvent.Subject);
        _logger.LogInformation("  Event Time   : {EventTime}", gridEvent.EventTime);

        try
        {
            var dataJson = gridEvent.Data?.ToString() ?? "{}";
            var data = JsonSerializer.Deserialize<DocumentUploadedEventData>(dataJson,
                new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

            if (data != null)
            {
                _logger.LogInformation(
                    "DocumentUploaded: documentId={DocumentId}, userId={UserId}, fileName={FileName}",
                    data.DocumentId, data.UserId, data.FileName);

                // In a production system, here you would:
                // 1. Send an email notification via SendGrid / Azure Communication Services
                // 2. Post a Teams/Slack webhook message
                // 3. Update a real-time dashboard via SignalR
                // 4. Trigger downstream approval workflows
            }
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize Event Grid event data");
        }
    }
}

public class MyEvent
{
    public string Id { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public string Subject { get; set; } = string.Empty;
    public string EventTime { get; set; } = string.Empty;
    public object? Data { get; set; }
}

internal record DocumentUploadedEventData(
    string DocumentId,
    string UserId,
    string FileName,
    string ContentType,
    string UploadedAt);
