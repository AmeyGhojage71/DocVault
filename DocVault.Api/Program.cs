using Azure.Identity;
using Azure.Storage.Blobs;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.Azure.Cosmos;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

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

builder.Services.AddAuthorization();

// ================= BLOB =================
builder.Services.AddSingleton(x =>
    new BlobServiceClient(
        builder.Configuration["Storage:ConnectionString"]));

// ================= COSMOS =================
builder.Services.AddSingleton(x =>
    new CosmosClient(
        builder.Configuration["Cosmos:ConnectionString"]));

// ================= COSMOS CONTAINER =================
builder.Services.AddSingleton(sp =>
{
    var client = sp.GetRequiredService<CosmosClient>();
    var config = sp.GetRequiredService<IConfiguration>();
    return client.GetContainer(
        config["Cosmos:Database"],
        config["Cosmos:Container"]
    );
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
