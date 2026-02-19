using Azure.Identity;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Azure.Cosmos;
<<<<<<< HEAD
using Microsoft.AspNetCore.Authentication.JwtBearer;
=======
>>>>>>> 5461541 (Added JWT authentication with Entra ID)
using Microsoft.IdentityModel.Tokens;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// ================= KEY VAULT =================
// Reads secrets from Azure Key Vault using Managed Identity (in production)
// or DefaultAzureCredential (local dev uses az login / env vars)
var keyVaultUri = builder.Configuration["KeyVault:Uri"];
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
builder.Services.AddSwaggerGen();

// ================= CORS =================
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular", policy =>
        policy.WithOrigins("http://localhost:4200")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

<<<<<<< HEAD
// ================= AUTH =================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
.AddJwtBearer(options =>
{
    options.Authority =
        "https://login.microsoftonline.com/4290a4f8-06d1-4535-ad77-859d562298ce/v2.0";

    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateAudience = true,
        ValidAudience = "8ffa4b4d-3ec5-40f0-a18c-0f976bf80e21"
    };
});
=======
// ================= JWT AUTH (Entra ID) =================
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority =
            $"https://login.microsoftonline.com/{builder.Configuration["AzureAd:TenantId"]}/v2.0";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateAudience = true,
            ValidAudience = builder.Configuration["AzureAd:ClientId"]
        };
    });

builder.Services.AddAuthorization();
>>>>>>> 5461541 (Added JWT authentication with Entra ID)

// ================= BLOB =================
builder.Services.AddSingleton(x =>
    new BlobServiceClient(
        builder.Configuration["Storage:ConnectionString"]
    ));

// ================= COSMOS =================
builder.Services.AddSingleton(x =>
    new CosmosClient(
        builder.Configuration["Cosmos:ConnectionString"]
    ));

// ================= COSMOS CONTAINER =================
builder.Services.AddSingleton<Container>(sp =>
{
    var client = sp.GetRequiredService<CosmosClient>();
    var config = sp.GetRequiredService<IConfiguration>();

    return client.GetContainer(
        config["Cosmos:Database"],
        config["Cosmos:Container"]
    );
});

var jwtSettings = builder.Configuration.GetSection("Jwt");
var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
    options.TokenValidationParameters = new TokenValidationParameters
    {
        ValidateIssuer = true,
        ValidateAudience = true,
        ValidateLifetime = true,
        ValidateIssuerSigningKey = true,
        ValidIssuer = jwtSettings["Issuer"],
        ValidAudience = jwtSettings["Audience"],
        IssuerSigningKey = new SymmetricSecurityKey(key)
    };
});

var app = builder.Build();

// ================= MIDDLEWARE =================
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
