using Newtonsoft.Json;
using System.Text.Json.Serialization;

public class DocumentRecord
{
    [JsonProperty("id")]
    [JsonPropertyName("id")]
    public string Id { get; set; } = string.Empty;

    [JsonProperty("fileName")]
    [JsonPropertyName("fileName")]
    public string FileName { get; set; } = string.Empty;

    [JsonProperty("fileSize")]
    [JsonPropertyName("fileSize")]
    public long FileSize { get; set; }

    [JsonProperty("fileType")]
    [JsonPropertyName("fileType")]
    public string FileType { get; set; } = string.Empty;

    [JsonProperty("url")]
    [JsonPropertyName("url")]
    public string Url { get; set; } = string.Empty;

    [JsonProperty("uploadedOn")]
    [JsonPropertyName("uploadedOn")]
    public DateTime UploadedOn { get; set; }
}
