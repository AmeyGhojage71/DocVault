using Azure.Storage.Blobs;
using Azure.Storage.Blobs.Models;
using Azure.Storage.Sas;

namespace DocVault.Api.Services;

public interface IBlobStorageService
{
    Task<string> UploadAsync(Stream fileStream, string fileName, string contentType);
    string GenerateSasUrl(string blobUrl, int expiryMinutes = 60);
    Task DeleteAsync(string blobUrl);
}

public class BlobStorageService : IBlobStorageService
{
    private readonly BlobServiceClient _blobServiceClient;
    private readonly string _uploadContainer;
    private readonly ILogger<BlobStorageService> _logger;

    public BlobStorageService(IConfiguration config, ILogger<BlobStorageService> logger)
    {
        var connectionString = config["Storage:ConnectionString"]
            ?? throw new InvalidOperationException("Storage:ConnectionString is not configured");
        _blobServiceClient = new BlobServiceClient(connectionString);
        _uploadContainer = config["Storage:ContainerName"] ?? "uploads";
        _logger = logger;
    }

    public async Task<string> UploadAsync(Stream fileStream, string fileName, string contentType)
    {
        var containerClient = _blobServiceClient.GetBlobContainerClient(_uploadContainer);
        await containerClient.CreateIfNotExistsAsync();

        // Use a unique blob name to prevent overwrites
        var blobName = $"{Guid.NewGuid()}/{fileName}";
        var blobClient = containerClient.GetBlobClient(blobName);

        var uploadOptions = new BlobUploadOptions
        {
            HttpHeaders = new BlobHttpHeaders { ContentType = contentType }
        };

        _logger.LogInformation("Uploading blob {BlobName} to container {Container}", blobName, _uploadContainer);
        await blobClient.UploadAsync(fileStream, uploadOptions);

        return blobClient.Uri.ToString();
    }

    public string GenerateSasUrl(string blobUrl, int expiryMinutes = 60)
    {
        // Parse the blob URL to extract container and blob name
        var uri = new Uri(blobUrl);
        var pathParts = uri.AbsolutePath.TrimStart('/').Split('/', 2);
        if (pathParts.Length < 2) return blobUrl;

        var containerName = pathParts[0];
        var blobName = pathParts[1];

        var containerClient = _blobServiceClient.GetBlobContainerClient(containerName);
        var blobClient = containerClient.GetBlobClient(blobName);

        // Generate a time-limited SAS token — never expose direct blob URLs
        var sasBuilder = new BlobSasBuilder
        {
            BlobContainerName = containerName,
            BlobName = blobName,
            Resource = "b",
            ExpiresOn = DateTimeOffset.UtcNow.AddMinutes(expiryMinutes)
        };
        sasBuilder.SetPermissions(BlobSasPermissions.Read);

        var sasUri = blobClient.GenerateSasUri(sasBuilder);
        return sasUri.ToString();
    }

    public async Task DeleteAsync(string blobUrl)
    {
        var uri = new Uri(blobUrl);
        var pathParts = uri.AbsolutePath.TrimStart('/').Split('/', 2);
        if (pathParts.Length < 2) return;

        var containerClient = _blobServiceClient.GetBlobContainerClient(pathParts[0]);
        var blobClient = containerClient.GetBlobClient(pathParts[1]);

        _logger.LogInformation("Deleting blob {BlobUrl}", blobUrl);
        await blobClient.DeleteIfExistsAsync(DeleteSnapshotsOption.IncludeSnapshots);
    }
}
