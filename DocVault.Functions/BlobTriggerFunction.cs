using System.IO;
using System.Threading.Tasks;
using Microsoft.Azure.Functions.Worker;
using Microsoft.Extensions.Logging;

namespace DocVault.Functions
{
    public class BlobTriggerFunction
    {
        private readonly ILogger _logger;

        public BlobTriggerFunction(ILoggerFactory loggerFactory)
        {
            _logger = loggerFactory.CreateLogger<BlobTriggerFunction>();
        }

        [Function("BlobTriggerFunction")]
        public async Task Run([BlobTrigger("documents/{name}", Connection = "AzureWebJobsStorage")] string myBlob, string name)
        {
            _logger.LogInformation($"C# Blob trigger function Processed blob\n Name: {name} \n Data: {myBlob}");
            
            // In a real scenario, you'd extract metadata or process the file here.
            // Since we already create the Cosmos record in the API upload, this function 
            // could be used for additional processing like OCR, thumbnail generation, etc.
            // For now, we'll just log it as a proof of concept for the trigger.
        }
    }
}
