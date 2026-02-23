using DocVault.Api.Models;

namespace DocVault.Api.Services;

// ─── Dev-only stub services ───────────────────────────────────────────────────
// These are registered only when ASPNETCORE_ENVIRONMENT=Development.
// They let the API boot and Swagger work without Azure credentials.
// Real uploads/queries return mock data so the full API surface is testable locally.

/// <summary>Stub that stores blobs in-memory (lost on restart).</summary>
public class DevBlobStorageService : IBlobStorageService
{
    private readonly Dictionary<string, (byte[] Data, string ContentType)> _store = new();

    public Task<string> UploadAsync(Stream fileStream, string fileName, string contentType)
    {
        using var ms = new MemoryStream();
        fileStream.CopyTo(ms);
        var blobName = $"{Guid.NewGuid()}/{fileName}";
        _store[blobName] = (ms.ToArray(), contentType);
        var fakeUrl = $"https://devstub.blob.core.windows.net/uploads/{blobName}";
        return Task.FromResult(fakeUrl);
    }

    public string GenerateSasUrl(string blobUrl, int expiryMinutes = 60)
    {
        // Return the same URL with a fake SAS token for dev inspection
        return $"{blobUrl}?sv=devstub&sp=r&se={DateTime.UtcNow.AddMinutes(expiryMinutes):s}Z";
    }

    public Task DeleteAsync(string blobUrl) => Task.CompletedTask;
}

/// <summary>Stub that stores documents in a List<Document> in-memory.</summary>
public class DevCosmosDbService : ICosmosDbService
{
    private readonly List<Document> _docs = new();

    public Task<Document> CreateAsync(Document document)
    {
        document.Status = "pending";
        _docs.Add(document);
        return Task.FromResult(document);
    }

    public Task<List<Document>> GetByUserAsync(string userId) =>
        Task.FromResult(_docs.Where(d => d.UserId == userId && !d.IsDeleted)
                             .OrderByDescending(d => d.UploadedAt)
                             .ToList());

    public Task<Document?> GetByIdAsync(string id, string userId) =>
        Task.FromResult(_docs.FirstOrDefault(d => d.Id == id && d.UserId == userId && !d.IsDeleted));

    public Task<List<Document>> SearchAsync(string userId, string query)
    {
        var q = query.ToLowerInvariant();
        return Task.FromResult(
            _docs.Where(d => d.UserId == userId && !d.IsDeleted &&
                             (d.FileName.Contains(q, StringComparison.OrdinalIgnoreCase) ||
                              (d.Excerpt ?? "").Contains(q, StringComparison.OrdinalIgnoreCase)))
                 .ToList());
    }

    public Task<Document?> SoftDeleteAsync(string id, string userId)
    {
        var doc = _docs.FirstOrDefault(d => d.Id == id && d.UserId == userId);
        if (doc != null) doc.IsDeleted = true;
        return Task.FromResult(doc);
    }

    public Task UpdateAsync(Document document)
    {
        var existing = _docs.FirstOrDefault(d => d.Id == document.Id);
        if (existing != null) _docs[_docs.IndexOf(existing)] = document;
        return Task.CompletedTask;
    }
}

/// <summary>Stub that logs Event Grid events to console.</summary>
public class DevEventGridService : IEventGridService
{
    public Task PublishDocumentUploadedAsync(string documentId, string userId, string fileName, string contentType)
    {
        Console.WriteLine($"[DEV] EventGrid event: DocumentUploaded | {documentId} | {fileName}");
        return Task.CompletedTask;
    }
}

/// <summary>Stub that logs Service Bus messages to console.</summary>
public class DevServiceBusService : IServiceBusService
{
    public Task SendDocumentProcessingJobAsync(string documentId, string userId, string blobUrl, string contentType)
    {
        Console.WriteLine($"[DEV] ServiceBus message: ProcessDocument | {documentId} | {contentType}");
        return Task.CompletedTask;
    }
}
