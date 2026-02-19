using Newtonsoft.Json;

namespace DocVault.Api.Models
{
    public class DocumentRecord
    {
        [JsonProperty("id")]
        public string Id { get; set; } = string.Empty;

        public string FileName { get; set; } = string.Empty;

        public long FileSize { get; set; }

        public string FileType { get; set; } = string.Empty;

        public string Url { get; set; } = string.Empty;

        public DateTime UploadedOn { get; set; }
    }
}
