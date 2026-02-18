using Azure.Storage.Blobs;

namespace DocVault.api.Services;

public class BlobService
{
    private readonly BlobContainerClient _container;

    public BlobService(BlobServiceClient client)
    {
        _container = client.GetBlobContainerClient("documents");
        _container.CreateIfNotExists();
    }
}
