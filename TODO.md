# DocVault - AZ-204 Capstone Project TODO

## Current Status
- ✅ Basic project structure
- ✅ .NET 8 Web API with controllers
- ✅ Angular frontend with dashboard
- ⚠️ Partial implementation - needs completion

## Day 1 - Foundation & Storage
- [x] Project structure created
- [x] Upload API endpoint
- [x] List API endpoint  
- [x] Download endpoint
- [x] Delete endpoint
- [x] Angular upload component
- [x] Angular document list component
- [ ] Fix hardcoded secrets - move to Key Vault
- [ ] Configure Blob lifecycle policy

## Day 2 - Security, Identity & Serverless
- [ ] Update AuthController for Entra ID (or keep simple JWT for demo)
- [ ] Create Azure Function (Blob trigger) for document processing
- [ ] Enable Managed Identity on App Service
- [ ] Add search endpoint

## Day 3 - Events, Messaging & Observability
- [ ] Set up Event Grid Topic
- [ ] Set up Service Bus Queue
- [ ] Create Service Bus trigger function
- [ ] Configure Application Insights
- [ ] Set up API Management

## Day 4 - Containers & Polish
- [ ] Dockerize .NET API
- [ ] Deploy to Azure Container Apps
- [ ] Create architecture diagram
- [ ] Final testing and demo prep

## Security Issues to Fix
1. Move Storage connection string to Key Vault
2. Move Cosmos DB key to Key Vault
3. Enable Key Vault in configuration
4. Use Managed Identity for Azure resources

## Files to Create/Update
- Azure Functions (Blob trigger, Service Bus trigger)
- GitHub Actions workflows (ci.yml, deploy.yml)
- Application Insights setup
- API Management configuration
