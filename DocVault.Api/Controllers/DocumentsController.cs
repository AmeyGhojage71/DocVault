using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.Cosmos;
using DocVault.Api.Models;

namespace DocVault.Api.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class DocumentsController : ControllerBase
    {
        private readonly BlobServiceClient _blobServiceClient;
        private readonly Container _cosmosContainer;
        private const string BlobContainerName = "documents";

        public DocumentsController(
            BlobServiceClient blobServiceClient,
            Container cosmosContainer)
        {
            _blobServiceClient = blobServiceClient;
            _cosmosContainer = cosmosContainer;
        }

        // ================= UPLOAD =================
        [HttpPost]
        public async Task<IActionResult> Upload(IFormFile file)
        {
            if (file == null || file.Length == 0)
                return BadRequest("Invalid file.");

            var blobContainer = _blobServiceClient.GetBlobContainerClient(BlobContainerName);
            await blobContainer.CreateIfNotExistsAsync();

            // Unique file name (avoids overwrite)
            var uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";

            var blobClient = blobContainer.GetBlobClient(uniqueFileName);

            using var stream = file.OpenReadStream();
            await blobClient.UploadAsync(stream, overwrite: true);

            var document = new DocumentRecord
            {
                Id = Guid.NewGuid().ToString(),
                FileName = uniqueFileName,
                FileSize = file.Length,
                FileType = Path.GetExtension(file.FileName).TrimStart('.').ToUpper(),
                Url = blobClient.Uri.ToString(),
                UploadedOn = DateTime.UtcNow
            };

            await _cosmosContainer.CreateItemAsync(document, new PartitionKey(document.Id));

            return Ok(document);
        }

        // ================= LIST =================
        [HttpGet]
        public async Task<IActionResult> List()
        {
            var query = "SELECT * FROM c ORDER BY c._ts DESC";
            var iterator = _cosmosContainer.GetItemQueryIterator<DocumentRecord>(query);
            var results = new List<DocumentRecord>();

            while (iterator.HasMoreResults)
            {
                var response = await iterator.ReadNextAsync();
                results.AddRange(response.Resource);
            }

            return Ok(results);
        }

        // ================= DOWNLOAD =================
        [HttpGet("{id}/download")]
        public async Task<IActionResult> Download(string id)
        {
            try
            {
                var response = await _cosmosContainer.ReadItemAsync<DocumentRecord>(
                    id,
                    new PartitionKey(id));

                var document = response.Resource;

                var blobContainer = _blobServiceClient.GetBlobContainerClient(BlobContainerName);
                var blobClient = blobContainer.GetBlobClient(document.FileName);

                if (!await blobClient.ExistsAsync())
                    return NotFound("File not found in Blob Storage.");

                var stream = await blobClient.OpenReadAsync();

                return File(
                    stream,
                    GetContentType(document.FileName),
                    document.FileName);
            }
            catch (CosmosException)
            {
                return NotFound();
            }
        }

        // ================= DELETE =================
        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(string id)
        {
            try
            {
                var response = await _cosmosContainer.ReadItemAsync<DocumentRecord>(
                    id,
                    new PartitionKey(id));

                var document = response.Resource;

                // Delete from Cosmos
                await _cosmosContainer.DeleteItemAsync<DocumentRecord>(
                    id,
                    new PartitionKey(id));

                // Delete from Blob
                var blobContainer = _blobServiceClient.GetBlobContainerClient(BlobContainerName);
                var blobClient = blobContainer.GetBlobClient(document.FileName);
                await blobClient.DeleteIfExistsAsync();

                return NoContent();
            }
            catch (CosmosException)
            {
                return NotFound();
            }
        }

        // ================= HELPER =================
        private static string GetContentType(string fileName)
        {
            var extension = Path.GetExtension(fileName).ToLowerInvariant();

            return extension switch
            {
                ".pdf" => "application/pdf",
                ".png" => "image/png",
                ".jpg" => "image/jpeg",
                ".jpeg" => "image/jpeg",
                ".docx" => "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                ".doc" => "application/msword",
                ".txt" => "text/plain",
                _ => "application/octet-stream"
            };
        }
    }
}
