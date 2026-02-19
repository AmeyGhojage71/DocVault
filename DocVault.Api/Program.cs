using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Azure.Cosmos;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// -------------------------
// Controllers + Swagger
// -------------------------
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// -------------------------
// CORS for Angular
// -------------------------
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
    {
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// -------------------------
// Azure AD Authentication
// -------------------------
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

// -------------------------
// Cosmos DB
// -------------------------
builder.Services.AddSingleton<CosmosClient>(provider =>
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    return new CosmosClient(
        configuration["CosmosDb:Endpoint"],
        configuration["CosmosDb:Key"]
    );
});

builder.Services.AddScoped(sp =>
{
    var client = sp.GetRequiredService<CosmosClient>();
    var configuration = sp.GetRequiredService<IConfiguration>();
    return client.GetContainer(
        configuration["CosmosDb:DatabaseName"],
        configuration["CosmosDb:ContainerName"]
    );
});

// -------------------------
// Azure Blob Storage
// -------------------------
builder.Services.AddScoped<BlobServiceClient>(provider =>
{
    var configuration = provider.GetRequiredService<IConfiguration>();
    return new BlobServiceClient(
        configuration["BlobStorage:ConnectionString"]
    );
});

var app = builder.Build();

// -------------------------
// Development Only
// -------------------------
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("AllowAngular");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();
