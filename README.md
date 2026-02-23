# DocVault — Secure Document Management Platform

> AZ-204 Capstone Project | Angular 17 + .NET 8 | Azure-native architecture

## Architecture Overview

```
Browser (Angular 17 SPA)
        │  MSAL login (Entra ID)
        ▼
Azure API Management  ── rate-limit, CORS, cache policies
        │
        ▼
Azure App Service (.NET 8 Web API)
 ├── POST /api/documents  ──► Blob Storage (upload)
 │                       ──► Cosmos DB (metadata)
 │                       ──► Event Grid (DocumentUploaded)
 │                       ──► Service Bus Queue (processing job)
 ├── GET  /api/documents  ──◄ Cosmos DB + SAS URL generation
 ├── GET  /api/documents/search ──◄ Cosmos DB full-text
 └── GET  /api/health     ──◄ Application Insights ping

Azure Functions (isolated worker)
 ├── BlobTrigger        ──► extract text, update Cosmos status
 ├── ServiceBusTrigger  ──► heavy processing jobs
 └── EventGridTrigger   ──► notification handler

Azure Key Vault ◄── Managed Identity (no secrets in code)
Application Insights ── telemetry, custom metrics, availability tests
```

## Azure Services Used

| Service | Purpose |
|---------|---------|
| Azure App Service | Host .NET 8 API |
| Azure Blob Storage | Store documents + thumbnails |
| Azure Cosmos DB | Document metadata (NoSQL, partition: userId) |
| Azure Functions | Blob trigger, Service Bus trigger, Event Grid |
| Microsoft Entra ID | User auth via MSAL, JWT bearer tokens |
| Azure Key Vault | All secrets — zero secrets in code |
| Managed Identity | Passwordless access to Key Vault, Storage, Cosmos |
| Application Insights | Telemetry, custom metrics, availability tests |
| Azure API Management | Rate limiting, CORS, caching policies |
| Azure Event Grid | Decoupled event: DocumentUploaded |
| Azure Service Bus | Reliable job queue: document-processing |
| Azure Container Registry | Docker image registry (Day 4) |
| Azure Container Apps | Scale-to-zero hosting (Day 4 stretch) |

## Quick Start

### Prerequisites
- .NET 8 SDK
- Node.js 20+
- Angular CLI (`npm install -g @angular/cli`)
- Azure CLI (`az login`)
- Azure Functions Core Tools v4

### 1. Provision Azure Resources

```bash
# Copy and edit with your subscription details
cp infra/setup.sh infra/setup.local.sh
chmod +x infra/setup.local.sh
bash infra/setup.local.sh
```

### 2. Configure Secrets (Key Vault)

All secrets are stored in Key Vault. The App Service and Functions use **Managed Identity** — no connection strings in code.

For **local development only**, create:
- `DocVault_Backend/appsettings.Development.json` (see `.example` file)
- `DocVault_Functions/local.settings.json` (see `.example` file)

> ⚠️ These files are in `.gitignore` — never commit them.

### 3. Run the API locally

```bash
cd DocVault_Backend
dotnet restore
dotnet run
# API available at https://localhost:5001
# Swagger UI at https://localhost:5001/swagger
```

### 4. Run Functions locally

```bash
cd DocVault_Functions
dotnet restore
func start
```

### 5. Run the Angular app

```bash
cd DocVault_Frontend
npm install
npm start
# App available at http://localhost:4200
```

## Branching Strategy

```
main        ◄── protected, PRs only, auto-deploys via GitHub Actions
dev         ◄── integration branch, daily merge to main
feature/*   ◄── short-lived, one branch per task
```

**Commit format:** `type(scope): description`
Examples: `feat(api): add upload endpoint with blob storage`

## GitHub Actions

| Workflow | Trigger | Steps |
|----------|---------|-------|
| `ci.yml` | PR to `dev` or `main` | dotnet build + test, npm build |
| `deploy.yml` | Push to `main` | CI + publish + deploy to App Service |

Secrets required in GitHub repository settings:
- `AZURE_WEBAPP_PUBLISH_PROFILE` — download from App Service → Get publish profile
- `AZURE_STATIC_WEB_APPS_API_TOKEN` — from Static Web Apps resource (if used)

## Data Model

**Cosmos DB** — `docvault` database, `documents` container, partition key: `/userId`

```typescript
interface Document {
  id: string;            // GUID
  userId: string;        // Entra ID object ID (partition key)
  fileName: string;
  blobUrl: string;       // internal blob URL (not exposed to client)
  contentType: string;
  sizeBytes: number;
  uploadedAt: string;    // ISO 8601
  tags: string[];
  excerpt: string;       // first 500 chars, set by Function
  thumbnailUrl: string;  // set by Function
  status: 'pending' | 'processed' | 'failed';
  isDeleted: boolean;    // soft delete
}
```

## Evaluation Checklist

- [x] Upload + download flow with SAS tokens
- [x] Cosmos DB with correct partition key `/userId`
- [x] Blob lifecycle policy (Cool 30d, Archive 180d)
- [x] SAS tokens for download links
- [x] Entra ID auth (MSAL Angular + JWT .NET)
- [x] Key Vault for all secrets + Managed Identity
- [x] Azure Function triggered on blob upload
- [x] Event Grid + Service Bus for decoupling
- [x] API Management with rate-limit + cache policy
- [x] Application Insights telemetry + availability test
- [x] GitHub Actions CI pipeline
- [x] GitHub Actions CD pipeline
- [x] Feature branch → dev → main workflow
- [x] Dockerfile + Container Apps (stretch)

Microsoft Azure Credentials
Email :- ameyghojage71@gmail.com
