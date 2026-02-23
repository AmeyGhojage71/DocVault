using Newtonsoft.Json;

namespace DocVault.Api.Models;

public class Document
{
    [JsonProperty("id")]
    public string Id { get; set; } = Guid.NewGuid().ToString();

    [JsonProperty("userId")]
    public string UserId { get; set; } = string.Empty;

    [JsonProperty("fileName")]
    public string FileName { get; set; } = string.Empty;

    [JsonProperty("blobUrl")]
    public string BlobUrl { get; set; } = string.Empty;

    [JsonProperty("contentType")]
    public string ContentType { get; set; } = string.Empty;

    [JsonProperty("sizeBytes")]
    public long SizeBytes { get; set; }

    [JsonProperty("uploadedAt")]
    public string UploadedAt { get; set; } = DateTime.UtcNow.ToString("o");

    [JsonProperty("tags")]
    public List<string> Tags { get; set; } = new();

    [JsonProperty("excerpt")]
    public string Excerpt { get; set; } = string.Empty;

    [JsonProperty("thumbnailUrl")]
    public string ThumbnailUrl { get; set; } = string.Empty;

    [JsonProperty("status")]
    public string Status { get; set; } = "pending";

    [JsonProperty("isDeleted")]
    public bool IsDeleted { get; set; } = false;
}

public class DocumentResponse
{
    public string Id { get; set; } = string.Empty;
    public string UserId { get; set; } = string.Empty;
    public string FileName { get; set; } = string.Empty;
    public string ContentType { get; set; } = string.Empty;
    public long SizeBytes { get; set; }
    public string UploadedAt { get; set; } = string.Empty;
    public List<string> Tags { get; set; } = new();
    public string Excerpt { get; set; } = string.Empty;
    public string ThumbnailUrl { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public string DownloadUrl { get; set; } = string.Empty; // SAS URL — never return blobUrl directly
}

public class UploadDocumentRequest
{
    public List<string>? Tags { get; set; }
}

public class SearchResult
{
    public List<DocumentResponse> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public string Query { get; set; } = string.Empty;
}
