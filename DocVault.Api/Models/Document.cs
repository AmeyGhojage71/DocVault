public class Document
{
    public string Id { get; set; }
    public string UserId { get; set; }
    public string FileName { get; set; }
    public string BlobUrl { get; set; }
    public long SizeBytes { get; set; }
    public DateTime UploadedAt { get; set; }
    public string Status { get; set; }
}
