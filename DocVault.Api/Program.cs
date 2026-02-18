using Azure.Storage.Blobs;
using Microsoft.Azure.Cosmos;

var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ================= BLOB =================

builder.Services.AddSingleton(x =>
    new BlobServiceClient(builder.Configuration["Storage:ConnectionString"]));

// ================= COSMOS CLIENT =================

builder.Services.AddSingleton(x =>
    new CosmosClient(builder.Configuration["Cosmos:ConnectionString"]));

// ================= COSMOS CONTAINER =================

builder.Services.AddSingleton<Container>(sp =>
{
    var client = sp.GetRequiredService<CosmosClient>();
    var config  = sp.GetRequiredService<IConfiguration>();

    var dbName        = config["Cosmos:Database"]!;
    var containerName = config["Cosmos:Container"]!;
    var partitionKey  = config["Cosmos:PartitionKey"] ?? "/id";

    // Auto-create database and container if they don't exist
    var dbResponse = client
        .CreateDatabaseIfNotExistsAsync(dbName)
        .GetAwaiter().GetResult();

    var containerResponse = dbResponse.Database
        .CreateContainerIfNotExistsAsync(containerName, partitionKey)
        .GetAwaiter().GetResult();

    return containerResponse.Container;
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();

app.MapControllers();

app.Run();
