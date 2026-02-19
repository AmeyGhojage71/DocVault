using Azure.Storage.Blobs;
using Microsoft.Azure.Cosmos;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;


var builder = WebApplication.CreateBuilder(args);

// Controllers + Swagger
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
