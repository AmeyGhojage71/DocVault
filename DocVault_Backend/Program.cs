using Azure.Identity;
using DocVault.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Identity.Web;

var builder = WebApplication.CreateBuilder(args);

// ================= KEY VAULT =================
var keyVaultUri = builder.Configuration["https://docvault-kv123.vault.azure.net/"];
if (!string.IsNullOrEmpty(keyVaultUri))
{
    builder.Configuration.AddAzureKeyVault(
        new Uri(keyVaultUri),
        new DefaultAzureCredential()
    );
}

// ================= CONTROLLERS + SWAGGER =================
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "DocVault API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        Description = "Enter your Entra ID JWT token"
    });
    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

// ================= CORS =================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("http://localhost:4200", "http://localhost:4385")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials());
});

// ================= JWT AUTH (Azure Entra ID) =================
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApi(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddAuthorization();

// ================= APPLICATION INSIGHTS =================
builder.Services.AddApplicationInsightsTelemetry(options =>
{
    options.ConnectionString = builder.Configuration["InstrumentationKey=046be436-88e0-4da0-8307-23e214c58f43;IngestionEndpoint=https://westeurope-5.in.applicationinsights.azure.com/;LiveEndpoint=https://westeurope.livediagnostics.monitor.azure.com/;ApplicationId=e7f82327-59e4-4975-8d96-b9a6a6543e83"]
        ?? builder.Configuration["APPLICATIONINSIGHTS_CONNECTION_STRING"];
});

// ================= DOMAIN SERVICES =================
// Services check whether real connection strings are configured.
// If not, in-memory dev stubs are used so the API boots without Azure credentials.
var hasRealStorage   = !string.IsNullOrEmpty(builder.Configuration["Storage:ConnectionString"]);
var hasRealCosmos    = !string.IsNullOrEmpty(builder.Configuration["Cosmos:ConnectionString"]);
var hasRealEventGrid = !string.IsNullOrEmpty(builder.Configuration["EventGrid:TopicEndpoint"])
    && !builder.Configuration["EventGrid:TopicEndpoint"]!.Contains("YOUR_");
var hasRealServiceBus = !string.IsNullOrEmpty(builder.Configuration["ServiceBus:ConnectionString"])
    && !builder.Configuration["ServiceBus:ConnectionString"]!.Contains("YOUR_");

builder.Services.AddSingleton<IBlobStorageService>(sp =>
    hasRealStorage
        ? new BlobStorageService(builder.Configuration, sp.GetRequiredService<ILogger<BlobStorageService>>())
        : new DevBlobStorageService());

builder.Services.AddSingleton<ICosmosDbService>(sp =>
    hasRealCosmos
        ? new CosmosDbService(builder.Configuration, sp.GetRequiredService<ILogger<CosmosDbService>>())
        : new DevCosmosDbService());

builder.Services.AddSingleton<IEventGridService>(sp =>
    hasRealEventGrid
        ? new EventGridService(builder.Configuration, sp.GetRequiredService<ILogger<EventGridService>>())
        : new DevEventGridService());

builder.Services.AddSingleton<IServiceBusService>(sp =>
    hasRealServiceBus
        ? new ServiceBusService(builder.Configuration, sp.GetRequiredService<ILogger<ServiceBusService>>())
        : new DevServiceBusService());

// ================= HEALTH CHECKS =================
builder.Services.AddHealthChecks();

// =================================================
var app = builder.Build();

app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "DocVault API v1"));

app.UseHttpsRedirection();
app.UseCors("AllowAngular");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHealthChecks("/api/health/ready");
app.MapGet("/", () => Results.Redirect("/swagger"));

app.Run();
