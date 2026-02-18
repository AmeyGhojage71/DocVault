using Azure.Storage.Blobs;

public class BlobService
{
    private readonly BlobContainerClient _container;

    public BlobService(IConfiguration config)
    {
        var client = new BlobServiceClient(
            config["Storage:ConnectionString"]);

        _container = client.GetBlobContainerClient("documents");
    }

    public async Task<string> UploadAsync(IFormFile file)
    {
        var blob = _container.GetBlobClient(Guid.NewGuid() + file.FileName);

        await blob.UploadAsync(file.OpenReadStream());

        return blob.Uri.ToString();
    }
}
